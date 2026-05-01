// lib/mail.ts
// Utility for sending transactional emails

import { Resend } from "resend";
import { OrderConfirmationEmail } from "@/emails/OrderConfirmation";
import { OrderStatusUpdateEmail } from "@/emails/order-status-update";
import React from "react";
import { OrderStatus } from "@prisma/client";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendOrderConfirmationParams {
  email: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  shippingAddress: string;
  orderId: string;
}

export async function sendOrderConfirmation({
  email,
  orderNumber,
  customerName,
  totalAmount,
  shippingAddress,
  orderId,
}: SendOrderConfirmationParams) {
  try {
    const statusUrl = `${process.env.NEXTAUTH_URL}/checkout/success/${orderId}`;
    
    await resend.emails.send({
      from: "MiDuka <orders@miduka.com>", // You must verify this domain in Resend
      to: email,
      subject: `Order Confirmed: ${orderNumber}`,
      react: React.createElement(OrderConfirmationEmail, {
        orderNumber,
        customerName,
        totalAmount,
        shippingAddress,
        statusUrl,
      }),
    });
  } catch (error) {
    console.error("Failed to send order confirmation email:", error);
    // We don't throw here to avoid failing the whole checkout/webhook flow
  }
}

interface SendOrderStatusUpdateParams {
  email: string;
  orderNumber: string;
  customerName: string;
  status: OrderStatus;
  orderId: string;
}

export async function sendOrderStatusUpdate({
  email,
  orderNumber,
  customerName,
  status,
  orderId,
}: SendOrderStatusUpdateParams) {
  try {
    const statusUrl = `${process.env.NEXTAUTH_URL}/account/orders/${orderId}`;
    
    await resend.emails.send({
      from: "MiDuka <orders@miduka.com>",
      to: email,
      subject: `Order Update: ${orderNumber} is now ${status.replace("_", " ")}`,
      react: React.createElement(OrderStatusUpdateEmail, {
        orderNumber,
        customerName,
        status,
        statusUrl,
      }),
    });
  } catch (error) {
    console.error("Failed to send order status update email:", error);
  }
}
