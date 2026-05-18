// app/(store)/products/page.tsx
// All products page — product grid with filters and sort

import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductFilters from "@/components/store/product-filters";
import ProductSort from "@/components/store/product-sort";
import ProductGrid from "@/components/store/product-grid";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { AttributeDefinitionPublic } from "@/types";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await prisma.storeSettings.findFirst();
  const storeName = settings?.storeName || "MiDuka";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const ogImageUrl = `${appUrl}/api/og?title=${encodeURIComponent("All Products")}&subtitle=${encodeURIComponent("Catalog")}${settings?.logoUrl ? `&image=${encodeURIComponent(settings.logoUrl)}` : ""}`;

  return {
    title: `All Products — Browse ${storeName}`,
    description: `Shop our complete collection of products at ${storeName}. Free delivery available on qualifying orders.`,
    alternates: {
      canonical: `/products`,
    },
    openGraph: {
      title: "All Products",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: "All Products",
        }
      ],
    },
  };
}

export default async function ProductsPage() {
  // Fetch global filterable attribute definitions
  const filterableAttributes = await prisma.attributeDefinition.findMany({
    where: {
      isFilterable: true,
      categoryId: null, // Global attributes only for all products
    },
    orderBy: { sortOrder: "asc" },
    include: { allowedValues: { orderBy: { sortOrder: "asc" } } },
  });

  const serializedFilters: AttributeDefinitionPublic[] = filterableAttributes.map((d) => ({
    id: d.id,
    key: d.key,
    label: d.label,
    unit: d.unit,
    inputType: d.inputType,
    sortOrder: d.sortOrder,
    isFilterable: d.isFilterable,
    categoryId: d.categoryId,
    allowedValues: d.allowedValues.map((av) => av.value),
  }));

  const breadcrumbItems = [
    { name: "Store", url: "/" },
    { name: "Products", url: "/products" }
  ];

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />
      <div className="container mx-auto px-4 py-10 flex flex-col gap-8">
        {/* Header */}
      <div>
        <nav aria-label="breadcrumb" className="text-sm text-muted-foreground mb-2">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span className="mx-2">›</span>
          <span className="text-foreground">All Products</span>
        </nav>
        <h1 className="text-3xl font-bold text-foreground">All Products</h1>
      </div>

      {/* Filters + Grid layout */}
      <div className="flex gap-8 items-start">
        <ProductFilters filterableAttributes={serializedFilters} mode="desktop" />

        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Mobile filter trigger + sort row */}
          <div className="flex items-center gap-3 flex-wrap">
            <Suspense fallback={<Skeleton className="h-9 w-32 rounded-2xl" />}>
              <ProductFilters filterableAttributes={serializedFilters} mode="mobile" />
            </Suspense>
            <div className="ml-auto">
              <Suspense fallback={<Skeleton className="h-9 w-44 rounded-2xl" />}>
                <ProductSort />
              </Suspense>
            </div>
          </div>

          <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
            <ProductGrid />
          </Suspense>
        </div>
      </div>
    </div>
    </>
  );
}
