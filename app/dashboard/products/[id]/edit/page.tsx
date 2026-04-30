// app/dashboard/products/[id]/edit/page.tsx
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { EditProductForm } from "@/components/dashboard/edit-product-form";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Edit Product | MiDuka",
  description: "Edit an existing product",
};

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  
  if (!session || session.user.role !== "STORE_OWNER") {
    redirect("/auth/login");
  }

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: "asc" },
        },
        variants: true,
      },
    }),
    prisma.category.findMany({
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
    }),
  ]);

  if (!product) {
    notFound();
  }

  const serializedProduct = product ? {
    ...product,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    variants: product.variants.map((v) => ({
      ...v,
      priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
    })),
  } : null;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edit Product</h2>
          <p className="text-muted-foreground">Update the details for this product.</p>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-6">
        <EditProductForm initialData={serializedProduct} categories={categories} />
      </div>
    </div>
  );
}
