// app/api/gift-cards/purchase/route.ts
// API route to handle gift card purchases

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import crypto from "crypto";
import { initiateStkPush, formatPhoneNumber } from "@/lib/mpesa";
import { PaymentStatus, PaymentMethod } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const { amount, recipientEmail, recipientName, senderName, paymentMethod, senderPhone } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (paymentMethod === "MPESA" && !senderPhone) {
      return NextResponse.json({ error: "Phone number is required for M-Pesa" }, { status: 400 });
    }

    // 1. Generate unique 16-character code
    const code = crypto.randomBytes(8).toString('hex').toUpperCase();

    // 2. Set expiry (1 year from now)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // 3. Create GiftCard record with PENDING status
    const giftCard = await prisma.giftCard.create({
      data: {
        code,
        initialValue: amount,
        remainingValue: amount,
        expiresAt,
        purchasedByCustomerId: session?.user?.id,
        recipientEmail,
        recipientName,
        senderName,
        isActive: false, // Inactive until paid
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: paymentMethod as PaymentMethod,
      }
    });

    // We no longer send the email here. We trigger payment, and email is sent in the webhook.

    if (paymentMethod === "MPESA") {
      try {
        const formattedPhone = formatPhoneNumber(senderPhone);
        if (process.env.MPESA_CONSUMER_KEY) {
          const stkResponse = await initiateStkPush({
            phoneNumber: formattedPhone,
            amount: Number(amount),
            accountReference: giftCard.id,
            transactionDesc: `Gift Card Purchase`,
          });

          // Save the request ID to the gift card so we can match it in the webhook
          await prisma.giftCard.update({
            where: { id: giftCard.id },
            data: { mpesaCheckoutRequestId: stkResponse.CheckoutRequestID }
          });
        } else {
          console.warn("M-Pesa credentials missing, skipping STK push for gift card", giftCard.id);
        }
      } catch (err) {
        console.error("STK Push failed for gift card:", err);
      }
    } else if (paymentMethod === "STRIPE") {
      console.log("Stripe selected for gift card", giftCard.id);
    }

    return NextResponse.json({ 
      success: true, 
      id: giftCard.id 
    });
  } catch (error: unknown) {
    console.error("[GIFT_CARD_PURCHASE_ERROR]", error);
    return NextResponse.json({ error: "Failed to process gift card purchase" }, { status: 500 });
  }
}
