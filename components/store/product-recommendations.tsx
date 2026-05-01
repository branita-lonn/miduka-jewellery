/**
 * file: components/store/product-recommendations.tsx
 * purpose: Client component to fetch and display AI-driven product recommendations
 */

"use client";

import React, { useEffect, useState } from "react";
import ProductCard from "./product-card";
import { Loader2 } from "lucide-react";

interface ProductRecommendationsProps {
  productSlug: string;
}

export default function ProductRecommendations({ productSlug }: ProductRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await fetch(`/api/products/${productSlug}/recommendations`);
        if (response.ok) {
          const data = await response.json();
          setRecommendations(data.recommendations);
          setLabel(data.label);
        }
      } catch (error) {
        console.error("[FETCH_RECOMMENDATIONS_ERROR]", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [productSlug]);

  if (loading) {
    return (
      <div className="flex justify-center py-12 animate-in fade-in duration-500">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <section className="flex flex-col gap-6 py-8 border-t border-border animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h2 className="text-2xl font-bold text-foreground">{label}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {recommendations.map((p) => (
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
            createdAt={p.createdAt}
            // Handle optional rating data if included in the future
            rating={p.rating ?? 0}
            reviewCount={p.reviewCount ?? 0}
          />
        ))}
      </div>
    </section>
  );
}
