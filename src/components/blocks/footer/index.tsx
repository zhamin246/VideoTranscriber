import { Footer as FooterType } from "@/types/blocks/footer";
import Icon from "@/components/icon";
import { Link } from "@/i18n/navigation";

export default function Footer({ footer }: { footer: FooterType }) {
  if (footer.disabled) {
    return null;
  }

  return (
    <section id={footer.name} className="py-12 sm:py-16" style={{ backgroundColor: '#124337' }}>
      {/* 移动端优化：调整容器边距和宽度 */}
      <div className="w-full px-2 sm:px-4 lg:px-8">
        <footer>
          {/* 移动端优化：调整整体布局和间距 */}
          <div className="flex flex-col items-center justify-between gap-8 sm:gap-10 text-center lg:flex-row lg:text-left lg:items-start lg:justify-between lg:gap-12">
            {/* 移动端优化：调整导航网格布局 - 往右移动，减少左侧空余 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 lg:flex-shrink-0 lg:ml-auto">
              {footer.nav?.items?.map((item, i) => {
                // 特殊处理：将AI Photo Effects合并到Image AI列中
                if (item.title === "AI Photo Effects" || item.title === "AI照片特效") {
                  return null; // 不渲染AI Photo Effects，它会被合并到Image AI中
                }
                
                // 如果是Image AI，需要包含AI Photo Effects的内容
                const isImageAI = item.title === "Image AI";
                const aiPhotoEffectsItem = footer.nav?.items?.find(navItem => 
                  navItem.title === "AI Photo Effects" || navItem.title === "AI照片特效"
                );
                
                return (
                  <div key={i} className="min-w-0 flex flex-col">
                    {/* Image AI 标题 */}
                    <p className="mb-4 sm:mb-6 font-bold text-white text-sm sm:text-base lg:text-lg whitespace-nowrap text-center lg:text-left">{item.title}</p>
                    <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-300">
                      {/* Image AI 的子项目 */}
                      {item.children?.map((iitem, ii) => {
                        // 如果有URL，就显示为链接
                        if (iitem.url && iitem.url.trim() !== "") {
                          return (
                            <li key={ii} className="font-medium hover:text-white transition-colors whitespace-nowrap">
                              <Link href={iitem.url} target={iitem.target}>
                                {iitem.title}
                              </Link>
                            </li>
                          );
                        } else {
                          return (
                            <li key={ii} className="font-medium text-gray-300 whitespace-nowrap">
                              <span>{iitem.title}</span>
                            </li>
                          );
                        }
                      })}
                      
                      {/* 如果是Image AI，添加AI Photo Effects作为独立分类 */}
                      {isImageAI && aiPhotoEffectsItem && (
                        <>
                          {/* AI Photo Effects 标题 */}
                          <li className="mt-6 sm:mt-8">
                            <p className="mb-4 sm:mb-6 font-bold text-white text-sm sm:text-base lg:text-lg whitespace-nowrap">
                              {aiPhotoEffectsItem.title}
                            </p>
                          </li>
                          {/* AI Photo Effects 的子项目 */}
                          {aiPhotoEffectsItem.children?.map((iitem, ii) => {
                            // 如果有URL，就显示为链接
                            if (iitem.url && iitem.url.trim() !== "") {
                              return (
                                <li key={`ai-photo-${ii}`} className="font-medium hover:text-white transition-colors whitespace-nowrap">
                                  <Link href={iitem.url} target={iitem.target}>
                                    {iitem.title}
                                  </Link>
                                </li>
                              );
                            } else {
                              return (
                                <li key={`ai-photo-${ii}`} className="font-medium text-gray-300 whitespace-nowrap">
                                  <span>{iitem.title}</span>
                                </li>
                              );
                            }
                          })}
                        </>
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* 分隔线 - 移动端隐藏，桌面端显示 */}
            <div className="hidden lg:block w-px h-64 bg-gray-600 lg:mx-8"></div>
            
            {/* 移动端优化：调整品牌区域布局和间距 */}
            <div className="flex w-full max-w-80 shrink flex-col items-center justify-start gap-2 lg:items-end lg:shrink-0 lg:pt-0 mt-8 lg:mt-0">
              {footer.brand && (
                <div className="lg:text-right text-center">
                  <div className="flex items-center justify-center gap-2 lg:justify-end">
                    {footer.brand.logo && (
                      <img
                        src={footer.brand.logo.src}
                        alt={footer.brand.logo.alt || footer.brand.title}
                        className="h-8 sm:h-10 lg:h-11"
                        style={{ backgroundColor: 'transparent' }}
                      />
                    )}
                    {footer.brand.title && (
                      <p className="text-xl font-semibold text-white">
                        {footer.brand.title}
                      </p>
                    )}
                  </div>
                  {footer.brand.description && (
                    <p className="mt-4 sm:mt-6 text-base text-gray-300 max-w-fit">
                      {footer.brand.description}
                    </p>
                  )}
                  <div className="mt-4 sm:mt-6 flex items-center justify-center gap-2 lg:justify-end">
                    <Icon name="RiMailLine" className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300" />
                    <span className="text-sm text-gray-300 break-all">
                      {process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@facerating.com'}
                    </span>
                  </div>
                </div>
              )}
              {footer.copyright && (
                <p className="mt-4 sm:mt-6 text-sm text-gray-400 lg:text-right text-center whitespace-nowrap">
                  {footer.copyright}
                </p>
              )}
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
}
