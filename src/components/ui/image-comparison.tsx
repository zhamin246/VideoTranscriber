"use client";

import { cn } from "@/lib/utils";
import { useState, createContext, useContext, useEffect, useRef } from "react";
import {
  motion,
  MotionValue,
  SpringOptions,
  useMotionValue,
  useSpring,
  useTransform,
  animate
} from "motion/react";
import Image from "next/image";

const ImageComparisonContext = createContext<
  | {
      sliderPosition: number;
      setSliderPosition: (pos: number) => void;
      motionSliderPosition: MotionValue<number>;
    }
  | undefined
>(undefined);

export type ImageComparisonProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  enableHover?: boolean;
  springOptions?: SpringOptions;
  autoSlide?: boolean;
  autoSlideDuration?: number;
};

const DEFAULT_SPRING_OPTIONS = {
  bounce: 0,
  duration: 0
};

function ImageComparison({
  children,
  className,
  style,
  enableHover,
  springOptions,
  autoSlide = true,
  autoSlideDuration = 3000
}: ImageComparisonProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const motionValue = useMotionValue(50);
  const motionSliderPosition = useSpring(motionValue, springOptions ?? DEFAULT_SPRING_OPTIONS);
  const [sliderPosition, setSliderPosition] = useState(50);
  const animationRef = useRef<any>(null);
  const directionRef = useRef<1 | -1>(1);

  // 自动滑动动画
  useEffect(() => {
    if (!autoSlide || isDragging || isHovered || isPaused) {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
      return;
    }

    const animateSlider = () => {
      const currentValue = motionValue.get();
      let targetValue: number;

      if (directionRef.current === 1) {
        // 向右滑动到 80%
        targetValue = 80;
        if (currentValue >= 79) {
          directionRef.current = -1;
          targetValue = 20;
        }
      } else {
        // 向左滑动到 20%
        targetValue = 20;
        if (currentValue <= 21) {
          directionRef.current = 1;
          targetValue = 80;
        }
      }

      animationRef.current = animate(motionValue, targetValue, {
        duration: autoSlideDuration / 1000,
        ease: "easeInOut",
        onComplete: () => {
          if (!isDragging && !isHovered && !isPaused) {
            animateSlider();
          }
        }
      });
    };

    animateSlider();

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [autoSlide, isDragging, isHovered, isPaused, motionValue, autoSlideDuration]);

  const handleDrag = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging && !enableHover) return;

    // 暂停自动滑动
    if (!isPaused) {
      setIsPaused(true);
      if (animationRef.current) {
        animationRef.current.stop();
      }
    }

    const containerRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x =
      "touches" in event
        ? event.touches[0].clientX - containerRect.left
        : (event as React.MouseEvent).clientX - containerRect.left;

    const percentage = Math.min(Math.max((x / containerRect.width) * 100, 0), 100);
    motionValue.set(percentage);
    setSliderPosition(percentage);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (enableHover) {
      handleDrag(event);
    } else if (isDragging) {
      handleDrag(event);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (animationRef.current) {
      animationRef.current.stop();
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // 延迟恢复自动滑动，让用户有时间离开
    setTimeout(() => {
      if (!isDragging && !isPaused) {
        setIsPaused(false);
      }
    }, 100);
  };

  const handleMouseDown = () => {
    if (!enableHover) {
      setIsDragging(true);
      setIsPaused(true);
      if (animationRef.current) {
        animationRef.current.stop();
      }
    }
  };

  const handleMouseUp = () => {
    if (!enableHover) {
      setIsDragging(false);
      // 延迟恢复自动滑动
      setTimeout(() => {
        if (!isHovered) {
          setIsPaused(false);
        }
      }, 500);
    }
  };

  return (
    <ImageComparisonContext.Provider
      value={{ sliderPosition, setSliderPosition, motionSliderPosition }}>
      <div
        className={cn(
          "relative overflow-hidden select-none",
          enableHover && "cursor-ew-resize",
          className
        )}
        style={style}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleDrag}
        onTouchStart={() => {
          setIsDragging(true);
          setIsPaused(true);
          if (animationRef.current) {
            animationRef.current.stop();
          }
        }}
        onTouchEnd={() => {
          setIsDragging(false);
          setTimeout(() => {
            if (!isHovered) {
              setIsPaused(false);
            }
          }, 500);
        }}>
        {children}
      </div>
    </ImageComparisonContext.Provider>
  );
}

const ImageComparisonImage = ({
  className,
  alt,
  src,
  position
}: {
  className?: string;
  alt: string;
  src: string;
  position: "left" | "right";
}) => {
  const { motionSliderPosition } = useContext(ImageComparisonContext)!;
  const leftClipPath = useTransform(motionSliderPosition, (value) => `inset(0 0 0 ${value}%)`);
  const rightClipPath = useTransform(
    motionSliderPosition,
    (value) => `inset(0 ${100 - value}% 0 0)`
  );

  // 使用Next.js Image组件优化，但需要motion包装来处理clipPath动画
  return (
    <motion.div
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{
        clipPath: position === "left" ? leftClipPath : rightClipPath
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="h-full w-full object-contain"
        sizes="(max-width: 768px) 100vw, 50vw"
        quality={position === "left" ? 85 : 75} // 左侧图片（改善后的）使用更高质量
        priority={position === "left"} // 左侧图片（改善后的）优先加载
        loading={position === "left" ? "eager" : "eager"} // hero区域图片都立即加载
        fetchPriority={position === "left" ? "high" : "low"} // 右侧图片使用低优先级
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        draggable={false}
        unoptimized={false}
      />
    </motion.div>
  );
};

const ImageComparisonSlider = ({
  className,
  children
}: {
  className: string;
  children?: React.ReactNode;
}) => {
  const { motionSliderPosition } = useContext(ImageComparisonContext)!;

  const left = useTransform(motionSliderPosition, (value) => `${value}%`);

  return (
    <motion.div
      className={cn("absolute top-0 bottom-0 w-1 cursor-ew-resize", className)}
      style={{
        left
      }}>
      {children}
    </motion.div>
  );
};

export { ImageComparison, ImageComparisonImage, ImageComparisonSlider };
