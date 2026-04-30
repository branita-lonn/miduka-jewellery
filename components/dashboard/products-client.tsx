// components/dashboard/products-client.tsx
// Client component for the products page

"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Edit, Search, Trash2 } from "lucide-react";
import { ProductWithRelationsSerialized } from "@/types";
import { InlineConfirmDelete } from "@/components/dashboard/inline-confirm-delete";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency, cn } from "@/lib/utils";

export function ProductsClient({ initialProducts }: { initialProducts: ProductWithRelationsSerialized[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  const filteredProducts = initialProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/dashboard/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      toast.success("Product status updated");
      router.refresh();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred");
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
      toast.success("Product deleted");
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      router.refresh();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred");
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsDeletingBulk(true);
    try {
      const promises = Array.from(selectedIds).map((id) =>
        fetch(`/api/dashboard/products/${id}`, { method: "DELETE" })
      );
      await Promise.all(promises);
      toast.success(`Deleted ${selectedIds.size} products`);
      setSelectedIds(new Set());
      router.refresh();
    } catch (error: unknown) {
      toast.error("Failed to delete some products");
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const getCompletenessTooltip = (p: ProductWithRelationsSerialized) => {
    const missing = [];
    if (!p.images || p.images.length === 0) missing.push("Add an image (+25pts)");
    else if (p.images.length < 3) missing.push("Add 3+ images (+10pts)");
    if (!p.description || p.description.length <= 50) missing.push("Write a longer description (+20pts)");
    if (!p.categoryId) missing.push("Assign a category (+15pts)");
    if ((!p.variants || p.variants.length === 0) && p.stockQuantity <= 0) missing.push("Add stock or variants (+15pts)");
    if (Number(p.price) <= 0) missing.push("Set a price (+10pts)");
    if (!p.tags || p.tags.length === 0) missing.push("Add tags (+5pts)");

    if (missing.length === 0) return "100% Complete!";
    return missing.join(" • ");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">Manage your product catalogue.</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete} disabled={isDeletingBulk}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected ({selectedIds.size})
            </Button>
          )}
          <Link href="/dashboard/products/new" className={cn(buttonVariants({ variant: "default" }))}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </div>
      </div>

      <div className="flex items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products by name..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={filteredProducts.length > 0 && selectedIds.size === filteredProducts.length}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Completeness</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => {
                const isSelected = selectedIds.has(product.id);
                const score = product.completenessScore || 0;
                
                let progressClass = "[&_[data-slot=progress-indicator]]:bg-red-500 dark:[&_[data-slot=progress-indicator]]:bg-red-600";
                let textColor = "text-red-600 dark:text-red-400";
                if (score > 40 && score <= 70) {
                  progressClass = "[&_[data-slot=progress-indicator]]:bg-amber-500 dark:[&_[data-slot=progress-indicator]]:bg-amber-600";
                  textColor = "text-amber-600 dark:text-amber-400";
                } else if (score > 70) {
                  progressClass = "[&_[data-slot=progress-indicator]]:bg-green-500 dark:[&_[data-slot=progress-indicator]]:bg-green-600";
                  textColor = "text-green-600 dark:text-green-400";
                }

                const totalStock = product.variants?.length > 0
                  ? product.variants.reduce((acc, v) => acc + v.stockQuantity, 0)
                  : product.stockQuantity;

                let stockIndicator = <Badge variant="outline" className="text-green-600 border-green-600 dark:text-green-400 dark:border-green-400">{totalStock} in stock</Badge>;
                if (totalStock === 0) {
                  stockIndicator = <Badge variant="destructive">Out of Stock</Badge>;
                } else if (totalStock <= 10) {
                  stockIndicator = <Badge variant="outline" className="text-amber-600 border-amber-600 dark:text-amber-400 dark:border-amber-400">Low Stock ({totalStock})</Badge>;
                }

                return (
                  <TableRow key={product.id} className={isSelected ? "bg-muted/50" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(product.id)}
                        aria-label={`Select ${product.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="h-12 w-12 rounded-xl border bg-muted overflow-hidden relative">
                        {product.images && product.images.length > 0 ? (
                          <Image src={product.images[0].url} alt={product.name} fill className="object-cover" sizes="48px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No img</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {product.category?.name || "Uncategorised"}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(Number(product.price))}</TableCell>
                    <TableCell>{stockIndicator}</TableCell>
                    <TableCell className="w-[150px]">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center gap-2 cursor-help">
                              <Progress value={score} className={cn("h-2 w-full", progressClass)} />
                              <span className={`text-xs font-medium ${textColor}`}>{score}%</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[200px] text-xs">
                            <p>{getCompletenessTooltip(product)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={product.isActive}
                        onCheckedChange={() => handleToggleActive(product.id, product.isActive)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/dashboard/products/${product.id}/edit`}
                          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                        <InlineConfirmDelete onDelete={() => handleDelete(product.id)} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
