"use client";

import Image from "next/image";
import React from "react";
import { Section as SectionType } from "@/types/blocks/section";
import { useTranslations } from "next-intl";

export default function MemoryCards({ section }: { section?: SectionType }) {
  const t = useTranslations();
  
  if (section?.disabled) {
    return null;
  }

  // 使用 section.items 或默认数据
  const items = section?.items || [
    {
      title: t("memoryCards.card1.title", { defaultValue: "Bring Your Family's Memories to Life" }),
      description: t("memoryCards.card1.description", { 
        defaultValue: "Restore and enhance your treasured family photos, bringing back the clarity and vibrancy of precious moments." 
      }),
      image: { src: "/landingpage/memory-cards/1.webp", alt: "Family memories" },
      bgColor: "#124337"
    },
    {
      title: t("memoryCards.card2.title", { defaultValue: "Celebrate the Moments That Shape Us" }),
      description: t("memoryCards.card2.description", { 
        defaultValue: "Preserve the stories behind every smile, laugh, and heartfelt moment captured in your photo collection." 
      }),
      image: { src: "/landingpage/memory-cards/2.webp", alt: "Photo album" },
      bgColor: "#ffde45"
    },
    {
      title: t("memoryCards.card3.title", { defaultValue: "Preserve Your Story for Tomorrow" }),
      description: t("memoryCards.card3.description", { 
        defaultValue: "Create beautiful restored photos from your memories — so your family's story lives on, clear and vibrant for years to come." 
      }),
      image: { src: "/landingpage/memory-cards/3.webp", alt: "Preserved memories" },
      bgColor: "#114337"
    }
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="container mx-auto px-4 max-w-[1216px]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
          {items.slice(0, 3).map((item: any, index: number) => {
            const baseImageSrc = typeof item.image === 'object' ? item.image?.src : item.image;
            // 添加版本号查询参数以强制刷新缓存
            const imageSrc = baseImageSrc ? `${baseImageSrc}?v=2` : null;
            const imageAlt = typeof item.image === 'object' ? item.image?.alt : item.title;
            const bgColor = item.bgColor || "#124337";
            
            return (
              <div key={index} className="flex flex-col items-center text-center">
                {/* 图片容器 - 圆形背景 + 叠加图片 */}
                <div className="relative mb-6 w-full max-w-[300px] mx-auto">
                  {/* 圆形背景 - 在图片后面，底部左侧和顶部右侧可见 */}
                  <div 
                    className="absolute rounded-full"
                    style={{
                      width: '120%',
                      height: '120%',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 0,
                      opacity: 0.3,
                      backgroundColor: bgColor
                    }}
                  />
                  
                  {/* 图片 - 叠加在圆形背景上 */}
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-lg z-10 bg-gray-200">
                    {imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt={imageAlt || item.title || "Memory card"}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                        loading="lazy"
                        quality={85}
                        onError={(e) => {
                          // 图片加载失败时显示占位符
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                        <span className="text-gray-400 text-sm">Image</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 文字内容 */}
                <div className="space-y-3 px-4">
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

