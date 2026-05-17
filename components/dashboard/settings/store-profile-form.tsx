// components/dashboard/settings/store-profile-form.tsx
// Form to update store profile, logo, and contact information.

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { VERTICAL_CONFIG } from "@/lib/store-vertical";
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
import { Loader2, Save, Globe, Mail, Phone } from "lucide-react";

const storeProfileSchema = z.object({
  storeName: z.string().min(2, "Store name must be at least 2 characters."),
  storeTagline: z.string().optional(),
  contactEmail: z.string().email("Invalid email address.").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  returnPolicy: z.string().optional(),
  aboutPage: z.string().optional(),
  privacyPolicy: z.string().optional(),
  contactPage: z.string().optional(),
  storeVertical: z.enum(["FASHION", "ELECTRONICS", "GADGETS", "BEAUTY", "JEWELLERY", "FRESH_PRODUCE", "GENERAL"]),
  currency: z.string().min(1, "Currency is required").max(5, "Currency code is too long"),
  currencyLocale: z.string().min(2, "Locale is required").max(10, "Locale is too long"),
});

type StoreProfileValues = z.infer<typeof storeProfileSchema>;

interface StoreProfileFormProps {
  initialData: any;
}

export function StoreProfileForm({ initialData }: StoreProfileFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<StoreProfileValues>({
    resolver: zodResolver(storeProfileSchema),
    defaultValues: {
      storeName: initialData?.storeName || "MiDuka",
      storeTagline: initialData?.storeTagline || "",
      contactEmail: initialData?.contactEmail || "",
      contactPhone: initialData?.contactPhone || "",
      whatsappNumber: initialData?.whatsappNumber || "",
      returnPolicy: initialData?.returnPolicy || "",
      aboutPage: initialData?.aboutPage || "",
      privacyPolicy: initialData?.privacyPolicy || "",
      contactPage: initialData?.contactPage || "",
      storeVertical: initialData?.storeVertical || "GENERAL",
      currency: initialData?.currency || "KES",
      currencyLocale: initialData?.currencyLocale || "en-KE",
    },
  });

  const onSubmit = async (data: StoreProfileValues) => {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to update settings");

      toast.success("Store profile updated successfully.");
    } catch (error) {
      toast.error("Something went wrong.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-3xl border-border/50 bg-card/50 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-xl">Store Profile</CardTitle>
        <CardDescription>Update your store's identity and contact information.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="storeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Name</FormLabel>
                    <FormControl>
                      <Input {...field} className="rounded-2xl border-border/50 bg-background/50 h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="storeTagline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Tagline</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Best electronics in Nairobi" className="rounded-2xl border-border/50 bg-background/50 h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Public Contact Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input {...field} className="pl-9 rounded-2xl border-border/50 bg-background/50 h-11" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input {...field} className="pl-9 rounded-2xl border-border/50 bg-background/50 h-11" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsappNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp Number (for floating button)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+254..." className="rounded-2xl border-border/50 bg-background/50 h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="storeVertical"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Vertical</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="rounded-2xl border-border/50 bg-background/50 h-11">
                          <SelectValue placeholder="Select Store Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(VERTICAL_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Determines variant dimensions and AI guidelines. Seed attributes after switching.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency Code (e.g. KES, USD)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g. KES"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        className="rounded-2xl border-border/50 bg-background/50 h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currencyLocale"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency Locale (e.g. en-KE, en-US)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g. en-KE"
                        className="rounded-2xl border-border/50 bg-background/50 h-11"
                      />
                    </FormControl>
                    <FormDescription>
                      Used to format prices correctly for buyers (BCP 47 language tag).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-6 pt-6 border-t border-border/50">
              <h3 className="text-lg font-semibold">Store Policies & Pages</h3>
              <p className="text-sm text-muted-foreground">
                Manage the content of your public store pages. You can use Markdown formatting.
              </p>

              <FormField
                control={form.control}
                name="aboutPage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About Us Page</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        rows={5} 
                        placeholder="Tell your customers about your store's history and mission..."
                        className="rounded-2xl border-border/50 bg-background/50 resize-none" 
                      />
                    </FormControl>
                    <FormDescription>Displayed on the About page.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Us Page</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        rows={5} 
                        placeholder="Add some introductory text or directions for your contact page..."
                        className="rounded-2xl border-border/50 bg-background/50 resize-none" 
                      />
                    </FormControl>
                    <FormDescription>Displayed on the Contact page.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="privacyPolicy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Privacy Policy</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        rows={5} 
                        placeholder="Detail how you handle customer data and privacy..."
                        className="rounded-2xl border-border/50 bg-background/50 resize-none" 
                      />
                    </FormControl>
                    <FormDescription>Displayed on the Privacy Policy page.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="returnPolicy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Return Policy</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        rows={5} 
                        placeholder="Describe your store's return and refund policy..."
                        className="rounded-2xl border-border/50 bg-background/50 resize-none" 
                      />
                    </FormControl>
                    <FormDescription>Displayed on product pages and the Returns Policy page.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading} className="rounded-full px-8 h-11 gap-2 shadow-lg shadow-primary/20">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
