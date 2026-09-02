import { Section as SectionType } from "@/types/blocks/section";
import Icon from "@/components/icon";

export default function Feature({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  return (
    <section id={section.name} className="py-12 sm:py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* 标题 - 在白色卡片外面 */}
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center mb-12 sm:mb-16 px-4 sm:px-6">
          <h2 className="text-pretty text-3xl sm:text-4xl md:text-5xl lg:text-[48px] font-bold tracking-tight text-foreground">
            {section.title}
          </h2>
          {section.description && (
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {section.description}
            </p>
          )}
        </div>
        
        {/* 卡片背景 - 九宫格布局 */}
        <div className="bg-[#EEEBE3] rounded-2xl p-8 sm:p-10 lg:p-12">
          {/* 九宫格布局：一行三个，两行 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {section.items?.map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-4 p-6">
                {/* 图标 */}
                {item.icon && (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <Icon name={item.icon} className="w-8 h-8 text-primary" />
                  </div>
                )}
                
                {/* 文字内容 */}
                <div className="space-y-3">
                  <h3 className="text-lg sm:text-xl font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
