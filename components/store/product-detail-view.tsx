// components/store/product-detail-view.tsx
// Client component that coordinates the ImageGallery and ProductInfo to handle colour-image switching

"use client";

import { useEffect, useState } from "react";
import ImageGallery from "@/components/store/image-gallery";
import ProductInfo from "@/components/store/product-info";
import { ProductWithRelationsSerialized, AttributeDefinitionPublic } from "@/types";

interface ProductDetailViewProps {
  product: ProductWithRelationsSerialized;
  attributeDefinitions: AttributeDefinitionPublic[];
  bundles?: any[];
}

export default function ProductDetailView({ product, attributeDefinitions, bundles = [] }: ProductDetailViewProps) {
  // Lift variant ID state up to coordinate between gallery and info
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  // Track product view engagement
  useEffect(() => {
    const trackView = async () => {
      try {
        await fetch(`/api/products/${product.slug}/view`, {
          method: "POST",
        });
      } catch (error: unknown) {
        // Silently fail for analytics tracking
        console.error("Failed to track view:", error);
      }
    };

    trackView();
  }, [product.slug]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
      {/* Left: Image Gallery */}
      <div>
        <ImageGallery 
          images={product.images} 
          productName={product.name} 
          selectedVariantId={selectedVariantId}
        />
      </div>

      {/* Right: Info */}
      <div className="flex flex-col gap-6">
        <ProductInfo 
          product={product} 
          attributeDefinitions={attributeDefinitions}
          onVariantChange={(variant) => setSelectedVariantId(variant?.id ?? null)}
          bundles={bundles}
        />
      </div>
    </div>
  );
}
