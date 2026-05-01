// lib/loyalty.ts
// Utility functions for loyalty points earning and redemption

import { prisma } from "@/lib/prisma";
import { LoyaltyTransactionType } from "@prisma/client";

export async function getLoyaltySettings() {
  const settings = await prisma.storeSettings.findFirst({
    select: {
      loyaltyPointsPerKes: true,
      loyaltyRedemptionRate: true,
    },
  });
  return settings || { loyaltyPointsPerKes: 1, loyaltyRedemptionRate: 100 };
}

/**
 * Adds loyalty points to a customer's account based on their order total.
 */
export async function earnPoints(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order || !order.customerId) return;

  const settings = await getLoyaltySettings();
  const pointsToEarn = Math.floor(Number(order.total) * settings.loyaltyPointsPerKes);

  if (pointsToEarn <= 0) return;

  return await prisma.$transaction(async (tx) => {
    // Ensure loyalty account exists
    let account = await tx.loyaltyAccount.findUnique({
      where: { customerId: order.customerId! },
    });

    if (!account) {
      account = await tx.loyaltyAccount.create({
        data: { customerId: order.customerId! },
      });
    }

    // Update account
    await tx.loyaltyAccount.update({
      where: { id: account.id },
      data: {
        points: { increment: pointsToEarn },
        lifetimePoints: { increment: pointsToEarn },
      },
    });

    // Create transaction
    await tx.loyaltyTransaction.create({
      data: {
        loyaltyAccountId: account.id,
        type: LoyaltyTransactionType.EARN,
        points: pointsToEarn,
        orderId: order.id,
        description: `Earned from order #${order.id.slice(-6).toUpperCase()}`,
      },
    });

    // Update order record
    await tx.order.update({
      where: { id: order.id },
      data: { loyaltyPointsEarned: pointsToEarn },
    });
  });
}

/**
 * Deducts points and returns the KES value for discount.
 */
export async function redeemPoints(customerId: string, points: number) {
  if (points <= 0) throw new Error("Points must be positive");

  const account = await prisma.loyaltyAccount.findUnique({
    where: { customerId },
  });

  if (!account || account.points < points) {
    throw new Error("Insufficient points");
  }

  const settings = await getLoyaltySettings();
  const kesValue = points / settings.loyaltyRedemptionRate;

  return await prisma.$transaction(async (tx) => {
    await tx.loyaltyAccount.update({
      where: { id: account.id },
      data: { points: { decrement: points } },
    });

    await tx.loyaltyTransaction.create({
      data: {
        loyaltyAccountId: account.id,
        type: LoyaltyTransactionType.REDEEM,
        points: -points,
        description: `Redeemed for KES ${kesValue} discount`,
      },
    });

    return kesValue;
  });
}

/**
 * Gets a customer's loyalty account and transaction history.
 */
export async function getLoyaltyAccount(customerId: string) {
  return await prisma.loyaltyAccount.findUnique({
    where: { customerId },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 20,
      }
    }
  });
}
