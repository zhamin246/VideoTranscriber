import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  
  // 如果 locale 是 pt，强制使用 en（因为 pt 已被移除）
  if (locale === "pt") {
    locale = routing.defaultLocale;
  }
  
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  if (!routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  try {
    // 加载全局翻译
    const globalMessages = (await import(`./messages/${locale.toLowerCase()}.json`))
      .default;
    
    // 注意：Features页面翻译通过 getFeaturesPage() 函数单独加载
    // 这里只加载全局翻译，避免构建时检查不存在的文件
    
    return {
      locale: locale,
      messages: globalMessages,
    };
  } catch (e) {
    return {
      locale: routing.defaultLocale,
      messages: (await import(`./messages/en.json`)).default,
    };
  }
});
