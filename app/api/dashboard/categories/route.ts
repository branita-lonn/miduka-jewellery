// app/api/dashboard/categories/route.ts
// API route for fetching and creating categories

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/generate-slug";

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "STORE_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json(categories);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`[CATEGORIES_GET] ${error.message}`);
    } else {
      console.error(`[CATEGORIES_GET] Unknown error`);
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "STORE_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, imageUrl, parentId, sortOrder } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const slug = await generateUniqueSlug(name, async (currentSlug) => {
      const existing = await prisma.category.findUnique({
        where: { slug: currentSlug },
      });
      return !!existing;
    });

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        imageUrl,
        parentId: parentId || null,
        sortOrder: sortOrder || 0,
        isActive: true,
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
      console.error(`[CATEGORIES_POST] ${error.message}`);
    } else {
      console.error(`[CATEGORIES_POST] Unknown error`);
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
