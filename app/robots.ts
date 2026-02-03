import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/*", "/_next/*", "/private/*"] },
      { userAgent: "Googlebot", allow: "/", disallow: ["/api/*", "/_next/*"] },
      { userAgent: "Bingbot", allow: "/", disallow: ["/api/*", "/_next/*"] },
      { userAgent: ["AhrefsBot", "SemrushBot", "DotBot", "MJ12bot"], disallow: "/" },
    ],
    host: "https://tripoli.media",
    sitemap: "https://tripoli.media/sitemap.xml",
  };
}
