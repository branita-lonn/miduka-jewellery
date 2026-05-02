// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { PaymentStatus, OrderStatus } from "@prisma/client";
import { sendOrderConfirmation } from "@/lib/mail";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("Stripe-Signature") as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`[STRIPE WEBHOOK ERROR] ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const session = event.data.object as any;

  // Handle successful checkout
  if (event.type === "checkout.session.completed") {
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      return new NextResponse("Order ID missing in metadata", { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        status: OrderStatus.CONFIRMED,
        stripePaymentIntentId: session.payment_intent as string,
      },
      include: { shippingAddress: true, customer: true },
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
  }

  // Handle payment failure
  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as any;
    const order = await prisma.order.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (order) {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: PaymentStatus.FAILED },
      });
    }
  }

  return new NextResponse(null, { status: 200 });
}
