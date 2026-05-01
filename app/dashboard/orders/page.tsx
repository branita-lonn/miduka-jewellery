// app/dashboard/orders/page.tsx
// Order management dashboard page.

import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { OrderList } from "@/components/dashboard/orders/order-list";
import { OrderStatus, PaymentStatus } from "@prisma/client";

interface OrdersPageProps {
  searchParams: Promise<{
    page?: string;
    status?: string | string[];
    paymentStatus?: string;
    fromDate?: string;
    toDate?: string;
    q?: string;
  }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;
  
  const page = parseInt(params.page || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  const status = typeof params.status === 'string' ? [params.status] : params.status || [];
  const paymentStatus = params.paymentStatus as PaymentStatus | undefined;
  const fromDate = params.fromDate;
  const toDate = params.toDate;
  const q = params.q;

  const where: any = {};

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

  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { guestEmail: { contains: q, mode: "insensitive" } },
      { guestName: { contains: q, mode: "insensitive" } },
      { 
        customer: { 
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } }
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">Manage and track your store's orders.</p>
      </div>

      <OrderList 
        initialOrders={JSON.parse(JSON.stringify(orders))} 
        pagination={{
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          currentPage: page,
          limit
        }}
      />
    </div>
  );
}
