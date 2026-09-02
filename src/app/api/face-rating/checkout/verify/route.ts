import { respData, respErr } from "@/lib/resp";
import { newStripeClient } from "@/integrations/stripe";
import { handleCheckoutSession } from "@/services/stripe";
import { findOrderByOrderNo, OrderStatus } from "@/models/order";
import { activateFaceReport } from "@/models/face-report";

/**
 * Confirm Stripe payment for a Face Report and activate the report row.
 * Body: { session_id, scanId? }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const session_id = String(body.session_id || "").trim();
    const scanIdHint = String(body.scanId || "").trim();

    if (!session_id) {
      return respErr("Missing session_id");
    }
    if (!process.env.STRIPE_PRIVATE_KEY) {
      return respErr("Stripe is not configured");
    }

    const client = newStripeClient();
    const session = await client.stripe().checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return respErr("Payment not completed yet");
    }

    // Mark order paid (idempotent if webhook already ran)
    try {
      await handleCheckoutSession(client.stripe(), session);
    } catch (e) {
      console.warn("handleCheckoutSession in verify:", e);
    }

    const meta = session.metadata || {};
    const order_no = meta.order_no || "";
    const scan_id = meta.scan_id || scanIdHint;
    const user_email = (
      meta.user_email ||
      session.customer_email ||
      session.customer_details?.email ||
      ""
    ).toLowerCase();

    if (order_no) {
      const order = await findOrderByOrderNo(order_no);
      if (order && order.status !== OrderStatus.Paid) {
        // webhook may lag; handleCheckoutSession should have fixed it
        console.warn("order still not paid after handleCheckoutSession", order_no);
      }
    }

    // Promote pending → active (must run even if client never re-POSTs scan)
    if (scan_id) {
      await activateFaceReport(scan_id, user_email || undefined);
    }

    return respData({
      paid: true,
      scanId: scan_id,
      email: user_email,
      order_no,
    });
  } catch (e) {
    console.error("face-rating verify failed:", e);
    return respErr(
      e instanceof Error ? e.message : "Failed to verify payment"
    );
  }
}
