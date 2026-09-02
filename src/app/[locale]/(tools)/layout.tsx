import { ReactNode } from "react";
import ToolsSidebar from "@/components/tools/sidebar";
import Header from "@/components/blocks/header";
import { getLandingPage, getFeaturesPage } from "@/services/page";
import ConditionalContent from "@/components/tools/conditional-content";

export default async function ToolsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = await getLandingPage(locale);
  
  // 获取所有页面的数据
  const featuresPage = await getFeaturesPage(locale);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* 使用首页的 Header */}
      {page.header && <Header header={page.header} />}
      
      {/* 固定定位的侧边栏 */}
      <ToolsSidebar />
      
      {/* 右侧内容区域 - 边距由JavaScript动态控制 */}
      <div className="mt-20 px-4 lg:px-6 transition-all duration-300 w-full overflow-x-hidden lg:ml-16" id="content-area">
        {/* 工具区域 - 添加ID用于跳转 */}
        <div id="tool-container" className="min-h-screen">
          {children}
        </div>
        
        {/* 条件渲染组件 */}
        <ConditionalContent
          featuresPage={featuresPage}
          footer={page.footer}
        />
      </div>
    </div>
  );
}
