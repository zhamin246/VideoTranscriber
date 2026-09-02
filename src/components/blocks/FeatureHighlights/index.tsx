"use client";

import Icon from "@/components/icon";
import { Section as SectionType } from "@/types/blocks/section";
import { Button } from "@/components/ui/button";
import React, { forwardRef, useEffect, useState } from 'react';
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

const FeatureHighlights = forwardRef<HTMLElement, { 
  section: SectionType; 
  targetId?: string;
  imagePathPrefix?: string;
}>(({ section, targetId = 'feature-highlights', imagePathPrefix = '' }, ref) => {
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md断点
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  if (section.disabled) {
    return null;
  }

  // 添加跳转函数 - 跳转到当前页面的hero区域
  const handleGetStarted = () => {
    // 直接滚动到当前页面的hero区域
    setTimeout(() => {
      const heroSection = document.getElementById('hero');
      if (heroSection) {
        // 计算header高度，确保滚动位置正确
        const headerOffset = 80;
        const elementPosition = heroSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  return (
    <section className="bg-[#F8F4EE] pt-8 sm:pt-10 lg:pt-12 pb-12 sm:pb-16 lg:pb-20" ref={ref}>
      <div className="container mx-auto px-4">

        {/* 内容区域 */}
        <div className="space-y-8 sm:space-y-12 lg:space-y-16">
          {section.items?.map((item, index) => {
            const isEven = index % 2 === 0;
            // 第一张、第三张卡片（索引 0, 2）使用 #EEEBE3
            // 第二张、第四张卡片（索引 1, 3）使用白色
            // 其他索引保持默认样式
            const isBeigeCard = index === 0 || index === 2; // 第一张和第三张卡片使用浅米色
            const isWhiteCard = index === 1 || index === 3; // 第二张和第四张卡片使用白色
            // 如果图片路径已经包含完整路径，直接使用；否则添加前缀
            // 添加版本号查询参数以强制刷新缓存
            const baseImageSrc = item.image?.src ? 
              (item.image.src.startsWith('/') ? item.image.src : `${imagePathPrefix}${item.image.src}`) : 
              null;
            const imageSrc = baseImageSrc ? `${baseImageSrc}?v=2` : null;
            
            return (
              <div 
                key={index} 
                className={`${
                  isBeigeCard
                    ? 'bg-[#EEEBE3] border border-gray-200 shadow-sm'
                    : isWhiteCard 
                    ? 'bg-[#FFFFFF] border border-gray-200 shadow-sm' 
                    : 'bg-[#EEEBE3] border border-gray-200 shadow-sm'
                } rounded-2xl`}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center rounded-2xl p-8 sm:p-10 lg:p-12">
                  <div className={`${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                      {/* 卡片标题 */}
                      <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                        {item.title}
                      </div>
                      
                      {/* 卡片描述 */}
                      <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                      
                      {/* 三个分点 - 带勾选标记 */}
                      {item.features && item.features.length > 0 && (
                        <ul className="space-y-3 sm:space-y-4">
                          {item.features.slice(0, 3).map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <span className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      
                      {/* 按钮 */}
                      <div className="flex justify-center lg:justify-start pt-2">
                        <Button 
                          className="bg-[#124337] text-white hover:bg-[#124337]/90 px-8 py-4 text-base font-bold rounded-lg h-auto shadow-lg border-0"
                          size="lg"
                          onClick={handleGetStarted}
                        >
                          {item.buttons && item.buttons.length > 0
                            ? item.buttons[0].title
                            : "Restore photo now"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* 图片区域 - 修改为 4:3 比例 */}
                  <div className={`${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                    {imageSrc && (
                      <div className="relative w-full aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden">
                        <Image
                          src={imageSrc}
                          alt={item.image?.alt || item.title || 'Feature highlight image'}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 50vw"
                          className="object-cover transition-transform duration-500 hover:scale-105"
                          loading={index < 2 ? "eager" : "lazy"}
                          quality={index < 2 ? 85 : 75}
                          fetchPriority={index < 2 ? "high" : "auto"}
                          placeholder="blur"
                          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

FeatureHighlights.displayName = 'FeatureHighlights';

export default FeatureHighlights;
