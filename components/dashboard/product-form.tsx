// components/dashboard/product-form.tsx
// Unified multi-step form for creating and editing products

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Wand2, X } from "lucide-react";

import { CategoryWithRelations, ProductWithRelationsSerialized } from "@/types";
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

const variantSchema = z.object({
  id: z.string().optional(),
  colour: z.string().optional(),
  size: z.string().optional(),
  material: z.string().optional(),
  priceOverride: z.coerce.number().optional(),
  stockQuantity: z.coerce.number().int().default(0),
  sku: z.string().optional(),
  isActive: z.boolean().default(true),
});

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  categoryId: z.string().optional().nullable(),
  price: z.coerce.number().min(0, "Price must be positive"),
  compareAtPrice: z.coerce.number().optional().nullable(),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isOnSale: z.boolean().default(false),
  description: z.string().optional(),
  stockQuantity: z.coerce.number().int().default(0),
  images: z.array(z.string()).default([]),
  variants: z.array(variantSchema).default([]),
});

type FormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  initialData?: ProductWithRelationsSerialized | null;
  categories: CategoryWithRelations[];
}

const STEPS = ["Details", "Description", "Variants", "Media"];

export function ProductForm({ initialData, categories }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tagInput, setTagInput] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: initialData
      ? {
          name: initialData.name,
          categoryId: initialData.categoryId,
          price: Number(initialData.price),
          compareAtPrice: initialData.compareAtPrice ? Number(initialData.compareAtPrice) : undefined,
          tags: initialData.tags || [],
          isActive: initialData.isActive,
          isFeatured: initialData.isFeatured,
          isOnSale: initialData.isOnSale,
          description: initialData.description || "",
          stockQuantity: initialData.stockQuantity,
          images: initialData.images?.map((img) => img.url) || [],
          variants: initialData.variants?.map((v) => ({
            id: v.id,
            colour: v.colour || "",
            size: v.size || "",
            material: v.material || "",
            priceOverride: v.priceOverride ? Number(v.priceOverride) : undefined,
            stockQuantity: v.stockQuantity,
            sku: v.sku || "",
            isActive: v.isActive,
          })) || [],
        }
      : {
          name: "",
          categoryId: undefined,
          price: 0,
          compareAtPrice: undefined,
          tags: [],
          isActive: true,
          isFeatured: false,
          isOnSale: false,
          description: "",
          stockQuantity: 0,
          images: [],
          variants: [],
        },
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const nextStep = async () => {
    let isValid = false;

    if (currentStep === 0) {
      isValid = await form.trigger(["name", "price", "categoryId", "compareAtPrice"]);
      // Auto-check "isOnSale" if compareAtPrice > price
      const price = form.getValues("price");
      const compareAt = form.getValues("compareAtPrice");
      if (compareAt && compareAt > price) {
        form.setValue("isOnSale", true);
      }
    } else if (currentStep === 1) {
      isValid = await form.trigger(["description"]);
    } else if (currentStep === 2) {
      isValid = await form.trigger(["stockQuantity", "variants"]);
    }

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim() !== "") {
      e.preventDefault();
      const currentTags = form.getValues("tags");
      if (!currentTags.includes(tagInput.trim())) {
        form.setValue("tags", [...currentTags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags");
    form.setValue(
      "tags",
      currentTags.filter((tag) => tag !== tagToRemove)
    );
  };

  const onSubmit = async (values: FormValues) => {
    console.log("SUBMITTING PRODUCT:", values);
    // Safety guard: only allow submission on the final step
    if (currentStep !== STEPS.length - 1) {
      return;
    }

    try {
      setLoading(true);
      const url = initialData ? `/api/dashboard/products/${initialData.id}` : "/api/dashboard/products";
      const method = initialData ? "PUT" : "POST";

      const payload = {
        ...values,
        categoryId: values.categoryId === "none" ? null : values.categoryId,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save product");
      }

      toast.success(initialData ? "Product updated" : "Product created");
      router.push("/dashboard/products");
      router.refresh();
    } catch (error: unknown) {
      console.error("SUBMISSION ERROR:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  // Build hierarchical category list for the dropdown
  const topLevelCategories = categories.filter((c) => !c.parentId);
  const categoryOptions: { id: string; name: string; level: number }[] = [];

  const addCategoryChildren = (parentId: string, level: number) => {
    const children = categories.filter((c) => c.parentId === parentId);
    children.forEach((child) => {
      categoryOptions.push({ id: child.id, name: child.name, level });
      addCategoryChildren(child.id, level + 1);
    });
  };

  topLevelCategories.forEach((cat) => {
    categoryOptions.push({ id: cat.id, name: cat.name, level: 0 });
    addCategoryChildren(cat.id, 1);
  });

  return (
    <div className="space-y-8">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div key={step} className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors ${
                currentStep === index
                  ? "border-primary bg-primary text-primary-foreground"
                  : currentStep > index
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-muted-foreground/30 text-muted-foreground"
              }`}
            >
              {index + 1}
            </div>
            <span
              className={`mt-2 text-xs font-medium ${
                currentStep >= index ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {step}
            </span>
          </div>
        ))}
      </div>

      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(onSubmit, (errors) => console.error("FORM VALIDATION ERRORS:", errors))} 
          className="space-y-8"
        >
          
          {/* STEP 1: Details */}
          {currentStep === 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <FormField
                control={form.control}
                name="name"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input disabled={loading} placeholder="E.g. Wireless Headphones" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Price (KES)</FormLabel>
                      <FormControl>
                        <Input type="number" disabled={loading} placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="compareAtPrice"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Compare At Price (KES)</FormLabel>
                      <FormControl>
                        <Input type="number" disabled={loading} placeholder="0.00 (Optional)" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormDescription>Shown struck-through to indicate a sale.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      disabled={loading}
                      onValueChange={field.onChange}
                      value={field.value || "none"}
                      defaultValue={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Uncategorised</SelectItem>
                        {categoryOptions.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <span style={{ paddingLeft: `${cat.level * 1}rem` }}>
                              {cat.level > 0 && "└ "}
                              {cat.name}
                            </span>
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
                name="tags"
                render={() => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {form.getValues("tags").map((tag) => (
                            <div
                              key={tag}
                              className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full text-xs font-medium"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="hover:text-destructive focus:outline-none"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <Input
                          placeholder="Type a tag and press Enter"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={addTag}
                          disabled={loading}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>Press Enter to add tags (e.g. &quot;summer&quot;, &quot;sale&quot;, &quot;new&quot;)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }: any) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription className="text-xs">Visible to customers.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} disabled={loading} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }: any) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Featured</FormLabel>
                        <FormDescription className="text-xs">Show on homepage.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} disabled={loading} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isOnSale"
                  render={({ field }: any) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>On Sale</FormLabel>
                        <FormDescription className="text-xs">Highlight as discounted.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} disabled={loading} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {/* STEP 2: Description */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Product Description</h3>
                  <p className="text-sm text-muted-foreground">Detailed information about your product.</p>
                </div>
                <Button type="button" variant="outline" size="sm" className="gap-2 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/40">
                  <Wand2 className="h-4 w-4" />
                  Generate with AI
                </Button>
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }: any) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        disabled={loading}
                        placeholder="Describe the product details, features, and benefits..."
                        className="min-h-[300px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* STEP 3: Variants */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Inventory & Variants</h3>
                  <p className="text-sm text-muted-foreground">Manage stock levels and product variations (e.g. size, colour).</p>
                </div>
              </div>

              {variantFields.length === 0 ? (
                <FormField
                  control={form.control}
                  name="stockQuantity"
                  render={({ field }: any) => (
                    <FormItem className="max-w-xs">
                      <FormLabel>Base Stock Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" disabled={loading} {...field} />
                      </FormControl>
                      <FormDescription>Used if you don&apos;t add specific variants.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900">
                  Base stock is ignored when variants are added. Stock will be managed per variant.
                </div>
              )}

              <div className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Product Variants</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendVariant({ colour: "", size: "", material: "", priceOverride: undefined, stockQuantity: 0, sku: "", isActive: true })}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Variant
                  </Button>
                </div>

                {variantFields.length === 0 ? (
                  <div className="text-center p-8 border border-dashed rounded-xl text-muted-foreground text-sm">
                    No variants added. Click &quot;Add Variant&quot; to create sizes, colours, or materials.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {variantFields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-xl relative group">
                        <div className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button type="button" variant="destructive" size="icon" className="h-6 w-6 rounded-full shadow-md" onClick={() => removeVariant(index)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="md:col-span-3 space-y-3">
                          <FormField
                            control={form.control}
                            name={`variants.${index}.colour`}
                            render={({ field }: any) => (
                              <FormItem>
                                <FormLabel className="text-xs">Colour</FormLabel>
                                <FormControl><Input placeholder="e.g. Red" className="h-8 text-sm" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`variants.${index}.size`}
                            render={({ field }: any) => (
                              <FormItem>
                                <FormLabel className="text-xs">Size</FormLabel>
                                <FormControl><Input placeholder="e.g. XL" className="h-8 text-sm" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="md:col-span-3 space-y-3">
                          <FormField
                            control={form.control}
                            name={`variants.${index}.material`}
                            render={({ field }: any) => (
                              <FormItem>
                                <FormLabel className="text-xs">Material</FormLabel>
                                <FormControl><Input placeholder="e.g. Cotton" className="h-8 text-sm" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`variants.${index}.sku`}
                            render={({ field }: any) => (
                              <FormItem>
                                <FormLabel className="text-xs">SKU</FormLabel>
                                <FormControl><Input placeholder="e.g. RED-XL-COT" className="h-8 text-sm" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="md:col-span-4 space-y-3">
                          <FormField
                            control={form.control}
                            name={`variants.${index}.priceOverride`}
                            render={({ field }: any) => (
                              <FormItem>
                                <FormLabel className="text-xs">Price Override (Optional)</FormLabel>
                                <FormControl><Input type="number" placeholder="Overrides base price" className="h-8 text-sm" {...field} value={field.value || ""} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`variants.${index}.stockQuantity`}
                            render={({ field }: any) => (
                              <FormItem>
                                <FormLabel className="text-xs">Stock Quantity</FormLabel>
                                <FormControl><Input type="number" className="h-8 text-sm" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="md:col-span-2 flex items-center justify-center border-l pl-4">
                          <FormField
                            control={form.control}
                            name={`variants.${index}.isActive`}
                            render={({ field }: any) => (
                              <FormItem className="flex flex-col items-center gap-2">
                                <FormLabel className="text-xs">Active</FormLabel>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Media */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Product Media</h3>
                  <p className="text-sm text-muted-foreground">Upload images for your product. The first image will be the cover.</p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ImageUpload
                        value={field.value}
                        onChange={(urls) => field.onChange(urls)}
                        onRemove={(url: string) => field.onChange(field.value.filter((val: string) => val !== url))}
                        maxImages={8}
                        folder="miduka/products"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0 || loading}
            >
              Back
            </Button>
            
            {currentStep < STEPS.length - 1 ? (
              <Button 
                key="next-button"
                type="button" 
                onClick={nextStep} 
                disabled={loading}
              >
                Next
              </Button>
            ) : (
              <Button 
                key="submit-button"
                type="submit" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>{initialData ? "Save Changes" : "Create Product"}</>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
