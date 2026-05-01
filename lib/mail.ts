// lib/mail.ts
// Utility for sending transactional emails

import { Resend } from "resend";
import { OrderConfirmationEmail } from "@/emails/OrderConfirmation";
import React from "react";

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
