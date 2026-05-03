"use client";

// components/store/product-card.tsx
// Reusable product card for all storefront product grids — rounded-4xl design

import Link from "next/link";

import Image from "next/image";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ProductCardProps } from "@/types";
import { useWishlist } from "@/components/store/wishlist-provider";

function isNewProduct(createdAt: string | Date): boolean {
  const created =
    typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);
  return created > cutoff;
}

export default function ProductCard({
  slug,
  name,
  price,
  compareAtPrice,
  primaryImage,
  isOnSale = false,
  stockQuantity = 0,
  createdAt,
  rating = 0,
  reviewCount = 0,
  priority = false,
  id,
  flashSale,
  blurDataUrl,
}: ProductCardProps) {
  const { isWishlisted, toggleWishlist, isLoading } = useWishlist();
  const wishlisted = isWishlisted(id);

  const isNew = isNewProduct(createdAt);
  const isOutOfStock = stockQuantity === 0;

  // Flash Sale logic
  const activeFlashSale = flashSale && new Date(flashSale.startTime) <= new Date() && new Date(flashSale.endTime) >= new Date()
    ? flashSale
    : null;

  const displayPrice = activeFlashSale ? activeFlashSale.salePrice : price;
  const originalPrice = activeFlashSale ? price : compareAtPrice;
  const showStrikethrough = activeFlashSale || (compareAtPrice && compareAtPrice > price);

  const discount = showStrikethrough && originalPrice && originalPrice > displayPrice
      ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
      : null;

  return (
    <Link
      href={`/products/${slug}`}
      className="group relative flex flex-col rounded-4xl bg-card p-1 pb-3 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-border/40 hover:border-primary/20"
    >
      {/* Image */}
      <div className="relative rounded-3xl aspect-[4/3] overflow-hidden bg-muted mb-3 flex-shrink-0">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            {...(blurDataUrl ? { placeholder: "blur", blurDataURL: blurDataUrl } : {})}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {activeFlashSale ? (
            <Badge variant="destructive" className="rounded-full text-[10px] font-bold px-2 py-0.5 border-none shadow-sm">
              FLASH SALE
            </Badge>
          ) : isOnSale && discount !== null && (
            <Badge variant="destructive" className="text-xs font-bold px-2 py-0.5">
              -{discount}%
            </Badge>
          )}
          {isNew && !isOnSale && !activeFlashSale && (
            <Badge className="text-xs font-bold px-2 py-0.5 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 border-none shadow-sm">New</Badge>
          )}
        </div>

        {/* Wishlist button */}
        <button
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={cn(
            "absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm transition-all duration-200 border border-border/50",
            wishlisted 
              ? "bg-red-50 text-red-500 opacity-100 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800" 
              : "bg-background/80 text-muted-foreground opacity-100 md:opacity-0 md:group-hover:opacity-100"
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(id);
          }}
          disabled={isLoading}
        >
          <Heart className={cn("h-3.5 w-3.5", wishlisted && "fill-current")} />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1 flex-1">
        <p className="font-semibold text-sm text-foreground line-clamp-1 leading-tight">
          {name}
        </p>

        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span
            className={cn(
              "font-bold text-foreground text-sm",
              (isOnSale || activeFlashSale) && "text-destructive"
            )}
          >
            {formatCurrency(displayPrice)}
          </span>
          {showStrikethrough && originalPrice && originalPrice > displayPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {formatCurrency(originalPrice)}
              </span>
            )}
        </div>

        {/* Stars */}
        {(reviewCount > 0 || rating > 0) && (
          <div className="flex items-center gap-1">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3 w-3",
                    i < Math.round(rating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-muted text-muted-foreground/30"
                  )}
                />
              ))}
            </div>
            {reviewCount > 0 && (
              <span className="text-xs text-muted-foreground">
                ({reviewCount})
              </span>
            )}
          </div>
        )}

        {isOutOfStock && (
          <span className="text-xs text-destructive font-medium">
            Out of Stock
          </span>
        )}
      </div>
    </Link>
  );
}
