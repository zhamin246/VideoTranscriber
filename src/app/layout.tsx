import "@/app/globals.css";

import { getLocale, setRequestLocale } from "next-intl/server";
import { locales, defaultLocale } from "@/i18n/locale";
import { cn } from "@/lib/utils";
import localFont from "next/font/local";
import { Lexend } from "next/font/google";
import MicrosoftClarity from "@/components/analytics/microsoft-clarity";

const lexend = Lexend({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lexend",
});

const inter = localFont({
  src: "../fonts/inter-latin.woff2",
  weight: "100 900",
  display: "swap",
  preload: true,
  variable: "--font-inter",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

const instrumentSerif = localFont({
  src: [
    {
      path: "../fonts/instrument-serif-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/instrument-serif-latin-400-italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  display: "swap",
  variable: "--font-instrument",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  setRequestLocale(locale);

  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000";
  const googleAdsenseCode = process.env.NEXT_PUBLIC_GOOGLE_ADCODE || "";

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn(inter.variable, instrumentSerif.variable, lexend.variable)}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // 禁用浏览器的滚动恢复机制
              if ('scrollRestoration' in history) {
                history.scrollRestoration = 'manual';
              }
            `,
          }}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        {googleAdsenseCode && (
          <meta name="google-adsense-account" content={googleAdsenseCode} />
        )}

        {/* Face Rating brand icons — mesh mark on burgundy #9F1239 */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-96x96.png" type="image/png" sizes="96x96" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#8882F5" />

        {/* 预加载关键 hero 图片（移动端优化）- 使用fetchpriority提高优先级 */}
        {/* 只预加载左侧图片（改善后的），右侧图片延迟加载 */}
        <link
          rel="preload"
          href="/landingpage/hero/2.webp?v=3"
          as="image"
          imageSizes="(max-width: 768px) 100vw, 50vw"
          fetchPriority="high"
        />
        {/* 右侧图片使用低优先级，避免阻塞关键渲染路径 */}
        <link
          rel="preload"
          href="/landingpage/hero/1.webp?v=3"
          as="image"
          imageSizes="(max-width: 768px) 100vw, 50vw"
          fetchPriority="low"
        />
        
        {/* DNS预解析和预连接外部资源（移动端优化） */}
        <link rel="dns-prefetch" href="https://accounts.google.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.clarity.ms" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.clarity.ms" crossOrigin="anonymous" />

        {locales &&
          locales.map((loc) => (
            <link
              key={loc}
              rel="alternate"
              hrefLang={loc}
              href={webUrl ? `${webUrl}${loc === defaultLocale ? "" : `/${loc}`}/` : undefined}
            />
          ))}
        {webUrl && <link rel="alternate" hrefLang="x-default" href={webUrl} />}
      </head>
      <body
        className={cn(
          "min-h-screen font-sans antialiased overflow-x-hidden",
          inter.className
        )}
        suppressHydrationWarning
      >
        {children}
        {/* Server-injected: reads CLARITY_PROJECT_ID at runtime on VPS/Docker */}
        <MicrosoftClarity />
      </body>
    </html>
  );
}
