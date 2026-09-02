import { Button } from "@/types/blocks/base/button";

export interface PricingGroup {
  name?: string;
  title?: string;
  description?: string;
  label?: string;
  is_featured?: boolean;
}

export interface PricingItem {
  title: string;
  description: string;
  features_title: string;
  features: string[];
  interval: string;
  amount: number;
  cn_amount?: number;
  currency: string;
  price: string;
  original_price?: string;
  unit: string;
  is_featured: boolean;
  tip?: string;
  button: {
    title: string;
    url: string;
    icon: string;
  };
  product_id: string;
  product_name: string;
  credits: number;
  valid_months: number;
  group: string;
  stripe_product_id?: string;  // 添加这个
  stripe_price_id?: string;    // 添加这个
}

export interface Pricing {
  disabled?: boolean;
  name?: string;
  title?: string;
  description?: string;
  items?: PricingItem[];
  groups?: PricingGroup[];
}
