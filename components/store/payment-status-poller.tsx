"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PaymentStatus } from "@prisma/client";

export function PaymentStatusPoller({ 
  orderId, 
  initialStatus 
}: { 
  orderId: string; 
  initialStatus: PaymentStatus 
}) {
  const router = useRouter();

  useEffect(() => {
    if (initialStatus !== "PENDING") return;

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`/api/checkout/status?orderId=${orderId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.paymentStatus !== "PENDING") {
            // Status updated! Refresh the page to show the new status.
            router.refresh();
          }
        }
      } catch (err) {
        console.error("Failed to poll payment status", err);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId);
  }, [orderId, initialStatus, router]);

  return null;
}
