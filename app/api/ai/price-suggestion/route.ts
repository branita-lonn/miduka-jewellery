/**
 * file: app/api/ai/price-suggestion/route.ts
 * purpose: AI-powered price suggestions for sellers based on store data or market estimates
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateText } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();

    // Check authorization: STORE_OWNER only
    if (!session || session.user?.role !== "STORE_OWNER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, categoryId, variants } = body;

    if (!categoryId || categoryId === "none") {
      return new NextResponse("Category is required for price suggestions", { status: 400 });
    }

    // 1. Check store data first (priority)
    const categoryProducts = await prisma.product.findMany({
      where: { categoryId, isActive: true },
      select: { price: true },
    });

    if (categoryProducts.length >= 3) {
      const prices = categoryProducts.map(p => Number(p.price));
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

      return NextResponse.json({
        min,
        max,
        avg,
        source: "store_data",
        message: `Similar products in your store sell for KES ${min.toLocaleString()} – KES ${max.toLocaleString()}`,
      });
    }

    // 2. Fallback to AI estimate if store data is insufficient
    const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { name: true }
    });
    
    const categoryName = category?.name || "General";

    const prompt = `
      Provide a rough Kenyan market price range (in KES) for a product with the following details:
      - Name: ${name || "Unknown Product"}
      - Category: ${categoryName}
      ${variants ? `- Variants: ${JSON.stringify(variants.map((v: any) => ({ size: v.size, colour: v.colour })))}` : ""}

      Respond with ONLY a JSON object: { "min": number, "max": number, "reasoning": string }.
      The reasoning should be a brief 1-sentence explanation of why this range is suggested for the Kenyan market.
      Example: { "min": 1500, "max": 2500, "reasoning": "Standard pricing for cotton t-shirts in local boutique stores." }
    `;

    const aiResponse = await generateText(prompt, 300);
    const cleanJson = aiResponse.replace(/```json|```/g, "").trim();
    const estimate = JSON.parse(cleanJson);

    return NextResponse.json({
      min: estimate.min,
      max: estimate.max,
      source: "ai_estimate",
      reasoning: estimate.reasoning,
      message: `Market estimate: KES ${estimate.min.toLocaleString()} – KES ${estimate.max.toLocaleString()}`,
    });
  } catch (error) {
    console.error("[PRICE_SUGGESTION_ERROR]", error);
    // Fail silently in the UI, but log on server
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
