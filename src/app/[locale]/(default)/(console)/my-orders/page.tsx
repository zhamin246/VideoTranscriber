import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import ManageSubscriptionButton from "@/components/console/manage-subscription-button";

import { getOrdersByPaidEmail, getOrdersByUserUuid } from "@/models/order";
import { getUserEmail, getUserUuid } from "@/services/user";
import { getStripeBilling } from "@/services/order";

import { TableColumn } from "@/types/blocks/table";
import { Separator } from "@/components/ui/separator";
import TableBlock from "@/components/blocks/table";
import moment from "moment";
import { redirect } from "next/navigation";
import Link from "next/link";
import Stripe from "stripe";

export default async function () {
  const t = await getTranslations();

  const user_uuid = await getUserUuid();
  const user_email = await getUserEmail();

  const callbackUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/my-orders`;
  if (!user_uuid) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  let orders = await getOrdersByUserUuid(user_uuid);
  if (!orders || orders.length === 0) {
    orders = await getOrdersByPaidEmail(user_email);
  }

  // 确保 orders 不为 undefined
  if (!orders) {
    orders = [];
  }

  // 查找当前订阅
  const currentSubscription = orders?.find(order => 
    order.interval && order.interval !== 'one_time' && 
    order.paid_at && 
    (!order.expired_at || new Date(order.expired_at) > new Date()) &&
    order.sub_id // 确保有 sub_id
  );

  // 检查订阅状态
  let subscriptionStatus = 'none'; // none, active, cancelled
  let subscriptionInfo = null;

  if (currentSubscription && currentSubscription.sub_id) {
    try {
      // 直接获取订阅信息而不是 billing portal
      const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY || "");
      const subscription = await stripe.subscriptions.retrieve(currentSubscription.sub_id);
      
      subscriptionStatus = subscription.status === 'active' ? 'active' : 'cancelled';
      subscriptionInfo = {
        plan: currentSubscription.product_name || 'Pro',
        interval: currentSubscription.interval === 'month' ? '月付' : '年付',
        nextBillingDate: subscription.current_period_end ? 
          moment.unix(subscription.current_period_end).format('YYYY-MM-DD') : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      };
    } catch (error) {
      console.error('Failed to get subscription info:', error);
      subscriptionStatus = 'cancelled';
    }
  }

  const columns: TableColumn[] = [
    { name: "order_no", title: t("my_orders.table.order_no") },
    { name: "paid_email", title: t("my_orders.table.email") },
    { name: "product_name", title: t("my_orders.table.product_name") },
    {
      name: "amount",
      title: t("my_orders.table.amount"),
      callback: (item: any) =>
        `${item.currency.toUpperCase() === "CNY" ? "¥" : "$"} ${
          item.amount / 100
        }`,
    },
    {
      name: "interval",
      title: t("my_orders.table.interval"),
      callback: async (item: any) => {
        if (item.interval === "month") {
          return t("my_orders.table.interval_month");
        }

        if (item.interval === "year") {
          return t("my_orders.table.interval_year");
        }

        return t("my_orders.table.interval_one_time");
      },
    },
    {
      name: "paid_at",
      title: t("my_orders.table.paid_at"),
      callback: (item: any) =>
        moment(item.paid_at).format("YYYY-MM-DD HH:mm:ss"),
    },
    // 删除了 Manage Billing 列
  ];

  const table: any = {
    title: t("my_orders.title"),
    toolbar: {
      items: [
        // 管理订阅按钮
        ...(subscriptionStatus === 'active' || subscriptionStatus === 'cancelled' ? [{
          title: t("my_orders.manage_subscription"),
          icon: "RiSettingsLine",
          variant: "default" as const,
          onClick: () => {
            // 这里需要处理点击事件
          }
        }] : [])
      ],
    },
    columns: columns,
    data: orders,
    empty_message: t("my_orders.no_orders"),
  };

  return (
    <div className="pt-8 px-6">
      <div className="space-y-6">
        {/* 管理订阅按钮在标题上方 */}
        {(subscriptionStatus === 'active' || subscriptionStatus === 'cancelled') && (
          <div className="flex justify-start">
            <ManageSubscriptionButton />
          </div>
        )}
          
        {/* My Orders 标题 */}
        <h3 className="text-lg font-medium">{t("my_orders.title")}</h3>
        
        <Separator />
        <TableBlock columns={table.columns ?? []} data={table.data ?? []} />
      </div>
    </div>
  );
}
