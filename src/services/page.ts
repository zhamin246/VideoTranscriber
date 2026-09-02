import { 
  LandingPage, 
  PricingPage, 
  FeaturesPage
} from "@/types/pages/landing";

export async function getLandingPage(locale: string): Promise<LandingPage> {
  return (await getPage("landing", locale)) as LandingPage;
}

export async function getPricingPage(_locale: string): Promise<PricingPage> {
  const { getConvertPricingPage } = await import("@/lib/convert/pricing-catalog");
  return getConvertPricingPage();
}

export async function getFeaturesPage(locale: string): Promise<FeaturesPage> {
  return (await getPage("features", locale)) as FeaturesPage;
}

// 已下线工具页：如果仍有业务需要，请改为使用 landing/pricing 等其他页面配置
// export async function getRemoverFundoDeImagemPage(locale: string): Promise<LandingPage> {
//   return (await getPage("remover-fundo-de-imagem", locale)) as LandingPage;
// }
//
// export async function getComprimirImagemPage(locale: string): Promise<LandingPage> {
//   return (await getPage("comprimir-imagem", locale)) as LandingPage;
// }

export async function getPage(
  name: string,
  locale: string
): Promise<LandingPage | PricingPage | FeaturesPage> {
  try {
    // 将不支持的 locale 转换为 en
    if (locale === "zh-CN") {
      locale = "zh";
    }
    // 如果 locale 是 pt，强制使用 en（因为 pt 已被移除）
    if (locale === "pt") {
      locale = "en";
    }

    return await import(
      `@/i18n/pages/${name}/${locale.toLowerCase()}.json`
    ).then((module) => module.default);
  } catch (error) {
    console.warn(`Failed to load ${locale}.json for ${name}, falling back to en.json`);

    try {
      return await import(`@/i18n/pages/${name}/en.json`).then(
        (module) => module.default
      );
    } catch (fallbackError) {
      // 如果 en.json 也不存在，返回空对象（适用于 features 页面等可选页面）
      console.warn(`Failed to load en.json for ${name}, returning empty object`);
      return {} as LandingPage | PricingPage | FeaturesPage;
    }
  }
}
