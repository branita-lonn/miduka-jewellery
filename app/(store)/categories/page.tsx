// app/(store)/categories/page.tsx
// All active top-level categories grid — /categories

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Grid2X2 } from "lucide-react";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shop by Category | MiDuka",
  description: "Browse all product categories in our store.",
};

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="container mx-auto px-4 py-10 flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Shop by Category</h1>
        <p className="text-muted-foreground mt-1">
          {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Grid2X2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-semibold">No categories yet</p>
          <p className="text-sm text-muted-foreground">Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {categories.map((cat, index) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              id={`category-${cat.slug}`}
              className="group flex flex-col items-center gap-3 rounded-4xl bg-card border border-border/40 p-5 hover:border-primary/20 hover:shadow-lg transition-all duration-300 text-center overflow-hidden"
            >
              <div className="relative w-20 h-20 rounded-3xl overflow-hidden bg-muted flex-shrink-0">
                {cat.imageUrl ? (
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    sizes="80px"
                    priority={index < 4}
                    {...(cat.imageBlurDataUrl ? { placeholder: "blur", blurDataURL: cat.imageBlurDataUrl } : {})}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground line-clamp-1">{cat.name}</p>
                {/* <p className="text-xs text-muted-foreground mt-0.5">
                  {cat._count.products} item{cat._count.products !== 1 ? "s" : ""}
                </p> */}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
