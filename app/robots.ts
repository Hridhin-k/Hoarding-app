import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/market", "/market/"],
        disallow: ["/manage/", "/field/", "/api/", "/onboarding", "/auth/"],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
  };
}
