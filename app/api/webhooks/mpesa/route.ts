// app/api/webhooks/mpesa/route.ts
// Webhook listener for Safaricom STK Push callbacks

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentStatus, OrderStatus } from "@prisma/client";
import { sendOrderConfirmation } from "@/lib/mail";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // The STK Push callback body structure:
    // {
    //   "Body": {
    //     "stkCallback": {
    //       "MerchantRequestID": "29115-34620561-1",
    //       "CheckoutRequestID": "ws_CO_191220191020363925",
    //       "ResultCode": 0,
    //       "ResultDesc": "The service request is processed successfully.",
    //       "CallbackMetadata": {
    //         "Item": [
    //           { "Name": "Amount", "Value": 1.00 },
    //           { "Name": "MpesaReceiptNumber", "Value": "NLJ7RT61SV" },
    //           { "Name": "PhoneNumber", "Value": 254708374149 }
    //         ]
    //       }
    //     }
    //   }
    // }

    const stkCallback = body?.Body?.stkCallback;
    if (!stkCallback) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;

    // Find the order that initiated this request
    const order = await prisma.order.findFirst({
      where: { mpesaCheckoutRequestId: CheckoutRequestID },
    });

    if (!order) {
      console.warn("Received STK callback for unknown CheckoutRequestID:", CheckoutRequestID);
      return NextResponse.json({ success: true }); // Acknowledge to Safaricom anyway
    }

    // Determine status based on ResultCode (0 is success)
    if (ResultCode === 0) {
      // Extract receipt number
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

      // Trigger email confirmation
      await sendOrderConfirmation({
        email: updatedOrder.customer?.email ?? updatedOrder.guestEmail ?? "",
        orderNumber: updatedOrder.orderNumber,
        customerName: updatedOrder.customer?.name ?? updatedOrder.guestName ?? "Customer",
        totalAmount: Number(updatedOrder.total),
        shippingAddress: `${updatedOrder.shippingAddress.addressLine1}, ${updatedOrder.shippingAddress.city}`,
        orderId: updatedOrder.id,
      });
    } else {
      // Payment failed or was cancelled by user
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: PaymentStatus.FAILED,
          // We can add a note/reason using the ResultDesc if we had a field for it,
          // for now we just mark it failed.
        },
      });
      console.log(`Order ${order.id} payment failed: ${ResultDesc}`);
    }

    // Safaricom requires a success response to stop retrying
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[POST /api/webhooks/mpesa]", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
