import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://raphaelhealth.co.ke";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/app", "/api/", "/sign-in", "/sign-up"] }],
    sitemap: `${site}/sitemap.xml`,
  };
}
