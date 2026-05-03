// app/dashboard/settings/page.tsx
// Store settings and operations dashboard.

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { StoreProfileForm } from "@/components/dashboard/settings/store-profile-form";
import { BusinessHoursConfig } from "@/components/dashboard/settings/business-hours-config";
import { BrandingForm } from "@/components/dashboard/settings/branding-form";
import { ThemeConfig } from "@/components/dashboard/settings/theme-config";
import { ContentManager } from "@/components/dashboard/settings/content-manager";
import { PaymentSettings } from "@/components/dashboard/settings/payment-settings";
import { NotificationSettings } from "@/components/dashboard/settings/notification-settings";
import { SocialLinksForm } from "@/components/dashboard/settings/social-links-form";
import { NotificationCenter } from "@/components/dashboard/notifications/notification-center";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Clock, 
  Bell, 
  Share2, 
  Image as ImageIcon, 
  Palette, 
  Layout, 
  CreditCard,
  MessageSquare
} from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();

  if (!session || session.user?.role !== UserRole.STORE_OWNER) {
    redirect("/auth/login");
  }

  const settings = await prisma.storeSettings.findFirst();
  const serializedSettings = settings ? JSON.parse(JSON.stringify(settings)) : null;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings & Operations</h1>
        <p className="text-muted-foreground text-sm md:text-base">Manage your store identity, look & feel, and business rules.</p>
      </div>

      <div className="flex flex-col lg:grid lg:gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-6 min-w-0">
          <Tabs defaultValue="profile" className="w-full">
            {/* Scrollable tab bar — hides scrollbar on all browsers */}
            <div className="w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <TabsList className="bg-muted/50 rounded-2xl p-1 inline-flex w-max min-w-full sm:min-w-0">
                <TabsTrigger value="profile" className="rounded-xl px-3 sm:px-6 py-2 gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                  <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="branding" className="rounded-xl px-3 sm:px-6 py-2 gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                  <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  Branding
                </TabsTrigger>
                <TabsTrigger value="theme" className="rounded-xl px-3 sm:px-6 py-2 gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                  <Palette className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  Theme
                </TabsTrigger>
                <TabsTrigger value="content" className="rounded-xl px-3 sm:px-6 py-2 gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                  <Layout className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="payments" className="rounded-xl px-3 sm:px-6 py-2 gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                  <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  Payments
                </TabsTrigger>
                <TabsTrigger value="notifications" className="rounded-xl px-3 sm:px-6 py-2 gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                  <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="hours" className="rounded-xl px-3 sm:px-6 py-2 gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  Hours
                </TabsTrigger>
                <TabsTrigger value="social" className="rounded-xl px-3 sm:px-6 py-2 gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                  <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  Social
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="profile" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <StoreProfileForm initialData={serializedSettings} />
            </TabsContent>

            <TabsContent value="branding" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <BrandingForm initialData={serializedSettings} />
            </TabsContent>

            <TabsContent value="theme" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <ThemeConfig initialData={serializedSettings} />
            </TabsContent>

            <TabsContent value="content" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <ContentManager initialData={serializedSettings} />
            </TabsContent>

            <TabsContent value="payments" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <PaymentSettings initialData={serializedSettings} />
            </TabsContent>

            <TabsContent value="notifications" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <NotificationSettings initialData={serializedSettings} />
            </TabsContent>

            <TabsContent value="hours" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <BusinessHoursConfig initialData={serializedSettings} />
            </TabsContent>

            <TabsContent value="social" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <SocialLinksForm initialData={serializedSettings} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}