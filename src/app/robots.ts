import type { MetadataRoute } from "next";

function siteOrigin() {
  let base = (process.env.NEXT_PUBLIC_WEB_URL || "https://imagetocad.app").trim();
  base = base.replace(/\/$/, "");
  if (!/^https?:\/\//i.test(base)) base = `https://${base}`;
  return base;
}

export default function robots(): MetadataRoute.Robots {
  const base = siteOrigin();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/auth/",
          "/dashboard",
          "/results/",
          "/report/",
          "/tools/",
          "/my-",
          "/api-keys",
          "/user-generation-records",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
