// components/dashboard/coupon-form.tsx
// Reusable form for creating and editing a coupon.
// Used inside a Sheet in the coupons dashboard page.

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CouponType } from "@prisma/client";
import { Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Schema ───────────────────────────────────────────────────────────────────

const couponSchema = z.object({
  code: z.string().min(1, "Coupon code is required").max(50),
  type: z.nativeEnum(CouponType),
  value: z.coerce.number().positive("Value must be positive"),
  minimumOrderAmount: z.coerce
    .number()
    .nonnegative()
    .optional()
    .or(z.literal("")),
  maxUses: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .or(z.literal("")),
  maxUsesPerCustomer: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .or(z.literal("")),
  expiresAt: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

type CouponFormValues = z.infer<typeof couponSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CouponData {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minimumOrderAmount: number | null;
  maxUses: number | null;
  maxUsesPerCustomer: number | null;
  isActive: boolean;
  expiresAt: string | null;
}

interface CouponFormProps {
  initialData?: CouponData;
  onSuccess: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CouponForm({ initialData, onSuccess }: CouponFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<CouponFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(couponSchema) as any,
    defaultValues: {
      code: initialData?.code ?? "",
      type: initialData?.type ?? CouponType.PERCENTAGE,
      value: initialData?.value ?? 0,
      minimumOrderAmount: initialData?.minimumOrderAmount ?? "",
      maxUses: initialData?.maxUses ?? "",
      maxUsesPerCustomer: initialData?.maxUsesPerCustomer ?? "",
      expiresAt: initialData?.expiresAt ? new Date(initialData.expiresAt).toISOString().split("T")[0] : "",
      isActive: initialData?.isActive ?? true,
    },
  });

  const onSubmit = async (values: CouponFormValues) => {
    try {
      setLoading(true);

      const url = initialData
        ? `/api/dashboard/coupons/${initialData.id}`
        : "/api/dashboard/coupons";

      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save coupon");

      toast.success(initialData ? "Coupon updated" : "Coupon created");
      router.refresh();
      onSuccess();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Coupon Code */}
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Coupon Code</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. WELCOME20"
                  className="rounded-full uppercase"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          {/* Type */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="rounded-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={CouponType.PERCENTAGE}>Percentage (%)</SelectItem>
                    <SelectItem value={CouponType.FIXED_AMOUNT}>Fixed Amount (KES)</SelectItem>
                    <SelectItem value={CouponType.FREE_SHIPPING}>Free Shipping</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Value */}
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Value</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="e.g. 20"
                    className="rounded-full"
                    disabled={form.watch("type") === CouponType.FREE_SHIPPING}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Minimum Order Amount */}
        <FormField
          control={form.control}
          name="minimumOrderAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum Order Amount (KES) — Optional</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  placeholder="e.g. 1000"
                  className="rounded-full"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          {/* Max Uses */}
          <FormField
            control={form.control}
            name="maxUses"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Max Uses</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    placeholder="Unlimited"
                    className="rounded-full"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Max Uses Per Customer */}
          <FormField
            control={form.control}
            name="maxUsesPerCustomer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Per Customer</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    placeholder="Unlimited"
                    className="rounded-full"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Expiry Date */}
        <FormField
          control={form.control}
          name="expiresAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expiry Date — Optional</FormLabel>
              <FormControl>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    className="rounded-full pl-10"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Is Active */}
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-2xl border px-4 py-3">
              <div>
                <FormLabel>Active</FormLabel>
                <FormDescription className="text-xs">
                  Inactive coupons cannot be applied at checkout.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full rounded-full"
          disabled={loading}
        >
          {loading
            ? initialData
              ? "Saving..."
              : "Creating..."
            : initialData
            ? "Save Changes"
            : "Create Coupon"}
        </Button>
      </form>
    </Form>
  );
}
