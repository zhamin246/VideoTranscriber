export function isAuthEnabled(): boolean {
  // Face Rating always has passwordless email login available.
  if (process.env.NEXT_PUBLIC_AUTH_ENABLED === "false") return false;
  return true;
}

export function isEmailAuthEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_AUTH_EMAIL_ENABLED === "false") return false;
  return true;
}

/** True when Resend (or another transport) can actually send. */
export function isEmailSendConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY ||
      process.env.ZEPTOMAIL_TOKEN ||
      process.env.ZEPTO_MAIL_TOKEN ||
      process.env.ZOHO_SMTP_PASS ||
      process.env.SMTP_PASS
  );
}

export function isGoogleAuthEnabled(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true" &&
    process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID
  );
}

export function isGitHubAuthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AUTH_GITHUB_ENABLED === "true";
}

export function isGoogleOneTapEnabled(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED === "true" &&
    process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID
  );
}
