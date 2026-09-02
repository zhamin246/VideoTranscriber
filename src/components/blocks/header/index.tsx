"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Header as HeaderType } from "@/types/blocks/header";
import Icon from "@/components/icon";
import { Link, useRouter, usePathname } from "@/i18n/navigation";
import LocaleToggle from "@/components/locale/toggle";
import { Menu } from "lucide-react";
import SignToggle from "@/components/sign/toggle";
import ThemeToggle from "@/components/theme/toggle";
import CreditsDisplay from "./credits-display";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/contexts/app";
import Image from "next/image";

export default function Header({ header }: { header: HeaderType }) {
  const { user } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  
  if (header.disabled) {
    return null;
  }

  // 处理首页链接点击，自动滚动到hero区域
  const handleLinkClick = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    const cleanPath = url.split('#')[0] || '/';
    const currentPath = pathname.replace(/\/$/, '');
    const normalizedCurrentPath = currentPath.replace(/^\/[a-z]{2}\//, '/').replace(/^\/[a-z]{2}$/, '/');
    const normalizedTargetPath = cleanPath.replace(/^\/[a-z]{2}\//, '/').replace(/^\/[a-z]{2}$/, '/');
    
    // 如果目标路径与当前路径不同，需要先跳转
    if (cleanPath && normalizedTargetPath !== normalizedCurrentPath) {
      // 跳转到首页，不添加hash
      router.push(cleanPath);
      // 跳转后滚动到hero区域
      setTimeout(() => {
        const heroSection = document.getElementById('hero');
        if (heroSection) {
          const headerOffset = 80;
          const elementPosition = heroSection.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          
          window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: 'smooth'
          });
        }
      }, 300);
    } else {
      // 在同一页面，直接滚动到hero区域
      setTimeout(() => {
        const heroSection = document.getElementById('hero');
        if (heroSection) {
          const headerOffset = 80;
          const elementPosition = heroSection.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          
          window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  };

  return (
    <section className="fixed top-0 left-0 w-full z-50">
      {/* 铺满的header容器 */}
      <div className="w-full bg-background/40 backdrop-blur-md flex items-center">
        <nav className="hidden lg:flex items-center justify-between w-full px-3 py-2">
          {/* 左侧 Logo */}
          <div className="flex items-center gap-8">
            {(() => {
              const brandUrl = header.brand?.url || '/';
              const shouldUseHeroLink = !brandUrl || brandUrl === '/' || brandUrl.includes('#hero');
              const cleanUrl = brandUrl.split('#')[0] || '/';
              
              return shouldUseHeroLink ? (
                <a
                  href={cleanUrl}
                  onClick={(e) => handleLinkClick(e, cleanUrl)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {header.brand?.logo?.src && (
                      <Image
                        src={header.brand.logo.src}
                        alt={header.brand.logo.alt || header.brand.title || "Logo"}
                        width={40}
                        height={40}
                        className="h-10 w-10 object-contain"
                        style={{ backgroundColor: 'transparent' }}
                        unoptimized
                        priority
                        sizes="40px"
                        loading="eager"
                      />
                    )}
                    {header.brand?.title && (
                      <span className="text-xl text-foreground font-bold">
                        {header.brand?.title || ""}
                      </span>
                    )}
                  </div>
                </a>
              ) : (
                <Link
                  href={brandUrl}
                  className="flex items-center gap-3"
                >
                  <div className="flex items-center gap-3">
                    {header.brand?.logo?.src && (
                      <Image
                        src={header.brand.logo.src}
                        alt={header.brand.logo.alt || header.brand.title || "Logo"}
                        width={40}
                        height={40}
                        className="h-10 w-10 object-contain"
                        style={{ backgroundColor: 'transparent' }}
                        unoptimized
                        priority
                        sizes="40px"
                        loading="eager"
                      />
                    )}
                    {header.brand?.title && (
                      <span className="text-xl text-foreground font-bold">
                        {header.brand?.title || ""}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })()}
          </div>

          {/* 中间导航菜单 */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <NavigationMenu>
              <NavigationMenuList className="gap-8">
                {header.nav?.items?.map((item, i) => {
                  if (item.children && item.children.length > 0) {
                    return (
                      <NavigationMenuItem key={i}>
                        <NavigationMenuTrigger className="text-foreground hover:text-foreground/80 transition-colors !bg-transparent border-none shadow-none !hover:bg-transparent !data-[state=open]:bg-transparent !data-[active]:bg-transparent text-sm">
                          <span>{item.title}</span>
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <div className="w-[300px] p-4">
                            {/* 列表形式的 AI 工具 */}
                            {item.children && item.children.length > 0 && (
                              <div className="space-y-1">
                                {item.children.map((iitem, ii) => (
                                  <div key={ii}>
                                    {iitem.url && iitem.url.trim() !== "" && !iitem.disabled ? (
                                      <a
                                        className={cn(
                                          "flex items-center px-3 py-2 rounded-md hover:bg-accent/50 transition-colors text-sm text-foreground hover:text-foreground/80"
                                        )}
                                        href={iitem.url as any}
                                        target={iitem.target}
                                      >
                                        {iitem.title}
                                      </a>
                                    ) : (
                                      <div
                                        className={cn(
                                          "flex items-center px-3 py-2 rounded-md text-sm",
                                          iitem.disabled && "opacity-50 cursor-not-allowed text-muted-foreground"
                                        )}
                                      >
                                        {iitem.title}
                                        {iitem.disabled && iitem.disabledText && (
                                          <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                                            {iitem.disabledText}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* 支持的模型列表 */}
                            {item.models && item.models.items.length > 0 && (
                              <div>
                                <h3 className="text-sm font-semibold text-foreground mb-4">{item.models.title}</h3>
                                <div className="flex flex-wrap gap-2">
                                  {item.models.items.map((model, index) => (
                                    <span
                                      key={index}
                                      className={cn(
                                        "px-3 py-1.5 text-xs font-medium rounded-full border",
                                        model.hot 
                                          ? "bg-red-500/10 text-red-500 border-red-500/20 relative" 
                                          : "bg-muted/50 text-muted-foreground border-border/50"
                                      )}
                                    >
                                      {model.name}
                                      {model.hot && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                          Hot
                                        </span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                    );
                  }

                  return (
                    <NavigationMenuItem key={i}>
                      {item.url && item.url.trim() !== "" ? (
                        (() => {
                          const navUrl = item.url.trim();
                          // 如果URL是"/"或包含"#hero"，或者标题是"Home"，都跳转到hero区域
                          const isHomeLink = item.title?.toLowerCase() === 'home' || navUrl === '/' || navUrl.includes('#hero');
                          const cleanUrl = navUrl.split('#')[0] || '/';
                          
                          return isHomeLink ? (
                            <a
                              href={cleanUrl}
                              onClick={(e) => handleLinkClick(e, cleanUrl)}
                              className={cn(
                                "text-foreground hover:text-foreground/80 transition-colors !bg-transparent border-none shadow-none !hover:bg-transparent  text-sm px-4 py-2 h-10 inline-flex items-center justify-center cursor-pointer",
                                navigationMenuTriggerStyle,
                                buttonVariants({
                                  variant: "ghost",
                                })
                              )}
                              target={item.target}
                            >
                              {item.title}
                            </a>
                          ) : (
                            <Link
                              className={cn(
                                "text-foreground hover:text-foreground/80 transition-colors !bg-transparent border-none shadow-none !hover:bg-transparent  text-sm px-4 py-2 h-10 inline-flex items-center justify-center",
                                navigationMenuTriggerStyle,
                                buttonVariants({
                                  variant: "ghost",
                                })
                              )}
                              href={navUrl as any}
                              target={item.target}
                            >
                              {item.title}
                            </Link>
                          );
                        })()
                      ) : (
                        <div
                          className={cn(
                            "text-foreground hover:text-foreground/80 transition-colors !bg-transparent border-none shadow-none !hover:bg-transparent  text-sm px-4 py-2 h-10 inline-flex items-center justify-center",
                            navigationMenuTriggerStyle,
                            buttonVariants({
                              variant: "ghost",
                            })
                          )}
                        >
                          {item.title}
                        </div>
                      )}
                    </NavigationMenuItem>
                  );
                })}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* 右侧工具 */}
          <div className="flex gap-2 items-center">
            <CreditsDisplay />
            {header.show_locale && <LocaleToggle />}
            {header.show_theme && <ThemeToggle />}

            {header.buttons?.map((item, i) => {
              return (
                <Button key={i} variant={item.variant}>
                  {item.url && item.url.trim() !== "" ? (
                    <Link
                      href={item.url as any}
                      target={item.target || ""}
                      className="flex items-center gap-1 cursor-pointer"
                    >
                      {item.title}
                      {item.icon && (
                        <Icon name={item.icon} className="size-4 shrink-0" />
                      )}
                    </Link>
                  ) : (
                    <span className="flex items-center gap-1 cursor-pointer">
                      {item.title}
                      {item.icon && (
                        <Icon name={item.icon} className="size-4 shrink-0" />
                      )}
                    </span>
                  )}
                </Button>
              );
            })}
            {header.show_sign && <SignToggle />}
          </div>
        </nav>

        {/* 移动端导航 */}
        <div className="block lg:hidden w-full relative z-10">
          <div className="flex items-center justify-between w-full px-3 sm:px-4 py-2 sm:py-3">
            {/* 左侧面包导航入口 */}
            <div className="flex-shrink-0">
              <Sheet>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-10 h-10 sm:w-12 sm:h-12 text-foreground hover:bg-accent/50 active:bg-accent/70 touch-manipulation cursor-pointer"
                  >
                    <Menu className="size-5 sm:size-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent 
                  side="left" 
                  className="overflow-y-auto w-full h-full p-0 sm:max-w-none"
                >
                  <SheetHeader className="sr-only">
                    <SheetTitle>Navigation Menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col h-full">
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        {(() => {
                          const brandUrl = header.brand?.url || '/';
                          const shouldUseHeroLink = !brandUrl || brandUrl === '/' || brandUrl.includes('#hero');
                          const cleanUrl = brandUrl.split('#')[0] || '/';
                          
                          return shouldUseHeroLink ? (
                            <a
                              href={cleanUrl}
                              onClick={(e) => handleLinkClick(e, cleanUrl)}
                              className="flex items-center gap-3 cursor-pointer"
                            >
                              {header.brand?.logo?.src && (
                                <Image
                                  src={header.brand.logo.src}
                                  alt={header.brand.logo.alt || header.brand.title || "Logo"}
                                  width={32}
                                  height={32}
                                  className="w-8 h-8 object-contain"
                                  style={{ backgroundColor: 'transparent' }}
                                  unoptimized
                                  priority
                                  sizes="32px"
                                  loading="eager"
                                />
                              )}
                              {header.brand?.title && (
                                <span className="text-lg text-foreground font-semibold">
                                  {header.brand?.title || ""}
                                </span>
                              )}
                            </a>
                          ) : (
                            <Link
                              href={brandUrl}
                              className="flex items-center gap-3"
                            >
                              {header.brand?.logo?.src && (
                                <Image
                                  src={header.brand.logo.src}
                                  alt={header.brand.logo.alt || header.brand.title || "Logo"}
                                  width={32}
                                  height={32}
                                  className="w-8 h-8 object-contain"
                                  style={{ backgroundColor: 'transparent' }}
                                  unoptimized
                                  priority
                                  sizes="32px"
                                  loading="eager"
                                />
                              )}
                              {header.brand?.title && (
                                <span className="text-lg text-foreground font-semibold">
                                  {header.brand?.title || ""}
                                </span>
                              )}
                            </Link>
                          );
                        })()}
                      </div>
                    </div>
                    
                    <div className="flex-1 p-4">
                      <div className="space-y-2">
                        <Accordion type="single" collapsible className="w-full">
                          {header.nav?.items?.map((item, i) => {
                            if (item.children && item.children.length > 0) {
                              return (
                                <AccordionItem
                                  key={i}
                                  value={item.title || ""}
                                  className="border-b border-border/50"
                                >
                                  <AccordionTrigger className="py-3 text-left hover:no-underline text-foreground hover:text-foreground/80 transition-colors">
                                    <div className="flex items-center gap-3">
                                      {item.icon && (
                                        <Icon
                                          name={item.icon}
                                          className="size-5 shrink-0"
                                        />
                                      )}
                                      <span className="font-medium">{item.title}</span>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="pb-2">
                                    <div className="space-y-1 pl-8">
                                      {item.children.map((iitem, ii) => (
                                        <div key={ii}>
                                          {iitem.url && iitem.url.trim() !== "" ? (
                                            <Link
                                              className="flex items-center gap-3 rounded-md p-3 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                                              href={iitem.url as any}
                                              target={iitem.target}
                                            >
                                              {iitem.icon && (
                                                <Icon
                                                  name={iitem.icon}
                                                  className="size-5 shrink-0 text-primary"
                                                />
                                              )}
                                              <div className="flex-1">
                                                <div className="font-medium text-sm">
                                                  {iitem.title}
                                                </div>
                                                {iitem.description && (
                                                  <p className="text-xs text-muted-foreground mt-1">
                                                    {iitem.description}
                                                  </p>
                                                )}
                                              </div>
                                            </Link>
                                          ) : (
                                            <div className="flex items-center gap-3 rounded-md p-3">
                                              {iitem.icon && (
                                                <Icon
                                                  name={iitem.icon}
                                                  className="size-5 shrink-0 text-primary"
                                                />
                                              )}
                                              <div className="flex-1">
                                                <div className="font-medium text-sm">
                                                  {iitem.title}
                                                </div>
                                                {iitem.description && (
                                                  <p className="text-xs text-muted-foreground mt-1">
                                                    {iitem.description}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              );
                            }

                            return (
                              <div key={i}>
                                {item.url && item.url.trim() !== "" ? (
                                  (() => {
                                    const navUrl = item.url.trim();
                                    // 如果URL是"/"或包含"#hero"，或者标题是"Home"，都跳转到hero区域
                                    const isHomeLink = item.title?.toLowerCase() === 'home' || navUrl === '/' || navUrl.includes('#hero');
                                    const cleanUrl = navUrl.split('#')[0] || '/';
                                    
                                    return isHomeLink ? (
                                      <a
                                        href={cleanUrl}
                                        onClick={(e) => handleLinkClick(e, cleanUrl)}
                                        className="flex items-center gap-3 py-3 text-foreground hover:text-foreground/80 transition-colors cursor-pointer"
                                        target={item.target}
                                      >
                                        {item.icon && (
                                          <Icon
                                            name={item.icon}
                                            className="size-5 shrink-0"
                                          />
                                        )}
                                        <span className="font-medium">{item.title}</span>
                                      </a>
                                    ) : (
                                      <Link
                                        href={navUrl as any}
                                        target={item.target}
                                        className="flex items-center gap-3 py-3 text-foreground hover:text-foreground/80 transition-colors"
                                      >
                                        {item.icon && (
                                          <Icon
                                            name={item.icon}
                                            className="size-5 shrink-0"
                                          />
                                        )}
                                        <span className="font-medium">{item.title}</span>
                                      </Link>
                                    );
                                  })()
                                ) : (
                                  <div className="flex items-center gap-3 py-3 text-foreground">
                                    {item.icon && (
                                      <Icon
                                        name={item.icon}
                                        className="size-5 shrink-0"
                                      />
                                    )}
                                    <span className="font-medium">{item.title}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </Accordion>
                      </div>
                    </div>
                    
                    <div className="p-4 border-t space-y-4">
                      {user && (
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          {header.show_sign && <SignToggle />}
                          <div className="flex-1">
                            <div className="text-sm font-medium">User</div>
                            <div className="text-xs text-muted-foreground">
                              {user.credits?.left_credits || 0} Credits
                            </div>
                          </div>
                          {header.show_locale && <LocaleToggle />}
                        </div>
                      )}

                      {!user && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {header.show_sign && <SignToggle />}
                          </div>
                          {header.show_locale && <LocaleToggle />}
                        </div>
                      )}

                      <div className="space-y-2">
                        {header.buttons?.map((item, i) => {
                          return (
                            <Button key={i} variant={item.variant} className="w-full">
                              {item.url && item.url.trim() !== "" ? (
                                <Link
                                  href={item.url as any}
                                  target={item.target || ""}
                                  className="flex items-center gap-2 justify-center"
                                >
                                  {item.icon && (
                                    <Icon name={item.icon} className="size-4 shrink-0" />
                                  )}
                                  <span>{item.title}</span>
                                </Link>
                              ) : (
                                <span className="flex items-center gap-2 justify-center">
                                  {item.icon && (
                                    <Icon name={item.icon} className="size-4 shrink-0" />
                                  )}
                                  <span>{item.title}</span>
                                </span>
                              )}
                            </Button>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {header.show_theme && <ThemeToggle />}
                        </div>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            
            {/* 中间 Logo 和品牌 */}
            <div className="flex-1 flex justify-center">
              {(() => {
                const brandUrl = header.brand?.url || '/';
                const shouldUseHeroLink = !brandUrl || brandUrl === '/' || brandUrl.includes('#hero');
                const cleanUrl = brandUrl.split('#')[0] || '/';
                
                return shouldUseHeroLink ? (
                  <a
                    href={cleanUrl}
                    onClick={(e) => handleLinkClick(e, cleanUrl)}
                    className="flex items-center gap-2 sm:gap-3 cursor-pointer"
                  >
                    {header.brand?.logo?.src && (
                      <Image
                        src={header.brand.logo.src}
                        alt={header.brand.logo.alt || header.brand.title || "Logo"}
                        width={40}
                        height={40}
                        className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                        style={{ backgroundColor: 'transparent' }}
                        unoptimized
                        priority
                        sizes="(max-width: 640px) 32px, 40px"
                        loading="eager"
                      />
                    )}
                    {header.brand?.title && (
                      <span className="text-lg sm:text-xl text-foreground font-bold truncate max-w-[140px] sm:max-w-none">
                        {header.brand?.title || ""}
                      </span>
                    )}
                  </a>
                ) : (
                  <Link
                    href={brandUrl}
                    className="flex items-center gap-2 sm:gap-3"
                  >
                    {header.brand?.logo?.src && (
                      <Image
                        src={header.brand.logo.src}
                        alt={header.brand.logo.alt || header.brand.title || "Logo"}
                        width={40}
                        height={40}
                        className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                        style={{ backgroundColor: 'transparent' }}
                        unoptimized
                        priority
                        sizes="(max-width: 640px) 32px, 40px"
                        loading="eager"
                      />
                    )}
                    {header.brand?.title && (
                      <span className="text-lg sm:text-xl text-foreground font-bold truncate max-w-[140px] sm:max-w-none">
                        {header.brand?.title || ""}
                      </span>
                    )}
                  </Link>
                );
              })()}
            </div>
            
            {/* 右侧用户积分和头像 */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <CreditsDisplay />
              {header.show_sign && <SignToggle />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
