"use client";

import { Badge } from "@/components/ui/badge";
import { Hero as HeroType } from "@/types/blocks/hero";
import Icon from "@/components/icon";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  ImageComparison,
  ImageComparisonImage,
  ImageComparisonSlider
} from "@/components/ui/image-comparison";
import { ArrowLeftRight, Download, X, Loader2, Coins, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppContext } from "@/contexts/app";

export default function Hero({ hero }: { hero: HeroType }) {
  const router = useRouter();
  const { user, setShowSignModal } = useAppContext();
  const texts = hero.title?.split(hero.highlight_text || "");
  const highlightText = hero.highlight_text;
  const [isMounted, setIsMounted] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [upscaleSize, setUpscaleSize] = useState<"2x" | "4x" | "8x">("2x");
  const [selectedModel, setSelectedModel] = useState<"general" | "portrait">("general");
  const [hasFaceEnhancement, setHasFaceEnhancement] = useState<boolean>(true);
  const [hasScratchRepair, setHasScratchRepair] = useState<boolean>(false);
  const [colorization, setColorization] = useState<"off" | "natural" | "vibrant">("off");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [enhancedImageUrls, setEnhancedImageUrls] = useState<Array<{ url: string; mode: 'general' | 'portrait'; originalUrl: string }>>([]);
  const [showColorizationPreview, setShowColorizationPreview] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const [shouldScrollToHero, setShouldScrollToHero] = useState(false);
  const pathname = usePathname();
  const resultsRef = useRef<HTMLDivElement>(null);

  // 判断是否为首页
  const normalizedPath = pathname.replace(/^\/[a-z]{2}\//, '/').replace(/^\/[a-z]{2}$/, '/').replace(/\/$/, '');
  const isHomePage = normalizedPath === '' || normalizedPath === '/';
  // 组件挂载后设置mounted状态
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 监听路由变化，当需要滚动到 hero 时执行滚动
  // 关键：使用 sessionStorage 作为持久化标记，因为组件可能被卸载重新挂载
  useEffect(() => {
    console.log('🔍 [Hero] useEffect 触发:', {
      shouldScrollToHero,
      isHomePage,
      pathname,
      scrollY: window.scrollY,
      heroExists: !!document.getElementById('hero'),
      navigatingToHome: sessionStorage.getItem('navigatingToHome')
    });
    
    // 检查是否需要滚动：检查 sessionStorage 标记（这是持久化的）
    const needsScroll = isHomePage && sessionStorage.getItem('navigatingToHome') === 'true';
    
    if (needsScroll) {
      console.log('🔍 [Hero] 检测到需要滚动到 Hero（从 sessionStorage）');
      
      // 先确保滚动到顶部
      window.scrollTo({ top: 0, behavior: 'instant' });
      console.log('🔍 [Hero] 已滚动到顶部，scrollY:', window.scrollY);
      
      const scrollToHero = () => {
        // 确保找到的是首页的 hero，而不是其他页面的
        const heroSection = document.getElementById('hero');
        console.log('🔍 [Hero] scrollToHero 尝试:', {
          heroExists: !!heroSection,
          scrollY: window.scrollY
        });
        
        if (heroSection) {
          // 检查 hero 元素的位置
          const rect = heroSection.getBoundingClientRect();
          const isVisible = rect.top >= 0 && rect.top < window.innerHeight * 2;
          
          console.log('🔍 [Hero] Hero 元素信息:', {
            top: rect.top,
            height: rect.height,
            isVisible,
            windowInnerHeight: window.innerHeight,
            pageYOffset: window.pageYOffset
          });
          
          // 如果 hero 不在视口中，说明可能是错误的元素，继续等待
          if (!isVisible && rect.top < -100) {
            console.log('🔍 [Hero] Hero 不在视口中，继续等待');
            return false;
          }
          
          // 等待一帧，确保页面布局稳定
          requestAnimationFrame(() => {
            const headerOffset = 80;
            const elementPosition = heroSection.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            console.log('🔍 [Hero] 准备滚动到 Hero:', {
              elementPosition,
              pageYOffset: window.pageYOffset,
              headerOffset,
              offsetPosition
            });
            
            window.scrollTo({
              top: Math.max(0, offsetPosition),
              behavior: 'smooth'
            });
            
            console.log('🔍 [Hero] 已执行滚动，最终 scrollY:', window.scrollY);
          });
          
          // 清除标记
          sessionStorage.removeItem('navigatingToHome');
          setShouldScrollToHero(false);
          return true;
        }
        return false;
      };
      
      // 延迟执行，确保页面已完全渲染
      setTimeout(() => {
        console.log('🔍 [Hero] 延迟后开始尝试滚动，检查 Hero 是否存在');
        if (!scrollToHero()) {
          console.log('🔍 [Hero] Hero 未找到，开始重试');
          // 如果hero元素还没加载，等待一段时间后重试
          let attempts = 0;
          const tryScroll = setInterval(() => {
            attempts++;
            console.log(`🔍 [Hero] 重试 ${attempts} 次，检查 Hero:`, {
              heroExists: !!document.getElementById('hero'),
              scrollY: window.scrollY
            });
            
            if (scrollToHero() || attempts > 50) {
              clearInterval(tryScroll);
              sessionStorage.removeItem('navigatingToHome'); // 清除标记
              setShouldScrollToHero(false);
              console.log('🔍 [Hero] 重试结束:', {
                success: !!document.getElementById('hero'),
                attempts
              });
            }
          }, 100);
        }
      }, 800); // 增加延迟，确保 Hero 完全渲染
    } else if (shouldScrollToHero && !isHomePage) {
      console.log('🔍 [Hero] shouldScrollToHero 为 true 但还不是首页，等待路径更新');
    }
  }, [isHomePage, pathname]); // 只监听 pathname 和 isHomePage，不监听 shouldScrollToHero

  // 加载默认对比图片并获取实际宽高比
  useEffect(() => {
    if (uploadedImages.length === 0) {
      const img = new window.Image();
      const imageSrc = pathname.includes("/remover-fundo-de-imagem") 
        ? "/mremover-fundo-de-imagem/hero/1.png" 
        : "/landingpage/hero/1.webp?v=3";
      img.src = imageSrc;
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        setImageAspectRatio(aspectRatio);
      };
    } else {
      setImageAspectRatio(null);
    }
  }, [pathname, uploadedImages.length]);


  // 检查用户是否是会员（购买过订阅或积分包）
  const isMember = user?.credits?.is_recharged || false;

  // 如果用户不是会员但选择了VIP选项，自动切换回默认选项
  useEffect(() => {
    if (!isMember) {
      if (upscaleSize === "8x") {
        setUpscaleSize("2x");
      }
      // Color Match选项已对所有用户开放，不再需要重置
    }
  }, [isMember, upscaleSize]);

  // 处理文件选择
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );
    
    const remainingSlots = 3 - uploadedImages.length;
    const filesToAdd = imageFiles.slice(0, remainingSlots);
    
    if (filesToAdd.length > 0) {
      const newUrls = filesToAdd.map(file => URL.createObjectURL(file));
      setUploadedImages(prev => [...prev, ...filesToAdd]);
      setImageUrls(prev => [...prev, ...newUrls]);
      // 上传新图片时清除之前的增强结果
      setEnhancedImageUrls([]);
    }
    
    if (imageFiles.length > remainingSlots) {
      alert(`You can only upload up to 3 images. ${remainingSlots} image(s) added.`);
    }
  };

  // 处理文件输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // 重置input值，允许重复选择相同文件
    e.target.value = '';
  };

  // 处理拖拽
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // 删除图片
  const handleRemoveImage = (index: number) => {
    // 清理 URL
    if (imageUrls[index]) {
      URL.revokeObjectURL(imageUrls[index]);
    }
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
    // 删除图片时，清除对应的增强结果
    setEnhancedImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  // 清理组件卸载时的 URL
  useEffect(() => {
    return () => {
      imageUrls.forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [imageUrls]);

  // 处理示例图片点击上传
  const handleSampleImageClick = async (imageSrc: string) => {
    // 检查是否已达到上传限制
    if (uploadedImages.length >= 3) {
      toast.error("You can only upload up to 3 images");
      return;
    }

    try {
      // 获取图片并转换为 File 对象
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      
      // 从URL中提取文件名
      const filename = imageSrc.split('/').pop() || 'sample.webp';
      
      // 创建 File 对象
      const file = new File([blob], filename, { type: blob.type || 'image/webp' });
      
      // 创建预览URL
      const previewUrl = URL.createObjectURL(file);
      
      // 添加到上传列表
      setUploadedImages(prev => [...prev, file]);
      setImageUrls(prev => [...prev, previewUrl]);
      
      // 清除之前的增强结果
      setEnhancedImageUrls([]);
      
      toast.success("Sample image added");
    } catch (error) {
      console.error("Error loading sample image:", error);
      toast.error("Error loading sample image");
    }
  };

  // 将 File 转换为 base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 下载图片或视频
  const handleDownload = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      
      const isVideo = url.includes('.mp4') || url.includes('video') || blob.type.includes('video');
      const filename = isVideo ? `video-${index + 1}.mp4` : `enhanced-image-${index + 1}.png`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success(isVideo ? "Video downloaded successfully!" : "Image downloaded successfully!");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Error downloading file");
    }
  };

  // 删除生成结果
  const handleRemoveResult = (index: number) => {
    setEnhancedImageUrls(prev => prev.filter((_, i) => i !== index));
    toast.success("Result removed");
  };

  // 处理图片生成
  const handleGenerate = async () => {
    if (uploadedImages.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    // 检查用户是否登录
    if (!user) {
      setShowSignModal(true);
      toast.error("Please sign in to generate images");
      return;
    }

    // 检查积分余额是否足够（每张图片需要1积分）
    const requiredCredits = uploadedImages.length;
    const availableCredits = user.credits?.left_credits || 0;
    
    if (availableCredits < requiredCredits) {
      toast.error(`Insufficient credits. You need ${requiredCredits} credit(s) but only have ${availableCredits}. Please purchase credits.`, {
        duration: 5000,
      });
      return;
    }

    // 检查VIP功能限制
    if (upscaleSize === "8x" && !isMember) {
      toast.error("The 8x option requires VIP subscription. Upgrade to use.", {
        duration: 3000,
      });
      return;
    }
    
    // Color Match选项已对所有用户开放，不再需要VIP检查

    setIsGenerating(true);
    setGenerationProgress(0);
    setProgressMessage("Initializing...");
    
    // 确定是否启用 face_enhance
    const faceEnhance = selectedModel === "portrait" || hasFaceEnhancement;

    // 处理所有上传的图片
    // 记录生成时使用的模式
    const generationMode = selectedModel;
    const results: Array<{ url: string; mode: 'general' | 'portrait'; originalUrl: string }> = [];
    const totalImages = uploadedImages.length;
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < uploadedImages.length; i++) {
      try {
        const image = uploadedImages[i];
        const base64Image = await fileToBase64(image);

        // 更新进度：开始上传图片到 R2
        setGenerationProgress(((i + 0.1) / totalImages) * 100);
        setProgressMessage(`Uploading image ${i + 1} of ${totalImages}...`);

        // 先将图片上传到 R2
        console.log(`📤 [图片 ${i + 1}] 开始上传到 R2...`);
        const uploadResponse = await fetch("/api/upload-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: base64Image,
          }),
        });

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json();
          console.error(`❌ [图片 ${i + 1}] 上传到 R2 失败:`, uploadError);
          throw new Error(uploadError.error || uploadError.details || 'Failed to upload image to R2');
        }

        const uploadData = await uploadResponse.json();
        const imageUrl = uploadData.imageUrl;
        console.log(`✅ [图片 ${i + 1}] 上传到 R2 成功:`, imageUrl);

        // 更新进度：图片上传完成，开始处理
        setGenerationProgress(((i + 0.3) / totalImages) * 100);
        setProgressMessage(`Restoring image ${i + 1} of ${totalImages}...`);

        const response = await fetch("/api/restore-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageUrl: imageUrl,
            prompt: `Restore and enhance image`,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.error || `Failed to restore image ${i + 1}`;
          
          // 如果是未授权错误，停止处理并显示登录提示
          if (errorData.errorType === 'unauthorized') {
            setIsGenerating(false);
            setShowSignModal(true);
            toast.error("Please sign in to use this feature", {
              duration: 5000,
            });
            return; // 直接返回，不继续处理
          }
          
          // 记录失败，但不中断流程
          failCount++;
          console.error(`Image ${i + 1} failed:`, errorMessage);
          
          // 显示错误提示
          if (errorData.errorType === 'memory') {
            toast.error(`Image ${i + 1} failed: ${errorMessage}`, {
              duration: 5000,
            });
          } else if (errorData.errorType === 'image_too_large') {
            toast.error(`Image ${i + 1} failed: ${errorMessage}`, {
              duration: 5000,
            });
          } else {
            toast.error(`Image ${i + 1} failed: ${errorMessage}`, {
              duration: 5000,
            });
          }
          
          // 更新进度：这张图片处理完成（失败也算完成）
          setGenerationProgress(((i + 1) / totalImages) * 100);
          setProgressMessage(`Image ${i + 1} of ${totalImages} failed, continuing...`);
          continue; // 继续处理下一张图片
        }

        const data = await response.json();
        
        if (!data.imageUrl) {
          failCount++;
          const errorMsg = `Image ${i + 1} did not generate a result. Please try again.`;
          console.error(errorMsg);
          toast.error(errorMsg, {
            duration: 5000,
          });
          setGenerationProgress(((i + 1) / totalImages) * 100);
          setProgressMessage(`Image ${i + 1} of ${totalImages} failed, continuing...`);
          continue; // 继续处理下一张图片
        }

        let finalImageUrl = data.imageUrl;

        // 如果选择的是 "True-to-Life Color Correction"，需要再调用 color-matcher API
        if (generationMode === "portrait") {
          // 更新进度：开始颜色匹配处理
          setGenerationProgress(((i + 0.7) / totalImages) * 100);
          setProgressMessage(`Applying color correction to image ${i + 1} of ${totalImages}...`);

          console.log(`🎨 [图片 ${i + 1}] 开始颜色匹配处理...`);
          const colorMatchResponse = await fetch("/api/color-matcher", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              input_image: data.imageUrl, // 修复后的图片
              reference_image: imageUrl,  // 原始图片作为参考
            }),
          });

          if (!colorMatchResponse.ok) {
            const colorMatchError = await colorMatchResponse.json();
            console.error(`❌ [图片 ${i + 1}] 颜色匹配失败:`, colorMatchError);
            // 如果颜色匹配失败，使用修复后的图片作为最终结果
            console.log(`⚠️ [图片 ${i + 1}] 颜色匹配失败，使用修复后的图片`);
            finalImageUrl = data.imageUrl;
          } else {
            const colorMatchData = await colorMatchResponse.json();
            if (colorMatchData.imageUrl) {
              finalImageUrl = colorMatchData.imageUrl;
              console.log(`✅ [图片 ${i + 1}] 颜色匹配成功:`, finalImageUrl);
            } else {
              // 如果颜色匹配没有返回结果，使用修复后的图片
              console.log(`⚠️ [图片 ${i + 1}] 颜色匹配无结果，使用修复后的图片`);
              finalImageUrl = data.imageUrl;
            }
          }
        }
        
        // 成功处理，立即添加到结果并更新显示（记录生成时使用的模式和原始图片URL）
        results.push({ 
          url: finalImageUrl, 
          mode: generationMode,
          originalUrl: imageUrls[i] // 保存对应的原始图片URL
        });
        successCount++;
        
        // 立即更新显示结果，让用户看到成功的图片
        setEnhancedImageUrls([...results]);
        
        // 更新进度：这张图片处理完成
        setGenerationProgress(((i + 1) / totalImages) * 100);
        setProgressMessage(`Image ${i + 1} of ${totalImages} completed`);
      } catch (error) {
        // 处理单张图片的异常，不中断整个流程
        failCount++;
        console.error(`Image ${i + 1} exception:`, error);
        const errorMessage = error instanceof Error ? error.message : "Error enhancing image";
        toast.error(`Image ${i + 1} failed: ${errorMessage}`, {
          duration: 5000,
        });
        setGenerationProgress(((i + 1) / totalImages) * 100);
        setProgressMessage(`Image ${i + 1} of ${totalImages} failed, continuing...`);
      }
    }

    // 所有图片处理完成，显示最终统计
    setGenerationProgress(100);
    setProgressMessage(successCount > 0 ? `Completed! ${successCount} image(s) processed successfully` : "Processing completed");
    
    if (successCount > 0) {
      toast.success(`${successCount} image(s) processed successfully${failCount > 0 ? `, ${failCount} failed` : ''}`, {
        duration: 5000,
      });
      
      // 滚动到结果区域
      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    } else {
      toast.error(`All images failed, please check the settings`, {
        duration: 5000,
      });
    }
    
    setIsGenerating(false);
    // 延迟重置进度条
    setTimeout(() => {
      setGenerationProgress(0);
      setProgressMessage("");
    }, 1000);
  };

  return (
    <>
      {/* Hero 区域 */}
      <section id="hero" className="hero w-full overflow-hidden relative min-h-screen">
        {/* 背景遮罩层 */}
        <div
          className={cn(
            "absolute inset-0",
            isHomePage
              ? "bg-[#F8F4EE] dark:bg-background"
              : "bg-gradient-to-br from-[#F8F4EE] via-[#F8F4EE]/95 to-[#F8F4EE]/90"
          )}
        />

        {/* Hero内容区域 */}
        <div className="relative z-10 px-4 sm:px-8 lg:px-20 py-16">
          {/* 顶部：标题与描述 */}
          <div className="max-w-6xl mx-auto text-center mb-10 pt-8 sm:pt-12">
            {hero.announcement && hero.announcement.url && hero.announcement.url.trim() !== "" && (
              <Link
                href={hero.announcement.url as any}
                className="mx-auto mb-3 inline-flex items-center gap-3 rounded-full border px-2 py-1 text-sm"
              >
                {hero.announcement.label && (
                  <Badge>{hero.announcement.label}</Badge>
                )}
                {hero.announcement.title}
              </Link>
            )}

            <h1
              className={cn(
                "hero-title font-bold tracking-tight text-foreground drop-shadow-2xl mb-4",
                "text-2xl sm:text-3xl md:text-4xl lg:text-[36px]"
              )}
            >
              {texts && texts.length > 1 ? (
                <>
                  {texts[0]}
                  <span className="bg-linear-to-r from-primary via-primary to-primary bg-clip-text text-transparent">
                    {highlightText}
                  </span>
                  {texts[1]}
                </>
              ) : (
                hero.title
              )}
            </h1>
            <p
              className="text-muted-foreground text-[16px] leading-relaxed w-full"
              dangerouslySetInnerHTML={{ __html: hero.description || "" }}
            />
          </div>

          {/* 中部：左右两列 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* 左侧：上传的图片 */}
            {uploadedImages.length > 0 ? (
              /* 显示上传的第一张原始图片 */
              <div className="aspect-[3/2] w-full rounded-xl overflow-hidden bg-slate-100 relative">
                <Image
                  src={imageUrls[0]}
                  alt="Imagem enviada"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain"
                />
                {/* Loading overlay */}
                {isGenerating && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-12 h-12 text-white animate-spin" />
                      <span className="text-white text-sm font-medium">Processing...</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* 默认对比图 - 根据路径动态选择图片 */
            <ImageComparison 
              className="w-full rounded-xl bg-slate-100" 
              enableHover 
              autoSlide={false}
              style={imageAspectRatio ? { aspectRatio: imageAspectRatio.toString() } : { aspectRatio: '3/2' }}
            >
              <ImageComparisonImage
                  src={pathname.includes("/remover-fundo-de-imagem") ? "/mremover-fundo-de-imagem/hero/1.png" : "/landingpage/hero/1.webp?v=3"}
                alt="Imagem original"
                  position="right"
              />
              <ImageComparisonImage
                  src={pathname.includes("/remover-fundo-de-imagem") ? "/mremover-fundo-de-imagem/hero/2.png" : "/landingpage/hero/2.webp?v=3"}
                alt="Imagem melhorada"
                  position="left"
              />
              <ImageComparisonSlider className="w-1 bg-white/60 backdrop-blur-xs">
                <div className="absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border border-gray-300 shadow-lg flex items-center justify-center">
                  <ArrowLeftRight className="w-4 h-4 text-gray-700" />
                </div>
              </ImageComparisonSlider>
            </ImageComparison>
            )}

            {/* 右侧：工具区域 */}
            <div className="flex flex-col gap-4 h-full">
              {/* 导航按钮 - 首页显示 */}
              {isHomePage && (
                <div className="flex justify-start gap-2 sm:gap-3 flex-wrap">
                  <Button 
                    variant={isHomePage ? "default" : "outline"} 
                    className="rounded-full px-4 py-2 h-10 sm:px-5 sm:py-2.5 sm:h-11 lg:px-6 lg:py-3 lg:h-12 text-sm sm:text-base"
                    onClick={(e) => {
                      e.preventDefault();

                      if (!isHomePage) {
                        console.log('🔍 [Hero] 点击 Photo Restoration 按钮，准备跳转到首页:', {
                          currentPath: pathname,
                          scrollY: window.scrollY,
                          heroExists: !!document.getElementById('hero')
                        });
                        
                        // 不在首页，先立即滚动到顶部，然后跳转
                        window.scrollTo({ top: 0, behavior: 'instant' });
                        console.log('🔍 [Hero] 已滚动到顶部，scrollY:', window.scrollY);
                        
                        // 设置 sessionStorage 标记，告诉 HashScrollHandler 不要自动滚动
                        sessionStorage.setItem('navigatingToHome', 'true');
                        setShouldScrollToHero(true);
                        
                        console.log('🔍 [Hero] 准备跳转到首页，设置标记');
                        router.push('/');
                      } else {
                        // 已经在首页，直接滚动到 hero
                        const scrollToHero = () => {
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
                        };
                        setTimeout(scrollToHero, 100);
                      }
                    }}
                  >
                    Rate My Face
                  </Button>
                  <Link href="/pricing">
                    <Button 
                      variant="outline" 
                      className="rounded-full px-4 py-2 h-10 sm:px-5 sm:py-2.5 sm:h-11 lg:px-6 lg:py-3 lg:h-12 text-sm sm:text-base relative"
                    >
                      <span className="whitespace-nowrap">Full Report</span>
                      <Badge className="ml-1.5 sm:ml-2 bg-red-500 hover:bg-red-600 text-white text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full">NEW</Badge>
                    </Button>
                  </Link>
                </div>
              )}
              
              {uploadedImages.length === 0 ? (
                <>
                  {/* 主内容区域：上传面板 */}
                  <div className={cn(
                    "rounded-xl bg-[#EEEBE3] border-2 border-dashed border-slate-300/60 flex flex-col items-center justify-center flex-1",
                    "p-8"
                  )}>
                    {/* 标题 */}
                    <p className="text-slate-700 font-medium mb-4 text-center text-base">
                      Upload a clear front-facing photo
                    </p>

                    {/* 隐藏的文件输入 */}
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleInputChange}
                      disabled={uploadedImages.length >= 3}
                    />

                    {/* 上传区域 */}
                    <label
                      htmlFor="image-upload"
                      className={cn(
                        "w-full bg-[#124337] rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors",
                        "p-8 min-h-[140px]",
                        isDragging ? "bg-[#124337]/80 border-2 border-dashed border-white/50" : "hover:bg-[#124337]/90",
                        uploadedImages.length >= 3 && "opacity-50 cursor-not-allowed"
                      )}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => {
                        if (uploadedImages.length >= 3) {
                          alert("You have already uploaded the maximum of 3 images.");
                        }
                      }}
                    >
                      {/* 云上传图标 - 带向上箭头 */}
              <div className="mb-4">
                        <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
              </div>
                      {/* 上传提示文字 */}
                      <p className="text-white text-sm text-center">
                        {uploadedImages.length >= 3 
                          ? "Maximum of 3 images reached"
                          : "Click or drag to upload. Maximum of 3 files at a time."
                        }
                      </p>
                    </label>

                    {/* 底部免责声明 */}
                    <p className="mt-6 text-xs text-slate-600 text-center leading-relaxed">
                      By uploading an image, you agree to our{" "}
                      <Link href="/terms-of-service" className="underline hover:text-slate-800">
                        Terms of Use
                      </Link>
                      {" "}and{" "}
                      <Link href="/privacy-policy" className="underline hover:text-slate-800">
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* 已上传后：显示选项样式 */}
                  <div className="rounded-xl bg-[#EEEBE3] border-2 border-dashed border-slate-300/60 p-6 flex flex-col gap-6">
                    {/* 标题 */}
                    <h3 className="text-slate-700 font-medium text-base mb-2">
                      Analysis Settings
                    </h3>

                    {/* Face Enhancement */}
                    <div>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="face-enhancement"
                          checked={hasFaceEnhancement}
                          onChange={(e) => setHasFaceEnhancement(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-[#124337] focus:ring-[#124337]"
                        />
                        <label htmlFor="face-enhancement" className="text-sm text-slate-700 cursor-pointer">
                          Face Enhancement
                          <span className="text-xs text-slate-500 ml-2">(For portrait images)</span>
                        </label>
                      </div>
                    </div>

                    {/* Scratch & Tear Repair */}
                    <div>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="scratch-repair"
                          checked={hasScratchRepair}
                          onChange={(e) => setHasScratchRepair(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-[#124337] focus:ring-[#124337]"
                        />
                        <label htmlFor="scratch-repair" className="text-sm text-slate-700 cursor-pointer">
                          Scratch & Tear Repair
                          <span className="text-xs text-slate-500 ml-2">(For severe physical damage)</span>
                        </label>
                      </div>
                    </div>

                    {/* Colorization */}
                      <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-slate-700 font-medium text-sm">Colorization</h4>
                        <button
                          onClick={() => setShowColorizationPreview(true)}
                          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-700 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">Color match and white balance fixes for images</p>
                      <div className="flex flex-col gap-3">
                        {/* Fine-tune Balance Option */}
                        <button
                          type="button"
                          onClick={() => setSelectedModel("general")}
                          className={cn(
                            "w-full p-4 rounded-lg transition-all text-left cursor-pointer",
                            selectedModel === "general"
                              ? "bg-white"
                              : "border-2 border-transparent bg-slate-200"
                          )}
                          style={selectedModel === "general" ? { border: "3px solid #404040" } : undefined}
                        >
                          <div className="flex items-start gap-4">
                            {/* 缩略图 */}
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                              <Image
                                src="/landingpage/hero/Colorization/1.webp"
                                alt="Standard Restoration"
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-slate-700 mb-1">Standard Restoration</h5>
                              <p className="text-xs text-slate-500">
                                Restores image clarity and applies vibrant, automatic colorization. Great for general photos.
                              </p>
                            </div>
                          </div>
                        </button>

                        {/* Color Match Option */}
                        <button
                          type="button"
                          onClick={() => setSelectedModel("portrait")}
                          className={cn(
                            "w-full p-4 rounded-lg transition-all text-left cursor-pointer",
                            selectedModel === "portrait"
                              ? "bg-white"
                              : "border-2 border-transparent bg-slate-200"
                          )}
                          style={selectedModel === "portrait" ? { border: "3px solid #404040" } : undefined}
                        >
                          <div className="flex items-start gap-4">
                            {/* 缩略图 */}
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                              <Image
                                src="/landingpage/hero/Colorization/2.webp"
                                alt="True-to-Life Color Correction"
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-slate-700 mb-1">True-to-Life Color Correction</h5>
                              <p className="text-xs text-slate-500">
                                Uses a specialized color engine to fix white balance, remove yellow tints, and reproduce natural skin tones.
                              </p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                    {/* 已上传图片预览 - 放在区域内，缩小尺寸 */}
                    <div className="mt-2">
                      <h4 className="text-slate-700 font-medium mb-3 text-sm">Your Images</h4>
                      <div className="flex gap-2">
                        {uploadedImages.map((file, index) => (
                          <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-200 group flex-shrink-0">
                            <Image
                              src={imageUrls[index]}
                              alt={`Uploaded ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            {/* 删除按钮 */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveImage(index);
                              }}
                              className="absolute top-0.5 right-0.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm font-bold hover:bg-red-600 shadow-md"
                            >
                              ×
                            </button>
                            {/* 图片编号 */}
                            <div className="absolute bottom-0.5 left-0.5 bg-black/50 text-white text-[10px] px-1 py-0.5 rounded">
                              {index + 1}
                            </div>
                          </div>
                        ))}
                </div>
              </div>

                    {/* 进度条 */}
                    {isGenerating && (
                      <div className="mt-6">
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#124337] h-full transition-all duration-300 ease-out rounded-full"
                            style={{ width: `${generationProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-600 mt-2 text-center">
                          {progressMessage || `${Math.round(generationProgress)}% completed`}
                        </p>
                      </div>
                    )}

                    {/* 生成按钮 */}
                    <div className="mt-6">
                      <Button
                        className="bg-[#124337] text-white hover:bg-[#124337]/90 px-8 py-4 text-base font-bold rounded-lg h-auto shadow-lg border-0 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        size="lg"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generating...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            Rate my face
                            <span className="flex items-center gap-1 ml-2 text-sm font-normal opacity-90">
                              <Coins className="w-4 h-4" />
                              <span>-1</span>
                            </span>
                          </span>
                        )}
                      </Button>
                      
                      {/* 剩余积分提示 */}
                      <div className="mt-4 text-center">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Coins className="w-4 h-4 text-slate-600" />
                            <span className="text-sm text-slate-600">
                              Available Credits:{" "}
                              <span className={cn(
                                "font-semibold",
                                (() => {
                                  const credits = user 
                                    ? (user.credits?.left_credits || 0)
                                    : 0;
                                  return credits === 0 ? "text-red-600" : credits <= 5 ? "text-orange-600" : "text-green-600";
                                })()
                              )}>
                                {user 
                                  ? (user.credits?.left_credits || 0)
                                  : 0
                                }
                              </span>
                            </span>
                          </div>
                          <Link
                            href="/pricing"
                            className="text-sm text-[#124337] hover:text-[#124337]/80 underline font-medium"
                          >
                            Buy Credits
                          </Link>
                        </div>
                        {!user && (
                          <p className="text-xs text-slate-500 mt-2">
                            New users receive 4 free credits upon registration
                          </p>
                        )}
                      </div>
                    </div>
              </div>
                </>
              )}
            </div>
          </div>

          {/* 生成结果展示区域 - 显示在配置区域下方 */}
          {enhancedImageUrls.length > 0 && (
            <div ref={resultsRef} className="mt-8 flex flex-col items-center">
              <div className="w-full flex flex-col items-center gap-6">
                {enhancedImageUrls.map((result, index) => (
                  /* 外层容器 - Resultados 区域容器 */
                  <div key={index} className="relative rounded-xl border-2 border-slate-200 p-6" style={{ width: '1000px', maxWidth: '95%', backgroundColor: '#EEEBE3' }}>
                    {/* 删除按钮 - 外层容器右上角，稍微超出边界 */}
                    <button
                      onClick={() => handleRemoveResult(index)}
                      className="absolute -top-3 -right-3 z-30 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                      title="Remover resultado"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* 顶部标题栏 - 与图片区域宽度对齐（800px） */}
                    <div className="relative px-4 py-3 flex items-center justify-between mb-2 mx-auto" style={{ width: '800px', maxWidth: '100%' }}>
                      {/* 左侧标题 - 显示生成时使用的模式 */}
                      <h4 className="text-lg font-bold text-slate-700">
                        {result.mode === "general"
                          ? "Standard Restoration"
                          : "True-to-Life Color Correction"}
                      </h4>
                      
                      {/* 右侧操作按钮区域 - 只保留下载按钮 */}
                      <div className="flex items-center">
                        {/* 下载按钮 - 右侧 */}
                        <button
                          onClick={() => handleDownload(result.url, index)}
                          className="w-8 h-8 bg-slate-700 hover:bg-slate-800 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                          title="Download image"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* 内层容器 - 图片/视频容器（保持原尺寸） */}
                    <div className="relative bg-white rounded-xl border-2 border-slate-200 overflow-hidden mx-auto" style={{ width: '800px', maxWidth: '100%' }}>
                      {/* 结果卡片容器 - 固定尺寸 800x450 */}
                      <div className="relative" style={{ width: "100%", height: "450px" }}>
                        <div className="h-full w-full">
                          <ImageComparison
                            className="h-full w-full rounded-xl"
                            enableHover
                            autoSlide={false}
                          >
                            <ImageComparisonImage
                              src={result.originalUrl}
                              alt={`Original image ${index + 1}`}
                              position="right"
                            />
                            <ImageComparisonImage
                              src={result.url}
                              alt={`Enhanced image ${index + 1}`}
                              position="left"
                            />
                            <ImageComparisonSlider className="w-1 bg-white/60 backdrop-blur-xs">
                              <div className="absolute left-1/2 top-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-300 bg-white shadow-lg">
                                <ArrowLeftRight className="h-4 w-4 text-gray-700" />
                              </div>
                            </ImageComparisonSlider>
                          </ImageComparison>

                          <div className="absolute bottom-3 left-3 z-10">
                            <span className="rounded bg-slate-700 px-3 py-1.5 text-sm font-medium text-white">
                              BEFORE
                            </span>
                          </div>
                          <div className="absolute bottom-3 right-3 z-10">
                            <span className="rounded bg-slate-700 px-3 py-1.5 text-sm font-medium text-white">
                              AFTER
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* 内层容器结束 */}

                    {/* 底部反馈区域 - 属于外容器 */}
                    <div className="px-4 py-4 flex items-center justify-center gap-3 mt-2" style={{ width: '800px', maxWidth: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-700 text-sm font-medium">How's the result?</span>
                        <div className="flex gap-2">
                          <button className="text-2xl hover:scale-110 transition-transform" title="Satisfied">
                            😊
                          </button>
                          <button className="text-2xl hover:scale-110 transition-transform" title="Not satisfied">
                            😞
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  /* 外层容器结束 */
                ))}
              </div>
            </div>
          )}

          {/* 底部：示例上传图片 - 只在未上传时显示 */}
          {uploadedImages.length === 0 && (
          <div className="mt-10">
            <p className="text-sm text-muted-foreground mb-3 text-center">No images? Try these examples:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "/landingpage/hero/Sem-imagens/1.webp",
                "/landingpage/hero/Sem-imagens/2.webp",
                "/landingpage/hero/Sem-imagens/3.webp",
                "/landingpage/hero/Sem-imagens/4.webp",
                "/landingpage/hero/Sem-imagens/5.webp",
              ].map((src, i) => {
                // 添加版本号查询参数以强制刷新缓存
                const imageSrc = `${src}?v=2`;
                return (
                <div 
                  key={i} 
                  onClick={() => handleSampleImageClick(src)}
                  className="relative w-[60px] h-[60px] rounded-lg overflow-hidden bg-white cursor-pointer hover:opacity-80 transition-opacity border-2 border-transparent hover:border-slate-300"
                  title="Clique para usar esta imagem"
                >
                  <Image 
                    src={imageSrc} 
                    alt={`sample-${i}`} 
                    fill 
                    sizes="60px"
                    className="object-cover"
                    loading="lazy"
                    quality={75}
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                  />
                </div>
              );
              })}
            </div>
          </div>
          )}
        </div>
      </section>

      {/* Colorization Preview Dialog */}
      <Dialog open={showColorizationPreview} onOpenChange={setShowColorizationPreview}>
        <DialogContent className="max-w-full sm:max-w-4xl w-full h-auto sm:h-auto sm:w-auto p-0 fixed top-4 left-4 right-4 bottom-auto sm:inset-auto sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] !translate-x-0 !translate-y-0 sm:!translate-x-[-50%] sm:!translate-y-[-50%] max-h-[calc(100vh-2rem)] sm:max-h-[90vh] overflow-y-auto rounded-lg sm:rounded-lg m-0">
          <DialogHeader className="px-4 pt-6 pb-4">
            <DialogTitle>Colorization Preview</DialogTitle>
            <DialogDescription>
              See the difference between original and color-matched images
            </DialogDescription>
          </DialogHeader>
          <div className="px-4 pb-6 flex justify-center">
            <div className="relative rounded-xl overflow-hidden bg-slate-100 w-full sm:w-[800px]">
              <ImageComparison 
                className="rounded-xl w-full aspect-[4/3] sm:aspect-[3/2]" 
                enableHover 
                autoSlide={false}
              >
                <ImageComparisonImage
                  src="/landingpage/hero/Colorization/1.webp"
                  alt="Standard Restoration"
                  position="right"
                />
                <ImageComparisonImage
                  src="/landingpage/hero/Colorization/2.webp"
                  alt="True-to-Life Color Correction"
                  position="left"
                />
                <ImageComparisonSlider className="w-1 bg-white/60 backdrop-blur-xs">
                  <div className="absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border border-gray-300 shadow-lg flex items-center justify-center">
                    <ArrowLeftRight className="w-4 h-4 text-gray-700" />
                  </div>
                </ImageComparisonSlider>
              </ImageComparison>
              {/* BEFORE 和 AFTER 标签 */}
              <div className="absolute bottom-3 left-3 z-10">
                <span className="bg-slate-700 text-white px-3 py-1.5 rounded text-sm font-medium">
                  BEFORE
                </span>
              </div>
              <div className="absolute bottom-3 right-3 z-10">
                <span className="bg-slate-700 text-white px-3 py-1.5 rounded text-sm font-medium">
                  AFTER
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
