// app/api/dashboard/coupons/route.ts
// API route to list and create coupons.
// STORE_OWNER only.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session || session.user?.role !== UserRole.STORE_OWNER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(coupons);
  } catch (error: unknown) {
    console.error("[GET /api/dashboard/coupons]", error);
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session || session.user?.role !== UserRole.STORE_OWNER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      code, 
      type, 
      value, 
      minimumOrderAmount, 
      maxUses, 
      maxUsesPerCustomer, 
      expiresAt, 
      isActive 
    } = body;

    if (!code || !type || value === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        type,
        value,
        minimumOrderAmount: minimumOrderAmount ? parseFloat(minimumOrderAmount) : null,
        maxUses: maxUses ? parseInt(maxUses) : null,
        maxUsesPerCustomer: maxUsesPerCustomer ? parseInt(maxUsesPerCustomer) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(coupon);
  } catch (error: unknown) {
    console.error("[POST /api/dashboard/coupons]", error);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}
