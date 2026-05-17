// app/(store)/products/[slug]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Heart, Share2, Copy } from "lucide-react";
import ProductDetailView from "@/components/store/product-detail-view";
import RecentlyViewed from "@/components/store/recently-viewed";
import ProductRecommendations from "@/components/store/product-recommendations";
import Script from "next/script";
import { ReviewsSection } from "@/components/store/reviews-section";
import { ProductSchema } from "@/components/seo/product-schema";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { ProductWithRelationsSerialized, AttributeDefinitionPublic } from "@/types";
import { auth } from "@/auth";
import { getBundlesForProduct } from "@/lib/bundles";
import { serializeProduct } from "@/lib/serialize-product";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const description = product.description
    ? product.description.replace(/[#*_~`\[\]()]/g, '').substring(0, 155)
    : `Buy ${product.name} at MiDuka.`;

  const imageUrl = product.images[0]?.url;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const ogImageUrl = `${appUrl}/api/og?title=${encodeURIComponent(product.name)}&subtitle=${encodeURIComponent(product.category?.name || "Product")}${imageUrl ? `&image=${encodeURIComponent(imageUrl)}` : ""}`;

  return {
    title: product.name,
    description,
    alternates: {
      canonical: `/products/${product.slug}`,
    },
    openGraph: {
      title: product.name,
      description,
      type: "article",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        }
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: [ogImageUrl],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const session = await auth();
  
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      category: true,
      images: {
        include: {
          variantLinks: {
            include: { variant: true },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
      variants: {
        where: { isActive: true },
        include: {
          attributes: {
            include: { attributeDefinition: true },
            orderBy: { attributeDefinition: { sortOrder: "asc" } },
          },
          imageLinks: {
            include: { image: true },
          },
        },
      },
      flashSale: true,
    },
  });

  if (!product) {
    notFound();
  }

  // Fetch review data for initial display
  const [avgRating, totalReviews, ratingGroups, bundles, allDefinitions] = await Promise.all([
    prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
    }),
    prisma.review.count({
      where: { productId: product.id },
    }),
    prisma.review.groupBy({
      by: ['rating'],
      where: { productId: product.id },
      _count: { id: true },
    }),
    getBundlesForProduct(product.id),
    prisma.attributeDefinition.findMany({
      orderBy: { sortOrder: "asc" },
      include: { allowedValues: { orderBy: { sortOrder: "asc" } } },
    }),
  ]);

  const ratingBreakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratingGroups.forEach((group) => {
    ratingBreakdown[group.rating] = group._count.id;
  });

  // Simple eligibility: must be logged in. 
  // (In a real app, check if they bought the product)
  const isEligible = !!session?.user;

  // Derive which attribute keys this specific product uses across all its variants.
  const usedKeys = new Set(
    product.variants.flatMap((v) => v.attributes.map((a) => a.attributeDefinition.key))
  );
  const relevantDefinitions = allDefinitions.filter((d) => usedKeys.has(d.key));

  const serializedDefinitions: AttributeDefinitionPublic[] = relevantDefinitions.map((d) => ({
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

  // Pre-serialize for client component
  const serializedProduct = serializeProduct(product);

  const isOutOfStock = product.stockQuantity === 0 && (product.variants.length === 0 || product.variants.reduce((acc, v) => acc + v.stockQuantity, 0) === 0);

  // SEO Schemas
  const breadcrumbItems = [
    { name: "Store", url: "/" },
    ...(product.category ? [{ name: product.category.name, url: `/categories/${product.category.slug}` }] : []),
    { name: product.name, url: `/products/${product.slug}` }
  ];

  return (
    <>
      <ProductSchema 
        product={serializedProduct as any}
        aggregateRating={{
          ratingValue: avgRating._avg.rating || 0,
          reviewCount: totalReviews
        }}
      />
      <BreadcrumbSchema items={breadcrumbItems} />
      <div className="container mx-auto px-4 py-8 flex flex-col gap-16">
        {/* Breadcrumbs */}
        <nav aria-label="breadcrumb" className="text-sm text-muted-foreground flex items-center gap-2">
          <Link href="/" className="hover:text-foreground">Store</Link>
          <span className="text-muted-foreground/50">›</span>
          {product.category ? (
            <>
              <Link href={`/categories/${product.category.slug}`} className="hover:text-foreground">
                {product.category.name}
              </Link>
              <span className="text-muted-foreground/50">›</span>
            </>
          ) : null}
          <span className="text-foreground font-medium">{product.name}</span>
        </nav>

        <ProductDetailView product={serializedProduct} attributeDefinitions={serializedDefinitions} bundles={bundles} />

        {/* Description & Specs Tab Style */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            {product.description && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">About this product</h2>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap leading-relaxed opacity-80">{product.description}</p>
                </div>
              </div>
            )}

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="pt-4">
                <h3 className="text-sm font-semibold mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Link 
                      key={tag} 
                      href={`/search?q=${encodeURIComponent(tag)}`}
                      className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Specs or Info could go here */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-muted/30 border border-border/50">
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider">Product Highlights</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Authentic Quality</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Fast Shipping across Kenya</span>
                </li>ProductDetailPage
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Secure Payments</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div id="reviews" className="scroll-mt-20">
          <ReviewsSection 
            productId={product.id} 
            productSlug={product.slug}
            isEligible={isEligible}
            currentUserId={session?.user?.id}
            initialData={{
              averageRating: avgRating._avg.rating || 0,
              totalReviews: totalReviews,
              ratingBreakdown: ratingBreakdown
            }}
          />
        </div>

        {/* Recommendations */}
        <ProductRecommendations productSlug={product.slug} />
        
        {/* Recently Viewed */}
        <RecentlyViewed />
      </div>
    </>
  );
}
