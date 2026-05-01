/**
 * file: components/dashboard/ai-description-button.tsx
 * purpose: Button component to trigger AI product description generation
 */

"use client";

import React, { useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface AiDescriptionButtonProps {
  formData: {
    name: string;
    categoryId: string | null | undefined;
    tags: string[];
    variants: any[];
    price: number;
    compareAtPrice?: number | null;
    isOnSale: boolean;
  };
  onGenerated: (description: string) => void;
  disabled?: boolean;
}

export function AiDescriptionButton({ formData, onGenerated, disabled }: AiDescriptionButtonProps) {
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Requirement: Disabled until name and category are present
  const isFieldsMissing = !formData.name || !formData.categoryId || formData.categoryId === "none";

  const handleGenerate = async () => {
    if (isFieldsMissing) return;

    try {
      setLoading(true);
      const response = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to generate description");
      }

      const data = await response.json();
      onGenerated(data.description);
      setHasGenerated(true);
      toast.success("AI description generated!");
    } catch (error: unknown) {
      console.error("[AI_DESCRIPTION_CLIENT_ERROR]", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate AI description");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1 items-end">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/40"
        onClick={handleGenerate}
        disabled={loading || disabled || isFieldsMissing}
        title={isFieldsMissing ? "Fill in product name and category to unlock AI" : "Generate description with AI"}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Wand2 className="h-4 w-4" />
        )}
        Generate with AI
      </Button>
      {isFieldsMissing && (
        <span className="text-[10px] text-muted-foreground italic">
          Fill in product name and category to unlock AI
        </span>
      )}
      {hasGenerated && !loading && (
        <span className="text-[10px] text-muted-foreground italic">
          AI suggestion ready — edit freely before saving.
        </span>
      )}
    </div>
  );
}
