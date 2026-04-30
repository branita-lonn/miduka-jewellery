// app/dashboard/categories/page.tsx
// Categories dashboard page

import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CategoriesClient } from "./categories-client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Categories | MiDuka",
  description: "Manage product categories",
};

export default async function CategoriesPage() {
  const session = await auth();
  
  if (!session || session.user.role !== "STORE_OWNER") {
    redirect("/auth/login");
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

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <CategoriesClient initialCategories={categories} />
    </div>
  );
}
