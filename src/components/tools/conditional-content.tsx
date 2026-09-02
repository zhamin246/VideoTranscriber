"use client";

import DynamicToolContent from "@/components/tools/dynamic-tool-content";
import Footer from "@/components/blocks/footer";
import Feedback from "@/components/feedback";
import { FeaturesPage } from "@/types/pages/landing";

interface ConditionalContentProps {
  featuresPage: FeaturesPage;
  footer: any;
}

export default function ConditionalContent({
  featuresPage,
  footer
}: ConditionalContentProps) {
  return (
    <>
      {/* 动态内容组件 */}
      <DynamicToolContent
        featuresPage={featuresPage}
      />
      
      {/* Footer - 所有页面都显示 */}
      {footer && <Footer footer={footer} />}
      
      {/* Feedback 组件 */}
      <Feedback />
    </>
  );
}
