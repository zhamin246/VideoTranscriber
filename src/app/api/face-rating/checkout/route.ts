import Stripe from "stripe";
import { respData, respErr } from "@/lib/resp";
import { getUserEmail, getUserUuid } from "@/services/user";
import { insertOrder, OrderStatus, updateOrderSession } from "@/models/order";
import { getSnowId } from "@/lib/hash";
import { newStripeClient } from "@/integrations/stripe";
import type { StoredScanResult } from "@/lib/face-rating/result-store";
import { tierFromScore } from "@/lib/face-rating/result-store";
import { upsertFaceReport } from "@/models/face-report";

const PRODUCT_ID = "face_report";
const PRODUCT_NAME = "Full Face Report";
const AMOUNT_CENTS = 990; // $9.90

function faceReportPriceId(): string {
  return (
    process.env.STRIPE_FACE_REPORT_PRICE_ID ||
    process.env.Face_Report_PRICE_ID ||
    process.env.FACE_REPORT_PRICE_ID ||
    ""
  );
}

/**
 * Create Stripe Checkout for a one-time Full Face Report purchase.
 * Body: { scanId, email?, scan?, locale? }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const scanId = String(body.scanId || "").trim();
    const locale = String(body.locale || "en");
    const emailInput = String(body.email || "")
      .trim()
      .toLowerCase();
    const scan = body.scan as StoredScanResult | undefined;

    if (!scanId) {
      return respErr("Missing scanId");
    }

    const priceId = faceReportPriceId();
    if (!priceId) {
      return respErr(
        "STRIPE_FACE_REPORT_PRICE_ID (or Face_Report_PRICE_ID) is not configured"
      );
    }
    if (!process.env.STRIPE_PRIVATE_KEY) {
      return respErr("STRIPE_PRIVATE_KEY is not configured");
    }

    const user_uuid = (await getUserUuid()) || "";
    let user_email = emailInput || (await getUserEmail()) || "";
    user_email = user_email.trim().toLowerCase();

    if (!user_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user_email)) {
      return respErr("A valid email is required for checkout and your report");
    }

    // Pre-save scan as pending so payment success can list it even if sessionStorage is gone
    if (scan?.id === scanId && typeof scan.score === "number") {
      try {
        const tier = tierFromScore(scan.score);
        const outOfTen = (Math.round(scan.score) / 10).toFixed(1);
        const preview =
          typeof scan.previewUrl === "string" &&
          scan.previewUrl.startsWith("data:") &&
          scan.previewUrl.length < 350_000
            ? scan.previewUrl
            : "";
        const { landmarks: _l, ...rest } = scan;
        const clean: StoredScanResult = {
          ...rest,
          previewUrl: preview,
          unlocked: false,
          unlockEmail: user_email,
        };
        await upsertFaceReport({
          report_id: scanId,
          user_uuid,
          user_email,
          score: Math.round(scan.score),
          out_of_ten: outOfTen,
          tier_name: tier.name,
          face_shape: scan.faceShape || "",
          src: scan.src || "",
          preview_url: preview,
          scan_json: JSON.stringify(clean),
          status: "pending",
        });
      } catch (e) {
        console.warn("pre-save pending report failed:", e);
      }
    }

    const order_no = getSnowId();
    const webUrl = (process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000").replace(
      /\/$/,
      ""
    );

    await insertOrder({
      order_no,
      created_at: new Date(),
      user_uuid,
      user_email,
      amount: AMOUNT_CENTS,
      interval: "one-time",
      expired_at: null,
      status: OrderStatus.Created,
      credits: 0,
      currency: "usd",
      product_id: PRODUCT_ID,
      product_name: PRODUCT_NAME,
      valid_months: 0,
      order_detail: JSON.stringify({ scanId, type: "face_report" }),
    });

    const client = newStripeClient();
    const success_url = `${webUrl}/report/${encodeURIComponent(scanId)}?checkout=success&session_id={CHECKOUT_SESSION_ID}&order_no=${order_no}`;
    const cancel_url = `${webUrl}/results/${encodeURIComponent(scanId)}?checkout=cancel`;

    const options: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      customer_email: user_email,
      client_reference_id: order_no,
      metadata: {
        project: process.env.NEXT_PUBLIC_PROJECT_NAME || "Face Rating",
        product_id: PRODUCT_ID,
        product_name: PRODUCT_NAME,
        product_type: "face_report",
        order_no,
        scan_id: scanId,
        user_email,
        user_uuid,
        credits: "0",
      },
      success_url,
      cancel_url,
    };

    const session = await client.stripe().checkout.sessions.create(options);
    await updateOrderSession(order_no, session.id, JSON.stringify(options));

    if (!session.url) {
      return respErr("Stripe did not return a checkout URL");
    }

    return respData({
      order_no,
      session_id: session.id,
      checkout_url: session.url,
    });
  } catch (e) {
    console.error("face-rating checkout failed:", e);
    return respErr(
      e instanceof Error ? e.message : "Failed to start Stripe checkout"
    );
  }
}
