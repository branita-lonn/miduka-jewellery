// app/dashboard/orders/error.tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

export default function OrdersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-muted/30 p-8 text-center">
      <div className="mb-4 rounded-full bg-destructive/10 p-4 text-destructive">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">Orders loading failed</h2>
      <p className="mt-2 mb-6 text-muted-foreground max-w-md">
        We could not load the order data. This might be due to a temporary database issue.
      </p>
      <div className="flex gap-4">
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          className="rounded-full"
        >
          Reload Page
        </Button>
        <Button 
          onClick={() => reset()}
          className="rounded-full gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
