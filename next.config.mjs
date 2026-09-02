import bundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";
import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: false,
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*",
      },
    ],
    // 优化移动端图片加载 - 优先移动端尺寸
    deviceSizes: [375, 414, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1年缓存
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // 移动端优化：降低默认质量以减少文件大小
    unoptimized: false,
  },
  async headers() {
    return [
      {
        source: "/vectorline/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // 重定向text-to-image到text-to-video
      {
        source: '/convert',
        destination: '/',
        permanent: true,
      },
      {
        source: '/convert/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/convert/image-to-dxf',
        destination: '/',
        permanent: true,
      },
      {
        source: '/image-to-dxf',
        destination: '/',
        permanent: true,
      },
      {
        source: '/sketch-to-cad',
        destination: '/',
        permanent: true,
      },
      {
        source: '/signature-to-vector',
        destination: '/',
        permanent: true,
      },
      {
        source: '/logo-to-vector',
        destination: '/',
        permanent: true,
      },
      {
        source: '/raster-to-vector',
        destination: '/',
        permanent: true,
      },
      {
        source: '/text-to-image',
        destination: '/text-to-video',
        permanent: true,
      },
      {
        source: '/zh/text-to-image',
        destination: '/zh/text-to-video',
        permanent: true,
      },
      // 规范化带参数的URL
      {
        source: '/:path*',
        has: [
          {
            type: 'query',
            key: 'ref',
          },
        ],
        destination: '/:path*',
        permanent: false,
      },
    ];
  },
};

// Make sure experimental mdx flag is enabled
const configWithMDX = {
  ...nextConfig,
  experimental: {
    mdxRs: true,
  },
    serverExternalPackages: ["sharp", "@visioncortex/vtracer"],
};

export default withBundleAnalyzer(withNextIntl(withMDX(configWithMDX)));
