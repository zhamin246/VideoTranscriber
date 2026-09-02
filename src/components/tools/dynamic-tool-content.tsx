"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import HowToUse from "@/components/blocks/how-to-use";
import FeatureHighlights from "@/components/blocks/FeatureHighlights";
import Feature from "@/components/blocks/feature";
import FAQ from "@/components/blocks/faq";
import { FeaturesPage } from "@/types/pages/landing";

interface DynamicToolContentProps {
  featuresPage: FeaturesPage;
}

export default function DynamicToolContent({
  featuresPage
}: DynamicToolContentProps) {
  const [currentPage, setCurrentPage] = useState<FeaturesPage | null>(null);
  const [imagePathPrefix, setImagePathPrefix] = useState("/features/");
  const [sidebarState, setSidebarState] = useState<string>('collapsed');
  const pathname = usePathname();

  useEffect(() => {
    const getCurrentPage = () => {
      console.log('Current pathname:', pathname);
      if (pathname === '/') {
        return featuresPage;
      } else if (pathname.includes('/features')) {
        return featuresPage;
      }
      return null;
    };

    const currentPageData = getCurrentPage();
    console.log('Current page data:', currentPageData);
    setCurrentPage(currentPageData);

    if (currentPageData) {
      if (currentPageData.imagePathPrefix) {
        setImagePathPrefix(currentPageData.imagePathPrefix);
      } else {
        setImagePathPrefix("/features/"); // Default prefix
      }
    }
  }, [pathname, featuresPage]);

  // 监听侧边栏状态变化
  useEffect(() => {
    const contentArea = document.getElementById('content-area');
    if (contentArea) {
      const observer = new MutationObserver(() => {
        const state = contentArea.getAttribute('data-sidebar-state');
        if (state) {
          setSidebarState(state);
        }
      });
      
      observer.observe(contentArea, { attributes: true, attributeFilter: ['data-sidebar-state'] });
      
      // 初始化状态
      const initialState = contentArea.getAttribute('data-sidebar-state');
      if (initialState) {
        setSidebarState(initialState);
      }
      
      return () => observer.disconnect();
    }
  }, []);

  // 在return之前添加检查
  if (!currentPage) {
    return null;
  }

  return (
    <div className={`transition-all duration-300 ${
      sidebarState === 'expanded' 
        ? 'max-w-[calc(100vw-16rem)] mx-auto' 
        : sidebarState === 'collapsed'
        ? 'max-w-[calc(100vw-4rem)] mx-auto'
        : 'max-w-full mx-auto'
    }`}>
      {/* HowToUse 组件 */}
      {currentPage.howToUse && (
        <HowToUse 
          section={currentPage.howToUse} 
          imagePathPrefix={imagePathPrefix}
        />
      )}
      
      {/* FeatureHighlights 组件 */}
      {currentPage.featureHighlights && (
        <FeatureHighlights 
          section={currentPage.featureHighlights} 
          targetId="tool-container"
          imagePathPrefix={imagePathPrefix}
        />
      )}
      
      {/* Feature 组件 */}
      {currentPage.feature && (
        <Feature section={currentPage.feature} />
      )}
      
      {/* FAQ 组件 */}
      {currentPage.faq && (
        <FAQ section={currentPage.faq} />
      )}
    </div>
  );
}
