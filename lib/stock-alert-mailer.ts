// lib/stock-alert-mailer.ts
// Utility for sending back-in-stock notifications

import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import React from "react";
import BackInStockEmail from "@/emails/back-in-stock";
import { formatCurrency } from "@/lib/utils";
import { render } from "@react-email/components";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBackInStockNotifications(productId: string, variantId?: string) {
  try {
    // 1. Find the product and all active alerts
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: { take: 1, orderBy: { sortOrder: "asc" } },
      },
    });

    if (!product) return;

    const alerts = await prisma.stockAlert.findMany({
      where: {
        productId,
        variantId: variantId || null,
        isNotified: false,
      },
    });

    if (alerts.length === 0) return;

    const productUrl = `${process.env.NEXTAUTH_URL}/products/${product.slug}`;
    const productPrice = formatCurrency(Number(product.price));
    const productImage = product.images[0]?.url || null;

    // 2. Send emails in batches (Resend supports multiple recipients or individual calls)
    // For free tier and simplicity, we'll do individual calls but we could optimize
    const emailPromises = alerts.map(async (alert) => {
      const html = await render(
        React.createElement(BackInStockEmail, {
          productName: product.name,
          productImage,
          productPrice,
          productUrl,
        })
      );

      return resend.emails.send({
        from: "MiDuka <updates@miduka.com>", // Ensure domain is verified
        to: alert.email,
        subject: `Good news! ${product.name} is back in stock`,
        html,
      });
    });

    await Promise.allSettled(emailPromises);

    // 3. Mark alerts as notified
    await prisma.stockAlert.updateMany({
      where: {
        id: { in: alerts.map(a => a.id) },
      },
      data: {
        isNotified: true,
      },
    });

    console.log(`Sent ${alerts.length} back-in-stock notifications for product ${productId}`);
  } catch (error) {
    console.error("Failed to send back-in-stock notifications:", error);
  }
}
