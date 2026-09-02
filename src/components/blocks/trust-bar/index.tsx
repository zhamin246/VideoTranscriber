"use client";

import { Section as SectionType } from "@/types/blocks/section";
import Image from "next/image";
import { Zap, CheckCircle2, Heart } from "lucide-react";

export default function TrustBar({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  // 分离 logo 和 highlights
  const logos = section.items?.filter(item => item.image && !item.icon) || [];
  const highlights = section.items?.filter(item => item.icon && !item.image) || [];

  return (
    <section className="w-full bg-background">
      {/* Logo Cloud Section */}
      {logos.length > 0 && (
        <div className="bg-[#F8F4EE] py-8 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 lg:gap-16">
              {logos.map((logo, index) => (
                <div
                  key={index}
                  className="flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity"
                >
                  {logo.image?.src ? (
                    <Image
                      src={logo.image.src}
                      alt={logo.image.alt || logo.title || "Logo"}
                      // 使用固定宽高以匹配类型定义（base Image 类型中未包含 width/height）
                      width={120}
                      height={40}
                      className="h-8 md:h-10 object-contain brightness-75 hover:brightness-100 transition-all"
                      style={{ backgroundColor: 'transparent' }}
                      unoptimized
                    />
                  ) : (
                    <span className="text-lg md:text-xl font-semibold text-foreground">
                      {logo.title}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Highlights Section */}
      {highlights.length > 0 && (
        <div className="bg-[#123F37] py-6 px-4 text-white">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
              {highlights.map((highlight, index) => {
                // 根据 icon 名称选择对应的图标
                let IconComponent = CheckCircle2;
                if (highlight.icon === "zap" || highlight.icon === "lightning") {
                  IconComponent = Zap;
                } else if (highlight.icon === "heart" || highlight.icon === "love") {
                  IconComponent = Heart;
                } else if (highlight.icon === "check" || highlight.icon === "checkmark") {
                  IconComponent = CheckCircle2;
                }

                return (
                  <div
                    key={index}
                    className="flex items-center gap-3"
                  >
                    <IconComponent className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
                    <span className="text-center md:text-left text-[12px]">{highlight.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

