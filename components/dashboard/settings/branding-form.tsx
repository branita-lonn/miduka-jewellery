// components/dashboard/settings/branding-form.tsx
// Branding settings: Logo, Favicon, SEO (Meta Title/Description)

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, Image as ImageIcon, Search, Globe } from "lucide-react";
import { ImageUpload } from "@/components/dashboard/image-upload";

const brandingSchema = z.object({
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

type BrandingValues = z.infer<typeof brandingSchema>;

interface BrandingFormProps {
  initialData: any;
}

export function BrandingForm({ initialData }: BrandingFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<BrandingValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      logoUrl: initialData?.logoUrl || "",
      faviconUrl: initialData?.faviconUrl || "",
      metaTitle: initialData?.metaTitle || "",
      metaDescription: initialData?.metaDescription || "",
    },
  });

  const onSubmit = async (data: BrandingValues) => {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to update settings");

      toast.success("Branding updated successfully.");
    } catch (error) {
      toast.error("Something went wrong.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo Upload */}
            <Card className="rounded-3xl border-border/50 bg-card/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Store Logo
                </CardTitle>
                <CardDescription>Upload your brand's logo.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ImageUpload 
                          value={field.value ? [{ url: field.value }] : []}
                          onChange={(images) => field.onChange(images[0]?.url || "")}
                          onRemove={() => field.onChange("")}
                          maxImages={1}
                          folder="miduka/branding"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Favicon Upload */}
            <Card className="rounded-3xl border-border/50 bg-card/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Favicon
                </CardTitle>
                <CardDescription>Icon displayed in browser tabs.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <FormField
                  control={form.control}
                  name="faviconUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ImageUpload 
                          value={field.value ? [{ url: field.value }] : []}
                          onChange={(images) => field.onChange(images[0]?.url || "")}
                          onRemove={() => field.onChange("")}
                          maxImages={1}
                          folder="miduka/branding"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* SEO Settings */}
          <Card className="rounded-3xl border-border/50 bg-card/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-4 w-4" />
                SEO & Store Identity
              </CardTitle>
              <CardDescription>
                These settings define your store's name and how it appears in browser tabs and search engines. 
                Note: "Meta Title" will be used as the primary browser tab title.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <FormField
                control={form.control}
                name="metaTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. MiDuka | Best Electronics Store" className="rounded-2xl border-border/50 bg-background/50 h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="metaDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Describe your store for search results..." className="rounded-2xl border-border/50 bg-background/50 resize-none" rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading} className="rounded-full px-8 h-11 gap-2 shadow-lg shadow-primary/20">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Branding
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
