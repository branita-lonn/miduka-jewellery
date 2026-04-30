// components/dashboard/category-form.tsx
// Category create and edit form

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { CategoryWithRelations } from "@/types";
import { ImageUpload } from "./image-upload";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface CategoryFormProps {
  initialData?: CategoryWithRelations | null;
  categories: CategoryWithRelations[];
  onSuccess: () => void;
}

export function CategoryForm({ initialData, categories, onSuccess }: CategoryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: initialData
      ? {
          name: initialData.name,
          slug: initialData.slug,
          description: initialData.description || "",
          imageUrl: initialData.imageUrl || "",
          parentId: initialData.parentId,
          sortOrder: initialData.sortOrder,
          isActive: initialData.isActive,
        }
      : {
          name: "",
          slug: "",
          description: "",
          imageUrl: "",
          parentId: undefined,
          sortOrder: 0,
          isActive: true,
        },
  });

  const { setValue } = form;
  const name = useWatch({
    control: form.control,
    name: "name",
  });

  // Auto-generate slug when name changes (only in create mode or if slug is empty)
  useEffect(() => {
    if (!initialData && name) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setValue("slug", generatedSlug, { shouldValidate: true });
    }
  }, [name, initialData, setValue]);

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      const url = initialData
        ? `/api/dashboard/categories/${initialData.id}`
        : "/api/dashboard/categories";
      const method = initialData ? "PUT" : "POST";

      const payload = {
        ...values,
        parentId: values.parentId === "none" ? null : values.parentId,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save category");
      }

      toast.success(initialData ? "Category updated" : "Category created");
      router.refresh();
      onSuccess();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const validParentOptions = categories.filter((cat) => {
    if (!initialData) return true;
    if (cat.id === initialData.id) return false;
    if (cat.parentId === initialData.id) return false;
    return true;
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>Category Image</FormLabel>
              <FormControl>
                <ImageUpload
                  value={field.value ? [field.value] : []}
                  onChange={(urls) => field.onChange(urls[0] || "")}
                  onRemove={() => field.onChange("")}
                  maxImages={1}
                  folder="miduka/categories"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input disabled={loading} placeholder="E.g. Electronics" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input disabled={loading} placeholder="e.g. electronics" {...field} />
              </FormControl>
              <FormDescription>Auto-generated from name but can be customized.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parentId"
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>Parent Category</FormLabel>
              <Select
                disabled={loading}
                onValueChange={field.onChange}
                value={field.value || "none"}
                defaultValue={field.value || "none"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a parent category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">None (Top Level)</SelectItem>
                  {validParentOptions.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  disabled={loading}
                  placeholder="A short description of this category."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="sortOrder"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Sort Order</FormLabel>
                <FormControl>
                  <Input type="number" disabled={loading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }: any) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-8">
                <div className="space-y-0.5">
                  <FormLabel>Active Status</FormLabel>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} disabled={loading} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>{initialData ? "Save Changes" : "Create Category"}</>
          )}
        </Button>
      </form>
    </Form>
  );
}
