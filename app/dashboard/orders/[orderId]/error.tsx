// app/dashboard/orders/[orderId]/error.tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function OrderDetailError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-muted/30 p-8 text-center">
      <div className="mb-4 rounded-full bg-destructive/10 p-4 text-destructive">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">Order not found</h2>
      <p className="mt-2 mb-6 text-muted-foreground max-w-md">
        The order you are looking for does not exist or you don't have permission to view it.
      </p>
      <Link href="/dashboard/orders">
        <Button className="rounded-full gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Button>
      </Link>
    </div>
  );
}
