// components/store/product-filters.tsx
// Client component — URL-param-driven filter sidebar / bottom sheet

"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { AttributeDefinitionPublic } from "@/types";

interface ProductFiltersProps {
  filterableAttributes: AttributeDefinitionPublic[];
  /** If set, category filter is locked to this slug (category page) */
  lockedCategory?: string;
  /** Whether to render desktop sidebar, mobile trigger, or both (default) */
  mode?: "desktop" | "mobile" | "both";
}

function FiltersContent({
  filterableAttributes,
  lockedCategory,
  onClose,
}: ProductFiltersProps & { onClose?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read current values
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [onSale, setOnSale] = useState(searchParams.get("onSale") === "true");
  const [inStock, setInStock] = useState(searchParams.get("inStock") === "true");

  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    filterableAttributes.forEach((def) => {
      const val = searchParams.get(`attr_${def.key}`);
      if (val) {
        initial[def.key] = val.split(",").filter(Boolean);
      }
    });
    return initial;
  });

  // Keep state synchronized with URL query params
  useEffect(() => {
    setMinPrice(searchParams.get("minPrice") ?? "");
    setMaxPrice(searchParams.get("maxPrice") ?? "");
    setOnSale(searchParams.get("onSale") === "true");
    setInStock(searchParams.get("inStock") === "true");

    const next: Record<string, string[]> = {};
    filterableAttributes.forEach((def) => {
      const val = searchParams.get(`attr_${def.key}`);
      if (val) {
        next[def.key] = val.split(",").filter(Boolean);
      }
    });
    setSelectedAttrs(next);
  }, [searchParams, filterableAttributes]);

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");

    if (minPrice) params.set("minPrice", minPrice); else params.delete("minPrice");
    if (maxPrice) params.set("maxPrice", maxPrice); else params.delete("maxPrice");
    if (onSale) params.set("onSale", "true"); else params.delete("onSale");
    if (inStock) params.set("inStock", "true"); else params.delete("inStock");
    if (lockedCategory) params.set("category", lockedCategory);

    // Apply dynamic attributes to URL params
    filterableAttributes.forEach((def) => {
      const values = selectedAttrs[def.key];
      if (values && values.length > 0) {
        params.set(`attr_${def.key}`, values.join(","));
      } else {
        params.delete(`attr_${def.key}`);
      }
    });

    router.push(`${pathname}?${params.toString()}`);
    onClose?.();
  }, [minPrice, maxPrice, onSale, inStock, selectedAttrs, filterableAttributes, router, pathname, searchParams, lockedCategory, onClose]);

  function clearAll() {
    const params = new URLSearchParams();
    if (lockedCategory) params.set("category", lockedCategory);

    // Reset local states
    setMinPrice("");
    setMaxPrice("");
    setOnSale(false);
    setInStock(false);
    setSelectedAttrs({});

    router.push(`${pathname}?${params.toString()}`);
    onClose?.();
  }

  function toggleAttrValue(key: string, value: string) {
    setSelectedAttrs((prev) => {
      const current = prev[key] ?? [];
      const next = current.includes(value)
        ? current.filter((x) => x !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  }

  const hasDynamicFilters = Object.values(selectedAttrs).some((arr) => arr.length > 0);
  const hasFilters = minPrice || maxPrice || onSale || inStock || hasDynamicFilters;

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto pr-1">
      {/* Price Range */}
      <div className="flex flex-col gap-3">
        <h3 className="font-semibold text-sm text-foreground">Price (KES)</h3>
        <div className="flex items-center gap-2">
          <Input
            id="filter-min-price"
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="rounded-xl"
            min={0}
          />
          <span className="text-muted-foreground text-sm">–</span>
          <Input
            id="filter-max-price"
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="rounded-xl"
            min={0}
          />
        </div>
      </div>

      {/* Dynamic Attributes Filters */}
      {filterableAttributes.map((def) => {
        const selectedValues = selectedAttrs[def.key] ?? [];

        // Skip NUMBER fields in filters as range filter is handled separately
        if (def.inputType === "NUMBER") return null;

        return (
          <div key={def.id} className="flex flex-col gap-3">
            <h3 className="font-semibold text-sm text-foreground">{def.label}</h3>

            {/* COLOR attribute rendering as swatches */}
            {def.inputType === "COLOR" && (
              <div className="flex flex-wrap gap-2">
                {def.allowedValues.map((value) => {
                  const isSelected = selectedValues.includes(value);
                  const hasColor = value.trim() !== "";
                  return (
                    <button
                      key={value}
                      id={`filter-attr-${def.key}-${value}`}
                      onClick={() => toggleAttrValue(def.key, value)}
                      title={value || "Unset colour"}
                      aria-label={`Filter by ${def.label} ${value}`}
                      aria-pressed={isSelected}
                      className={cn(
                        "h-8 w-8 rounded-full border-2 transition-all",
                        isSelected
                          ? "border-primary ring-2 ring-primary ring-offset-2"
                          : "border-border hover:scale-105",
                        !hasColor && "bg-muted"
                      )}
                      style={hasColor ? { backgroundColor: value } : undefined}
                    />
                  );
                })}
              </div>
            )}

            {/* BOOLEAN attribute rendering as pills */}
            {def.inputType === "BOOLEAN" && (
              <div className="flex flex-wrap gap-2">
                {["true", "false"].map((value) => {
                  const isSelected = selectedValues.includes(value);
                  const displayLabel = value === "true" ? "Yes" : "No";
                  return (
                    <button
                      key={value}
                      id={`filter-attr-${def.key}-${value}`}
                      onClick={() => toggleAttrValue(def.key, value)}
                      aria-pressed={isSelected}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-sm border font-medium transition-all",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-foreground hover:border-primary/50"
                      )}
                    >
                      {displayLabel}
                    </button>
                  );
                })}
              </div>
            )}

            {/* TEXT / SELECT: rendered as checkbox list */}
            {(def.inputType === "TEXT" || def.inputType === "SELECT") && (
              <div className="flex flex-col gap-2 pl-1">
                {def.allowedValues.map((value) => {
                  const isSelected = selectedValues.includes(value);
                  return (
                    <div key={value} className="flex items-center gap-2">
                      <Checkbox
                        id={`filter-attr-${def.key}-${value}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleAttrValue(def.key, value)}
                      />
                      <Label
                        htmlFor={`filter-attr-${def.key}-${value}`}
                        className="cursor-pointer text-sm font-medium opacity-80 hover:opacity-100"
                      >
                        {value}
                      </Label>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Toggles */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="filter-on-sale"
            checked={onSale}
            onCheckedChange={(v) => setOnSale(Boolean(v))}
          />
          <Label htmlFor="filter-on-sale" className="cursor-pointer">On Sale</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="filter-in-stock"
            checked={inStock}
            onCheckedChange={(v) => setInStock(Boolean(v))}
          />
          <Label htmlFor="filter-in-stock" className="cursor-pointer">In Stock Only</Label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-4">
        <Button onClick={applyFilters} className="flex-1 rounded-full">
          Apply Filters
        </Button>
        {hasFilters && (
          <Button variant="outline" onClick={clearAll} className="rounded-full px-4">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function ProductFilters({ mode = "both", ...props }: ProductFiltersProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const showDesktop = mode === "desktop" || mode === "both";
  const showMobile = mode === "mobile" || mode === "both";

  return (
    <>
      {/* Desktop sidebar */}
      {showDesktop && (
        <aside className="hidden md:flex flex-col w-56 flex-shrink-0 gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Filters</h2>
          </div>
          <FiltersContent {...props} />
        </aside>
      )}

      {/* Mobile sheet trigger */}
      {showMobile && (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger render={<Button variant="outline" className="md:hidden rounded-full gap-2" id="mobile-filter-btn" />}>
            <Filter className="h-4 w-4" />
            Filters
          </SheetTrigger>
          <SheetContent side="left" className="w-80 flex flex-col gap-6 pt-8">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <FiltersContent {...props} onClose={() => setSheetOpen(false)} />
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
