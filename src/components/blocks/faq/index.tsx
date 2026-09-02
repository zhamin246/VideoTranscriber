import { Badge } from "@/components/ui/badge";
import { Section as SectionType } from "@/types/blocks/section";
import { Sparkles } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";

export default function FAQ({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  return (
    <section id={section.name} className="py-12 sm:py-16 lg:py-20 bg-background">
      <div className="container">
        {/* 移动端优化：调整网格布局和间距 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12 items-start">
          {/* 左侧标题区域 - 移动端优化：调整文字大小和间距 */}
          <div className="mb-8 lg:mb-0">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[36px] font-bold text-foreground leading-tight">
              {section.title}
            </h2>
          </div>

          {/* 右侧FAQ列表 - 移动端优化：调整手风琴样式和间距 */}
          <div className="lg:col-span-2 space-y-0">
            {section.items?.map((item, index) => (
              <Accordion key={index} type="single" collapsible>
                <AccordionItem value={`item-${index}`} className="border-b border-white/20 last:border-b-0" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>
                  <AccordionTrigger className="text-left font-bold text-lg sm:text-xl text-foreground hover:no-underline py-4 sm:py-6 lg:py-8 px-0 group w-full [&>svg:not(.custom-icon)]:hidden">
                    <svg className="custom-icon mr-3 sm:mr-4 w-4 h-4 sm:w-5 sm:h-5 text-foreground group-data-[state=open]:rotate-90 transition-transform duration-200" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200">
                      <path d="M794.01856 501.65888c-1.12896-2.33728-2.63936-4.53504-4.57728-6.47424L339.66336 45.40928c-9.2864-9.2864-24.34176-9.2864-33.62816 0l-71.45984 71.45856c-9.28512 9.2864-9.28512 24.34176 0 33.62816L596.08064 512 234.57536 873.504c-9.2864 9.2864-9.2864 24.34432 0 33.62944l71.45856 71.45856c9.2864 9.2864 24.34176 9.28512 33.62816-0.00128L717.9776 600.27648c0.00128-0.00128 0.00128-0.00256 0.00256-0.00256l71.45856-71.45856c0.58112-0.58112 1.12512-1.184 1.63328-1.80736C796.99456 519.74912 797.95968 509.81504 794.01856 501.65888L794.01856 501.65888z" fill="currentColor"/>
                    </svg>
                    <span className="text-left flex-1">{item.question || item.title}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 sm:pb-6 lg:pb-8 px-0 text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {item.answer || item.description}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}