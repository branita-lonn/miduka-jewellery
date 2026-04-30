// app/api/dashboard/products/[id]/images/reorder/route.ts
// API route for reordering product images

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
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
    const { images } = body; // Array of { id: string, sortOrder: number }

    if (!images || !Array.isArray(images)) {
      return NextResponse.json({ error: "Invalid images data" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      for (const image of images) {
        if (!image.id) continue;
        
        // We ensure the image belongs to the product just to be safe
        const existingImage = await tx.productImage.findUnique({
          where: { id: image.id },
        });
        
        if (existingImage && existingImage.productId === productId) {
          await tx.productImage.update({
            where: { id: image.id },
            data: { sortOrder: image.sortOrder },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`[PRODUCT_IMAGES_REORDER] ${error.message}`);
    } else {
      console.error(`[PRODUCT_IMAGES_REORDER] Unknown error`);
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
