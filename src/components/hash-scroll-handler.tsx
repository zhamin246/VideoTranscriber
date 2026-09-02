"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function HashScrollHandler() {
  const pathname = usePathname();

  useEffect(() => {
    // 判断是否是首页
    const normalizedPath = pathname.replace(/^\/[a-z]{2}\//, '/').replace(/^\/[a-z]{2}$/, '/').replace(/\/$/, '');
    const isHomePage = normalizedPath === '' || normalizedPath === '/';
    
    // 检查是否是从其他页面跳转过来的（通过 sessionStorage 标记）
    const isNavigatingFromOtherPage = sessionStorage.getItem('navigatingToHome') === 'true';
    
    console.log('🔍 [HashScrollHandler] 路径变化:', {
      pathname,
      normalizedPath,
      isHomePage,
      isNavigatingFromOtherPage,
      scrollY: window.scrollY,
      hash: window.location.hash,
      heroExists: !!document.getElementById('hero')
    });
    
    // 如果是从其他页面跳转过来的，先滚动到顶部
    if (isNavigatingFromOtherPage && isHomePage) {
      console.log('🔍 [HashScrollHandler] 从其他页面跳转过来，滚动到顶部');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    
    const scrollToHero = () => {
      const heroSection = document.getElementById('hero');
      if (heroSection) {
        // 检查 hero 元素是否在视口中（确保是当前页面的 hero）
        const rect = heroSection.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.top < window.innerHeight * 2;
        
        // 如果 hero 不在视口中，说明可能是错误的元素
        if (!isVisible && rect.top < -100) {
          return false;
        }
        
        // 计算header高度，确保滚动位置正确
        const headerOffset = 80;
        const elementPosition = heroSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: 'smooth'
        });
        return true;
      }
      return false;
    };

    const handleHashScroll = () => {
      console.log('🔍 [HashScrollHandler] handleHashScroll 执行:', {
        hash: window.location.hash,
        isNavigatingFromOtherPage,
        isHomePage,
        scrollY: window.scrollY
      });
      
      // 如果是从其他页面跳转过来的，不执行自动滚动（让 hero 组件的逻辑处理）
      if (isNavigatingFromOtherPage) {
        console.log('🔍 [HashScrollHandler] 从其他页面跳转过来，跳过自动滚动');
        sessionStorage.removeItem('navigatingToHome');
        return;
      }
      
      if (window.location.hash === '#hero') {
        // 立即尝试一次
        if (!scrollToHero()) {
          // 如果hero元素还没加载，等待一段时间后重试
          let attempts = 0;
          const tryScroll = setInterval(() => {
            attempts++;
            if (scrollToHero() || attempts > 20) {
              clearInterval(tryScroll);
            }
          }, 100);
        }
      } else if (isHomePage && !window.location.hash) {
        // 在首页且没有hash时，如果页面在顶部，自动滚动到hero区域
        // 这样可以避免用户已经滚动过页面后再次滚动
        if (window.scrollY <= 10) {
          setTimeout(() => {
            scrollToHero();
          }, 500);
        }
      }
    };

    // 页面加载完成后检查hash
    if (document.readyState === 'complete') {
      handleHashScroll();
    } else {
      window.addEventListener('load', handleHashScroll);
    }

    // 监听hash变化
    window.addEventListener('hashchange', handleHashScroll);

    // 延迟执行，确保DOM已渲染（但如果是从其他页面跳转过来的，不执行）
    if (!isNavigatingFromOtherPage) {
      setTimeout(handleHashScroll, 300);
    }

    return () => {
      window.removeEventListener('load', handleHashScroll);
      window.removeEventListener('hashchange', handleHashScroll);
    };
  }, [pathname]);

  return null;
}

