import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // Article images and lawyer portraits are served from /api/public/;
        // the longer rule wins, so they stay crawlable under the /api/ block.
        allow: ["/", "/api/public/"],
        // `/notice` carries no firm information; the signed-in areas are private.
        disallow: ["/notice", "/login", "/dashboard", "/admin", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
