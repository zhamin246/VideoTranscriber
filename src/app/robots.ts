import type { MetadataRoute } from "next";

function siteOrigin() {
  let base = (process.env.NEXT_PUBLIC_WEB_URL || "https://imagetocad.app").trim();
  base = base.replace(/\/$/, "");
  if (!/^https?:\/\//i.test(base)) base = `https://${base}`;
  return base;
}

export default function robots(): MetadataRoute.Robots {
  const base = siteOrigin();

  const disallow = [
    "/pricing",
    "/*/pricing",
    "/privacy-policy",
    "/*/privacy-policy",
    "/terms-of-service",
    "/*/terms-of-service",
    "/refund-policy",
    "/*/refund-policy",
    "/workspace/",
    "/*/workspace/",
    "/my-assets",
    "/*/my-assets",
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
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow,
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
