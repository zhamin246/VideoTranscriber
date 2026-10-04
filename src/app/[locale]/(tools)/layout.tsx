import { ReactNode } from "react";
import ToolsSidebar from "@/components/tools/sidebar";
import FaceRatingSiteHeader from "@/components/face-rating/site-header";
import { getFeaturesPage } from "@/services/page";
import ConditionalContent from "@/components/tools/conditional-content";
import FaceRatingSiteFooter from "@/components/face-rating/site-footer";

export default async function ToolsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const featuresPage = await getFeaturesPage(locale);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <FaceRatingSiteHeader />
      
      {/* 固定定位的侧边栏 */}
      <ToolsSidebar />
      
      {/* 右侧内容区域 - 边距由JavaScript动态控制 */}
      <div className="mt-20 px-4 lg:px-6 transition-all duration-300 w-full overflow-x-hidden lg:ml-16" id="content-area">
        {/* 工具区域 - 添加ID用于跳转 */}
        <div id="tool-container" className="min-h-screen">
          {children}
        </div>
        
        {/* 条件渲染组件 */}
        <ConditionalContent featuresPage={featuresPage} footer={null} />
        <FaceRatingSiteFooter />
      </div>
    </div>
  );
}
