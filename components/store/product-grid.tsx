// components/store/product-grid.tsx
// Client component — reads URL search params, fetches /api/products, renders cards + pagination

"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ShoppingBag, Loader2 } from "lucide-react";
import ProductCard from "@/components/store/product-card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductPublic, ProductsApiResponse } from "@/types";

interface ProductGridProps {
  /** Pre-set category slug (category pages) — merged with URL params */
  defaultCategory?: string;
  /** Pre-set search query (search page) — merged with URL params */
  defaultQ?: string;
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="aspect-[4/3] rounded-3xl" />
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-4 w-1/2 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function ProductGrid({ defaultCategory, defaultQ }: ProductGridProps) {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<ProductPublic[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedFrom, setExpandedFrom] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      if (defaultCategory && !params.has("category")) {
        params.set("category", defaultCategory);
      }
      if (defaultQ && !params.has("q")) {
        params.set("q", defaultQ);
      }

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data: ProductsApiResponse = await res.json() as ProductsApiResponse;
      setProducts(data.products);
      setTotalPages(data.pages);
      setCurrentPage(data.currentPage);
      setTotal(data.total);
      setExpandedFrom(data.expandedFrom || null);
    } catch (error: unknown) {
      console.error(error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchParams, defaultCategory, defaultQ]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  function buildPageUrl(page: number): string {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return `?${params.toString()}`;
  }

  if (loading) return <GridSkeleton />;

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-semibold text-foreground">No products found</p>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters or search query.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Result count & Expansion Notice */}
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">
          {total} result{total !== 1 ? "s" : ""}
        </p>
        {expandedFrom && (
          <p className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full w-fit animate-in fade-in slide-in-from-left-2 duration-500">
            Showing results for &ldquo;<span className="font-semibold text-foreground italic">{expandedFrom}</span>&rdquo; and similar terms
          </p>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((p, index) => (
          <ProductCard
            key={p.id}
            id={p.id}
            slug={p.slug}
            name={p.name}
            price={p.price}
            compareAtPrice={p.compareAtPrice}
            primaryImage={p.images[0]?.url ?? null}
            category={p.category}
            isOnSale={p.isOnSale}
            isFeatured={p.isFeatured}
            stockQuantity={p.stockQuantity}
            createdAt={p.createdAt}
            rating={p.rating}
            reviewCount={p.reviewCount}
            priority={index < 4}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={buildPageUrl(currentPage - 1)}
                disabled={currentPage <= 1}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                if (idx > 0 && (arr[idx - 1] as number) < p - 1) acc.push("ellipsis");
                acc.push(p);
                return acc;
              }, [])
              .map((item, i) =>
                item === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationLink
                      href={buildPageUrl(item)}
                      isActive={item === currentPage}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

            <PaginationItem>
              <PaginationNext
                href={buildPageUrl(currentPage + 1)}
                disabled={currentPage >= totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
