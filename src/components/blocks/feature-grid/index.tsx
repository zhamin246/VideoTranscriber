"use client";

import Image from "next/image";
import React from "react";
import { Section as SectionType } from "@/types/blocks/section";
import Icon from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function FeatureGrid({ section, imagePathPrefix = "" }: { section: SectionType; imagePathPrefix?: string }) {
  if (section?.disabled) return null;

  // 兼容两种数据源：feature_highlights 使用 items；use_cases 使用 cards
  const rawItems: any[] = (section as any).items ?? (section as any).cards ?? [];
  const items = rawItems.slice(0, 6);

  return (
    <section className="pt-10 sm:pt-12 lg:pt-16 pb-12 sm:pb-16 lg:pb-20 bg-[#EEEBE3]">
      <div className="container mx-auto px-4 max-w-[1216px]">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[36px] font-bold text-foreground">
            {section.title}
          </h2>
          {section.description && (
            <p className="mt-3 text-muted-foreground">
              {section.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {items.map((item: any, idx: number) => {
            // 兼容 image 两种格式：{ src } 或 字符串
            const rawImage = item.image;
            const srcFromObject = typeof rawImage === 'object' && rawImage?.src ? rawImage.src : undefined;
            const srcFromString = typeof rawImage === 'string' ? rawImage : undefined;
            const imageSrc = srcFromObject
              ? (srcFromObject.startsWith('/') ? srcFromObject : `${imagePathPrefix}${srcFromObject}`)
              : (srcFromString ? (srcFromString.startsWith('/') ? srcFromString : `${imagePathPrefix}${srcFromString}`) : undefined);
            return (
              <div key={idx} className="rounded-xl bg-white overflow-hidden flex flex-col">
                {imageSrc && (
                  <div className="relative w-full aspect-[4/3]">
                    <Image 
                      src={imageSrc} 
                      alt={item.image?.alt || item.title || "feature"} 
                      fill 
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                      loading="lazy"
                      quality={75}
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                    />
                  </div>
                )}
                <div className="p-4 sm:p-6 flex flex-col gap-3">
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground">{item.title}</h3>
                  {item.description && (
                    <div className="flex items-start gap-3">
                      <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{item.description}</p>
                      {item.icon && (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#124337' }}>
                          <Icon name={item.icon} className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* 底部按钮 */}
        <div className="flex justify-center mt-8 sm:mt-12">
          <Button
            asChild
            size="lg"
            className="bg-[#124337] text-white hover:bg-[#124337]/90 px-28 py-4 text-base font-bold rounded-lg h-auto shadow-lg border-0"
          >
            <Link href="/features" className="flex items-center gap-2">
              Explore all tools
              <Icon name="RiArrowRightLine" className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}


