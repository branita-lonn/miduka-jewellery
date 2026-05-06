// app/api/dashboard/coupons/[id]/route.ts
// API route to update and delete individual coupons.
// STORE_OWNER only.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session || session.user?.role !== UserRole.STORE_OWNER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
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

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        code: code?.toUpperCase(),
        type,
        value,
        minimumOrderAmount: minimumOrderAmount !== undefined ? (minimumOrderAmount ? parseFloat(minimumOrderAmount) : null) : undefined,
        maxUses: maxUses !== undefined ? (maxUses ? parseInt(maxUses) : null) : undefined,
        maxUsesPerCustomer: maxUsesPerCustomer !== undefined ? (maxUsesPerCustomer ? parseInt(maxUsesPerCustomer) : null) : undefined,
        expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : undefined,
        isActive,
      },
    });

    return NextResponse.json(coupon);
  } catch (error: unknown) {
    console.error("[PUT /api/dashboard/coupons/[id]]", error);
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session || session.user?.role !== UserRole.STORE_OWNER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[DELETE /api/dashboard/coupons/[id]]", error);
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
