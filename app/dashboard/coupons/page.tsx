// app/dashboard/coupons/page.tsx
// Main coupon management page for the seller dashboard.
// Fetches coupons server-side and renders the client management table.

import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { CouponsClient } from "@/components/dashboard/coupons-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Coupon Management | Dashboard",
};

async function getCoupons() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  });
  
  // Serialize Decimal to Number for the client component
  return coupons.map(c => ({
    ...c,
    value: Number(c.value),
    minimumOrderAmount: c.minimumOrderAmount ? Number(c.minimumOrderAmount) : null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
  }));
}

export default async function CouponsPage() {
  const coupons = await getCoupons();

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <Suspense fallback={<CouponsSkeleton />}>
        <CouponsClient initialCoupons={coupons} />
      </Suspense>
    </div>
  );
}

function CouponsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-[250px] rounded-full" />
          <Skeleton className="h-4 w-[350px] rounded-full" />
        </div>
        <Skeleton className="h-10 w-[120px] rounded-full" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-3xl" />
        ))}
      </div>
      <Skeleton className="h-[400px] w-full rounded-3xl" />
    </div>
  );
}
