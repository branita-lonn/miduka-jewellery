/**
 * file: app/api/products/[slug]/recommendations/route.ts
 * purpose: AI-driven product recommendations using co-occurrence and similarity
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const product = await prisma.product.findUnique({
      where: { slug, isActive: true },
    });

    if (!product) {
      return new NextResponse("Product not found", { status: 404 });
    }

    // 1. "Frequently Bought Together" (co-occurrence from OrderItems)
    const ordersWithProduct = await prisma.orderItem.findMany({
      where: { productId: product.id },
      select: { orderId: true },
    });

    const orderIds = ordersWithProduct.map((o) => o.orderId);

    const coOccurringItems = await prisma.orderItem.findMany({
      where: {
        orderId: { in: orderIds },
        productId: { not: product.id },
      },
      select: { productId: true },
    });

    const counts: Record<string, number> = {};
    coOccurringItems.forEach((item) => {
      counts[item.productId] = (counts[item.productId] || 0) + 1;
    });

    const sortedIds = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

    // Requires at least 2 data points to surface "Frequently Bought Together"
    if (sortedIds.length >= 2) {
      const recommendations = await prisma.product.findMany({
        where: {
          id: { in: sortedIds.slice(0, 4) },
          isActive: true,
          stockQuantity: { gt: 0 },
        },
        include: { images: { take: 1, orderBy: { sortOrder: 'asc' } }, category: true },
      });

      if (recommendations.length > 0) {
        return NextResponse.json({
          recommendations: recommendations.map(p => ({
            ...p,
            price: Number(p.price),
            compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
          })),
          label: "Frequently Bought Together",
        });
      }
    }

    // 2. "You Might Also Like" (Similarity Scoring)
    const similarProducts = await prisma.product.findMany({
      where: {
        id: { not: product.id },
        isActive: true,
        stockQuantity: { gt: 0 },
        categoryId: product.categoryId,
      },
      include: { images: { take: 1, orderBy: { sortOrder: 'asc' } }, category: true },
    });

    const scoredProducts = similarProducts.map((p) => {
      let score = 0;
      
      // Tag overlap (weight: 3 per tag)
      const sharedTags = p.tags.filter((t) => product.tags.includes(t));
      score += sharedTags.length * 3;

      // Price range (±40%) (weight: 2)
      const currentPrice = Number(product.price);
      const targetPrice = Number(p.price);
      if (targetPrice >= currentPrice * 0.6 && targetPrice <= currentPrice * 1.4) {
        score += 2;
      }

      // Same category (already filtered, but we can add weight for same subcategory if we had parentId info)
      score += 5; 

      return { ...p, score };
    });

    const topRecommendations = scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    if (topRecommendations.length > 0) {
      return NextResponse.json({
        recommendations: topRecommendations.map(({ score, ...p }) => ({
            ...p,
            price: Number(p.price),
            compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        })),
        label: "You Might Also Like",
      });
    }

    // 3. Fallback: More from this Category
    const categoryFallback = await prisma.product.findMany({
      where: {
        id: { not: product.id },
        isActive: true,
        stockQuantity: { gt: 0 },
        categoryId: product.categoryId,
      },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { images: { take: 1, orderBy: { sortOrder: 'asc' } }, category: true },
    });

    return NextResponse.json({
      recommendations: categoryFallback.map(p => ({
        ...p,
        price: Number(p.price),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      })),
      label: "More from this Category",
    });
  } catch (error) {
    console.error("[RECOMMENDATIONS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
