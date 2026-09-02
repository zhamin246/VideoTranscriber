"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Section as SectionType } from "@/types/blocks/section";
import { CheckCircle2 } from "lucide-react";
import React from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function Testimonial({ section }: { section: SectionType }) {
  const t = useTranslations();
  
  if (section.disabled) {
    return null;
  }

  // 只取前6个评价
  const testimonials = (section.items || []).slice(0, 6);

  return (
    <section id={section.name} className="py-12 sm:py-16 lg:py-20 bg-[#F8F4EE]">
      <div className="container mx-auto px-4 max-w-[1216px]">
        {/* 顶部大标题 */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[36px] font-bold text-foreground mb-4 sm:mb-6 leading-tight">
            {section.title}
          </h2>
          
          {/* 描述 */}
          {section.description && section.description.trim() !== "" && (
            <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-3xl mx-auto">
              {section.description}
            </p>
          )}
          
          {/* 信任条 - 黄色按钮样式 */}
          <div className="flex items-center justify-center mb-8">
            <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#FFDD45] rounded-full shadow-sm">
              {/* 用户头像 - 重叠显示 */}
              {section.trustBarAvatars && section.trustBarAvatars.length > 0 ? (
                <div className="flex items-center -space-x-2">
                  {section.trustBarAvatars.slice(0, 4).map((avatar, index) => (
                    <Avatar 
                      key={index} 
                      className="size-6 sm:size-8 border-2 border-white"
                    >
                      <AvatarImage
                        src={avatar.src}
                        alt={avatar.alt || `User ${index + 1}`}
                      />
                    </Avatar>
                  ))}
                </div>
              ) : (
                // 默认头像 - 使用评价中的用户头像
                <div className="flex items-center -space-x-2">
                  {testimonials.slice(0, 4).map((item, index) => (
                    <Avatar 
                      key={index} 
                      className="size-6 sm:size-8 border-2 border-white"
                    >
                      <AvatarImage
                        src={item.image?.src || `/landingpage/users/${index + 1}.webp`}
                        alt={item.title || `User ${index + 1}`}
                      />
                    </Avatar>
                  ))}
                </div>
              )}
              
              {/* 信任条文本 */}
              {section.trustBarText && (
                <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">
                  {section.trustBarText}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 6个评价卡片网格布局 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {testimonials.map((item, index) => {
            const baseBeforeImage = item.beforeImage?.src || item.image?.src;
            const baseAfterImage = item.afterImage?.src || item.image?.src;
            // 添加版本号查询参数以强制刷新缓存
            // 第5个评价（index 4）使用更高版本号以强制刷新
            const version = index === 4 ? 'v=4' : 'v=3';
            const beforeImage = baseBeforeImage ? `${baseBeforeImage}?${version}` : null;
            const afterImage = baseAfterImage ? `${baseAfterImage}?${version}` : null;
            const afterVideo = item.afterVideo || null;
            
            return (
              <Card 
                key={index} 
                className="bg-[#EEEBE3] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                style={{ width: '380px', height: '515.98px' }}
              >
                {/* 前后对比图片/视频 - 上方 */}
                {(beforeImage || afterImage || afterVideo) && (
                  <div className="relative bg-[#EEEBE3] flex-shrink-0" style={{ height: '280px', padding: '16px' }}>
                    {/* 大图/视频 - 在右下角，底层，左上角与小图右下角叠加 */}
                    {(afterImage || afterVideo) && (
                      <div className="absolute" style={{ bottom: '16px', right: '16px', zIndex: 0, transform: 'translate(-40px, 10px)' }}>
                        <div 
                          className="relative rounded-[32px] overflow-hidden border-2 border-white shadow-sm"
                          style={{ width: '212px', height: '212px' }}
                        >
                          {afterVideo ? (
                            <video
                              src={afterVideo}
                              className="w-full h-full object-cover"
                              autoPlay
                              loop
                              muted
                              playsInline
                            />
                          ) : afterImage ? (
                            <Image
                              src={afterImage}
                              alt={`${item.title} - After`}
                              fill
                              className="object-cover"
                              sizes="212px"
                              loading={index < 3 ? "eager" : "lazy"}
                            />
                          ) : null}
                        </div>
                      </div>
                    )}
                    
                    {/* 小图 - 在左上角，上层，右下角部分叠加在大图左上角 */}
                    {beforeImage && (
                      <div className="absolute" style={{ top: '16px', left: '16px', zIndex: 10, transform: 'translate(10px, 10px)' }}>
                        <div 
                          className="relative rounded-[32px] overflow-hidden border-2 border-white shadow-sm"
                          style={{ width: '117.78px', height: '117.78px' }}
                        >
                          <Image
                            src={beforeImage}
                            alt={`${item.title} - Before`}
                            fill
                            className="object-cover"
                            sizes="117.78px"
                            loading={index < 3 ? "eager" : "lazy"}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* 箭头 - 从小图右下角指向大图/视频左上角 */}
                    {beforeImage && (afterImage || afterVideo) && (
                      <div className="absolute" style={{ bottom: '60px', left: '50px', zIndex: 20 }}>
                        <Image
                          src="/landingpage/testimonial/1.png"
                          alt="Arrow"
                          width={56}
                          height={56}
                          className="w-full h-full rotate-75 object-contain"
                        />
                      </div>
                    )}
                  </div>
                )}
                
                {/* 卡片内容 */}
                <div className="px-8 pb-8 pt-2 flex-shrink-0 flex flex-col">
                  {/* 用户信息和评分 - 名字和位置在左侧，星级在右侧 */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      {/* 名字 */}
                      <h3 className="text-sm sm:text-base font-bold text-foreground mb-1">
                        {item.title}
                      </h3>
                      {/* 位置 */}
                      {item.location && (
                        <p className="text-xs" style={{ color: 'oklch(0.707 0.022 261.325)' }}>
                          {item.location}
                        </p>
                      )}
                      {!item.location && item.label && (
                        <p className="text-xs" style={{ color: 'oklch(0.707 0.022 261.325)' }}>
                          {item.label}
                        </p>
                      )}
                    </div>
                    
                    {/* 5星评价 - 右侧 */}
                    <div className="flex items-center ml-2">
                      <Image
                        src="/landingpage/testimonial/2.png"
                        alt="5 stars rating"
                        width={80}
                        height={16}
                        className="h-4 w-auto object-contain"
                      />
                    </div>
                  </div>
                  
                  {/* 评价文本 - 斜体 */}
                  {item.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3 italic line-clamp-3">
                      {item.description}
                    </p>
                  )}
                  
                  {/* 验证用户标识 - 最下方 */}
                  {item.verified !== false && (
                    <div className="flex items-center gap-2 mt-auto">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-foreground">Verified user</span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
        
        {/* CTA按钮 - 评价下方 */}
        <div className="flex justify-center mt-12 sm:mt-16">
          <Button
            asChild
            size="lg"
            className="h-12 px-8 text-base font-medium bg-[#124337] text-white hover:bg-[#124337]/90 rounded-lg shadow-sm"
          >
            <Link href="#hero">
              {t("testimonial.ctaButton", { 
                defaultValue: "立即开始 - 让您的第一张照片重获新生" 
              })}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
