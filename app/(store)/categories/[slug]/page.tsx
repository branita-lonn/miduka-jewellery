// app/(store)/categories/[slug]/page.tsx
// Category detail page — product grid with filters, sort, subcategory pills

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductFilters from "@/components/store/product-filters";
import ProductSort from "@/components/store/product-sort";
import ProductGrid from "@/components/store/product-grid";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { AttributeDefinitionPublic } from "@/types";

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });
  
  if (!category) return {};
  
  const settings = await prisma.storeSettings.findFirst();
  const storeName = settings?.storeName || "MiDuka";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const ogImageUrl = `${appUrl}/api/og?title=${encodeURIComponent(category.name)}&subtitle=${encodeURIComponent("Category")}${settings?.logoUrl ? `&image=${encodeURIComponent(settings.logoUrl)}` : ""}`;

  return {
    title: `${category.name} — Browse ${storeName}`,
    description: `Shop ${category.name.toLowerCase()} at ${storeName}. Free delivery available on qualifying orders.`,
    alternates: {
      canonical: `/categories/${slug}`,
    },
    openGraph: {
      title: category.name,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: category.name,
        }
      ],
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug, isActive: true },
    include: {
      children: { where: { isActive: true }, orderBy: { sortOrder: "asc" }, include: { children: { select: { id: true, slug: true } } } },
      _count: { select: { products: true } },
    },
  });

  if (!category) notFound();

  // Calculate total products including descendants
  const categoryIds = [category.id];
  category.children.forEach(child => {
    categoryIds.push(child.id);
    child.children.forEach(grandchild => categoryIds.push(grandchild.id));
  });

  const totalProducts = await prisma.product.count({
    where: { categoryId: { in: categoryIds }, isActive: true }
  });

  // Fetch filterable attribute definitions scoped to category or global
  const filterableAttributes = await prisma.attributeDefinition.findMany({
    where: {
      isFilterable: true,
      OR: [
        { categoryId: null },
        { categoryId: category.id }
      ]
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
    { name: "Categories", url: "/categories" },
    { name: category.name, url: `/categories/${category.slug}` }
  ];

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />
      <div className="container mx-auto px-4 py-10 flex flex-col gap-8">
        {/* Header */}
      <div>
        <nav aria-label="breadcrumb" className="text-sm text-muted-foreground mb-2">
          <Link href="/categories" className="hover:text-foreground transition-colors">
            Categories
          </Link>
          <span className="mx-2">›</span>
          <span className="text-foreground">{category.name}</span>
        </nav>
        <h1 className="text-3xl font-bold text-foreground">{category.name}</h1>
        {category.description && (
          <p className="text-muted-foreground mt-1 max-w-2xl">{category.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          {totalProducts} product{totalProducts !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Subcategory pills */}
      {category.children.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {category.children.map((child) => (
            <Link
              key={child.id}
              href={`/categories/${child.slug}`}
              id={`subcategory-${child.slug}`}
              className="flex-shrink-0 px-4 py-1.5 rounded-full border border-border text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      {/* Filters + Grid layout */}
      <div className="flex gap-8 items-start">
        <ProductFilters filterableAttributes={serializedFilters} lockedCategory={slug} mode="desktop" />

        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Mobile filter trigger + sort row */}
          <div className="flex items-center gap-3 flex-wrap">
            <Suspense fallback={<Skeleton className="h-9 w-32 rounded-2xl" />}>
              <ProductFilters filterableAttributes={serializedFilters} lockedCategory={slug} mode="mobile" />
            </Suspense>
            <div className="ml-auto">
              <Suspense fallback={<Skeleton className="h-9 w-44 rounded-2xl" />}>
                <ProductSort />
              </Suspense>
            </div>
          </div>

          <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
            <ProductGrid defaultCategory={slug} />
          </Suspense>
        </div>
      </div>
    </div>
    </>
  );
}
