"use client";

import { GoogleAnalytics as NextGoogleAnalytics } from "@next/third-parties/google";
import { useEffect, useState } from "react";

export default function GoogleAnalytics() {
  const [shouldLoad, setShouldLoad] = useState(false);

  // 延迟加载Google Analytics，等待页面主要内容加载完成
  useEffect(() => {
    // 等待页面交互或2秒后加载（取较早者）
    const timer = setTimeout(() => {
      setShouldLoad(true);
    }, 2000);

    // 用户交互时立即加载
    const handleInteraction = () => {
      setShouldLoad(true);
      clearTimeout(timer);
    };

    // 监听用户交互
    const events = ['mousedown', 'touchstart', 'keydown', 'scroll'];
    events.forEach(event => {
      window.addEventListener(event, handleInteraction, { once: true, passive: true });
    });

    return () => {
      clearTimeout(timer);
      events.forEach(event => {
        window.removeEventListener(event, handleInteraction);
      });
    };
  }, []);

  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  const analyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  if (!analyticsId) {
    return null;
  }

  // 延迟加载Analytics
  if (!shouldLoad) {
    return null;
  }

  return <NextGoogleAnalytics gaId={analyticsId} />;
}
