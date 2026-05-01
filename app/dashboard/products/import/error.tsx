// app/dashboard/products/import/error.tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

export default function Error({
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
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 p-8 bg-destructive/5 rounded-3xl border border-destructive/20">
      <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold">Import Error</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Something went wrong while loading the import page.
        </p>
      </div>
      <Button onClick={() => reset()} className="rounded-xl">
        <RefreshCcw className="mr-2 h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}
