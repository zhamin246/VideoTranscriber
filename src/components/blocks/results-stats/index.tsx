"use client";

import { Section as SectionType } from "@/types/blocks/section";

export default function ResultsStats({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  const items = section.items || [];

  return (
    <section className="w-full bg-[#123F37] py-12 md:py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* 标题和副标题 */}
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3">
            {section.title || "Results You Can Feel"}
          </h2>
          {section.description && (
            <p className="text-xs md:text-sm text-white/90 max-w-2xl mx-auto">
              {section.description}
            </p>
          )}
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center border border-white/20 rounded-lg p-4 md:p-6"
            >
              {/* 大数字 */}
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-yellow-400 mb-3">
                {item.label}
              </div>
              
              {/* 标题 */}
              <h3 className="text-sm md:text-base font-semibold text-white mb-3">
                {item.title}
              </h3>
              
              {/* 描述框 */}
              {item.description && (
                <div className="w-full bg-[#123F37] rounded-lg px-3 py-2 border border-white/10">
                  <p className="text-xs md:text-sm text-white">
                    {item.description}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

