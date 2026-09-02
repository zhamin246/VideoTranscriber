"use client";

import { Check, Loader } from "lucide-react";
import { PricingItem, Pricing as PricingType } from "@/types/blocks/pricing";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAppContext } from "@/contexts/app";

export default function Pricing({ pricing }: { pricing: PricingType }) {
  if (pricing.disabled) {
    return null;
  }

  const params = useParams();
  const locale = params.locale as string;

  const { user, setShowSignModal } = useAppContext();

  const [isLoading, setIsLoading] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  
  // 从配置中获取订阅计划和积分包
  // 只显示月度订阅计划（过滤掉年度计划）
  const subscriptionPlans = (pricing.items?.filter(item => item.group === "subscription" && item.interval === "month") || []).sort((a, b) => a.credits - b.credits);
  const creditPacks = (pricing.items?.filter(item => item.group === "credits") || []).sort((a, b) => a.credits - b.credits);

  // 订阅计划选择状态（默认选中第二个选项）
  // 只考虑前4个选项
  const [selectedSubscription, setSelectedSubscription] = useState<string>(() => {
    const top4Plans = subscriptionPlans.slice(0, 4);
    if (top4Plans.length === 0) return "";
    return top4Plans.length > 1 ? top4Plans[1].product_id : top4Plans[0].product_id;
  });
  // 一次性购买选择状态（默认选中第四个选项）
  // 只考虑前6个选项
  const [selectedOneTime, setSelectedOneTime] = useState<string>(() => {
    const top6Packs = creditPacks.slice(0, 6);
    if (top6Packs.length === 0) return "";
    return top6Packs.length > 3 ? top6Packs[3].product_id : top6Packs[0].product_id;
  });
  
  // 确保选中的值在可用选项中
  useEffect(() => {
    const top4Plans = subscriptionPlans.slice(0, 4);
    if (top4Plans.length > 0 && !top4Plans.find(p => p.product_id === selectedSubscription)) {
      setSelectedSubscription(top4Plans.length > 1 ? top4Plans[1].product_id : top4Plans[0].product_id);
    }
  }, [subscriptionPlans, selectedSubscription]);
  
  useEffect(() => {
    const top6Packs = creditPacks.slice(0, 6);
    if (top6Packs.length > 0 && !top6Packs.find(p => p.product_id === selectedOneTime)) {
      setSelectedOneTime(top6Packs.length > 3 ? top6Packs[3].product_id : top6Packs[0].product_id);
    }
  }, [creditPacks, selectedOneTime]);

  const handleCheckout = async (item: PricingItem, cn_pay: boolean = false) => {
    try {
      if (!user) {
        setShowSignModal(true);
        return;
      }

      const params = {
        product_id: item.product_id,
        stripe_product_id: item.stripe_product_id,
        stripe_price_id: item.stripe_price_id,
        currency: cn_pay ? "cny" : item.currency,
        locale: locale || "en",
      };

      setIsLoading(true);
      setProductId(item.product_id);

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (response.status === 401) {
        setIsLoading(false);
        setProductId(null);
        setShowSignModal(true);
        return;
      }

      const { code, message, data } = await response.json();
      if (code !== 0) {
        toast.error(message);
        return;
      }

      const { checkout_url } = data;
      if (!checkout_url) {
        toast.error("checkout failed");
        return;
      }

      window.location.href = checkout_url;
    } catch (e) {
      console.log("checkout failed: ", e);
      toast.error("checkout failed");
    } finally {
      setIsLoading(false);
      setProductId(null);
    }
  };

  // 计算每credit价格（向下取整到3位小数）
  const getPricePerCredit = (price: string, credits: number) => {
    const priceNum = parseFloat(price.replace(/[^0-9.]/g, ''));
    const pricePerCredit = priceNum / credits;
    // 向下取整到3位小数
    const floored = Math.floor(pricePerCredit * 1000) / 1000;
    return floored.toFixed(3);
  };

  // 计算节省百分比（基于最贵的选项）
  const getSavePercent = (currentPrice: string, credits: number, allItems: PricingItem[]) => {
    if (allItems.length === 0) return null;
    const priceNum = parseFloat(currentPrice.replace(/[^0-9.]/g, ''));
    const pricePerCredit = priceNum / credits;
    
    // 找到每credit最贵的选项
    const maxPricePerCredit = Math.max(...allItems.map(item => {
      const itemPrice = parseFloat(item.price.replace(/[^0-9.]/g, ''));
      return itemPrice / item.credits;
    }));
    
    if (pricePerCredit >= maxPricePerCredit) return null;
    const savePercent = Math.round(((maxPricePerCredit - pricePerCredit) / maxPricePerCredit) * 100);
    return savePercent > 0 ? savePercent : null;
  };

  // 获取当前选中的订阅计划
  const selectedSubscriptionPlan = subscriptionPlans.find(item => item.product_id === selectedSubscription) || subscriptionPlans[0] || null;
  // 获取当前选中的一次性购买
  const selectedOneTimePlan = creditPacks.find(item => item.product_id === selectedOneTime) || creditPacks[0] || null;

  return (
    <section id={pricing.name} className="pt-24 pb-16">
      <div className="container">
        <div className="mx-auto mb-12 text-center">
          <h1 className="mb-2 text-[36px] font-bold text-foreground">
            Subscription Plans
          </h1>
          <p className="text-lg text-muted-foreground">
            Choose the plan that works best for you. Cancel or change at any time.
          </p>
        </div>

        {/* 三列布局 */}
        <div className="w-full grid gap-6 md:grid-cols-3 max-w-6xl mx-auto mb-16 items-stretch">
          {/* Free Plan - 左侧 */}
          <div className="relative rounded-xl p-7 border border-border bg-card/50 text-card-foreground flex flex-col h-full">
            <div className="text-2xl font-bold mb-4 text-center">
              Free Plan
            </div>
            
            <div className="flex items-end justify-center gap-1 mb-3">
              <div className="text-4xl font-bold">
                $0
              </div>
              <span className="text-base text-muted-foreground mb-1">
                /credit
              </span>
            </div>
            
            {/* 占位空间，使按钮与右侧对齐（模拟 billing 信息的高度） */}
            <div className="mb-4 min-h-[20px]"></div>
            
            <Button
              className="w-full text-base font-bold py-5 bg-[#262729] text-[#FEBE6C] hover:bg-[#262729]/90 mb-4"
              onClick={() => {
                if (!user) {
                  setShowSignModal(true);
                }
              }}
            >
              Sign Up Free
            </Button>
            
            <ul className="flex flex-col gap-3">
                <li>
                  <div className="flex items-start gap-3">
                    <Check className="mt-0.5 size-4 shrink-0 text-orange-500" />
                    <span className="text-sm text-foreground">1 Free Credit (Total)</span>
                  </div>
                </li>
                <li>
                  <div className="flex items-start gap-3">
                    <Check className="mt-0.5 size-4 shrink-0 text-orange-500" />
                    <span className="text-sm text-foreground">Unlimited Previews</span>
                  </div>
                </li>
                <li>
                  <div className="flex items-start gap-3">
                    <Check className="mt-0.5 size-4 shrink-0 text-orange-500" />
                    <span className="text-sm text-foreground">Access to all AI features</span>
                  </div>
                </li>
                <li>
                  <div className="flex items-start gap-3">
                    <Check className="mt-0.5 size-4 shrink-0 text-orange-500" />
                    <span className="text-sm text-foreground">24/7 Support</span>
                  </div>
                </li>
              </ul>
          </div>

          {/* Subscription Plan - 中间 */}
          <div className="relative rounded-xl p-7 border-4 border-black bg-card/50 text-card-foreground flex flex-col h-full">
            <Badge className="absolute -top-3 right-0 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-sm font-bold px-3 py-1.5 rounded-md">
              Most Popular
            </Badge>
            
            <div className="text-2xl font-bold mb-4 text-center">
              Subscription Plan
            </div>
            
            {/* 显示当前选中计划的价格 */}
            {selectedSubscriptionPlan && (
              <div className="flex items-end justify-center gap-1 mb-4">
                <div className="text-3xl font-bold">
                  ${getPricePerCredit(selectedSubscriptionPlan.price, selectedSubscriptionPlan.credits)}
                </div>
                <span className="text-base text-muted-foreground mb-1">
                  /credit
                </span>
              </div>
            )}
            
            {/* Billing信息 */}
            {selectedSubscriptionPlan && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground text-center">
                  {selectedSubscriptionPlan.price} charged monthly. Cancel anytime.
                </p>
              </div>
            )}
            
            {/* 按钮 */}
            {selectedSubscriptionPlan && (
              <Button
                className="w-full text-base font-bold py-5 bg-[#262729] text-[#FEBE6C] hover:bg-[#262729]/90 mb-4"
                disabled={isLoading}
                onClick={() => {
                  handleCheckout(selectedSubscriptionPlan, false);
                }}
              >
                Subscribe Now
                {isLoading && productId === selectedSubscriptionPlan.product_id && (
                  <Loader className="ml-2 h-4 w-4 animate-spin" />
                )}
              </Button>
            )}
            
            <div className="flex flex-col gap-6">
              
              {/* 订阅计划选项 */}
              {subscriptionPlans.length > 0 && (
              <RadioGroup
                value={selectedSubscription || undefined}
                onValueChange={setSelectedSubscription}
                className="mb-4 space-y-3"
              >
                {(() => {
                  const top4Plans = subscriptionPlans.slice(0, 4);
                  return top4Plans.map((item, index) => {
                    const pricePerCredit = getPricePerCredit(item.price, item.credits);
                    const savePercent = getSavePercent(item.price, item.credits, top4Plans);
                    const isSelected = selectedSubscription === item.product_id;
                  
                  return (
                    <div key={item.product_id} className="flex items-center gap-3">
                      <RadioGroupItem
                        value={item.product_id}
                        id={`sub-${item.product_id}`}
                        className={`h-4 w-4 border-2 ${
                          isSelected 
                            ? "border-black [&[data-state=checked]>span>svg]:h-3 [&[data-state=checked]>span>svg]:w-3 [&[data-state=checked]>span>svg]:fill-black [&[data-state=checked]>span>svg]:text-black" 
                            : "border-gray-300"
                        }`}
                      />
                      <Label
                        htmlFor={`sub-${item.product_id}`}
                        className="flex-1 flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-baseline gap-1">
                          <span className="font-bold text-sm text-foreground">
                            {item.credits} Credit
                          </span>
                          <span className="text-sm text-muted-foreground">
                            /month
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          {savePercent && (
                            <Badge className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded mb-1">
                              Save {savePercent}%
                            </Badge>
                          )}
                          <div className="flex items-baseline gap-1">
                            <span className="font-bold text-sm text-foreground">
                              $ {pricePerCredit}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              /credit
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.price} /month
                          </div>
                        </div>
                      </Label>
                    </div>
                  );
                  });
                })()}
              </RadioGroup>
              )}
              
              {selectedSubscriptionPlan && (
                <ul className="flex flex-col gap-3">
                  <li>
                    <div className="flex items-start gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-orange-500" />
                      <span className="text-sm text-foreground">Save up to 60% vs Pay-as-you-go</span>
                    </div>
                  </li>
                  <li>
                    <div className="flex items-start gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-orange-500" />
                      <span className="text-sm text-foreground">Priority Processing Queue</span>
                    </div>
                  </li>
                  <li>
                    <div className="flex items-start gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-orange-500" />
                      <span className="text-sm text-foreground">Cancel Anytime</span>
                    </div>
                  </li>
                  <li>
                    <div className="flex items-start gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-orange-500" />
                      <span className="text-sm text-foreground">Access to Pro Animation Models</span>
                    </div>
                  </li>
                </ul>
              )}
            </div>
          </div>

          {/* One Time Payment - 右侧 */}
          <div className="relative rounded-xl p-7 border border-border bg-card/50 text-card-foreground flex flex-col h-full">
            <div className="text-2xl font-bold mb-4 text-center">
              One-time Payment
            </div>
            
            {/* 显示当前选中计划的价格 */}
            {selectedOneTimePlan && (
              <div className="flex items-end justify-center gap-1 mb-4">
                <div className="text-3xl font-bold">
                  ${getPricePerCredit(selectedOneTimePlan.price, selectedOneTimePlan.credits)}
                </div>
                <span className="text-base text-muted-foreground mb-1">
                  /credit
                </span>
              </div>
            )}
            
            {/* Billing信息 */}
            {selectedOneTimePlan && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground text-center">
                  {selectedOneTimePlan.price} charged once
                </p>
              </div>
            )}
            
            {/* 按钮 */}
            {selectedOneTimePlan && (
              <Button
                className="w-full text-base font-bold py-5 bg-[#262729] text-[#FEBE6C] hover:bg-[#262729]/90 mb-6"
                disabled={isLoading}
                onClick={() => {
                  handleCheckout(selectedOneTimePlan, false);
                }}
              >
                Buy Now
                {isLoading && productId === selectedOneTimePlan.product_id && (
                  <Loader className="ml-2 h-4 w-4 animate-spin" />
                )}
              </Button>
            )}
            
            <div className="flex flex-col gap-6 mt-auto">
              
              {/* 一次性购买选项 */}
              {creditPacks.length > 0 && (
              <RadioGroup
                value={selectedOneTime || undefined}
                onValueChange={setSelectedOneTime}
                className="mb-4 space-y-3"
              >
                {(() => {
                  const top6Packs = creditPacks.slice(0, 6);
                  return top6Packs.map((item, index) => {
                    const pricePerCredit = getPricePerCredit(item.price, item.credits);
                    const savePercent = getSavePercent(item.price, item.credits, top6Packs);
                    const isSelected = selectedOneTime === item.product_id;
                    
                    return (
                      <div key={item.product_id} className="flex items-center gap-3">
                        <RadioGroupItem
                          value={item.product_id}
                          id={`credit-${item.product_id}`}
                          className={`h-4 w-4 border-2 ${
                            isSelected 
                              ? "border-black [&[data-state=checked]>span>svg]:h-3 [&[data-state=checked]>span>svg]:w-3 [&[data-state=checked]>span>svg]:fill-black [&[data-state=checked]>span>svg]:text-black" 
                              : "border-gray-300"
                          }`}
                        />
                        <Label
                          htmlFor={`credit-${item.product_id}`}
                          className="flex-1 flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-baseline gap-1">
                            <span className="font-bold text-sm text-foreground">
                              {item.credits} Credits
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-0.5">
                            {savePercent && (
                              <Badge className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded mb-1">
                                Save {savePercent}%
                              </Badge>
                            )}
                            <div className="flex items-baseline gap-1">
                              <span className="font-bold text-sm text-foreground">
                                $ {pricePerCredit}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                /credit
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.price} charged once
                            </div>
                          </div>
                        </Label>
                      </div>
                    );
                  });
                })()}
              </RadioGroup>
              )}
              
              {selectedOneTimePlan && (
                <ul className="flex flex-col gap-3">
                  <li>
                    <div className="flex items-start gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-orange-500" />
                      <span className="text-sm text-foreground">Credits Never Expire</span>
                    </div>
                  </li>
                  <li>
                    <div className="flex items-start gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-orange-500" />
                      <span className="text-sm text-foreground">No Monthly Fees</span>
                    </div>
                  </li>
                  <li>
                    <div className="flex items-start gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-orange-500" />
                      <span className="text-sm text-foreground">Share with Family</span>
                    </div>
                  </li>
                  <li>
                    <div className="flex items-start gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-orange-500" />
                      <span className="text-sm text-foreground">Instant High-Res Download</span>
                    </div>
                  </li>
                  <li>
                    <div className="flex items-start gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-orange-500" />
                      <span className="text-sm text-foreground">24/7 Email Support</span>
                    </div>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* 邮箱联系信息 */}
        <div className="mt-24 text-center">
          <div className="max-w-2xl mx-auto">
            <p className="text-2xl font-bold text-foreground mb-2">
              For inquiries or assistance, contact us at
            </p>
            <span className="text-base text-muted-foreground">
              {process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@neonlightsai.com'}
            </span>
          </div>
        </div>
        
        {/* FAQ 部分 */}
        <div className="mt-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              If you have other questions, feel free to contact us
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 max-w-6xl mx-auto">
            <div className="rounded-xl p-6 border border-border bg-card/50 text-card-foreground">
              <h3 className="text-lg font-bold text-foreground mb-3">
                What happens when my credits run out?
              </h3>
              <p className="text-sm text-muted-foreground">
                Subscription credits are automatically reset at the beginning of each billing cycle. If you need more credits before the reset, you can purchase additional credit packs to meet your creative needs.
              </p>
            </div>
            
            <div className="rounded-xl p-6 border border-border bg-card/50 text-card-foreground">
              <h3 className="text-lg font-bold text-foreground mb-3">
                How long are my credits valid?
              </h3>
              <p className="text-sm text-muted-foreground">
                Subscription credits are reset monthly on your billing date. Credit pack credits never expire and can be used at any time, making them perfect for occasional users or when you need extra credits beyond your subscription allocation.
              </p>
            </div>
            
            <div className="rounded-xl p-6 border border-border bg-card/50 text-card-foreground">
              <h3 className="text-lg font-bold text-foreground mb-3">
                Can I get a refund for unused credits?
              </h3>
              <p className="text-sm text-muted-foreground">
                We do not provide refunds for previous subscription usage. Credit packs are non-refundable due to immediate allocation of computational resources. Please consider your needs carefully before purchasing.
              </p>
            </div>
            
            <div className="rounded-xl p-6 border border-border bg-card/50 text-card-foreground">
              <h3 className="text-lg font-bold text-foreground mb-3">
                How do I manage my subscription?
              </h3>
              <p className="text-sm text-muted-foreground">
                You can manage or cancel your subscription in the 'My Orders' section of your account. There you can view billing history, update payment methods, or change your plan.
              </p>
            </div>

            <div className="rounded-xl p-6 border border-border bg-card/50 text-card-foreground">
              <h3 className="text-lg font-bold text-foreground mb-3">
                How do subscription credits work?
              </h3>
              <p className="text-sm text-muted-foreground">
                Subscription credits are reset every 30 days. 
                Unused credits expire when the 30-day period is reset.
              </p>
            </div>

            <div className="rounded-xl p-6 border border-border bg-card/50 text-card-foreground">
              <h3 className="text-lg font-bold text-foreground mb-3">
                How do credit packs work?
              </h3>
              <p className="text-sm text-muted-foreground">
                Credit pack credits never expire and can be used at any time. They are perfect for occasional users 
                or when you need extra credits beyond your subscription allocation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
