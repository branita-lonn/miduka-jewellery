// app/api/dashboard/products/[id]/route.ts
// API route for fetching, updating, and deleting a single product

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/generate-slug";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const session = await auth();

    if (!session || session.user.role !== "STORE_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: "asc" },
        },
        variants: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`[PRODUCT_GET] ${error.message}`);
    } else {
      console.error(`[PRODUCT_GET] Unknown error`);
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
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

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let updatedSlug = existingProduct.slug;

    if (name && name !== existingProduct.name) {
      updatedSlug = await generateUniqueSlug(name, async (currentSlug) => {
        const existing = await prisma.product.findUnique({
          where: { slug: currentSlug },
        });
        return !!existing && existing.id !== productId;
      });
    }

    const product = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          name,
          slug: updatedSlug,
          description,
          price,
          compareAtPrice,
          categoryId: categoryId || null,
          tags: tags || [],
          isActive: isActive !== undefined ? isActive : existingProduct.isActive,
          isFeatured: isFeatured !== undefined ? isFeatured : existingProduct.isFeatured,
          isOnSale: isOnSale !== undefined ? isOnSale : existingProduct.isOnSale,
          stockQuantity: stockQuantity !== undefined ? stockQuantity : existingProduct.stockQuantity,
        },
      });

      if (images) {
        await tx.productImage.deleteMany({
          where: { productId },
        });

        if (images.length > 0) {
          await tx.productImage.createMany({
            data: images.map((url: string, index: number) => ({
              productId,
              url,
              sortOrder: index,
            })),
          });
        }
      }

      if (variants) {
        const existingVariants = await tx.productVariant.findMany({
          where: { productId },
        });

        const incomingVariantIds = variants.map((v: { id?: string }) => v.id).filter(Boolean);

        const variantsToDelete = existingVariants
          .filter((ev) => !incomingVariantIds.includes(ev.id))
          .map((ev) => ev.id);

        if (variantsToDelete.length > 0) {
          await tx.productVariant.deleteMany({
            where: { id: { in: variantsToDelete } },
          });
        }

        for (const variant of variants) {
          if (variant.id) {
            await tx.productVariant.update({
              where: { id: variant.id },
              data: {
                colour: variant.colour,
                size: variant.size,
                material: variant.material,
                priceOverride: variant.priceOverride,
                stockQuantity: variant.stockQuantity || 0,
                sku: variant.sku,
                isActive: variant.isActive !== undefined ? variant.isActive : true,
              },
            });
          } else {
            await tx.productVariant.create({
              data: {
                productId,
                colour: variant.colour,
                size: variant.size,
                material: variant.material,
                priceOverride: variant.priceOverride,
                stockQuantity: variant.stockQuantity || 0,
                sku: variant.sku,
                isActive: variant.isActive !== undefined ? variant.isActive : true,
              },
            });
          }
        }
      }

      return updatedProduct;
    });

    return NextResponse.json(product);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`[PRODUCT_PUT] ${error.message}`);
    } else {
      console.error(`[PRODUCT_PUT] Unknown error`);
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const session = await auth();

    if (!session || session.user.role !== "STORE_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`[PRODUCT_DELETE] ${error.message}`);
    } else {
      console.error(`[PRODUCT_DELETE] Unknown error`);
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
