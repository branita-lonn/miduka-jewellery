// app/api/dashboard/products/route.ts
// API route for fetching and creating products

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/generate-slug";
import { computeCompleteness } from "@/lib/product-completeness";
import { ProductWithRelations } from "@/types";

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "STORE_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: "asc" },
        },
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const productsWithScore = products.map((product) => ({
      ...product,
      completenessScore: computeCompleteness(product as ProductWithRelations),
    }));

    return NextResponse.json(productsWithScore);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`[PRODUCTS_GET] ${error.message}`);
    } else {
      console.error(`[PRODUCTS_GET] Unknown error`);
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  console.log("POST /api/dashboard/products - HIT");
  try {
    const session = await auth();

    if (!session || session.user.role !== "STORE_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      description,
      price,
      compareAtPrice,
      categoryId,
      tags,
      isActive,
      isFeatured,
      isOnSale,
      stockQuantity,
      images,
      variants,
    } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
    }

    const slug = await generateUniqueSlug(name, async (currentSlug) => {
      const existing = await prisma.product.findUnique({
        where: { slug: currentSlug },
      });
      return !!existing;
    });

    console.log("CREATING PRODUCT IN DB - Payload:", { name, price, categoryId, imagesCount: images?.length });
    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name,
          slug,
          description,
          price,
          compareAtPrice,
          categoryId: categoryId || null,
          tags: tags || [],
          isActive: isActive !== undefined ? isActive : true,
          isFeatured: isFeatured || false,
          isOnSale: isOnSale || false,
          stockQuantity: stockQuantity || 0,
        },
      });

      if (images && images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((url: string, index: number) => ({
            productId: newProduct.id,
            url,
            sortOrder: index,
          })),
        });
      }

      if (variants && variants.length > 0) {
        await tx.productVariant.createMany({
          data: variants.map((v: { colour?: string; size?: string; material?: string; priceOverride?: number; stockQuantity?: number; sku?: string; isActive?: boolean }) => ({
            productId: newProduct.id,
            colour: v.colour,
            size: v.size,
            material: v.material,
            priceOverride: v.priceOverride,
            stockQuantity: v.stockQuantity || 0,
            sku: v.sku,
            isActive: v.isActive !== undefined ? v.isActive : true,
          })),
        });
      }

      return newProduct;
    });

    console.log("PRODUCT CREATED SUCCESSFULLY:", product.id);
    return NextResponse.json(product);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`[PRODUCTS_POST] ${error.message}`);
    } else {
      console.error(`[PRODUCTS_POST] Unknown error`);
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
