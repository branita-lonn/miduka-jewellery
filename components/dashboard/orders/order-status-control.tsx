// components/dashboard/orders/order-status-control.tsx
// Client component for updating order status and printing receipts.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";
import { OrderStatus } from "@prisma/client";
import { toast } from "sonner";

interface OrderStatusControlProps {
  orderId: string;
  initialStatus: OrderStatus;
}

export function OrderStatusControl({ orderId, initialStatus }: OrderStatusControlProps) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStatusChange = async (newStatus: OrderStatus) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      setStatus(newStatus);
      toast.success(`Order status updated to ${newStatus.replace("_", " ")}`);
      router.refresh();
    } catch (error) {
      toast.error("Could not update order status");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex gap-3 print:hidden">
      <Button 
        variant="outline" 
        className="rounded-full gap-2 border-border/50 bg-background/50 hover:bg-muted"
        onClick={handlePrint}
      >
        <Printer className="h-4 w-4" />
        Print Receipt
      </Button>

      <Select 
        value={status} 
        onValueChange={(val) => handleStatusChange(val as OrderStatus)}
        disabled={loading}
      >
        <SelectTrigger className="w-[180px] rounded-full border-primary/20 bg-primary/5 font-semibold text-primary">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          <SelectValue placeholder="Update Status" />
        </SelectTrigger>
        <SelectContent className="rounded-2xl">
          {Object.values(OrderStatus).map((s) => (
            <SelectItem key={s} value={s} className="rounded-xl">
              {s.replace("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
