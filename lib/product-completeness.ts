// lib/product-completeness.ts
// Utility to compute product completeness score

import { ProductWithRelations } from "@/types";

export function computeCompleteness(product: ProductWithRelations): number {
  let score = 0;

  // Has at least one image: 25 points
  if (product.images && product.images.length > 0) {
    score += 25;
  }

  // Has at least 3 images: additional 10 points (total 35 if 3+ images)
  if (product.images && product.images.length >= 3) {
    score += 10;
  }

  // Has a description (non-empty, >50 chars): 20 points
  if (product.description && product.description.length > 50) {
    score += 20;
  }

  // Has a category assigned: 15 points
  if (product.categoryId) {
    score += 15;
  }

  // Has at least one variant OR stockQuantity > 0: 15 points
  if ((product.variants && product.variants.length > 0) || product.stockQuantity > 0) {
    score += 15;
  }

  // Has a price > 0: 10 points
  if (Number(product.price) > 0) {
    score += 10;
  }

  // Has at least one tag: 5 points
  if (product.tags && product.tags.length > 0) {
    score += 5;
  }

  return Math.min(score, 100);
}
