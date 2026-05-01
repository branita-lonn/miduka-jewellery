// app/(store)/products/[slug]/page.tsx
// Product Detail Page — displays full product info, images, variant selection, and SEO metadata

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Heart, Share2, Copy } from "lucide-react";
import ImageGallery from "@/components/store/image-gallery";
import ProductCard from "@/components/store/product-card";
import ProductInfo from "@/components/store/product-info";
import RecentlyViewed from "@/components/store/recently-viewed";
import ProductRecommendations from "@/components/store/product-recommendations";
import Script from "next/script";
import { ProductWithRelationsSerialized } from "@/types";
import { auth } from "@/auth";
import { ReviewsSection } from "@/components/store/reviews-section";

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

// ─── SEO METADATA ────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const [product, settings] = await Promise.all([
    prisma.product.findUnique({
      where: { slug, isActive: true },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    }),
    prisma.storeSettings.findFirst({ select: { storeName: true } }),
  ]);

  if (!product) return {};

  const storeName = settings?.storeName ?? "MiDuka";
  const ogImage = product.images[0]?.url;
  const description =
    product.description?.substring(0, 160) ??
    `Buy ${product.name} at ${storeName}. ${formatCurrency(Number(product.price))}`;

  return {
    title: `${product.name} | ${storeName}`,
    description,
    openGraph: {
      title: product.name,
      description,
      images: ogImage ? [{ url: ogImage }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: ogImage ? [ogImage] : [],
    },
  };
}

// ─── PAGE COMPONENT ──────────────────────────────────────────────────────
export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;

  const [product, settings, session] = await Promise.all([
    prisma.product.findUnique({
      where: { slug, isActive: true },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: { where: { isActive: true } },
      },
    }),
    prisma.storeSettings.findFirst({ select: { storeName: true } }),
    auth(),
  ]);

  if (!product) notFound();

  // Fetch review summary data server-side
  const [reviewGroups, totalReviews] = await Promise.all([
    prisma.review.groupBy({
      by: ["rating"],
      where: { productId: product.id },
      _count: { rating: true },
    }),
    prisma.review.count({
      where: { productId: product.id },
    }),
  ]);

  const ratingBreakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRatingPoints = 0;
  reviewGroups.forEach((group) => {
    ratingBreakdown[group.rating] = group._count.rating;
    totalRatingPoints += group.rating * group._count.rating;
  });
  const averageRating = totalReviews > 0 ? totalRatingPoints / totalReviews : 0;

  // Check eligibility for writing a review
  let isEligible = false;
  if (session?.user?.id) {
    const [hasDeliveredOrder, hasAlreadyReviewed] = await Promise.all([
      prisma.order.findFirst({
        where: {
          customerId: session.user.id,
          status: "DELIVERED",
          items: { some: { productId: product.id } },
        },
      }),
      prisma.review.findUnique({
        where: {
          productId_customerId: {
            productId: product.id,
            customerId: session.user.id,
          },
        },
      }),
    ]);

    isEligible = !!hasDeliveredOrder && !hasAlreadyReviewed;
  }

  // AI recommendations will be fetched client-side via ProductRecommendations component

  const priceNum = Number(product.price);
  const comparePriceNum = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const isOutOfStock = product.stockQuantity === 0;

  // Build JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? "",
    image: product.images.map((img) => img.url),
    offers: {
      "@type": "Offer",
      price: Number(product.price),
      priceCurrency: "KES",
      availability: isOutOfStock
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
    },
  };

  // Serialize product for Client Component
  const serializedProduct: ProductWithRelationsSerialized = {
    ...product,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    variants: product.variants.map((v) => ({
      ...v,
      priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
    })),
  } as any;

  return (
    <>
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto px-4 py-8 flex flex-col gap-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          {/* Left: Image Gallery */}
          <div>
            <ImageGallery images={product.images} productName={product.name} />
          </div>

          {/* Right: Info */}
          <div className="flex flex-col gap-6">
            <nav aria-label="breadcrumb" className="text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">Store</Link>
              <span className="mx-2">›</span>
              {product.category ? (
                <>
                  <Link href={`/categories/${product.category.slug}`} className="hover:text-foreground">
                    {product.category.name}
                  </Link>
                  <span className="mx-2">›</span>
                </>
              ) : null}
              <span className="text-foreground">{product.name}</span>
            </nav>

            <ProductInfo product={serializedProduct} />

            {/* Description */}
            {product.description && (
              <div className="mt-6 prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
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
            )}

            {/* Share */}
            <div className="flex items-center gap-4 mt-6 pt-6 border-t border-border">
              <span className="text-sm font-medium">Share:</span>
              <a
                href={`https://wa.me/?text=Check+out+${encodeURIComponent(product.name)}+at+${encodeURIComponent("https://example.com/products/" + product.slug)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Share on WhatsApp"
              >
                <Share2 className="h-5 w-5" />
              </a>
              <button 
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Copy Link"
              >
                <Copy className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── AI RECOMMENDATIONS ─────────────────────────────────────────── */}
        <ProductRecommendations productSlug={product.slug} />

        {/* ─── REVIEWS SECTION ───────────────────────────────────────────── */}
        <section className="py-8 border-t border-border">
          <ReviewsSection
            productId={product.id}
            productSlug={product.slug}
            isEligible={isEligible}
            currentUserId={session?.user?.id}
            initialData={{
              averageRating,
              totalReviews,
              ratingBreakdown,
            }}
          />
        </section>

        {/* ─── RECENTLY VIEWED ──────────────────────────────────────────── */}
        <RecentlyViewed />

        {/* Script to add to recently viewed on mount */}
        <Script id="add-to-recently-viewed" strategy="lazyOnload">
          {`
            try {
              const currentSlug = "${slug}";
              let rv = [];
              const stored = localStorage.getItem('recently_viewed');
              if (stored) {
                rv = JSON.parse(stored);
                if (!Array.isArray(rv)) rv = [];
              }
              // Remove if exists, then unshift to front
              rv = rv.filter(s => s !== currentSlug);
              rv.unshift(currentSlug);
              if (rv.length > 8) rv = rv.slice(0, 8);
              localStorage.setItem('recently_viewed', JSON.stringify(rv));
            } catch (e) { console.error('Recently viewed error', e) }
          `}
        </Script>
      </div>
    </>
  );
}
