"use client";

import Link from "next/link";
import { Section as SectionType } from "@/types/blocks/section";
import Icon from "@/components/icon";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Check } from "lucide-react";
import { Sparkles } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";

export default function RelatedTools({ section }: { section: SectionType }) {
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [slidesToScroll, setSlidesToScroll] = useState(3);
  const router = useRouter();
  const pathname = usePathname();

  if (section.disabled) {
    return null;
  }

  // 处理按钮点击，确保能正确跳转并滚动到hero区域
  const handleButtonClick = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    
    // 检查URL是否包含锚点
    if (url.includes('#hero')) {
      const [path, hash] = url.split('#');
      const cleanPath = path || '';
      const currentPath = pathname.replace(/\/$/, '');
      const normalizedCurrentPath = currentPath.replace(/^\/[a-z]{2}\//, '/').replace(/^\/[a-z]{2}$/, '/');
      const normalizedTargetPath = cleanPath.replace(/^\/[a-z]{2}\//, '/').replace(/^\/[a-z]{2}$/, '/');
      
      // 如果目标路径与当前路径不同，需要先跳转
      if (cleanPath && normalizedTargetPath !== normalizedCurrentPath) {
        // 使用window.location来确保hash能正确跳转
        window.location.href = url;
      } else {
        // 在同一页面，直接滚动到hero区域
        setTimeout(() => {
          const heroSection = document.getElementById('hero');
          if (heroSection) {
            // 计算header高度，确保滚动位置正确
            const headerOffset = 80;
            const elementPosition = heroSection.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }
        }, 100);
      }
    } else {
      // 没有锚点，正常跳转
      router.push(url);
    }
  };

  // 根据屏幕尺寸确定一次滚动的数量
  useEffect(() => {
    const updateSlidesToScroll = () => {
      if (window.innerWidth >= 1024) {
        setSlidesToScroll(3); // lg: 3个
      } else if (window.innerWidth >= 640) {
        setSlidesToScroll(2); // sm: 2个
      } else {
        setSlidesToScroll(1); // 移动端: 1个
      }
    };

    updateSlidesToScroll();
    window.addEventListener('resize', updateSlidesToScroll);
    return () => window.removeEventListener('resize', updateSlidesToScroll);
  }, []);

  // 监听路径变化和hash变化，如果URL包含#hero，自动滚动到hero区域
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#hero') {
        setTimeout(() => {
          const heroSection = document.getElementById('hero');
          if (heroSection) {
            // 计算header高度，确保滚动位置正确
            const headerOffset = 80;
            const elementPosition = heroSection.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }
        }, 500);
      }
    };

    // 检查初始hash
    if (typeof window !== 'undefined' && window.location.hash === '#hero') {
      handleHashChange();
    }

    // 监听hash变化
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [pathname]);

  useEffect(() => {
    if (!api) {
      return;
    }

    const updateScrollButtons = () => {
      const selectedIndex = api.selectedScrollSnap();
      const totalSlides = api.scrollSnapList().length;
      
      const canPrev = selectedIndex >= slidesToScroll;
      const canNext = selectedIndex + slidesToScroll < totalSlides;
      
      setCanScrollPrev(canPrev);
      setCanScrollNext(canNext);
    };

    updateScrollButtons();
    api.on("select", updateScrollButtons);
    
    return () => {
      api.off("select", updateScrollButtons);
    };
  }, [api, slidesToScroll]);

  const scrollPrev = useCallback(() => {
    if (!api) return;
    const selectedIndex = api.selectedScrollSnap();
    const targetIndex = Math.max(0, selectedIndex - slidesToScroll);
    api.scrollTo(targetIndex);
  }, [api, slidesToScroll]);

  const scrollNext = useCallback(() => {
    if (!api) return;
    const selectedIndex = api.selectedScrollSnap();
    const totalSlides = api.scrollSnapList().length;
    const targetIndex = Math.min(totalSlides - 1, selectedIndex + slidesToScroll);
    api.scrollTo(targetIndex);
  }, [api, slidesToScroll]);

  // 默认图标颜色
  const iconColors = [
    "bg-pink-100 text-pink-600",
    "bg-green-100 text-green-600",
    "bg-purple-100 text-purple-600",
    "bg-blue-100 text-blue-600",
    "bg-orange-100 text-orange-600",
    "bg-cyan-100 text-cyan-600",
  ];

  return (
    <section id={section.name} className="py-12 sm:py-16 lg:py-20 bg-background">
      <div className="container">
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

        <div className="relative px-8 lg:px-0">
          <Carousel
            opts={{
              align: "start",
              slidesToScroll: 1,
            }}
            setApi={setApi}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {section.items?.map((item, index) => {
                const iconColorClass = item.iconColor || iconColors[index % iconColors.length];
                return (
                  <CarouselItem
                    key={index}
                    className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
                  >
                    <div className="group h-full flex flex-col bg-[#EEEBE3] rounded-xl border border-gray-200 hover:border-primary/30 hover:shadow-lg transition-all duration-300 p-6 sm:p-8">
                      {/* 图标 */}
                      {item.icon && (
                        <div className={cn(
                          "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                          iconColorClass
                        )}>
                          <Icon name={item.icon} className="w-8 h-8" />
                        </div>
                      )}

                      {/* 标题 */}
                      <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>

                      {/* 描述 */}
                      {item.description && (
                        <p className="text-sm sm:text-base text-muted-foreground mb-4 leading-relaxed flex-1">
                          {item.description}
                        </p>
                      )}

                      {/* 特性列表 */}
                      {item.features && item.features.length > 0 && (
                        <div className="space-y-2 mb-6">
                          {item.features.slice(0, 2).map((feature, featureIndex) => (
                            <div key={featureIndex} className="flex items-start gap-2">
                              <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                              <span className="text-sm text-muted-foreground">{feature}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 按钮 */}
                      <Button
                        className="w-full h-12 bg-primary hover:bg-primary/90 text-white group-hover:shadow-md transition-all text-base font-medium"
                        onClick={(e) => handleButtonClick(e, item.url || "#")}
                      >
                        <span>Experimentar {item.title}</span>
                        <Sparkles className="w-4 h-4 ml-2 text-white" />
                      </Button>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>

            {/* 导航按钮 */}
            {section.items && section.items.length > 3 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 h-10 w-10 rounded-full shadow-md bg-white hover:bg-gray-50 hidden lg:flex",
                    !canScrollPrev && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={scrollPrev}
                  disabled={!canScrollPrev}
                  aria-label="Previous tools"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 h-10 w-10 rounded-full shadow-md bg-white hover:bg-gray-50 hidden lg:flex",
                    !canScrollNext && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={scrollNext}
                  disabled={!canScrollNext}
                  aria-label="Next tools"
                >
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </>
            )}
          </Carousel>
        </div>
      </div>
    </section>
  );
}
