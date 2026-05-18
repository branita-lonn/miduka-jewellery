// app/robots.ts
// Dynamic robots.txt generation

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/products", "/categories", "/search"],
      disallow: [
        "/dashboard/",
        "/account/",
        "/cart/",
        "/checkout/",
        "/api/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
