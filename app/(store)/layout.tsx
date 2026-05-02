// app/(store)/layout.tsx
// Public store layout — wraps all buyer-facing pages with CartProvider, header, footer, and mobile nav

import StoreHeaderServer from "@/components/store/store-header-server";
import StoreFooter from "@/components/store/store-footer";
import MobileBottomNav from "@/components/store/mobile-bottom-nav";
import CartProvider from "@/components/store/cart-provider";
import CartDrawer from "@/components/store/cart-drawer";
import WishlistProvider from "@/components/store/wishlist-provider";
import { PwaInstallPrompt } from "@/components/store/pwa-install-prompt";
import { ChatWidget } from "@/components/store/chat-widget";
import { prisma } from "@/lib/prisma";
import { hexToHsl, getContrastColor } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await prisma.storeSettings.findFirst({
    select: {
      metaTitle: true,
      metaDescription: true,
      storeName: true,
    }
  });

  return {
    title: settings?.metaTitle || settings?.storeName || "MiDuka",
    description: settings?.metaDescription || "Your neighbourhood store, online.",
  };
}

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await prisma.storeSettings.findFirst({
    select: { 
      storeName: true,
      accentColor: true,
      fontChoice: true,
    }
  });

  const accentColor = settings?.accentColor || "#3B82F6";
  const primaryHsl = hexToHsl(accentColor);
  const primaryForegroundHsl = getContrastColor(accentColor);
  const fontClass = settings?.fontChoice === "POPPINS" ? "font-poppins" : 
                    settings?.fontChoice === "LATO" ? "font-lato" :
                    settings?.fontChoice === "NUNITO" ? "font-nunito" : "font-sans";

  return (
    <CartProvider>
      <WishlistProvider>
        <div 
          className={cn("min-h-screen flex flex-col bg-background", fontClass)}
          style={{ 
            "--primary": primaryHsl,
            "--primary-foreground": primaryForegroundHsl 
          } as React.CSSProperties}
        >
        <StoreHeaderServer />
        <CartDrawer />
        {/* pb-16 on mobile reserves space for the fixed bottom nav */}
        {/* A11Y: Added main-content id for skip link */}
        <main id="main-content" className="flex-1 pb-16 md:pb-0">{children}</main>
        <StoreFooter />
        <MobileBottomNav />
        <PwaInstallPrompt />
        <ChatWidget storeName={settings?.storeName ?? "MiDuka"} />
      </div>
      </WishlistProvider>
    </CartProvider>
  );
}
