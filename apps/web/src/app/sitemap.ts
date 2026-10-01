import type { MetadataRoute } from "next";
import { practiceAreas, serviceHref } from "@/content/practice-areas";
import { industries } from "@/content/industries";
import { getInsights } from "@/lib/website-data";
import { policies } from "@/content/policies";
import { siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const insights = await getInsights();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/services`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/domains`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/insights`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/community`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/careers`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.7 },
  ];

  return [
    ...staticRoutes,
    ...practiceAreas.map((area) => ({
      url: `${siteUrl}/services/${area.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    ...practiceAreas.flatMap((area) =>
      area.services.map((service) => ({
        url: `${siteUrl}${serviceHref(area, service)}`,
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ),
    ...industries.map((industry) => ({
      url: `${siteUrl}/domains/${industry.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...insights.map((insight) => ({
      url: `${siteUrl}/insights/${insight.slug}`,
      lastModified: new Date(insight.updated ?? insight.date),
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
    ...policies.map((policy) => ({
      url: `${siteUrl}/${policy.slug}`,
      lastModified: new Date(policy.updated),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
