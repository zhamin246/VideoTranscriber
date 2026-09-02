'use client';

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function ManageSubscriptionButton() {
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("my_orders");

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      console.log('正在创建Stripe Portal会话...');
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('API响应状态:', response.status);
      const data = await response.json();
      console.log('API响应数据:', data);
      
      // 修复：检查 data.data.url 而不是 data.url
      if (data.code === 0 && data.data?.url) {
        console.log('正在打开Stripe Portal:', data.data.url);
        window.open(data.data.url, '_blank');
      } else {
        console.error('API响应中没有URL:', data);
        alert(`无法创建订阅管理链接: ${data.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('创建Portal会话时出错:', error);
      alert('创建订阅管理链接失败，请检查网络连接后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="default" 
      size="sm"
      className="bg-white text-gray-900 hover:bg-gray-100 border border-gray-300"
      onClick={handleManageSubscription}
      disabled={isLoading}
    >
      {isLoading ? 'Processing...' : t('manage_subscription')}
    </Button>
  );
}
