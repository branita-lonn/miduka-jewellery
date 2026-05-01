// components/dashboard/orders/order-status-badge.tsx
// Color-coded badges for order and payment statuses.

import { Badge } from "@/components/ui/badge";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

interface OrderStatusBadgeProps {
  status: OrderStatus | PaymentStatus;
  type: "order" | "payment";
}

const orderStatusMap: Record<OrderStatus, { label: string; className: string }> = {
  PLACED: { label: "Placed", className: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20" },
  CONFIRMED: { label: "Confirmed", className: "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20" },
  SHIPPED: { label: "Shipped", className: "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20" },
  DELIVERED: { label: "Delivered", className: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" },
  CANCELLED: { label: "Cancelled", className: "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20" },
};

const paymentStatusMap: Record<PaymentStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-slate-500/10 text-slate-500 hover:bg-slate-500/20" },
  PAID: { label: "Paid", className: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" },
  FAILED: { label: "Failed", className: "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20" },
  REFUNDED: { label: "Refunded", className: "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20" },
};

export function StatusBadge({ status, type }: OrderStatusBadgeProps) {
  const config = type === "order" 
    ? orderStatusMap[status as OrderStatus] 
    : paymentStatusMap[status as PaymentStatus];

  if (!config) return <Badge variant="outline">{status}</Badge>;

  return (
    <Badge 
      variant="outline" 
      className={cn("rounded-full border-none px-3 font-semibold", config.className)}
    >
      {config.label}
    </Badge>
  );
}
