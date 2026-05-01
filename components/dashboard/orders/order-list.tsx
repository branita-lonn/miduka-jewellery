// components/dashboard/orders/order-list.tsx
// Client component for order management table with filtering and export.

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { 
  Search, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical,
  ExternalLink,
  Printer
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { StatusBadge } from "./status-badge";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { OrderStatus, PaymentStatus } from "@prisma/client";

interface OrderListProps {
  initialOrders: any[];
  pagination: {
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
  };
}

export function OrderList({ initialOrders, pagination }: OrderListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") || "");

  const updateFilters = (newParams: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) nextParams.set(key, value);
      else nextParams.delete(key);
    });
    nextParams.set("page", "1"); // Reset to page 1 on filter change
    router.push(`?${nextParams.toString()}`);
  };

  const exportToCSV = () => {
    const headers = ["Order Number", "Customer", "Email", "Date", "Items", "Total", "Status", "Payment"];
    const rows = initialOrders.map(order => [
      order.orderNumber,
      order.customer?.name || order.guestName || "Guest",
      order.customer?.email || order.guestEmail,
      format(new Date(order.createdAt), "yyyy-MM-dd HH:mm"),
      order.items.length,
      order.total,
      order.status,
      order.paymentStatus
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `orders-export-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center gap-4 bg-card/50 p-4 rounded-3xl border border-border/50">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search orders, customers..." 
            className="pl-9 rounded-2xl border-border/50 bg-background/50"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && updateFilters({ q })}
          />
        </div>

        <Select 
          value={searchParams.get("status") || "ALL"} 
          onValueChange={(val) => updateFilters({ status: val === "ALL" ? null : val })}
        >
          <SelectTrigger className="w-[160px] rounded-2xl border-border/50 bg-background/50">
            <SelectValue placeholder="Order Status" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            <SelectItem value="ALL">All Statuses</SelectItem>
            {Object.values(OrderStatus).map(status => (
              <SelectItem key={status} value={status}>{status.replace("_", " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={searchParams.get("paymentStatus") || "ALL"} 
          onValueChange={(val) => updateFilters({ paymentStatus: val === "ALL" ? null : val })}
        >
          <SelectTrigger className="w-[160px] rounded-2xl border-border/50 bg-background/50">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            <SelectItem value="ALL">All Payments</SelectItem>
            {Object.values(PaymentStatus).map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          variant="outline" 
          className="rounded-2xl border-border/50 bg-background/50 gap-2"
          onClick={exportToCSV}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Orders Table */}
      <div className="rounded-3xl border border-border/50 bg-card/50 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No orders found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              initialOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="font-mono text-xs font-bold">{order.orderNumber}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{order.customer?.name || order.guestName || "Guest"}</span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                        {order.customer?.email || order.guestEmail}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(order.createdAt), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(Number(order.total))}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.paymentStatus} type="payment" />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} type="order" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/orders/${order.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{(pagination.currentPage - 1) * pagination.limit + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min(pagination.currentPage * pagination.limit, pagination.total)}
            </span>{" "}
            of <span className="font-medium">{pagination.total}</span> orders
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage === 1}
              onClick={() => router.push(`?page=${pagination.currentPage - 1}`)}
              className="rounded-xl"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage === pagination.pages}
              onClick={() => router.push(`?page=${pagination.currentPage + 1}`)}
              className="rounded-xl"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
