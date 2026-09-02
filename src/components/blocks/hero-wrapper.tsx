"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Hero from "./hero";

export default function HeroWrapper({ hero }: { hero: any }) {
  const pathname = usePathname();
  
  // 在特定页面不显示旧 hero（首页改用 FaceRatingLandingPage 自带 Hero）
  const hideHeroPages = ['/image-to-video', '/text-to-video', '/my-orders', '/my-credits', '/my-invites', '/user-generation-records', '/pricing'];
  const pathHit = hideHeroPages.some(page => pathname.includes(page));
  
  // 判断是否是首页
  const normalizedPath = pathname.replace(/^\/[a-z]{2}\//, '/').replace(/^\/[a-z]{2}$/, '/').replace(/\/$/, '');
  const isHomePage = normalizedPath === '' || normalizedPath === '/';
  // 首页使用全新 Face Rating 落地页组件，不再挂载旧修图 Hero
  const shouldHideHero = pathHit || isHomePage;
  
  // 调试信息
  useEffect(() => {
    console.log('🔍 [HeroWrapper] 路径变化:', {
      pathname,
      normalizedPath,
      isHomePage,
      shouldHideHero,
      scrollY: window.scrollY,
      heroExists: !!document.getElementById('hero'),
      navigatingFromOtherPage: sessionStorage.getItem('navigatingToHome') === 'true'
    });
  }, [pathname, isHomePage, shouldHideHero]);
  
  // 当路由变化到首页时，确保滚动到顶部（避免 Next.js 保留滚动位置）
  useEffect(() => {
    if (isHomePage && !shouldHideHero) {
      // 禁用浏览器的滚动恢复（防止刷新后的问题）
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }
      
      // 检查是否是从其他页面跳转过来的
      const isNavigatingFromOtherPage = sessionStorage.getItem('navigatingToHome') === 'true';
      console.log('🔍 [HeroWrapper] 路由变化到首页:', {
        isHomePage,
        shouldHideHero,
        isNavigatingFromOtherPage,
        scrollY: window.scrollY
      });
      
      if (isNavigatingFromOtherPage) {
        console.log('🔍 [HeroWrapper] 从其他页面跳转过来，滚动到顶部');
        // 立即滚动到顶部（多次确保，防止浏览器恢复滚动位置）
        window.scrollTo({ top: 0, behavior: 'instant' });
        
        // 使用 requestAnimationFrame 确保在浏览器恢复滚动位置之前执行
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: 'instant' });
          console.log('🔍 [HeroWrapper] requestAnimationFrame 后滚动到顶部，scrollY:', window.scrollY);
        });
        
        // 再次延迟确保
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'instant' });
          console.log('🔍 [HeroWrapper] setTimeout 后滚动到顶部，scrollY:', window.scrollY);
          
          const heroEl = document.getElementById('hero');
          console.log('🔍 [HeroWrapper] 滚动到顶部后检查 Hero:', {
            heroExists: !!heroEl,
            heroTop: heroEl?.getBoundingClientRect().top,
            scrollY: window.scrollY
          });
        }, 0);
        
        sessionStorage.removeItem('navigatingToHome');
      }
    }
  }, [pathname, isHomePage, shouldHideHero]);
  
  if (shouldHideHero) {
    console.log('🔍 [HeroWrapper] 隐藏 Hero，因为页面在隐藏列表中');
    return null;
  }

  console.log('🔍 [HeroWrapper] 渲染 Hero 组件');
  return <Hero hero={hero} />;
}