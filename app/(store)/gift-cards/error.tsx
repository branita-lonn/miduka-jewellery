// app/(store)/gift-cards/error.tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function GiftCardsError({
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
    <div className="container max-w-4xl mx-auto px-4 py-32 flex flex-col items-center text-center gap-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-10 w-10 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <p className="text-muted-foreground">
          We couldn't load the gift card page. This might be a temporary connection issue.
        </p>
      </div>
      <Button onClick={() => reset()} variant="outline" className="rounded-full gap-2 px-8">
        <RotateCcw className="h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}
