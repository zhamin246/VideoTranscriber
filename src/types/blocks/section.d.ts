import { Image, Button } from "@/types/blocks/base";

export interface SectionItem {
  title?: string;
  description?: string;
  label?: string;
  icon?: string;
  image?: Image;
  buttons?: Button[];
  url?: string;
  target?: string;
  children?: SectionItem[];
  // 添加这些字段
  id?: string;
  imageAlt?: string;
  // FAQ 专用字段
  question?: string;
  answer?: string;
  // 相关工具推荐专用字段
  features?: string[];
  iconColor?: string; // 图标背景颜色
  // Testimonial 专用字段
  location?: string; // 用户位置
  beforeImage?: Image; // 修复前图片
  afterImage?: Image; // 修复后图片
  afterVideo?: string; // 修复后视频（MP4路径）
  verified?: boolean; // 是否已验证用户
}

export interface Section {
  disabled?: boolean;
  name?: string;
  title?: string;
  description?: string;
  label?: string;
  icon?: string;
  image?: Image;
  buttons?: Button[];
  items?: SectionItem[];
  // 添加这些字段
  cards?: SectionItem[];
  // Testimonial 专用字段
  trustBarAvatars?: Image[]; // 信任条用户头像列表
  trustBarText?: string; // 信任条文本，如 "Trusted by over 120,000 users"
}
