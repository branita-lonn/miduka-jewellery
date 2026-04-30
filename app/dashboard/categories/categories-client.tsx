// app/dashboard/categories/categories-client.tsx
// Client component for the categories page

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Edit } from "lucide-react";
import { CategoryWithRelations } from "@/types";
import { CategoryForm } from "@/components/dashboard/category-form";
import { InlineConfirmDelete } from "@/components/dashboard/inline-confirm-delete";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function CategoriesClient({ initialCategories }: { initialCategories: CategoryWithRelations[] }) {
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithRelations | null>(null);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/categories/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete category");
      }

      toast.success("Category deleted");
      router.refresh();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete category");
      }
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/dashboard/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }
      
      toast.success("Category status updated");
      router.refresh();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update status");
      }
    }
  };

  const openCreateSheet = () => {
    setEditingCategory(null);
    setIsSheetOpen(true);
  };

  const openEditSheet = (category: CategoryWithRelations) => {
    setEditingCategory(category);
    setIsSheetOpen(true);
  };

  // Build hierarchical list
  const topLevelCategories = initialCategories.filter((c) => !c.parentId);
  const displayCategories: { category: CategoryWithRelations; level: number }[] = [];

  const addChildren = (parentId: string, level: number) => {
    const children = initialCategories.filter((c) => c.parentId === parentId);
    children.forEach((child) => {
      displayCategories.push({ category: child, level });
      addChildren(child.id, level + 1);
    });
  };

  topLevelCategories.forEach((cat) => {
    displayCategories.push({ category: cat, level: 0 });
    addChildren(cat.id, 1);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
          <p className="text-muted-foreground">Manage your product categories and hierarchy.</p>
        </div>
        <Button onClick={openCreateSheet}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Sort Order</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No categories found.
                </TableCell>
              </TableRow>
            ) : (
              displayCategories.map(({ category, level }) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center" style={{ paddingLeft: `${level * 1.5}rem` }}>
                      {level > 0 && <span className="text-muted-foreground mr-2">└</span>}
                      {category.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                  <TableCell>{category._count.products}</TableCell>
                  <TableCell>{category.sortOrder}</TableCell>
                  <TableCell>
                    <Switch
                      checked={category.isActive}
                      onCheckedChange={() => handleToggleActive(category.id, category.isActive)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditSheet(category)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <InlineConfirmDelete onDelete={() => handleDelete(category.id)} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingCategory ? "Edit Category" : "Add Category"}</SheetTitle>
            <SheetDescription>
              {editingCategory
                ? "Update the details for this category."
                : "Create a new category to organise your products."}
            </SheetDescription>
          </SheetHeader>
          <CategoryForm
            initialData={editingCategory}
            categories={initialCategories}
            onSuccess={() => setIsSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
