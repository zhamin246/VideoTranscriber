import Stripe from "stripe";
import { updateSubOrder, updateOrder } from "./order";
import {
  findOrderByOrderNo,
  OrderStatus,
  updateOrderSubscriptionPeriod,
} from "../models/order";
import { findCreditByOrderNo } from "@/models/credit";
import {
  increaseCredits,
  CreditsTransType,
  grantDueYearlyCreditsForOrder,
} from "./credit";
import { MONTHLY_CREDIT_EXPIRY_DAYS, creditExpiresAtDays } from "@/lib/time";
import { monthlyCreditsForProduct } from "@/lib/convert/pricing-catalog";
import { sendPaidReportReadyEmail } from "@/lib/email/send";

// 处理checkout session完成事件
export async function handleCheckoutSession(
  stripe: Stripe,
  session: Stripe.Checkout.Session
) {
  try {
    // 检查支付状态
    if (session.payment_status !== "paid") {
      console.log("Session not paid, skipping:", session.id);
      return;
    }

    // 获取session元数据
    const metadata = session.metadata;
    if (!metadata || !metadata.order_no) {
      console.error("No metadata in session:", session.id);
      return;
    }

    console.log("Processing paid session:", session.id, "Order:", metadata.order_no);

    // Idempotent email: only send when order first becomes paid
    const orderBefore = await findOrderByOrderNo(metadata.order_no);
    const alreadyPaid = orderBefore?.status === OrderStatus.Paid;

    // 处理订阅
    const subId = session.subscription as string;
    if (subId) {
      const subscription = await stripe.subscriptions.retrieve(subId);
      const item = subscription.items.data[0];

      // 更新订阅订单（updateSubOrder 内部会通过 updateCreditForOrder 增加积分）
      await updateSubOrder({
        order_no: metadata.order_no,
        user_email: metadata.user_email,
        sub_id: subId,
        sub_interval_count: 1,
        sub_cycle_anchor: subscription.billing_cycle_anchor,
        sub_period_end: subscription.current_period_end,
        sub_period_start: subscription.current_period_start,
        sub_times: 1,
        paid_detail: JSON.stringify(session),
      });
      // 注意：不再在这里调用 increaseCredits，因为 updateSubOrder 已经通过 updateCreditForOrder 处理了积分
    } else {
      // 处理一次性支付
      // 使用 updateOrder 函数统一处理订单状态更新和积分增加
      await updateOrder({
        order_no: metadata.order_no,
        paid_email: metadata.user_email,
        paid_detail: JSON.stringify(session),
      });
      // 注意：不再在这里调用 increaseCredits，因为 updateOrder 已经通过 updateCreditForOrder 处理了积分
    }

    // Face Report one-time product: activate Dashboard row + email report link
    if (
      metadata.product_type === "face_report" ||
      metadata.product_id === "face_report"
    ) {
      const scanId = metadata.scan_id;
      const userEmail = (
        metadata.user_email ||
        session.customer_email ||
        session.customer_details?.email ||
        ""
      ).toLowerCase();

      let score: number | undefined;
      let outOfTen: string | undefined;
      let tierName: string | undefined;

      if (scanId) {
        try {
          const { activateFaceReport, findFaceReportByReportId } = await import(
            "@/models/face-report"
          );
          const activated = await activateFaceReport(scanId, userEmail || undefined);
          const row = activated || (await findFaceReportByReportId(scanId));
          if (row) {
            score = row.score;
            outOfTen = row.out_of_ten;
            tierName = row.tier_name;
          }
          console.log("Activated face report:", scanId);
        } catch (e) {
          console.error("activate face report failed:", e);
        }
      }

      if (!alreadyPaid && userEmail && scanId) {
        await sendPaidReportReadyEmail({
          email: userEmail,
          reportId: scanId,
          score,
          outOfTen,
          tierName,
        });
      }
    }

    console.log("Successfully processed session:", session.id);
  } catch (error) {
    console.error("Error processing checkout session:", error);
    throw error;
  }
}

// 处理发票支付成功事件
export async function handleInvoice(stripe: Stripe, invoice: Stripe.Invoice) {
  try {
    if (invoice.status !== "paid") {
      console.log("Invoice not paid, skipping:", invoice.id);
      return;
    }

    if (invoice.billing_reason === "subscription_create") {
      return;
    }

    const subId = invoice.subscription as string;
    if (!subId) {
      console.log("No subscription in invoice, skipping:", invoice.id);
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(subId);
    const metadata = subscription.metadata;
    const user_uuid = metadata?.user_uuid || "";
    const productId = metadata?.product_id || "";
    const interval = subscription.items.data[0]?.price?.recurring?.interval;

    if (interval === "year" && metadata?.order_no) {
      if (subscription.current_period_start && subscription.current_period_end) {
        await updateOrderSubscriptionPeriod(
          metadata.order_no,
          subscription.current_period_start,
          subscription.current_period_end
        );
      }
      const order = await findOrderByOrderNo(metadata.order_no);
      if (order) {
        await grantDueYearlyCreditsForOrder(order);
      }
      return;
    }

    const credits =
      monthlyCreditsForProduct(productId) ||
      parseInt(metadata?.credits || "0", 10);
    if (!metadata || !credits || !user_uuid) {
      return;
    }

    const order_no = `${metadata.order_no || invoice.id}_inv_${invoice.id}`;
    const already = await findCreditByOrderNo(order_no);
    if (already) return;

    await increaseCredits({
      user_uuid,
      trans_type: CreditsTransType.OrderPay,
      credits,
      expired_at: creditExpiresAtDays(MONTHLY_CREDIT_EXPIRY_DAYS),
      order_no,
    });
    console.log(`Added ${credits} credits for subscription renewal ${invoice.id}`);
  } catch (error) {
    console.error("Error processing invoice:", error);
    throw error;
  }
}
