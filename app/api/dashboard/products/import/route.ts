// app/api/dashboard/products/import/route.ts
// API handler for bulk product CSV import.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

interface ImportProductRow {
  name: string;
  description?: string;
  price: string;
  compareAtPrice?: string;
  categorySlug: string;
  tags?: string; // pipe-separated
  stockQuantity?: string;
  isActive?: string;
  isFeatured?: string;
  isOnSale?: string;
  imageUrl1?: string;
  imageUrl2?: string;
  imageUrl3?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "STORE_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { products }: { products: ImportProductRow[] } = await request.json();

    if (!Array.isArray(products)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    const categories = await prisma.category.findMany({
      select: { id: true, slug: true }
    });
    const categoryMap = new Map(categories.map(c => [c.slug, c.id]));

    let imported = 0;
    let skipped = 0;
    const errors: { row: number; reason: string }[] = [];

    // Process rows
    for (let i = 0; i < products.length; i++) {
      const row = products[i];
      const rowNum = i + 1;

      // Basic Validation
      if (!row.name || !row.price || !row.categorySlug) {
        errors.push({ row: rowNum, reason: "Missing required fields (name, price, or categorySlug)" });
        skipped++;
        continue;
      }

      const price = parseFloat(row.price);
      if (isNaN(price) || price < 0) {
        errors.push({ row: rowNum, reason: "Invalid price" });
        skipped++;
        continue;
      }

      const categoryId = categoryMap.get(row.categorySlug);
      if (!categoryId) {
        errors.push({ row: rowNum, reason: `Category slug '${row.categorySlug}' not found` });
        skipped++;
        continue;
      }

      try {
        // Generate Slug and ensure uniqueness
        let slug = slugify(row.name);
        const existing = await prisma.product.findUnique({ where: { slug } });
        if (existing) {
          slug = `${slug}-${Math.floor(Math.random() * 10000)}`;
        }

        // Create product with images
        const tags = row.tags ? row.tags.split("|").map(t => t.trim()).filter(Boolean) : [];
        const imageUrls = [row.imageUrl1, row.imageUrl2, row.imageUrl3].filter(Boolean) as string[];

        await prisma.product.create({
          data: {
            name: row.name,
            slug,
            description: row.description,
            price,
            compareAtPrice: row.compareAtPrice ? parseFloat(row.compareAtPrice) : null,
            categoryId,
            tags,
            stockQuantity: row.stockQuantity ? parseInt(row.stockQuantity, 10) : 0,
            isActive: row.isActive?.toLowerCase() === "true",
            isFeatured: row.isFeatured?.toLowerCase() === "true",
            isOnSale: row.isOnSale?.toLowerCase() === "true",
            images: {
              create: imageUrls.map((url, idx) => ({
                url,
                sortOrder: idx
              }))
            }
          }
        });

        imported++;
      } catch (err: unknown) {
        console.error(`Error importing row ${rowNum}:`, err);
        errors.push({ row: rowNum, reason: "Database error during creation" });
        skipped++;
      }
    }

    return NextResponse.json({
      imported,
      skipped,
      errors
    });

  } catch (error: unknown) {
    console.error("[POST /api/dashboard/products/import]", error);
    return NextResponse.json({ error: "Failed to process import" }, { status: 500 });
  }
}
