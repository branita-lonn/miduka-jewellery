// components/dashboard/gift-cards-client.tsx
// Client component for managing gift cards in the dashboard

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Gift, Plus, Trash2, Copy, Check, Calendar, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import Papa from "papaparse";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { InlineConfirmDelete } from "@/components/dashboard/inline-confirm-delete";
import { formatCurrency, cn } from "@/lib/utils";

const giftCardSchema = z.object({
  initialValue: z.coerce.number().positive("Value must be positive"),
  code: z.string().optional(),
  expiresAt: z.string().optional().or(z.literal("")),
});

type GiftCardFormValues = z.infer<typeof giftCardSchema>;

interface GiftCard {
  id: string;
  code: string;
  initialValue: number;
  remainingValue: number;
  isActive: boolean;
  createdAt: string;
  expiresAt: string | null;
}

interface GiftCardsClientProps {
  initialGiftCards: GiftCard[];
}

export function GiftCardsClient({ initialGiftCards }: GiftCardsClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const form = useForm<GiftCardFormValues>({
    resolver: zodResolver(giftCardSchema),
    defaultValues: {
      initialValue: 0,
      code: "",
      expiresAt: "",
    },
  });

  const onSubmit = async (values: GiftCardFormValues) => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to create gift card");

      toast.success("Gift card created successfully");
      form.reset();
      router.refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const onToggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/dashboard/gift-cards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed to update gift card");
      router.refresh();
    } catch (error: unknown) {
      toast.error("Failed to update status");
    }
  };

  const onDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/gift-cards/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete gift card");
      toast.success("Gift card deleted");
      router.refresh();
    } catch (error: unknown) {
      toast.error("Failed to delete gift card");
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast.success("Code copied to clipboard");
  };
  const handleDownloadCSV = () => {
    if (initialGiftCards.length === 0) {
      toast.error("No data to export");
      return;
    }

    setIsExporting(true);
    try {
      const csvData = initialGiftCards.map(gc => ({
        Code: gc.code,
        "Initial Value": gc.initialValue,
        "Remaining Value": gc.remainingValue,
        Status: gc.isActive ? "Active" : "Disabled",
        "Created At": format(new Date(gc.createdAt), "yyyy-MM-dd HH:mm"),
        "Expires At": gc.expiresAt ? format(new Date(gc.expiresAt), "yyyy-MM-dd") : "N/A",
      }));

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `gift-cards-${format(new Date(), "yyyy-MM-dd")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV download started");
    } catch (error) {
      toast.error("Failed to export CSV");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gift Cards</h2>
          <p className="text-muted-foreground font-medium">Issue store credit and track redemptions.</p>
        </div>
        <Button 
          variant="outline" 
          className="rounded-full gap-2" 
          onClick={handleDownloadCSV}
          disabled={isExporting || initialGiftCards.length === 0}
        >
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Download CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Issue Gift Card
            </CardTitle>
            <CardDescription>
              Generate a new credit code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="initialValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Card Value (KES)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 5000"
                          className="rounded-full"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Code (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Leave blank for auto-generate"
                          className="rounded-full uppercase"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        e.g. SPECIAL-GIFT-2026
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date (Optional)</FormLabel>
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

                <Button type="submit" className="w-full rounded-full" disabled={loading}>
                  {loading ? "Issuing..." : "Issue Gift Card"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle>Gift Card Records</CardTitle>
            <CardDescription>
              Manage issued codes and track remaining balances.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-xl border-t bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialGiftCards.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No gift cards issued yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    initialGiftCards.map((gc) => (
                      <TableRow key={gc.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="bg-muted px-2 py-1 rounded text-xs font-mono font-bold">
                              {gc.code}
                            </code>
                            <button
                              onClick={() => copyToClipboard(gc.code)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {copiedCode === gc.code ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                          {gc.expiresAt && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Expires: {format(new Date(gc.expiresAt), "dd MMM yyyy")}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatCurrency(gc.initialValue)}
                        </TableCell>
                        <TableCell className="font-bold text-primary">
                          {formatCurrency(gc.remainingValue)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={gc.isActive}
                              onCheckedChange={(checked) => onToggleActive(gc.id, checked)}
                            />
                            <Badge variant={gc.isActive ? "default" : "secondary"} className="text-[10px]">
                              {gc.isActive ? "Active" : "Disabled"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <InlineConfirmDelete onDelete={() => onDelete(gc.id)} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
