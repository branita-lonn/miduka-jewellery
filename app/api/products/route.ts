// app/api/products/route.ts
// GET /api/products — public product search with filters, sort, and pagination

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { ProductPublic, ProductsApiResponse } from "@/types";
import { generateText } from "@/lib/ai";
import { getStoreSettings } from "@/lib/store-settings-cache";
import { getVerticalConfig } from "@/lib/store-vertical";
import { computeVariantLabel } from "@/lib/variant-label";

export const dynamic = "force-dynamic";

const SORT_MAP: Record<string, Prisma.ProductOrderByWithRelationInput> = {
  newest: { createdAt: "desc" },
  price_asc: { price: "asc" },
  price_desc: { price: "desc" },
  best_selling: { createdAt: "desc" },  // placeholder until orders exist
  most_reviewed: { reviews: { _count: "desc" } },
};

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const sp = req.nextUrl.searchParams;

    const q = sp.get("q")?.trim() ?? "";
    const category = sp.get("category") ?? "";
    const minPrice = sp.get("minPrice") ? parseFloat(sp.get("minPrice")!) : undefined;
    const maxPrice = sp.get("maxPrice") ? parseFloat(sp.get("maxPrice")!) : undefined;
    const onSale = sp.get("onSale") === "true";
    const inStock = sp.get("inStock") === "true";
    const sort = sp.get("sort") ?? "newest";
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
    const limit = Math.min(40, Math.max(1, parseInt(sp.get("limit") ?? "20", 10)));

    // Parse attribute filters: ?attr_colour=Silver,Gold&attr_size=M,L&attr_ram=8GB
    const attrFilters: { key: string; values: string[] }[] = [];
    for (const [param, val] of sp.entries()) {
      if (param.startsWith("attr_") && val) {
        const key = param.slice(5); // strip "attr_" prefix
        const values = val.split(",").map((v) => v.trim()).filter(Boolean);
        if (values.length > 0) attrFilters.push({ key, values });
      }
    }

    let categorySlugs: string[] = [];
    if (category) {
      const cat = await prisma.category.findUnique({
        where: { slug: category },
        include: {
          children: {
            select: { slug: true, children: { select: { slug: true } } }
          }
        }
      });
      if (cat) {
        categorySlugs.push(category);
        cat.children.forEach(child => {
          categorySlugs.push(child.slug);
          child.children.forEach(grandchild => {
            categorySlugs.push(grandchild.slug);
          });
        });
      } else {
        categorySlugs.push(category);
      }
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      SORT_MAP[sort] ?? SORT_MAP.newest;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { tags: { has: q } },
        ],
      }),
      ...(categorySlugs.length > 0 && { category: { slug: { in: categorySlugs } } }),
      ...(minPrice !== undefined && { price: { gte: minPrice } }),
      ...(maxPrice !== undefined && {
        price: minPrice !== undefined ? { gte: minPrice, lte: maxPrice } : { lte: maxPrice },
      }),
      ...(attrFilters.length > 0 && {
        variants: {
          some: {
            isActive: true,
            AND: attrFilters.map(({ key, values }) => ({
              attributes: {
                some: {
                  attributeDefinition: { key },
                  value: { in: values },
                },
              },
            })),
          },
        },
      }),
      ...(onSale && { isOnSale: true }),
      ...(inStock && { stockQuantity: { gt: 0 } }),
    };

    const include = {
      category: { select: { id: true, name: true, slug: true } },
      images: {
        select: {
          id: true,
          url: true,
          altText: true,
          sortOrder: true,
          blurDataUrl: true,
          createdAt: true,
          variantLinks: {
            select: { variantId: true },
          },
        },
        orderBy: { sortOrder: "asc" } as const,
      },
      variants: {
        where: { isActive: true },
        include: {
          attributes: {
            include: { attributeDefinition: true },
          },
        },
      },
      reviews: {
        select: {
          rating: true,
        },
      },
      flashSale: true,
    };

    let [total, rawProducts] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include,
      }),
    ]);

    let expandedFrom: string | null = null;

    // Smart Expansion: If no results and there was a query, try expanding the search
    if (total === 0 && q) {
      try {
        const { storeVertical } = await getStoreSettings();
        const verticalConfig = getVerticalConfig(storeVertical);

        const expansionPrompt =
          `Expand the search term "${q}" into semantically similar alternatives ` +
          `for a ${verticalConfig.searchExpansionContext}. ` +
          `Respond with ONLY a JSON array of strings — no explanation, no markdown fences. ` +
          `Example: "blue dress" → ["navy dress", "cobalt dress", "royal blue dress"]`;

        const expansionJson = await generateText(expansionPrompt, 200);

        // Clean up possible markdown wrappers if AI didn't follow "ONLY JSON" instruction
        let cleanJson = expansionJson.replace(/```json|```/g, "").trim();
        const startIdx = cleanJson.indexOf('[');
        const endIdx = cleanJson.lastIndexOf(']');
        if (startIdx !== -1 && endIdx !== -1 && startIdx <= endIdx) {
          cleanJson = cleanJson.substring(startIdx, endIdx + 1);
        }
        const expandedTerms: string[] = JSON.parse(cleanJson);

        if (Array.isArray(expandedTerms) && expandedTerms.length > 0) {
          const expandedWhere: Prisma.ProductWhereInput = {
            ...where,
            OR: expandedTerms.map(term => ({
              OR: [
                { name: { contains: term, mode: "insensitive" } },
                { description: { contains: term, mode: "insensitive" } },
                { tags: { has: term } },
              ]
            }))
          };

          const [expTotal, expRawProducts] = await Promise.all([
            prisma.product.count({ where: expandedWhere }),
            prisma.product.findMany({
              where: expandedWhere,
              orderBy,
              skip: (page - 1) * limit,
              take: limit,
              include,
            }),
          ]);

          if (expTotal > 0) {
            total = expTotal;
            rawProducts = expRawProducts;
            expandedFrom = q;
          }
        }
      } catch (e) {
        console.error("[SEARCH_EXPANSION_ERROR]", e);
        // Fallback: return original empty results
      }
    }

    const products: ProductPublic[] = rawProducts.map((p) => {
      const formattedVariants = p.variants.map((v) => {
        const attrs = v.attributes.map((a) => ({
          attributeDefinitionId: a.attributeDefinitionId,
          key: a.attributeDefinition.key,
          label: a.attributeDefinition.label,
          unit: a.attributeDefinition.unit,
          inputType: a.attributeDefinition.inputType,
          value: a.value,
        }));
        return {
          id: v.id,
          priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
          stockQuantity: v.stockQuantity,
          sku: v.sku,
          isActive: v.isActive,
          attributes: attrs,
          label: computeVariantLabel(attrs),
        };
      });

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: Number(p.price),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        tags: p.tags,
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        isOnSale: p.isOnSale,
        stockQuantity: p.variants && p.variants.length > 0
          ? p.variants.reduce((sum, v) => sum + v.stockQuantity, 0)
          : p.stockQuantity,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        categoryId: p.categoryId,
        category: p.category,
        images: p.images.map((img) => ({
          id: img.id,
          url: img.url,
          blurDataUrl: img.blurDataUrl,
          altText: img.altText,
          sortOrder: img.sortOrder,
          createdAt: img.createdAt.toISOString(),
          variantIds: img.variantLinks.map((vl) => vl.variantId),
        })),
        variants: formattedVariants,
        reviewCount: p.reviews.length,
        rating: p.reviews.length > 0
          ? p.reviews.reduce((acc, r) => acc + r.rating, 0) / p.reviews.length
          : 0,
        flashSale: p.flashSale ? {
          id: p.flashSale.id,
          salePrice: Number(p.flashSale.salePrice),
          startTime: p.flashSale.startTime.toISOString(),
          endTime: p.flashSale.endTime.toISOString(),
        } : null,
      };
    });

    const response: ProductsApiResponse = {
      products,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      expandedFrom,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
