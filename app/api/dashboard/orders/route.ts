// app/api/dashboard/orders/route.ts
// Orders API — list all orders with filters and pagination.
// STORE_OWNER only.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole, OrderStatus, PaymentStatus, Prisma } from "@prisma/client";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session || session.user?.role !== UserRole.STORE_OWNER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const skip = (page - 1) * limit;

    // Filters
    const status = searchParams.getAll("status") as OrderStatus[];
    const paymentStatus = searchParams.get("paymentStatus") as PaymentStatus | null;
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const query = searchParams.get("q");

    const where: Prisma.OrderWhereInput = {};

    if (status.length > 0) {
      where.status = { in: status };
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    if (query) {
      where.OR = [
        { orderNumber: { contains: query, mode: "insensitive" } },
        { guestEmail: { contains: query, mode: "insensitive" } },
        { guestName: { contains: query, mode: "insensitive" } },
        { 
          customer: { 
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } }
            ]
          } 
        }
      ];
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: { select: { name: true, email: true } },
          items: { select: { quantity: true } }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.order.count({ where })
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error: unknown) {
    console.error("[GET /api/dashboard/orders]", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
