import type { Metadata } from "next";
import { Inter, Geist, Poppins, Lato, Nunito } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import Script from "next/script";
import { PwaInstallPrompt } from "@/components/store/pwa-install-prompt";
import { OrganizationSchema } from "@/components/seo/organization-schema";
import { Analytics } from "@vercel/analytics/react";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-poppins" });
const lato = Lato({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-lato" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });

import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await prisma.storeSettings.findFirst();
  const storeName = settings?.storeName || "MiDuka";
  const tagline = settings?.storeTagline || "Your neighbourhood store, online.";

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    title: {
      default: storeName,
      template: `%s | ${storeName}`,
    },
    description: tagline,
    openGraph: {
      type: "website",
      siteName: storeName,
      locale: "en_KE",
      images: [settings?.logoUrl || "/icons/icon-512.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: storeName,
      description: tagline,
      images: [settings?.logoUrl || "/icons/icon-512.png"],
    },
    robots: {
      index: true,
      follow: true,
    },
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: storeName,
    },
    formatDetection: {
      telephone: false,
    },
    icons: {
      apple: "/icons/icon-192.png",
    },
  };
}

export const viewport = {
  themeColor: "#3B82F6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await prisma.storeSettings.findFirst();
  const socialLinks = (settings?.socialLinks as any) || {};

  // Extract your dynamic properties with fallback values
  const storeName = settings?.storeName || "MiDuka";
  const logoUrl = settings?.logoUrl || "/icons/icon-192.png";

  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <head>
        <Script id="theme-script" strategy="beforeInteractive">
          {`
            try {
              if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark')
              } else {
                document.documentElement.classList.remove('dark')
              }
            } catch (_) {}
          `}
        </Script>
      </head>
      <body className={`${inter.variable} ${poppins.variable} ${lato.variable} ${nunito.variable} bg-background text-foreground`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:px-4 focus:py-2 focus:rounded-full focus:shadow-lg"
        >
          Skip to main content
        </a>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <OrganizationSchema
              storeName={settings?.storeName}
              storeTagline={settings?.storeTagline || undefined}
              storeLogoUrl={settings?.logoUrl}
              whatsappNumber={settings?.whatsappNumber}
              facebookUrl={socialLinks.facebook}
              instagramUrl={socialLinks.instagram}
              twitterUrl={socialLinks.twitter}
            />
            {children}
            <Toaster position="bottom-right" />

            {/* 2. Pass the dynamic settings variables here */}
            <PwaInstallPrompt storeName={storeName} logoUrl={logoUrl} />

          </ThemeProvider>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
