import { getUserEmail, getUserUuid } from "@/services/user";
import { insertOrder, OrderStatus, updateOrderSession } from "@/models/order";
import { respData, respErr } from "@/lib/resp";

import Stripe from "stripe";
import { findUserByUuid } from "@/models/user";
import { getSnowId } from "@/lib/hash";
import { subscriptionCreditExpiresAt } from "@/lib/time";
import { getPricingPage } from "@/services/page";
import { PricingItem } from "@/types/blocks/pricing";
import { newStripeClient } from "@/integrations/stripe";
import { Order } from "@/types/order";
import { newCreemClient } from "@/integrations/creem";

const PRICE_IDS: Record<string, string | undefined> = {
  starter_pack: process.env.STRIPE_STARTER_PACK_PRICE_ID,
  popular_pack: process.env.STRIPE_POPULAR_PACK_PRICE_ID,
  plus_pack: process.env.STRIPE_PLUS_PACK_PRICE_ID,
  bulk_pack: process.env.STRIPE_BULK_PACK_PRICE_ID,
  hobby_monthly: process.env.STRIPE_HOBBY_MONTHLY_PRICE_ID,
  hobby_yearly: process.env.STRIPE_HOBBY_YEARLY_PRICE_ID,
  pro_monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
  pro_yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
  studio_monthly: process.env.STRIPE_STUDIO_MONTHLY_PRICE_ID,
  studio_yearly: process.env.STRIPE_STUDIO_YEARLY_PRICE_ID,
};

