// app/api/dashboard/settings/route.ts
// API route to manage store-wide settings.
// STORE_OWNER only.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

import * as z from "zod";

const settingsSchema = z.object({
  storeName: z.string().min(1).optional(),
  storeTagline: z.string().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  logoBlurDataUrl: z.string().optional().nullable(),
  faviconUrl: z.string().url().optional().nullable(),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  fontChoice: z.enum(["INTER", "POPPINS", "LATO", "NUNITO"]).optional(),
  socialLinks: z.any().optional(),
  returnPolicy: z.string().optional().nullable(),
  aboutPage: z.string().optional().nullable(),
  privacyPolicy: z.string().optional().nullable(),
  contactPage: z.string().optional().nullable(),
  whatsappNumber: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  enableStripe: z.boolean().optional(),
  enableMpesa: z.boolean().optional(),
  whatsappOrderNotifications: z.boolean().optional(),
  whatsappNotificationNumber: z.string().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  heroCarouselInterval: z.number().int().min(2000).max(30000).optional(),
  heroCarouselAutoplay: z.boolean().optional(),
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

    return NextResponse.json(updatedSettings);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("[PATCH /api/dashboard/settings]", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
