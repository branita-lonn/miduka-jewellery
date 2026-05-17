// components/store/image-gallery.tsx
// Client component — main image and thumbnail strip switcher

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: { 
    id: string; 
    url: string; 
    altText: string | null; 
    blurDataUrl?: string | null;
    variantIds: string[];
  }[];
  productName: string;
  selectedVariantId?: string | null;
}

export default function ImageGallery({ images, productName, selectedVariantId }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-switch to first image linked to the selected variant.
  // Senior implementation detail: if a seller creates a variant but has not linked
  // any images to it yet (common in lazy inventory setups), variantIds will be empty
  // or no image will match. In that case, do NOT clear activeIndex or reset to 0
  // (which would cause a jarring layout flicker). Check that linkedIndex is not -1
  // before committing the update.
  useEffect(() => {
    if (!selectedVariantId) return;
    
    const linkedIndex = images.findIndex(img => img.variantIds?.includes(selectedVariantId));
    if (linkedIndex !== -1) {
      setActiveIndex(linkedIndex);
    }
  }, [selectedVariantId, images]);

  if (images.length === 0) {
    return (
      <div className="aspect-[4/3] md:aspect-[3/4] w-full rounded-3xl bg-muted flex items-center justify-center border border-border">
        <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div className="relative aspect-square md:aspect-[4/5] lg:max-w-[80%] mx-auto w-full rounded-3xl overflow-hidden bg-muted/50 border border-border">
        <Image
          src={images[activeIndex].url}
          alt={images[activeIndex].altText || `${productName} image ${activeIndex + 1}`}
          fill
          priority
          loading="eager"
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover sm:object-contain transition-opacity duration-300"
          {...(images[activeIndex].blurDataUrl ? { placeholder: "blur", blurDataURL: images[activeIndex].blurDataUrl } : {})}
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(idx)}
              className={cn(
                "relative h-20 w-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all duration-200",
                activeIndex === idx
                  ? "border-primary ring-2 ring-primary/20 ring-offset-1"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <Image
                src={img.url}
                alt={`Thumbnail ${idx + 1}`}
                fill
                sizes="80px"
                className="object-cover"
                {...(img.blurDataUrl ? { placeholder: "blur", blurDataURL: img.blurDataUrl } : {})}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
