import type { MetadataRoute } from "next";
import { counties, features } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://raphaelhealth.co.ke";
  const staticPaths = ["/", "/legal/privacy-policy", "/legal/terms", "/legal/cookie-policy"];
  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${site}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/" ? "weekly" : "yearly",
    priority: path === "/" ? 1 : 0.35,
  }));
  for (const feature of features) {
    entries.push({ url: `${site}/features/${feature.slug}`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.65 });
  }
  for (const county of counties) {
    entries.push({ url: `${site}/counties/${county.slug}`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 });
  }
  return entries;
}
