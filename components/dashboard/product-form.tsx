// components/dashboard/product-form.tsx
// Unified multi-step form for creating and editing products supporting dynamic variant attributes

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Wand2, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { CategoryWithRelations, AttributeDefinitionPublic } from "@/types";
import { ImageUpload } from "./image-upload";
import { AiDescriptionButton } from "./ai-description-button";
import { VariantAttributeInput } from "./variant-attribute-input";

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
  sku: z.string().optional().nullable(),
  priceOverride: z.coerce.number().optional().nullable(),
  stockQuantity: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  attributes: z.array(
    z.object({
      key: z.string(),
      attributeDefinitionId: z.string().optional(),
      value: z.string(),
    })
  ).default([]),
});

const imageSchema = z.object({
  url: z.string(),
  blurDataUrl: z.string().optional().nullable(),
  variantIndex: z.coerce.number().optional().nullable(),
  variantIds: z.array(z.string()).default([]),
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
  images: z.array(imageSchema).default([]),
  variants: z.array(variantSchema).default([]),
});

type FormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  initialData?: any | null;
  categories: CategoryWithRelations[];
  featuredCount: number;
  availableAttributes?: AttributeDefinitionPublic[];
}

const STEPS = ["Details", "Description", "Variants", "Media"];

export function ProductForm({
  initialData,
  categories,
  featuredCount,
  availableAttributes = [],
}: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tagInput, setTagInput] = useState("");
  const [priceSuggestion, setPriceSuggestion] = useState<string | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

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
          images: initialData.images?.map((img: any) => ({ 
            url: img.url, 
            blurDataUrl: img.blurDataUrl,
            variantIndex: img.variantIndex,
            variantIds: img.variantIds || [],
          })) || [],
          variants: initialData.variants?.map((v: any) => ({
            id: v.id,
            sku: v.sku || "",
            priceOverride: v.priceOverride ? Number(v.priceOverride) : undefined,
            stockQuantity: v.stockQuantity,
            isActive: v.isActive,
            attributes: v.attributes?.map((attr: any) => ({
              key: attr.key,
              attributeDefinitionId: attr.attributeDefinitionId,
              value: attr.value,
            })) || [],
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

  // Category Scope dynamic selection
  const selectedCategoryId = form.watch("categoryId");
  const activeAttributes = availableAttributes.filter(
    (attr) => !attr.categoryId || attr.categoryId === selectedCategoryId
  );

  const handleAddVariant = () => {
    appendVariant({
      sku: "",
      priceOverride: undefined,
      stockQuantity: 0,
      isActive: true,
      attributes: activeAttributes.map((attr) => ({
        key: attr.key,
        attributeDefinitionId: attr.id,
        value: "",
      })),
    });
  };

  const handleRemoveVariant = (index: number) => {
    const deletedVariant = variantFields[index] as any;
    const currentImages = [...form.getValues("images")];
    const isEditMode = !!initialData;

    if (isEditMode) {
      const varId = deletedVariant.id;
      if (varId) {
        const updatedImages = currentImages.map((img) => ({
          ...img,
          variantIds: (img.variantIds || []).filter((id: string) => id !== varId),
        }));
        form.setValue("images", updatedImages);
      }
    } else {
      const updatedImages = currentImages.map((img) => {
        if (img.variantIndex === index) {
          return { ...img, variantIndex: null };
        } else if (img.variantIndex !== null && img.variantIndex !== undefined && img.variantIndex > index) {
          return { ...img, variantIndex: img.variantIndex - 1 };
        }
        return img;
      });
      form.setValue("images", updatedImages);
    }

    removeVariant(index);
  };

  const nextStep = async () => {
    let isValid = false;

    if (currentStep === 0) {
      isValid = await form.trigger(["name", "price", "categoryId", "compareAtPrice"]);
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

  const handlePriceBlur = async () => {
    const price = form.getValues("price");
    const categoryId = form.getValues("categoryId");
    const name = form.getValues("name");

    if (!price || !categoryId || categoryId === "none") {
      setPriceSuggestion(null);
      return;
    }

    try {
      setPriceLoading(true);
      const res = await fetch("/api/ai/price-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, categoryId, variants: form.getValues("variants") }),
      });
      if (res.ok) {
        const data = await res.json();
        setPriceSuggestion(data.message);
      }
    } catch (e) {
      // Fail silently
    } finally {
      setPriceLoading(false);
    }
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
    } catch (error: any) {
      console.error("SUBMISSION ERROR:", error);
      toast.error(error.message || "An error occurred");
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
      <div className="flex items-center justify-between max-w-2xl mx-auto mb-12">
        {STEPS.map((step, index) => (
          <div key={step} className="flex flex-col items-center flex-1 relative">
            {index > 0 && (
              <div className={cn(
                "absolute top-4 -left-1/2 w-full h-[2px] -z-10",
                currentStep >= index ? "bg-primary" : "bg-muted"
              )} />
            )}
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300",
                currentStep === index
                  ? "border-primary bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.5)] scale-110"
                  : currentStep > index
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted bg-background text-muted-foreground"
              )}
            >
              {index + 1}
            </div>
            <span
              className={cn(
                "mt-3 text-[10px] font-bold uppercase tracking-wider transition-colors duration-300",
                currentStep >= index ? "text-foreground" : "text-muted-foreground"
              )}
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
                      <Input disabled={loading} placeholder="E.g. Wireless Headphones" {...field} className="rounded-xl" />
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
                        <Input 
                          type="number" 
                          disabled={loading} 
                          placeholder="0.00" 
                          {...field} 
                          className="rounded-xl"
                          onBlur={(e) => {
                            field.onBlur();
                            handlePriceBlur();
                          }}
                        />
                      </FormControl>
                      {priceLoading ? (
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground animate-pulse">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Analyzing market...
                        </div>
                      ) : priceSuggestion ? (
                        <p className="mt-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium animate-in fade-in slide-in-from-top-1 duration-300">
                          {priceSuggestion}
                        </p>
                      ) : null}
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
                        <Input type="number" disabled={loading} placeholder="0.00" {...field} value={field.value || ""} className="rounded-xl" />
                      </FormControl>
                      <FormDescription className="text-[10px]">Struck-through price for sales.</FormDescription>
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
                        <SelectTrigger className="rounded-xl">
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
                              className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
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
                          className="rounded-xl"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }: any) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-muted/20">
                      <div className="space-y-0.5">
                        <FormLabel className="text-xs">Active</FormLabel>
                        <FormDescription className="text-[10px]">Visible to customers.</FormDescription>
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
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-muted/20">
                      <div className="space-y-0.5">
                        <FormLabel className="text-xs">Featured</FormLabel>
                        <FormDescription className="text-[10px]">Show on homepage.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch 
                          checked={field.value} 
                          onCheckedChange={(checked) => {
                            if (checked && !field.value && featuredCount >= 6) {
                                toast.error("You can only feature up to 6 products. Remove one to add another.");
                                return;
                            }
                            field.onChange(checked);
                          }} 
                          disabled={loading} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isOnSale"
                  render={({ field }: any) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-muted/20">
                      <div className="space-y-0.5">
                        <FormLabel className="text-xs">On Sale</FormLabel>
                        <FormDescription className="text-[10px]">Highlight as discounted.</FormDescription>
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
                  <h3 className="text-lg font-bold">Story & Details</h3>
                  <p className="text-sm text-muted-foreground">Craft a compelling narrative for your product.</p>
                </div>
                <AiDescriptionButton 
                  formData={form.getValues() as any}
                  onGenerated={(description) => form.setValue("description", description)}
                  disabled={loading}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }: any) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        disabled={loading}
                        placeholder="Start typing or use AI to generate a description..."
                        className="min-h-[400px] resize-y rounded-2xl p-6"
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
                  <h3 className="text-lg font-bold">Inventory & Variants</h3>
                  <p className="text-sm text-muted-foreground">Manage stock and type-aware options dynamically.</p>
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
                        <Input type="number" disabled={loading} {...field} className="rounded-xl" />
                      </FormControl>
                      <FormDescription className="text-[10px]">Used if no variants are added.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900 flex items-center gap-2">
                  <Wand2 className="h-3 w-3" />
                  Base stock is ignored when variants are added.
                </div>
              )}

              <div className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm uppercase tracking-wider">Product Variants</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={handleAddVariant}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Variant
                  </Button>
                </div>

                {variantFields.length === 0 ? (
                  <div className="text-center p-12 border-2 border-dashed rounded-2xl text-muted-foreground text-sm bg-muted/10">
                    No variants added yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {variantFields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5 rounded-2xl bg-card border shadow-sm relative group">
                        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button type="button" variant="destructive" size="icon" className="h-7 w-7 rounded-full shadow-lg" onClick={() => handleRemoveVariant(index)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        
                        {/* Dynamic Attributes Grid Column */}
                        <div className="md:col-span-6 space-y-4">
                          {activeAttributes.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic pt-4">
                              No attributes scoped to this category. Define some in dashboard under Attributes.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {activeAttributes.map((attr) => (
                                <FormField
                                  key={attr.key}
                                  control={form.control}
                                  name={`variants.${index}.attributes`}
                                  render={({ field }) => {
                                    const currentAttrs = field.value || [];
                                    const attrObj = currentAttrs.find((a: any) => a.key === attr.key);
                                    const value = attrObj ? attrObj.value : "";

                                    return (
                                      <FormItem className="space-y-0">
                                        <FormControl>
                                          <VariantAttributeInput
                                            definition={attr}
                                            value={value}
                                            onChange={(newVal) => {
                                              const updated = [...currentAttrs];
                                              const idx = updated.findIndex((a: any) => a.key === attr.key);
                                              if (idx > -1) {
                                                updated[idx] = { ...updated[idx], value: newVal };
                                              } else {
                                                updated.push({ key: attr.key, attributeDefinitionId: attr.id, value: newVal });
                                              }
                                              field.onChange(updated);
                                            }}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    );
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Inventory & Pricing Grid Column */}
                        <div className="md:col-span-4 space-y-3">
                          <FormField control={form.control} name={`variants.${index}.sku`} render={({ field }: any) => (
                            <FormItem><FormLabel className="text-[10px] font-bold uppercase">SKU (Optional)</FormLabel><FormControl><Input placeholder="SKU-001" className="h-9 rounded-lg" {...field} value={field.value || ""} /></FormControl></FormItem>
                          )} />
                          <FormField control={form.control} name={`variants.${index}.priceOverride`} render={({ field }: any) => (
                            <FormItem><FormLabel className="text-[10px] font-bold uppercase">Price Override (KES)</FormLabel><FormControl><Input type="number" placeholder="Override default price" className="h-9 rounded-lg" {...field} value={field.value || ""} /></FormControl></FormItem>
                          )} />
                          <FormField control={form.control} name={`variants.${index}.stockQuantity`} render={({ field }: any) => (
                            <FormItem><FormLabel className="text-[10px] font-bold uppercase">Stock Quantity</FormLabel><FormControl><Input type="number" className="h-9 rounded-lg" {...field} /></FormControl></FormItem>
                          )} />
                        </div>

                        {/* Variant Active Switch Column */}
                        <div className="md:col-span-2 flex flex-col items-center justify-center border-l pl-4 gap-2">
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">Active</span>
                          <FormField control={form.control} name={`variants.${index}.isActive`} render={({ field }: any) => (
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                          )} />
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
                  <h3 className="text-lg font-bold">Visual Assets</h3>
                  <p className="text-sm text-muted-foreground">Upload images and link them to variant options for dynamic switching.</p>
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
                        onChange={(images) => field.onChange(images)}
                        onRemove={(url: string) => field.onChange(field.value.filter((img: any) => img.url !== url))}
                        maxImages={12}
                        folder="miduka/products"
                        variants={form.watch("variants") || []}
                        isEditMode={!!initialData}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-8 mt-12 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 0 || loading}
              className="rounded-xl px-8"
            >
              Back
            </Button>
            
            {currentStep < STEPS.length - 1 ? (
              <Button 
                key="next-button"
                type="button" 
                onClick={nextStep} 
                disabled={loading}
                className="rounded-xl px-12 shadow-lg shadow-primary/20"
              >
                Continue
              </Button>
            ) : (
              <Button 
                key="submit-button"
                type="submit" 
                disabled={loading}
                className="rounded-xl px-12 shadow-xl shadow-primary/25"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finalizing...
                  </>
                ) : (
                  <>{initialData ? "Apply Changes" : "Publish Product"}</>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
