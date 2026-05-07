import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentStatus, OrderStatus } from "@prisma/client";
import { sendOrderConfirmation, resend } from "@/lib/mail";
import { render } from "@react-email/components";
import React from "react";
import { GiftCardEmail } from "@/emails/gift-card";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const stkCallback = body?.Body?.stkCallback;
    if (!stkCallback) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;

    // First try to find an Order
    const order = await prisma.order.findFirst({
      where: { mpesaCheckoutRequestId: CheckoutRequestID },
    });

    if (order) {
      if (ResultCode === 0) {
        const metadataItems = stkCallback.CallbackMetadata?.Item || [];
        const receiptItem = metadataItems.find((i: any) => i.Name === "MpesaReceiptNumber");
        const mpesaReceipt = receiptItem?.Value?.toString();

        const updatedOrder = await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: PaymentStatus.PAID,
            status: OrderStatus.CONFIRMED,
            mpesaReceiptNumber: mpesaReceipt,
          },
          include: { shippingAddress: true, customer: true }
        });

        await sendOrderConfirmation({
          email: updatedOrder.customer?.email ?? updatedOrder.guestEmail ?? "",
          orderNumber: updatedOrder.orderNumber,
          customerName: updatedOrder.customer?.name ?? updatedOrder.guestName ?? "Customer",
          totalAmount: Number(updatedOrder.total),
          shippingAddress: `${updatedOrder.shippingAddress.addressLine1}, ${updatedOrder.shippingAddress.city}`,
          orderId: updatedOrder.id,
        });
      } else {
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: PaymentStatus.FAILED },
        });
        console.log(`Order ${order.id} payment failed: ${ResultDesc}`);
      }
      return NextResponse.json({ success: true });
    }

    // If no order, try to find a GiftCard
    const giftCard = await prisma.giftCard.findFirst({
      where: { mpesaCheckoutRequestId: CheckoutRequestID },
    });

    if (giftCard) {
      if (ResultCode === 0) {
        const updatedGiftCard = await prisma.giftCard.update({
          where: { id: giftCard.id },
          data: {
            paymentStatus: PaymentStatus.PAID,
            isActive: true,
          },
        });

        const storeSettings = await prisma.storeSettings.findFirst();
        const storeName = storeSettings?.storeName || "MiDuka";

        // Find customer email if recipientEmail is not set, or we can use the customer's email if they were logged in
        let targetEmail = giftCard.recipientEmail;
        if (!targetEmail && giftCard.purchasedByCustomerId) {
          const customer = await prisma.user.findUnique({ where: { id: giftCard.purchasedByCustomerId } });
          targetEmail = customer?.email ?? null;
        }

        if (targetEmail) {
          const html = await render(
            React.createElement(GiftCardEmail, {
              recipientName: giftCard.recipientName || "Valued Customer",
              senderName: giftCard.senderName || "Someone Special",
              code: updatedGiftCard.code,
              value: Number(updatedGiftCard.initialValue),
              expiresAt: updatedGiftCard.expiresAt?.toISOString() || new Date().toISOString(),
              storeName,
            })
          );

          await resend.emails.send({
            from: `MiDuka <onboarding@resend.dev>`, // Replace with verified domain in production
            to: targetEmail,
            subject: `Your ${storeName} Gift Card has arrived!`,
            html,
          });
        }
      } else {
        await prisma.giftCard.update({
          where: { id: giftCard.id },
          data: { paymentStatus: PaymentStatus.FAILED },
        });
        console.log(`GiftCard ${giftCard.id} payment failed: ${ResultDesc}`);
      }
      return NextResponse.json({ success: true });
    }

    console.warn("Received STK callback for unknown CheckoutRequestID:", CheckoutRequestID);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[POST /api/webhooks/mpesa]", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
