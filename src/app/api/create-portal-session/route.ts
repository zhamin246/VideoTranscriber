import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { newStripeClient } from "@/integrations/stripe";
import { respErr, respData } from "@/lib/resp";

export async function POST(req: NextRequest) {
  try {
    console.log('开始创建Portal会话...');
    
    const session = await auth();
    console.log('用户会话:', session?.user?.email ? '已登录' : '未登录');
    
    if (!session?.user?.email) {
      console.log('用户未登录，返回未授权错误');
      return respErr("Unauthorized");
    }

    console.log('正在初始化Stripe客户端...');
    const stripe = newStripeClient();
    
    // 获取或创建Stripe客户
    let customer;
    try {
      console.log('正在查找Stripe客户:', session.user.email);
      const customers = await stripe.stripe().customers.list({
        email: session.user.email,
        limit: 1,
      });
      
      if (customers.data.length > 0) {
        customer = customers.data[0];
        console.log('找到现有客户:', customer.id);
      } else {
        console.log('创建新客户...');
        customer = await stripe.stripe().customers.create({
          email: session.user.email,
          name: session.user.name || undefined,
        });
        console.log('新客户已创建:', customer.id);
      }
    } catch (error) {
      console.error("创建/查找客户时出错:", error);
      return respErr("Failed to create customer");
    }

    // 创建Customer Portal会话
    try {
      console.log('正在创建Portal会话...');
      
      const portalSession = await stripe.stripe().billingPortal.sessions.create({
        customer: customer.id,
        return_url: process.env.STRIPE_CUSTOMER_PORTAL_RETURN_URL || `${process.env.NEXT_PUBLIC_WEB_URL}/dashboard`,
      });
      
      console.log('Portal会话创建成功:', portalSession.url);
      return respData({ url: portalSession.url });
    } catch (error) {
      console.error("创建Portal会话时出错:", error);
      return respErr("Failed to create portal session");
    }
  } catch (error) {
    console.error("API处理过程中出错:", error);
    return respErr("Internal server error");
  }
}
