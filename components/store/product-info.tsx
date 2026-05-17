// components/store/product-info.tsx
// Client Component — variant selector, quantity control, and Add to Cart action for the product detail page

"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Heart, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/components/store/cart-provider";
import { formatCurrency } from "@/lib/utils";
import type { ProductWithRelationsSerialized, AttributeDefinitionPublic } from "@/types";
import { cn } from "@/lib/utils";
import StockAlertButton from "@/components/store/stock-alert-button";
import { useWishlist } from "@/components/store/wishlist-provider";
import { FlashSaleCountdown } from "@/components/store/flash-sale-countdown";
import { ProductBundleCallout } from "@/components/store/product-bundle-callout";

interface ProductInfoProps {
  product: ProductWithRelationsSerialized;
  attributeDefinitions: AttributeDefinitionPublic[];
  onVariantChange?: (
    variant: ProductWithRelationsSerialized["variants"][number] | null
  ) => void;
  bundles?: any[];
}

export default function ProductInfo({ 
  product, 
  attributeDefinitions,
  onVariantChange,
  bundles = []
}: ProductInfoProps) {
  const { addItem } = useCart();

  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const { isWishlisted, toggleWishlist, isLoading: wishlistLoading } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  // When no attributes are selected, selectedAttributes is {} and Object.entries()
  // returns nothing, so every() returns true for all variants — the first active
  // variant is returned as the default. This is intentional: the PDP shows the
  // first variant's price and stock on initial load.
  // If a product has no active variants, selectedVariant is null and the component
  // falls back to product-level stock and price.
  const selectedVariant =
    product.variants.find(
      (v) =>
        v.isActive &&
        attributeDefinitions.every((def) => {
          const selected = selectedAttributes[def.id];
          if (selected === undefined) return true; // no selection = any value matches
          const variantAttr = v.attributes.find(
            (a) => a.attributeDefinitionId === def.id
          );
          return variantAttr?.value === selected;
        })
    ) ?? null;

  // Track fully selected to decide if we can Add to Cart
  const isFullySelected = attributeDefinitions.every((def) => selectedAttributes[def.id] !== undefined);
  const selectedVariantId = isFullySelected ? (selectedVariant?.id ?? undefined) : undefined;

  // Sync back variant selection to parent component
  useEffect(() => {
    onVariantChange?.(selectedVariant);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariant?.id]); // compare by ID to avoid infinite loop on object identity

  // Flash Sale logic
  const activeFlashSale = product.flashSale && new Date(product.flashSale.startTime) <= new Date() && new Date(product.flashSale.endTime) >= new Date()
    ? product.flashSale
    : null;

  // Effective price (flash sale > variant override > base price)
  const effectivePrice = activeFlashSale ? activeFlashSale.salePrice : (selectedVariant?.priceOverride ?? product.price);
  const strikethroughPrice = activeFlashSale ? (selectedVariant?.priceOverride ?? product.price) : product.compareAtPrice;
  const showStrikethrough = activeFlashSale || (product.compareAtPrice && product.compareAtPrice > effectivePrice);

  // Stock
  const totalVariantStock = product.variants.reduce((acc, v) => acc + (v.stockQuantity ?? 0), 0);
  const stockQty =
    product.variants.length > 0
      ? (selectedVariant 
          ? selectedVariant.stockQuantity 
          : totalVariantStock)
      : product.stockQuantity;

  const isOutOfStock = stockQty === 0;
  const isLowStock = !isOutOfStock && stockQty <= 5;

  function handleAttributeSelect(defId: string, value: string): void {
    setSelectedAttributes((prev) => {
      // If the value is already selected, deselect it by removing the key entirely.
      // Never set to "" — see state declaration comment above.
      if (prev[defId] === value) {
        const next = { ...prev };
        delete next[defId];
        return next;
      }
      return { ...prev, [defId]: value };
    });
    setQuantity(1);
  }

  async function handleAddToCart() {
    if (isOutOfStock || !isFullySelected) return;
    setIsAdding(true);
    try {
      await addItem({
        productId: product.id,
        variantId: selectedVariantId,
        quantity,
        productName: product.name,
      });
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Name */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {activeFlashSale ? (
            <Badge variant="destructive" className="rounded-full text-xs font-bold bg-destructive text-destructive-foreground">
              Flash Sale
            </Badge>
          ) : product.isOnSale && (
            <Badge variant="destructive" className="rounded-full text-xs">
              Sale
            </Badge>
          )}
          {product.isFeatured && (
            <Badge variant="secondary" className="rounded-full text-xs">
              Featured
            </Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold leading-tight">{product.name}</h1>
      </div>

      {/* Price */}
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold text-foreground">
            {formatCurrency(effectivePrice)}
          </span>
          {showStrikethrough && strikethroughPrice && Number(strikethroughPrice) > Number(effectivePrice) && (
            <span className="text-lg text-muted-foreground line-through">
              {formatCurrency(strikethroughPrice)}
            </span>
          )}
          {showStrikethrough && strikethroughPrice && Number(strikethroughPrice) > Number(effectivePrice) && (
            <Badge variant="destructive" className="rounded-full text-xs font-bold">
              {Math.round(
                ((Number(strikethroughPrice) - Number(effectivePrice)) /
                  Number(strikethroughPrice)) *
                  100
              )}
              % OFF
            </Badge>
          )}
        </div>

        {activeFlashSale && (
          <div className="bg-primary/5 rounded-3xl p-4 border border-primary/10">
            <FlashSaleCountdown endTime={activeFlashSale.endTime} />
          </div>
        )}
      </div>

      {/* Stock indicator */}
      {isOutOfStock ? (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>Out of stock</span>
        </div>
      ) : isLowStock ? (
        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-4 w-4" />
          <span>Only {stockQty} left in stock</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <span>In stock</span>
        </div>
      )}

      {/* Stock Alert for out of stock */}
      {isOutOfStock && (
        <StockAlertButton 
          productId={product.id} 
          variantId={selectedVariantId}
          isOutOfStock={isOutOfStock}
        />
      )}

      {/* Dynamic Attributes Variant Selector */}
      {attributeDefinitions.map((def) => {
        // Collect distinct values for this attribute across all active variants,
        // preserving the order they appear in allowedValues (if defined) or
        // by first-seen order across variants.
        const allowedOrder = def.allowedValues;
        const seenValues = new Set(
          product.variants
            .filter((v) => v.isActive)
            .flatMap((v) => v.attributes)
            .filter((a) => a.attributeDefinitionId === def.id)
            .map((a) => a.value)
        );
        // Use allowedValues order where possible; fall back to seen order for free-form types.
        const distinctValues =
          allowedOrder.length > 0
            ? allowedOrder.filter((v) => seenValues.has(v))
            : [...seenValues];

        if (distinctValues.length === 0) return null;

        const selectedValue = selectedAttributes[def.id]; // undefined = nothing selected

        return (
          <div key={def.id} className="space-y-2">
            <p className="text-sm font-medium">
              {def.label}:{" "}
              <span className="font-normal text-muted-foreground">
                {selectedValue !== undefined ? selectedValue : "Select"}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {distinctValues.map((value) => {
                const isSelected = selectedValue === value;

                // Availability check: is there any active variant that (a) has this
                // value for this attribute AND (b) is compatible with every currently
                // selected value for all OTHER attributes?
                //
                // The Object.entries(selectedAttributes) loop only includes attributes
                // where a selection has been made (no undefined/empty-string keys exist
                // in the map — the handleAttributeSelect handler guarantees this).
                const isAvailable = product.variants.some(
                  (v) =>
                    v.isActive &&
                    v.attributes.some(
                      (a) =>
                        a.attributeDefinitionId === def.id && a.value === value
                    ) &&
                    Object.entries(selectedAttributes).every(([defId, selVal]) => {
                      if (defId === def.id) return true; // skip current attribute
                      return v.attributes.some(
                        (a) =>
                          a.attributeDefinitionId === defId && a.value === selVal
                      );
                    })
                );

                // COLOR: circular swatch
                if (def.inputType === "COLOR") {
                  // When value is an empty string (not yet set by the seller),
                  // render a grey placeholder — never pass an empty string to
                  // backgroundColor as it has no visual output.
                  const hasValue = value.trim() !== "";
                  return (
                    <button
                      key={value}
                      onClick={() => handleAttributeSelect(def.id, value)}
                      disabled={!isAvailable}
                      title={value || "Unset colour"}
                      aria-label={`Select colour ${value}`}
                      aria-pressed={isSelected}
                      className={cn(
                        "h-8 w-8 rounded-full border-2 transition-all",
                        isSelected
                          ? "border-primary ring-2 ring-primary ring-offset-2"
                          : "border-border",
                        !isAvailable && "cursor-not-allowed opacity-30",
                        !hasValue && "bg-muted"
                      )}
                      style={hasValue ? { backgroundColor: value } : undefined}
                    />
                  );
                }

                // BOOLEAN: single toggle
                if (def.inputType === "BOOLEAN") {
                  const displayLabel =
                    value === "true" ? `Yes — ${def.label}` : `No — ${def.label}`;
                  return (
                    <button
                      key={value}
                      onClick={() => handleAttributeSelect(def.id, value)}
                      disabled={!isAvailable}
                      aria-pressed={isSelected}
                      className={cn(
                        "rounded-xl border-2 px-4 py-1.5 text-sm font-medium transition-all",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50",
                        !isAvailable && "cursor-not-allowed opacity-30"
                      )}
                    >
                      {displayLabel}
                    </button>
                  );
                }

                // NUMBER: append unit with correct spacing
                if (def.inputType === "NUMBER" && def.unit) {
                  const unit = def.unit;
                  const alreadyHasUnit = value
                    .toLowerCase()
                    .endsWith(unit.toLowerCase());
                  const separator = unit.length <= 2 ? "" : " ";
                  const displayValue = alreadyHasUnit
                    ? value
                    : `${value}${separator}${unit}`;
                  return (
                    <button
                      key={value}
                      onClick={() => handleAttributeSelect(def.id, value)}
                      disabled={!isAvailable}
                      aria-pressed={isSelected}
                      className={cn(
                        "rounded-xl border-2 px-4 py-1.5 text-sm font-medium transition-all",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50",
                        !isAvailable && "cursor-not-allowed opacity-30"
                      )}
                    >
                      {displayValue}
                    </button>
                  );
                }

                // TEXT / SELECT: plain pill
                return (
                  <button
                    key={value}
                    onClick={() => handleAttributeSelect(def.id, value)}
                    disabled={!isAvailable}
                    aria-pressed={isSelected}
                    className={cn(
                      "rounded-xl border-2 px-4 py-1.5 text-sm font-medium transition-all",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50",
                      !isAvailable && "cursor-not-allowed opacity-30"
                    )}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Quantity */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Quantity</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-2xl border border-border overflow-hidden">
            {/* A11Y: Min touch target 44px */}
            <button
              aria-label="Decrease quantity"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="h-11 w-11 flex items-center justify-center text-lg font-medium hover:bg-muted transition-colors disabled:opacity-40"
            >
              −
            </button>
            <span className="w-12 text-center text-sm font-semibold">
              {quantity}
            </span>
            {/* A11Y: Min touch target 44px */}
            <button
              aria-label="Increase quantity"
              onClick={() => setQuantity((q) => Math.min(stockQty, q + 1))}
              disabled={quantity >= stockQty}
              className="h-11 w-11 flex items-center justify-center text-lg font-medium hover:bg-muted transition-colors disabled:opacity-40"
            >
              +
            </button>
          </div>
          {stockQty > 0 && (
            <span className="text-sm text-muted-foreground">
              {stockQty} available
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          id="add-to-cart-button"
          size="lg"
          className="flex-1 rounded-2xl gap-2 py-2 border-foreground/30"
          disabled={isOutOfStock || isAdding || !isFullySelected}
          onClick={() => void handleAddToCart()}
        >
          <ShoppingCart className="h-5 w-5" />
          {isAdding 
            ? "Adding…" 
            : isOutOfStock 
              ? "Out of Stock" 
              : !isFullySelected
                ? "Select Options"
                : "Add to Cart"}
        </Button>
        <Button
          id="wishlist-button"
          variant="outline"
          size="lg"
          className={cn(
            "rounded-2xl gap-2 sm:w-auto transition-all duration-300",
            wishlisted && "bg-primary/5 border-primary/30 text-primary"
          )}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          disabled={wishlistLoading}
          onClick={() => toggleWishlist(product.id)}
        >
          <Heart className={cn("h-5 w-5", wishlisted && "fill-current")} />
          <span className="sm:inline">{wishlisted ? "Wishlisted" : "Wishlist"}</span>
        </Button>
      </div>

      {/* Bundles */}
      <ProductBundleCallout bundles={bundles} currentProductId={product.id} />
    </div>
  );
}
