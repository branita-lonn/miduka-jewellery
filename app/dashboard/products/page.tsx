// app/dashboard/products/page.tsx
// Products dashboard page

import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProductsClient } from "@/components/dashboard/products-client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { computeCompleteness } from "@/lib/product-completeness";
import { ProductWithRelations } from "@/types";

export const metadata: Metadata = {
  title: "Products | MiDuka",
  description: "Manage product catalogue",
};

export default async function ProductsPage() {
  const session = await auth();
  
  if (!session || session.user.role !== "STORE_OWNER") {
    redirect("/auth/login");
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
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    variants: product.variants.map((v) => ({
      ...v,
      priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
    })),
    completenessScore: computeCompleteness(product as ProductWithRelations),
  }));

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <ProductsClient initialProducts={productsWithScore} />
    </div>
  );
}
