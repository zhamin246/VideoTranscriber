/**
 * Transactional email (login magic link + paid report URL).
 *
 * Default / recommended: Resend
 *   EMAIL_TRANSPORT=resend
 *   RESEND_API_KEY=re_...
 *   RESEND_SENDER_EMAIL=Face Rating <onboarding@resend.dev>  (dev)
 *   EMAIL_FROM=Face Rating <noreply@face-rating.app>         (prod, verified domain)
 *
 * Optional: zeptomail | zoho (SMTP) | smtp
 */

import { Resend } from "resend";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

function fromAddress(): string {
  return (
    process.env.EMAIL_FROM ||
    process.env.RESEND_SENDER_EMAIL ||
    process.env.ZOHO_SMTP_USER ||
    "Face Rating <noreply@localhost>"
  );
}

function replyToAddress(): string | undefined {
  const r = (
    process.env.EMAIL_REPLY_TO ||
    process.env.RESEND_REPLY_TO ||
    ""
  ).trim();
  return r || undefined;
}

/** Parse `Name <email@x.com>` or bare email */
function parseFrom(raw: string): { name: string; address: string } {
  const m = raw.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m) {
    return {
      name: m[1].replace(/^["']|["']$/g, "").trim() || "Face Rating",
      address: m[2].trim(),
    };
  }
  return { name: "Face Rating", address: raw.trim() };
}

function transport(): "zeptomail" | "resend" | "zoho" | "smtp" {
  const t = (process.env.EMAIL_TRANSPORT || "resend").toLowerCase().trim();
  if (t === "resend") return "resend";
  if (t === "zeptomail" || t === "zepto" || t === "zoho-zepto") return "zeptomail";
  if (t === "zoho" || t === "smtp") return t;

  // Auto: prefer Resend when key is present
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.ZEPTOMAIL_TOKEN || process.env.ZEPTO_MAIL_TOKEN) {
    return "zeptomail";
  }
  if (process.env.ZOHO_SMTP_USER || process.env.SMTP_USER) return "zoho";
  return "resend";
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms / 1000}s`));
    }, ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

function zeptoAuthHeader(): string {
  const raw = (
    process.env.ZEPTOMAIL_TOKEN ||
    process.env.ZEPTO_MAIL_TOKEN ||
    process.env.ZOHO_SMTP_PASS ||
    ""
  ).trim();

  if (!raw) {
    throw new Error(
      "ZEPTOMAIL_TOKEN is not set. Paste your ZeptoMail Send Mail Token (Agent → SMTP/API → Send Mail Token)."
    );
  }

  // User may store either "Zoho-enczapikey xxx" or just "xxx"
  if (/^zoho-enczapikey\s+/i.test(raw)) {
    return raw.replace(/^zoho-enczapikey/i, "Zoho-enczapikey");
  }
  return `Zoho-enczapikey ${raw}`;
}

async function sendViaZeptoMail(input: SendEmailInput) {
  const from = parseFrom(fromAddress());
  const bounce =
    process.env.ZEPTOMAIL_BOUNCE ||
    process.env.ZEPTO_BOUNCE_ADDRESS ||
    undefined;

  const body: Record<string, unknown> = {
    from: {
      address: from.address,
      name: from.name,
    },
    to: [
      {
        email_address: {
          address: input.to,
          name: input.to.split("@")[0] || input.to,
        },
      },
    ],
    subject: input.subject,
    htmlbody: input.html,
    textbody: input.text || undefined,
  };
  if (bounce) {
    body.bounce_address = bounce;
  }

  const endpoint =
    process.env.ZEPTOMAIL_API_URL || "https://api.zeptomail.com/v1.1/email";

  const res = await withTimeout(
    fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: zeptoAuthHeader(),
      },
      body: JSON.stringify(body),
    }),
    20_000,
    "ZeptoMail API"
  );

  const text = await res.text();
  let json: { message?: string; error?: { message?: string }; data?: unknown } =
    {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    /* non-JSON body */
  }

  if (!res.ok) {
    const detail =
      json?.error?.message ||
      json?.message ||
      text.slice(0, 300) ||
      res.statusText;
    if (res.status === 429 || /resource limit|quota|rate limit/i.test(detail)) {
      throw new Error(
        `ZeptoMail quota/rate limit hit (${detail}). Check ZeptoMail dashboard → Subscription / Reports for daily credit usage, wait for reset, or upgrade. This is not an EMAIL_FROM format error.`
      );
    }
    if (/from|sender|domain|not allowed|unauthorized/i.test(detail)) {
      throw new Error(
        `ZeptoMail rejected sender (${detail}). EMAIL_FROM must be a verified address on domain face-rating.app (e.g. noreply@face-rating.app).`
      );
    }
    throw new Error(`ZeptoMail ${res.status}: ${detail}`);
  }

  console.log("[email] ZeptoMail accepted for", input.to);
}

async function sendViaResend(input: SendEmailInput) {
  const key = (process.env.RESEND_API_KEY || "").trim();
  if (!key) {
    throw new Error(
      "RESEND_API_KEY is not set. Create a key at https://resend.com/api-keys and add it to .env (EMAIL_TRANSPORT=resend)."
    );
  }
  const from = fromAddress();
  const reply_to = input.replyTo || replyToAddress();
  const resend = new Resend(key);
  const result = await withTimeout(
    resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      ...(reply_to ? { replyTo: reply_to } : {}),
    }),
    20_000,
    "Resend"
  );
  if (result.error) {
    const msg = result.error.message || "Resend send failed";
    // Common: domain not verified → use onboarding@resend.dev in dev
    if (/domain|not verified|from/i.test(msg)) {
      throw new Error(
        `${msg} — For testing use EMAIL_FROM / RESEND_SENDER_EMAIL = Face Rating <onboarding@resend.dev> (can only send to your Resend account email until face-rating.app is verified).`
      );
    }
    throw new Error(msg);
  }
  console.log("[email] Resend accepted for", input.to, "id=", result.data?.id);
  return result;
}

async function sendViaSmtp(input: SendEmailInput) {
  let nodemailer: typeof import("nodemailer");
  try {
    nodemailer = await import("nodemailer");
  } catch {
    throw new Error("nodemailer is required for SMTP. Run: pnpm add nodemailer");
  }

  const host =
    process.env.ZOHO_SMTP_HOST || process.env.SMTP_HOST || "smtp.zoho.com";
  const port = Number(
    process.env.ZOHO_SMTP_PORT || process.env.SMTP_PORT || 465
  );
  const user = (process.env.ZOHO_SMTP_USER || process.env.SMTP_USER || "").trim();
  const pass = (process.env.ZOHO_SMTP_PASS || process.env.SMTP_PASS || "").trim();

  if (!user || !pass) {
    throw new Error("SMTP user/pass not configured (ZOHO_SMTP_USER / ZOHO_SMTP_PASS)");
  }

  // Don't treat ZeptoMail API tokens as SMTP passwords
  if (/zoho-enczapikey/i.test(pass) || pass.length > 80) {
    throw new Error(
      "This looks like a ZeptoMail API token, not an SMTP password. Set EMAIL_TRANSPORT=zeptomail and ZEPTOMAIL_TOKEN=..."
    );
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 12_000,
    greetingTimeout: 12_000,
    socketTimeout: 20_000,
  });

  await withTimeout(transporter.verify(), 15_000, `SMTP verify ${host}:${port}`);
  await withTimeout(
    transporter.sendMail({
      from: fromAddress(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
    25_000,
    "SMTP sendMail"
  );
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const mode = transport();
  console.log(`[email] transport=${mode} to=${input.to} from=${fromAddress()}`);
  if (mode === "zeptomail") {
    await sendViaZeptoMail(input);
    return;
  }
  if (mode === "resend") {
    await sendViaResend(input);
    return;
  }
  await sendViaSmtp(input);
}

export function buildMagicLinkEmail(opts: {
  loginUrl: string;
  email: string;
}): { subject: string; html: string; text: string } {
  const brand = process.env.NEXT_PUBLIC_PROJECT_NAME || "image to cad";
  const subject = `Sign in to ${brand}`;
  const text = [
    `Welcome to ${brand}`,
    ``,
    `Sign in with the secure link below.`,
    opts.loginUrl,
    ``,
    `Once signed in, 3 free conversions are ready for you.`,
    ``,
    `If you didn't request this email, you can safely ignore it.`,
  ].join("\n");
  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f1ec;font-family:Inter,system-ui,-apple-system,sans-serif;color:#0a0a0a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;padding:48px 40px;">
        <tr><td align="center">
          <p style="margin:0 0 20px;font-size:18px;font-weight:600;color:#0a0a0a;">${brand}</p>
          <h1 style="margin:0 0 12px;font-size:32px;line-height:1.15;font-weight:800;color:#0a0a0a;">Welcome to ${brand}</h1>
          <p style="margin:0 0 28px;font-size:16px;line-height:1.5;color:#525252;">
            Sign in with the secure link below.
          </p>
          <a href="${opts.loginUrl}"
             style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 28px;border-radius:10px;">
            Sign in to ${brand}
          </a>
          <p style="margin:28px 0 0;font-size:15px;line-height:1.55;color:#525252;">
            Once signed in, 3 free conversions are ready for you.
          </p>
          <hr style="margin:32px 0 20px;border:none;border-top:1px solid #ececec;" />
          <p style="margin:0;font-size:13px;line-height:1.6;color:#a3a3a3;">
            If you didn’t request this email, you can safely ignore it.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  return { subject, html, text };
}

