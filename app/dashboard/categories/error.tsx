// app/dashboard/categories/error.tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function CategoriesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Categories Page Error:", error);
  }, [error]);

  return (
    <div className="flex h-[400px] flex-col items-center justify-center space-y-4 rounded-xl border border-dashed p-8 text-center animate-in fade-in-50">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Something went wrong!</h2>
        <p className="text-sm text-muted-foreground">
          {error.message || "Failed to load categories. Please try again."}
        </p>
      </div>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
