// app/(store)/page.tsx
// Public homepage — hero, featured products, new arrivals, on sale, category tiles

import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import ProductCard from "@/components/store/product-card";
import { Button } from "@/components/ui/button";
import type { Prisma } from "@prisma/client";

export const revalidate = 60;

// ─── Serialization helper ──────────────────────────────────────────────────
type RawProduct = Prisma.ProductGetPayload<{
  include: {
    images: { select: { url: true; sortOrder: true } };
    category: { select: { name: true; slug: true } };
  };
}>;

function toCardProps(p: RawProduct) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
    primaryImage: p.images.sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url ?? null,
    category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
    isOnSale: p.isOnSale,
    isFeatured: p.isFeatured,
    stockQuantity: p.stockQuantity,
    createdAt: p.createdAt.toISOString(),
    reviewCount: p.reviews.length,
    rating: p.reviews.length > 0 ? p.reviews.reduce((acc, r) => acc + r.rating, 0) / p.reviews.length : 0,
  };
}

const PRODUCT_INCLUDE = {
  images: { select: { url: true as const, sortOrder: true as const } },
  category: { select: { name: true as const, slug: true as const } },
  reviews: { select: { rating: true as const } },
} satisfies Prisma.ProductInclude;

// ─── Page ─────────────────────────────────────────────────────────────────
export default async function HomePage() {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const [settings, featured, newArrivals, onSale, categories] =
    await Promise.all([
      prisma.storeSettings.findFirst(),
      prisma.product.findMany({
        where: { isActive: true, isFeatured: true },
        include: PRODUCT_INCLUDE,
        orderBy: { updatedAt: "desc" },
        take: 8,
      }),
      prisma.product.findMany({
        where: { isActive: true, createdAt: { gte: fourteenDaysAgo } },
        include: PRODUCT_INCLUDE,
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.product.findMany({
        where: { isActive: true, isOnSale: true },
        include: PRODUCT_INCLUDE,
        orderBy: { updatedAt: "desc" },
        take: 8,
      }),
      prisma.category.findMany({
        where: { isActive: true, parentId: null },
        include: { _count: { select: { products: true } } },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

  const storeName = settings?.storeName ?? "MiDuka";
  const tagline = settings?.storeTagline ?? "Your neighbourhood store, online.";

  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section aria-label="Hero banner" className="relative w-full overflow-hidden">
        {settings?.heroImageUrl ? (
          <div className="relative h-[400px] md:h-[520px]">
            <Image
              src={settings.heroImageUrl}
              alt={settings.heroHeadline ?? storeName}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-20 gap-4 max-w-2xl">
              {settings.heroHeadline && (
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
                  {settings.heroHeadline}
                </h1>
              )}
              {settings.heroSubheadline && (
                <p className="text-lg text-muted-foreground">
                  {settings.heroSubheadline}
                </p>
              )}
              {settings.heroCtaText && settings.heroCtaLink && (
                <Link href={settings.heroCtaLink}>
                  <Button size="lg" className="rounded-full px-8 w-fit">
                    {settings.heroCtaText}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          /* Gradient fallback */
          <div className="relative h-[400px] md:h-[520px] bg-gradient-to-br from-primary/20 via-primary/5 to-background flex flex-col items-center justify-center text-center px-6 gap-4">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-primary/10 blur-3xl" />
            </div>
            <h1 className="relative text-5xl md:text-7xl font-extrabold tracking-tight text-foreground">
              {settings?.heroHeadline || storeName}
            </h1>
            <p className="relative text-lg md:text-xl text-muted-foreground max-w-lg">
              {settings?.heroSubheadline || tagline}
            </p>
            <Link href={settings?.heroCtaLink || "/categories"}>
              <Button size="lg" className="relative rounded-full px-10">
                {settings?.heroCtaText || "Shop Now"}
              </Button>
            </Link>
          </div>
        )}
      </section>

      <div className="container mx-auto px-4 flex flex-col gap-16">
        {/* ── Featured Products ─────────────────────────────────────────── */}
        {featured.length > 0 && (
          <Section title="Featured Products" href="/categories">
            <ProductGrid products={featured.map(toCardProps)} />
          </Section>
        )}

        {/* ── New Arrivals ──────────────────────────────────────────────── */}
        {newArrivals.length > 0 && (
          <Section title="New Arrivals" href="/categories">
            <ProductGrid products={newArrivals.map(toCardProps)} />
          </Section>
        )}

        {/* ── On Sale ───────────────────────────────────────────────────── */}
        {onSale.length > 0 && (
          <Section title="On Sale" href="/search?onSale=true">
            <ProductGrid products={onSale.map(toCardProps)} />
          </Section>
        )}

        {/* ── Category Tiles ────────────────────────────────────────────── */}
        {categories.length > 0 && (
          <Section title="Shop by Category">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  id={`category-tile-${cat.slug}`}
                  className="group relative flex flex-col items-center gap-3 rounded-4xl bg-card border border-border/40 p-4 hover:border-primary/20 hover:shadow-lg transition-all duration-300 text-center overflow-hidden"
                >
                  <div className="relative w-16 h-16 rounded-3xl overflow-hidden bg-muted flex-shrink-0">
                    {cat.imageUrl ? (
                      <Image
                        src={cat.imageUrl}
                        alt={cat.name}
                        fill
                        sizes="64px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground line-clamp-1">
                      {cat.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cat._count.products} item{cat._count.products !== 1 ? "s" : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

// ─── Local helper components ───────────────────────────────────────────────
function Section({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        {href && (
          <Link
            href={href}
            className="text-sm text-primary hover:underline font-medium"
          >
            View all →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function ProductGrid({
  products,
}: {
  products: ReturnType<typeof toCardProps>[];
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {products.map((p, index) => (
        <ProductCard key={p.id} {...p} priority={index < 4} />
      ))}
    </div>
  );
}
