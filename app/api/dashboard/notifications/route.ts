// app/api/dashboard/notifications/route.ts
// API route to fetch and manage dashboard notifications.
// STORE_OWNER only.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session || session.user?.role !== UserRole.STORE_OWNER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch existing notifications, sorted by most recent
    const notifications = await prisma.dashboardNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(notifications);
  } catch (error: unknown) {
    console.error("[GET /api/dashboard/notifications]", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session || session.user?.role !== UserRole.STORE_OWNER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, all } = await req.json();

    if (all) {
      await prisma.dashboardNotification.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      });
    } else if (id) {
      await prisma.dashboardNotification.update({
        where: { id },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[PATCH /api/dashboard/notifications]", error);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
