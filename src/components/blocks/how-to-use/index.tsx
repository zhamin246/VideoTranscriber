import { Badge } from "@/components/ui/badge";
import { Section as SectionType } from "@/types/blocks/section";
import { Sparkles } from "lucide-react";
import Image from "next/image";

// 为静态 how-to-use 图片增加版本号，用于缓存更新
const HOW_TO_USE_IMAGE_VERSION = "?v=2";

export default function HowToUse({ section, imagePathPrefix }: { section: SectionType; imagePathPrefix?: string }) {
  if (section.disabled) {
    return null;
  }

  // 只取前3个步骤
  const steps = section.items?.slice(0, 3) || [];

  return (
    <section className="py-12 sm:py-16 bg-[#F8F4EE]">
      <div className="container">
        {/* 移动端优化：调整标题区域间距和文字大小 */}
        <div className="mb-12 sm:mb-16 max-w-4xl mx-auto text-center px-4 sm:px-6">
          <h2 className="mb-4 sm:mb-6 text-pretty text-2xl sm:text-3xl md:text-4xl lg:text-[36px] font-bold text-foreground leading-tight">
            {section.title}
          </h2>
          <p className="mb-4 text-lg sm:text-xl font-medium text-muted-foreground">
            {section.description}
          </p>
        </div>
      </div>
      
      {/* 移动端优化：修复布局问题，确保所有步骤都能显示 */}
      <div className="container px-4 sm:px-6">
        <div className="flex flex-col md:flex-row gap-8 sm:gap-10 md:gap-12">
          {steps.map((item, index) => {
            // 先得到基础路径：如果图片路径已经包含完整路径，直接使用；否则添加前缀
            let baseSrc = item.image?.src
              ? (item.image.src.startsWith('/') ? item.image.src : `${imagePathPrefix || ''}${item.image.src}`)
              : `${imagePathPrefix || '/landingpage/how-to-use'}/${index + 1}.webp`;

            // 对 how-to-use 默认路径强制追加版本号，避免浏览器继续使用旧缓存
            if (baseSrc.startsWith("/landingpage/how-to-use/")) {
              // 如果已经带了查询参数，就不重复添加
              if (!baseSrc.includes("?")) {
                baseSrc = `${baseSrc}${HOW_TO_USE_IMAGE_VERSION}`;
              }
            }

            const imageSrc = baseSrc;
              
            return (
              <div key={index} className="flex-1">
                {/* 步骤图片 - 修改为 4:3 比例 */}
                <div className="relative aspect-[4/3] w-full mb-4 sm:mb-6 overflow-hidden rounded-xl sm:rounded-2xl bg-muted shadow-lg">
                  <Image 
                    src={imageSrc}
                    alt={`${item.title || `Passo ${index + 1}`} - Demonstração do tutorial da plataforma AI`}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    loading={index === 0 ? "eager" : "lazy"}
                    quality={index === 0 ? 85 : 75}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                  />
                </div>
                
                {/* 步骤名称 - 移动端优化：调整文字大小和间距 */}
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4 text-left">
                  <span className="text-primary font-bold mr-2">Passo {index + 1}:</span>
                  {item.title}
                </h3>
                
                {/* 步骤描述 - 移动端优化：调整文字大小 */}
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed text-left">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
