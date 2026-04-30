// types/index.ts
// Shared TypeScript interfaces for MiDuka

import { Prisma } from "@prisma/client";

// Define the exact payload shapes based on Prisma includes
export const categoryWithRelations = Prisma.validator<Prisma.CategoryDefaultArgs>()({
  include: {
    parent: true,
    children: true,
    _count: {
      select: { products: true },
    },
  },
});

export type CategoryWithRelations = Prisma.CategoryGetPayload<typeof categoryWithRelations>;

export const productWithRelations = Prisma.validator<Prisma.ProductDefaultArgs>()({
  include: {
    category: true,
    images: true,
    variants: true,
  },
});

export type ProductWithRelations = Prisma.ProductGetPayload<typeof productWithRelations> & {
  completenessScore?: number;
};

export type ProductWithRelationsSerialized = Omit<ProductWithRelations, "price" | "compareAtPrice" | "variants"> & {
  price: number;
  compareAtPrice: number | null;
  variants: (Omit<ProductWithRelations["variants"][number], "priceOverride"> & {
    priceOverride: number | null;
  })[];
};

export interface VariantInput {
  id?: string;
  colour?: string;
  size?: string;
  material?: string;
  priceOverride?: number;
  stockQuantity: number;
  sku?: string;
  isActive: boolean;
}

// Ensure the form values type can be inferred or exported if needed
// This will be expanded when we create the Zod schema
export interface ProductFormValues {
  name: string;
  categoryId?: string;
  price: number;
  compareAtPrice?: number;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  description?: string;
  stockQuantity: number;
  images: string[];
  variants: VariantInput[];
}
