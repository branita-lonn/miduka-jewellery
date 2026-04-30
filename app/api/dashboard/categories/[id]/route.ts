// app/api/dashboard/categories/[id]/route.ts
// API route for updating and deleting a single category

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/generate-slug";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: categoryId } = await params;
    const session = await auth();

    if (!session || session.user.role !== "STORE_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { name, description, imageUrl, parentId, sortOrder, isActive, slug: providedSlug } = body;

    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    let updatedSlug = existingCategory.slug;

    // Check if user manually provided a slug, else check name change
    if (providedSlug && providedSlug !== existingCategory.slug) {
      const exists = await prisma.category.findUnique({ where: { slug: providedSlug } });
      if (exists && exists.id !== categoryId) {
        return NextResponse.json({ error: "Slug is already taken" }, { status: 400 });
      }
      updatedSlug = providedSlug;
    } else if (name && name !== existingCategory.name) {
      updatedSlug = await generateUniqueSlug(name, async (currentSlug) => {
        const existing = await prisma.category.findUnique({
          where: { slug: currentSlug },
        });
        return !!existing && existing.id !== categoryId;
      });
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name,
        slug: updatedSlug,
        description,
        imageUrl,
        parentId: parentId || null,
        sortOrder: sortOrder || 0,
        isActive: isActive !== undefined ? isActive : existingCategory.isActive,
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json(category);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`[CATEGORY_PUT] ${error.message}`);
    } else {
      console.error(`[CATEGORY_PUT] Unknown error`);
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: categoryId } = await params;
    const session = await auth();

    if (!session || session.user.role !== "STORE_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (existingCategory._count.products > 0) {
      return NextResponse.json(
        { error: "Cannot delete a category that has products. Reassign or delete the products first." },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`[CATEGORY_DELETE] ${error.message}`);
    } else {
      console.error(`[CATEGORY_DELETE] Unknown error`);
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
