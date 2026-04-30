// components/dashboard/inline-confirm-delete.tsx
// Inline confirmation pattern for delete actions

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

interface InlineConfirmDeleteProps {
  onDelete: () => Promise<void>;
  loading?: boolean;
}

export function InlineConfirmDelete({ onDelete, loading = false }: InlineConfirmDeleteProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsConfirming(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (isConfirming) {
    return (
      <div ref={ref} className="flex items-center gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={async () => {
            await onDelete();
            setIsConfirming(false);
          }}
          disabled={loading}
          className="animate-in fade-in zoom-in duration-200"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <AlertTriangle className="h-4 w-4 mr-1" />}
          Confirm Delete?
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsConfirming(false)}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:text-destructive"
      onClick={() => setIsConfirming(true)}
      disabled={loading}
    >
      <Trash2 className="h-4 w-4" />
      <span className="sr-only">Delete</span>
    </Button>
  );
}
