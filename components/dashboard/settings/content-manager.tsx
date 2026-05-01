// components/dashboard/settings/content-manager.tsx
// Home page content: Hero section headline, subheadline, image, CTA

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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, Layout, ExternalLink, Image as ImageIcon } from "lucide-react";
import { ImageUpload } from "@/components/dashboard/image-upload";
import Image from "next/image";

const contentSchema = z.object({
  heroHeadline: z.string().optional(),
  heroSubheadline: z.string().optional(),
  heroImageUrl: z.string().optional(),
  heroCtaText: z.string().optional(),
  heroCtaLink: z.string().optional(),
});

type ContentValues = z.infer<typeof contentSchema>;

interface ContentManagerProps {
  initialData: any;
}

export function ContentManager({ initialData }: ContentManagerProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<ContentValues>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      heroHeadline: initialData?.heroHeadline || "",
      heroSubheadline: initialData?.heroSubheadline || "",
      heroImageUrl: initialData?.heroImageUrl || "",
      heroCtaText: initialData?.heroCtaText || "Shop Now",
      heroCtaLink: initialData?.heroCtaLink || "/products",
    },
  });

  const onSubmit = async (data: ContentValues) => {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to update settings");

      toast.success("Home content updated successfully.");
    } catch (error) {
      toast.error("Something went wrong.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const values = form.watch();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="rounded-3xl border-border/50 bg-card/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  Hero Section (Home Page Banner)
                </CardTitle>
                <CardDescription>
                  This overrides the default store name and tagline on your home page banner. 
                  If left empty, the storefront will fallback to your Store Name and Tagline from the Profile tab.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <FormField
                  control={form.control}
                  name="heroHeadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Headline</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Elevate Your Tech Experience" className="rounded-2xl border-border/50 bg-background/50 h-11" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="heroSubheadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subheadline</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Discover the latest gadgets with free delivery." className="rounded-2xl border-border/50 bg-background/50 h-11" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="heroCtaText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CTA Button Text</FormLabel>
                        <FormControl>
                          <Input {...field} className="rounded-2xl border-border/50 bg-background/50 h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="heroCtaLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CTA Button Link</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input {...field} className="pl-9 rounded-2xl border-border/50 bg-background/50 h-11" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="heroImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hero Image</FormLabel>
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

            <div className="flex justify-end">
              <Button type="submit" disabled={loading} className="rounded-full px-8 h-11 gap-2 shadow-lg shadow-primary/20">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Content
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Live Preview */}
      <div className="space-y-6">
        <Card className="rounded-3xl border-border/50 bg-card shadow-xl overflow-hidden sticky top-6">
          <CardHeader className="bg-muted/30 py-3">
            <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Live Preview</CardTitle>
          </CardHeader>
          <CardContent className="p-0 relative aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden">
            {values.heroImageUrl ? (
              <Image 
                src={values.heroImageUrl} 
                alt="Preview" 
                fill 
                className="object-cover opacity-50 brightness-50"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                <ImageIcon className="h-8 w-8 opacity-20" />
                <span className="text-xs">No image uploaded</span>
              </div>
            )}
            
            <div className="relative z-10 p-8 text-center space-y-4 max-w-md">
              <h1 className="text-2xl font-bold text-white drop-shadow-md">
                {values.heroHeadline || "Headline Placeholder"}
              </h1>
              <p className="text-sm text-white/80 drop-shadow-sm">
                {values.heroSubheadline || "Subheadline goes here."}
              </p>
              <div className="pt-2">
                <Button className="rounded-full px-6 bg-white text-black hover:bg-white/90">
                  {values.heroCtaText || "CTA Button"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