export async function POST(req: Request) {
  try {
    let { product_id, stripe_product_id, stripe_price_id, currency, locale } = await req.json();

    let cancel_url = `${
      process.env.NEXT_PUBLIC_PAY_CANCEL_URL || process.env.NEXT_PUBLIC_WEB_URL
    }`;
    if (cancel_url && cancel_url.startsWith("/")) {
      cancel_url = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}${cancel_url}`;
    }

    if (!product_id) {
      return respErr("invalid params");
    }

    // 验证结账参数
    const page = await getPricingPage(locale);
    if (!page || !page.pricing || !page.pricing.items) {
      return respErr("invalid pricing table");
    }

    const item = page.pricing.items.find(
      (item: PricingItem) => item.product_id === product_id
    );

    if (!item || !item.amount || !item.interval || !item.currency) {
      return respErr("invalid checkout params");
    }

    let { amount, interval, valid_months, credits, product_name } = item;

    if (!["year", "month", "one-time"].includes(interval)) {
      return respErr("invalid interval");
    }

    if (interval === "year" && valid_months !== 12) {
      return respErr("invalid valid_months");
    }

    if (interval === "month" && valid_months !== 1) {
      return respErr("invalid valid_months");
    }

    if (interval === "one-time" && valid_months !== 12) {
      return respErr("invalid valid_months");
    }

    if (currency === "cny") {
      if (!item.cn_amount) {
        return respErr("invalid checkout params: cn_amount");
      }
      amount = item.cn_amount;
    } else {
      currency = item.currency;
    }

    const is_subscription = interval === "month" || interval === "year";

    // 获取已登录用户
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth, please sign-in");
    }

    let user_email = await getUserEmail();
    if (!user_email) {
      const user = await findUserByUuid(user_uuid);
      if (user) {
        user_email = user.email;
      }
    }
    if (!user_email) {
      return respErr("invalid user");
    }

    // 生成订单号
    const order_no = getSnowId();
    const currentDate = new Date();
    const created_at = currentDate.toISOString();

    // Credit-lot expiry: monthly = 30 days; yearly grants and packs = 12 months.
    let expired_at = "";
    if (interval === "month" || interval === "year" || interval === "one-time") {
      expired_at = subscriptionCreditExpiresAt(interval, currentDate);
    }

    // 创建订单
    const order = {
      order_no: order_no,
      created_at: new Date(created_at),
      user_uuid: user_uuid,
      user_email: user_email,
      amount: amount,
      interval: interval,
      expired_at: expired_at ? new Date(expired_at) : null,
      status: OrderStatus.Created,
      credits: credits || 0,
      currency: currency,
      product_id: product_id,
      product_name: product_name,
      valid_months: valid_months,
    };
    await insertOrder(order);

    const provider = process.env.PAY_PROVIDER || "stripe";

    if (provider === "creem") {
      // 使用creem结账
      const result = await creemCheckout({
        order: order as any,
        locale,
        cancel_url,
      });

      return respData(result);
    }

    // 使用stripe结账
    const result = await stripeCheckout({
      order: order as any,
      locale,
      cancel_url,
      product_id: product_id,
      pricingItem: item, // 传递 pricing 配置项
    });

    return respData(result);
  } catch (e: any) {
    console.log("checkout failed: ", e);
    return respErr("checkout failed: " + e.message);
  }
}

async function stripeCheckout({
  order,
  locale,
  cancel_url,
  product_id,
  pricingItem,
}: {
  order: Order;
  locale: string;
  cancel_url: string;
  product_id: string;
  pricingItem?: PricingItem;
}) {
  const intervals = ["month", "year"];
  const is_subscription = intervals.includes(order.interval);

  const client = newStripeClient();

  let priceId: string | undefined;

  if (pricingItem?.stripe_price_id) {
    const priceIdTemplate = pricingItem.stripe_price_id;
    if (priceIdTemplate.startsWith("${process.env.") && priceIdTemplate.endsWith("}")) {
      const envVarName = priceIdTemplate.replace("${process.env.", "").replace("}", "");
      priceId = process.env[envVarName];
    } else if (priceIdTemplate.startsWith("price_")) {
      priceId = priceIdTemplate;
    }
  }

  if (!priceId) {
    priceId = PRICE_IDS[product_id];
  }

  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = priceId
    ? { price: priceId, quantity: 1 }
    : {
        quantity: 1,
        price_data: {
          currency: (order.currency || "usd").toLowerCase(),
          unit_amount: order.amount,
          product_data: {
            name: order.product_name || "Conversion credits",
            description:
              order.interval === "year"
                ? `${order.credits} conversion credits each month`
                : order.interval === "month"
                  ? `${order.credits} conversion credits each month · expire after 30 days`
                  : `${order.credits} conversion credits · use within 12 months`,
          },
          ...(is_subscription
            ? {
                recurring: {
                  interval: order.interval === "year" ? "year" : "month",
                },
              }
            : {}),
        },
      };

  let options: Stripe.Checkout.SessionCreateParams = {
    payment_method_types: ["card"],
    line_items: [lineItem],
    allow_promotion_codes: true,
    metadata: {
      project: process.env.NEXT_PUBLIC_PROJECT_NAME || "",
      product_id,
      product_name: order.product_name || "",
      order_no: order.order_no,
      user_email: order.user_email,
      credits: String(order.credits ?? 0),
      monthly_credits: String(order.credits ?? 0),
      user_uuid: order.user_uuid,
    },
    mode: is_subscription ? "subscription" : "payment",
    success_url: `${process.env.NEXT_PUBLIC_WEB_URL}/api/pay/callback/stripe?locale=${locale}&session_id={CHECKOUT_SESSION_ID}&order_no=${order.order_no}`,
    cancel_url: cancel_url,
  };

  if (order.user_email) {
    options.customer_email = order.user_email;
  }

  if (order.interval === "month" || order.interval === "year") {
    options.subscription_data = {
      metadata: options.metadata,
    };
  }

  if (order.currency === "cny") {
    options.payment_method_types = ["wechat_pay", "alipay", "card"];
    options.payment_method_options = {
      wechat_pay: {
        client: "web",
      },
      alipay: {},
    };
  }

  const session = await client.stripe().checkout.sessions.create(options);

  // 更新订单详情
  await updateOrderSession(order.order_no, session.id, JSON.stringify(options));

  return {
    order_no: order.order_no,
    session_id: session.id,
    checkout_url: session.url,
  };
}

async function creemCheckout({
  order,
  locale,
  cancel_url,
}: {
  order: Order;
  locale: string;
  cancel_url: string;
}) {
  const client = newCreemClient();

  let products = (process.env.CREEM_PRODUCTS as any) || {};
  if (typeof products === "string") {
    products = JSON.parse(products);
  }
  console.log("creem products: ", products);

  const product_id = products[order.product_id || ""] || "";
  if (!product_id) {
    throw new Error("invalid product_id");
  }

  const success_url = `${process.env.NEXT_PUBLIC_WEB_URL}/api/pay/callback/creem?locale=${locale}`;

  const result = await client.creem().createCheckout({
    xApiKey: client.apiKey(),
    createCheckoutRequest: {
      productId: product_id,
      requestId: order.order_no,
      customer: {
        email: order.user_email,
      },
      successUrl: success_url,
      metadata: {
        project: process.env.NEXT_PUBLIC_PROJECT_NAME || "",
        product_name: order.product_name || "",
        order_no: order.order_no,
        user_email: order.user_email,
        credits: order.credits,
        user_uuid: order.user_uuid,
      },
    },
  });

  // 更新订单详情
  await updateOrderSession(order.order_no, result.id, JSON.stringify(result));

  return {
    order_no: order.order_no,
    session_id: result.id,
    checkout_url: result.checkoutUrl,
  };
}