export function buildPaidReportEmail(opts: {
  email: string;
  reportUrl: string;
  score?: number;
  outOfTen?: string;
  tierName?: string;
  dashboardUrl?: string;
}): { subject: string; html: string; text: string } {
  const brand = process.env.NEXT_PUBLIC_PROJECT_NAME || "Face Rating";
  const scoreLine =
    opts.outOfTen || opts.score != null
      ? `Your score: ${opts.outOfTen || (opts.score! / 10).toFixed(1)}/10${
          opts.tierName ? ` · ${opts.tierName}` : ""
        }`
      : "";
  const subject = `Your ${brand} full report is ready`;
  const text = [
    `Thanks for your purchase.`,
    scoreLine,
    ``,
    `Open your full Face Report:`,
    opts.reportUrl,
    opts.dashboardUrl ? `\nOr view all reports: ${opts.dashboardUrl}` : "",
    ``,
    `Sign in with this email (${opts.email}) to open reports from Dashboard anytime.`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#fafafa;font-family:Inter,system-ui,sans-serif;color:#0a0a0a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:440px;background:#ffffff;border:1px solid #e5e5e5;border-radius:12px;padding:32px;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9f1239;">${brand}</p>
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#0a0a0a;">Your full report is ready</h1>
          <p style="margin:0 0 8px;font-size:14px;line-height:1.5;color:#525252;">
            Thanks for your purchase. Your Full Face Report is unlocked and saved to your account.
          </p>
          ${
            scoreLine
              ? `<p style="margin:0 0 20px;font-size:15px;font-weight:700;color:#0a0a0a;">${scoreLine}</p>`
              : `<div style="height:12px"></div>`
          }
          <a href="${opts.reportUrl}"
             style="display:inline-block;background:#9f1239;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:8px;">
            Open your Face Report
          </a>
          ${
            opts.dashboardUrl
              ? `<p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#525252;">
            Or open <a href="${opts.dashboardUrl}" style="color:#9f1239;font-weight:600;">Dashboard</a> to see all your reports.
          </p>`
              : ""
          }
          <p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#a3a3a3;">
            Link (if the button doesn’t work):<br/>
            <span style="word-break:break-all;color:#737373;">${opts.reportUrl}</span>
          </p>
          <p style="margin:16px 0 0;font-size:12px;color:#a3a3a3;">
            Sign in with <strong style="color:#525252;">${opts.email}</strong> to access this report later.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  return { subject, html, text };
}

/** Send paid report link email (Resend / configured transport). Never throws to caller. */
export async function sendPaidReportReadyEmail(opts: {
  email: string;
  reportId: string;
  score?: number;
  outOfTen?: string;
  tierName?: string;
}): Promise<boolean> {
  const email = (opts.email || "").trim().toLowerCase();
  if (!email || !opts.reportId) return false;

  const webUrl = (process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  );
  const reportUrl = `${webUrl}/report/${encodeURIComponent(opts.reportId)}`;
  const dashboardUrl = `${webUrl}/dashboard`;
  const mail = buildPaidReportEmail({
    email,
    reportUrl,
    dashboardUrl,
    score: opts.score,
    outOfTen: opts.outOfTen,
    tierName: opts.tierName,
  });

  try {
    await sendEmail({
      to: email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
    console.log("[email] paid report ready sent to", email, "report", opts.reportId);
    return true;
  } catch (e) {
    console.error("[email] paid report ready failed:", e);
    return false;
  }
}
