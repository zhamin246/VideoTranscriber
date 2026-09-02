"use client";

import { useState, useEffect, useLayoutEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Icon from "@/components/icon";

const toolCategories = [
  {
    id: "image-ai",
    name: "AI TOOLS",
    icon: "RiImageLine",
    tools: [
      {
        id: "features",
        name: "AI Effects & Filters",
        icon: "RiMagicLine",
        path: "/features"
      },
      {
        id: "ai-image-editor",
        name: "AI Image Editor",
        icon: "RiEditLine",
        path: "/image-editor"
      },
      {
        id: "ai-face-character",
        name: "AI Face & Character",
        icon: "RiUserLine",
        path: "/face-generator"
      },
      {
        id: "explore-more",
        name: "Explore More",
        icon: "RiMoreLine",
        path: "/explore"
      }
    ]
  },
  {
    id: "my-generations",
    name: "MY GENERATIONS",
    icon: "RiHistoryLine",
    tools: [
      {
        id: "my-generations",
        name: "My Generations",
        icon: "RiHistoryLine",
        path: "/user-generation-records"
      }
    ]
  }
];

export default function ToolsSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false); // 默认展开
  const [isMobile, setIsMobile] = useState(false); // 默认假设是桌面端
  const [mounted, setMounted] = useState(false); // 添加挂载状态
  const [activeSection, setActiveSection] = useState('features'); // 当前激活的section
  
  // Debug: 检查工具分类
  console.log("Tool categories:", toolCategories);
  
  // 使用 useEffect 检测移动端和设置状态
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(true); // 移动端折叠
      } else {
        setIsCollapsed(false); // 桌面端展开
      }
    };
    
    checkMobile();
    setMounted(true); // 标记为已挂载
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 滚动监听 - 只在features页面生效
  useEffect(() => {
    if (!pathname.includes('/features')) {
      return;
    }

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200; // 偏移量

      const sections = [
        { id: 'features', selector: '[data-section="ai-effects"]' },
        { id: 'ai-image-editor', selector: '[data-section="image-editor"]' },
        { id: 'ai-face-character', selector: '[data-section="face-character"]' },
        { id: 'explore-more', selector: '[data-section="explore-more"]' }
      ];

      for (const section of sections) {
        const element = document.querySelector(section.selector) as HTMLElement;
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  // 设置内容区域边距
  useEffect(() => {
    if (!mounted) return; // 只在挂载后执行
    
    const contentArea = document.getElementById('content-area');
    if (contentArea) {
      if (isMobile) {
        contentArea.style.marginLeft = '0';
        contentArea.setAttribute('data-sidebar-state', 'mobile');
      } else if (isCollapsed) {
        contentArea.style.marginLeft = '4rem';
        contentArea.setAttribute('data-sidebar-state', 'collapsed');
      } else {
        contentArea.style.marginLeft = '16rem';
        contentArea.setAttribute('data-sidebar-state', 'expanded');
      }
    }
  }, [isCollapsed, isMobile, mounted]);
  
  
  // 添加跳转处理函数
  const handleToolClick = (path: string) => {
    if (isMobile) {
      setIsCollapsed(true);
    }
    router.push(path);
  };


  // 确保 SSR 和客户端初始渲染一致
  const displayCollapsed = mounted ? isCollapsed : false; // SSR 时始终显示展开状态
  const displayMobile = mounted ? isMobile : false; // SSR 时始终显示桌面端状态

  return (
    <>
      {/* 移动端遮罩层 */}
      {displayMobile && !displayCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsCollapsed(true)}
        />
      )}
      
      <aside 
        className={cn(
          "fixed left-0 z-40 bg-muted/30 border-r border-border/50 transition-all duration-300",
          "top-14 h-[calc(100vh-3.5rem)] overflow-hidden",
          displayCollapsed ? "w-16" : "w-64",
          displayMobile ? (displayCollapsed ? "-translate-x-full" : "translate-x-0") : ""
        )}
        suppressHydrationWarning
      >
        <div className="p-4 h-full flex flex-col">
          {/* 折叠状态下单独显示折叠按钮 */}
          {displayCollapsed && (
            <div className="flex justify-center mb-4">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-8 h-8 rounded-full bg-muted text-muted-foreground hover:bg-accent flex items-center justify-center transition-colors"
              >
                <Icon name="RiMenuUnfoldLine" className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 工具分类列表 */}
          <nav className="space-y-2 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style jsx>{`
              nav::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {toolCategories.map((category, index) => (
              <div key={category.id} className="space-y-1">
                {/* 分类标题 */}
                <div className="flex items-center justify-between px-3 py-2 text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <Icon name={category.icon} className="w-4 h-4 flex-shrink-0" />
                    {!displayCollapsed && (
                      <span className="font-medium text-sm">{category.name}</span>
                    )}
                  </div>
                </div>
                
                {/* 子工具列表 - 始终显示 */}
                <div className={cn("space-y-1", !displayCollapsed && "ml-6")}>
                  {category.tools.map((tool) => {
                    // 在features页面使用滚动高亮，其他页面使用路径匹配
                    let isActive = false;
                    
                    if (pathname.includes('/features')) {
                      // 在features页面使用滚动高亮
                      isActive = activeSection === tool.id;
                    } else {
                      // 其他页面使用路径匹配
                      isActive = pathname.includes(tool.path);
                    }
                    
                    return (
                      <button
                        key={tool.id}
                        onClick={() => {
                          if (pathname.includes('/features')) {
                            // 在features页面点击时滚动到对应区域
                            const sectionElement = document.querySelector(`[data-section="${tool.id}"]`);
                            if (sectionElement) {
                              sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          } else {
                            handleToolClick(tool.path);
                          }
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left relative min-w-0",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-foreground rounded-r-full" />
                        )}
                        <Icon name={tool.icon} className="w-4 h-4 flex-shrink-0" />
                        {!displayCollapsed && (
                          <span className="text-sm whitespace-nowrap flex-1 min-w-0">{tool.name}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        
        </div>
      </aside>
    </>
  );
}