import { Button } from "@/components/ui/button";
import Icon from "@/components/icon";
import Link from "next/link";
import Image from "next/image";
import { Section as SectionType } from "@/types/blocks/section";

export default function CTA({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  const imageSrc = section.image?.src;

  return (
    <section id={section.name} className="py-16">
      <div className="container mx-auto px-4 max-w-[1216px]">
        <div className='flex flex-col lg:flex-row items-center gap-8 lg:gap-12 rounded-2xl bg-[#124337] px-4 sm:px-8 py-8 sm:py-12 lg:p-16 lg:h-[396px] overflow-hidden'>
          {/* 左侧：标题、描述、按钮 */}
          <div className="flex-1 text-center lg:text-left">
            <h2 className="mb-4 text-balance text-3xl font-semibold md:text-4xl lg:text-5xl text-white">
              {section.title}
            </h2>
            <p className="mb-8 text-white/90 md:text-lg">
              {section.description}
            </p>
            {section.buttons && section.buttons.length > 0 && (
              <div className="flex justify-center lg:justify-start">
                {section.buttons.map((item, idx) => (
                  <Button 
                    key={idx} 
                    variant={item.variant || "default"}
                    size="lg"
                    className="h-12 px-8 text-base font-medium bg-white text-[#124337] hover:bg-white/90"
                  >
                    {item.url && item.url.trim() !== "" ? (
                      <Link
                        href={item.url}
                        target={item.target}
                        className="flex items-center justify-center gap-2"
                      >
                        {item.title}
                        {item.icon && (
                          <Icon name={item.icon as string} className="size-5" />
                        )}
                      </Link>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {item.title}
                        {item.icon && (
                          <Icon name={item.icon as string} className="size-5" />
                        )}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* 右侧：图片 */}
          {imageSrc && (
            <div className="flex-1 relative w-full lg:w-auto max-w-full overflow-hidden">
              <div className="relative w-full aspect-square max-w-[200px] sm:max-w-xs mx-auto lg:max-w-sm">
                <div className="relative w-full h-full bg-transparent">
                  <Image
                    src={imageSrc}
                    alt={section.image?.alt || section.title || "CTA Image"}
                    fill
                    sizes="(max-width: 640px) 200px, (max-width: 1024px) 320px, 384px"
                    className="object-contain"
                    loading="lazy"
                    quality={85}
                    unoptimized={imageSrc.endsWith('.png')}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
