// app/api/dashboard/settings/route.ts
// API route to manage store-wide settings.
// STORE_OWNER only.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { invalidateStoreSettingsCache } from "@/lib/store-settings-cache";

import * as z from "zod";

const settingsSchema = z.object({
  storeName: z.string().min(1).optional(),
  storeTagline: z.string().optional().nullable(),
  logoUrl: z.preprocess((val) => val === "" ? null : val, z.string().url().nullable().optional()).optional(),
  logoBlurDataUrl: z.string().optional().nullable(),
  faviconUrl: z.preprocess((val) => val === "" ? null : val, z.string().url().nullable().optional()).optional(),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  fontChoice: z.enum(["INTER", "POPPINS", "LATO", "NUNITO"]).optional(),
  socialLinks: z.any().optional(),
  returnPolicy: z.string().optional().nullable(),
  aboutPage: z.string().optional().nullable(),
  privacyPolicy: z.string().optional().nullable(),
  contactPage: z.string().optional().nullable(),
  whatsappNumber: z.string().optional().nullable(),
  contactEmail: z.preprocess((val) => val === "" ? null : val, z.string().email().nullable().optional()).optional(),
  contactPhone: z.string().optional().nullable(),
  enableStripe: z.boolean().optional(),
  enableMpesa: z.boolean().optional(),
  whatsappOrderNotifications: z.boolean().optional(),
  whatsappNotificationNumber: z.string().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  heroCarouselInterval: z.number().int().min(2000).max(30000).optional(),
  heroCarouselAutoplay: z.boolean().optional(),
  storeVertical: z.enum(["FASHION", "ELECTRONICS", "GADGETS", "BEAUTY", "JEWELLERY", "FRESH_PRODUCE", "GENERAL"]).optional(),
  currency: z.string().min(1).max(5).optional(),
  currencyLocale: z.string().min(2).max(10).optional(),
});

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session || session.user?.role !== UserRole.STORE_OWNER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.storeSettings.findFirst();

    return NextResponse.json(settings || {});
  } catch (error: unknown) {
    console.error("[GET /api/dashboard/settings]", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session || session.user?.role !== UserRole.STORE_OWNER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = settingsSchema.parse(body);

    const settings = await prisma.storeSettings.findFirst();

    let updatedSettings;

    if (settings) {
      updatedSettings = await prisma.storeSettings.update({
        where: { id: settings.id },
        data: validatedData,
      });
    } else {
      updatedSettings = await prisma.storeSettings.create({
        data: validatedData as any,
      });
    }

    // Invalidate server cache
    invalidateStoreSettingsCache();

    return NextResponse.json(updatedSettings);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      console.error("Zod Validation Error on settings update:", error.issues);
      return NextResponse.json({ error: `${error.issues[0].path.join(".")}: ${error.issues[0].message}` }, { status: 400 });
    }
    console.error("[PATCH /api/dashboard/settings]", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
