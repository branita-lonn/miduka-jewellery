// app/api/gift-cards/purchase/route.ts
// API route to handle gift card purchases

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import crypto from "crypto";
import { resend } from "@/lib/mail";
import { GiftCardEmail } from "@/emails/gift-card";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const { amount, recipientEmail, recipientName, senderName } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // 1. Generate unique 16-character code
    const code = crypto.randomBytes(8).toString('hex').toUpperCase();

    // 2. Set expiry (1 year from now)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // 3. Create GiftCard record
    const giftCard = await prisma.giftCard.create({
      data: {
        code,
        initialValue: amount,
        remainingValue: amount,
        expiresAt,
        purchasedByCustomerId: session?.user?.id,
        isActive: true,
      }
    });

    // 4. Send Email
    const storeSettings = await prisma.storeSettings.findFirst();
    const storeName = storeSettings?.storeName || "MiDuka";
    const targetEmail = recipientEmail || session?.user?.email;

    if (targetEmail) {
      await resend.emails.send({
        from: `MiDuka <onboarding@resend.dev>`, // Replace with verified domain in production
        to: targetEmail,
        subject: `Your ${storeName} Gift Card has arrived!`,
        react: GiftCardEmail({
          recipientName: recipientName || "Valued Customer",
          senderName: senderName || "Someone Special",
          code,
          value: amount,
          expiresAt: expiresAt.toISOString(),
          storeName,
        }),
      });
    }

    return NextResponse.json({ 
      success: true, 
      code: giftCard.code 
    });
  } catch (error: unknown) {
    console.error("[GIFT_CARD_PURCHASE_ERROR]", error);
    return NextResponse.json({ error: "Failed to process gift card purchase" }, { status: 500 });
  }
}
