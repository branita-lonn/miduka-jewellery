// components/dashboard/coupons-client.tsx
// Client component for the coupons management table with Sheet-based
// create/edit workflow and inline delete with confirmation.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Ticket,
  ToggleLeft,
  ToggleRight,
  Search,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { CouponType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { InlineConfirmDelete } from "@/components/dashboard/inline-confirm-delete";
import { CouponForm, CouponData } from "@/components/dashboard/coupon-form";
import { formatCurrency } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minimumOrderAmount: number | null;
  maxUses: number | null;
  maxUsesPerCustomer: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

interface CouponsClientProps {
  initialCoupons: Coupon[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CouponsClient({ initialCoupons }: CouponsClientProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponData | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCoupons = initialCoupons.filter((coupon) =>
    coupon.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCreate = () => {
    setEditingCoupon(null);
    setSheetOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditingCoupon({
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minimumOrderAmount: coupon.minimumOrderAmount,
      maxUses: coupon.maxUses,
      maxUsesPerCustomer: coupon.maxUsesPerCustomer,
      isActive: coupon.isActive,
      expiresAt: coupon.expiresAt,
    });
    setSheetOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/coupons/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to delete coupon");
      }
      toast.success("Coupon deleted");
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(message);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      setTogglingId(coupon.id);
      const res = await fetch(`/api/dashboard/coupons/${coupon.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update coupon");
      }
      toast.success(
        coupon.isActive ? "Coupon deactivated" : "Coupon activated"
      );
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(message);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <>
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage discount codes to drive sales and customer loyalty.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="rounded-full gap-2 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Create Coupon
        </Button>
      </div>

      {/* ── Summary Stats ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-3xl border bg-card shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                <Ticket className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{initialCoupons.length}</p>
                <p className="text-xs text-muted-foreground">Total Coupons</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border bg-card shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-500/10">
                <ToggleRight className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {initialCoupons.filter((c) => c.isActive).length}
                </p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border bg-card shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10">
                <Calendar className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {initialCoupons.filter((c) => c.expiresAt && new Date(c.expiresAt) < new Date()).length}
                </p>
                <p className="text-xs text-muted-foreground">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border bg-card shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10">
                <Search className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {initialCoupons.reduce((acc, c) => acc + c.usedCount, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Redemptions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Search & Table ──────────────────────────────────────────────────── */}
      <Card className="rounded-3xl">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Discount Codes</CardTitle>
            <CardDescription>
              A list of all promotional codes available for your store.
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-full pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredCoupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Ticket className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">No coupons found</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                {searchQuery ? `No results for "${searchQuery}"` : "Start by creating your first promotional discount code."}
              </p>
              {!searchQuery && (
                <Button onClick={openCreate} className="rounded-full mt-2 gap-2">
                  <Plus className="h-4 w-4" />
                  Create Coupon
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCoupons.map((coupon) => (
                    <TableRow
                      key={coupon.id}
                      className={!coupon.isActive ? "opacity-60" : undefined}
                    >
                      {/* Code */}
                      <TableCell className="pl-6 font-mono font-bold">
                        {coupon.code}
                      </TableCell>

                      {/* Type */}
                      <TableCell>
                        <Badge variant="outline" className="rounded-full">
                          {coupon.type.replace("_", " ")}
                        </Badge>
                      </TableCell>

                      {/* Value */}
                      <TableCell className="font-medium">
                        {coupon.type === "PERCENTAGE" ? (
                          `${coupon.value}%`
                        ) : coupon.type === "FREE_SHIPPING" ? (
                          "Free Shipping"
                        ) : (
                          formatCurrency(coupon.value)
                        )}
                      </TableCell>

                      {/* Usage */}
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm">
                            {coupon.usedCount} / {coupon.maxUses ?? "∞"}
                          </span>
                          <div className="h-1 w-20 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary" 
                              style={{ 
                                width: coupon.maxUses 
                                  ? `${Math.min(100, (coupon.usedCount / coupon.maxUses) * 100)}%` 
                                  : "0%" 
                              }} 
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Expiry */}
                      <TableCell className="text-sm text-muted-foreground">
                        {coupon.expiresAt 
                          ? format(new Date(coupon.expiresAt), "dd MMM yyyy") 
                          : "Never"}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <button
                          onClick={() => handleToggleActive(coupon)}
                          disabled={togglingId === coupon.id}
                          className="flex items-center gap-1.5 transition-opacity hover:opacity-70 disabled:opacity-40 cursor-pointer"
                        >
                          {coupon.isActive ? (
                            <>
                              <ToggleRight className="h-4 w-4 text-green-600" />
                              <Badge
                                variant="secondary"
                                className="rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              >
                                Active
                              </Badge>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                              <Badge
                                variant="secondary"
                                className="rounded-full"
                              >
                                Inactive
                              </Badge>
                            </>
                          )}
                        </button>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => openEdit(coupon)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <InlineConfirmDelete
                            onDelete={() => handleDelete(coupon.id)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Create / Edit Sheet ──────────────────────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>
              {editingCoupon ? "Edit Coupon" : "Create Coupon"}
            </SheetTitle>
            <SheetDescription>
              {editingCoupon
                ? "Update the coupon details below."
                : "Set up a new discount code for your customers."}
            </SheetDescription>
          </SheetHeader>
          <CouponForm
            initialData={editingCoupon ?? undefined}
            onSuccess={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
