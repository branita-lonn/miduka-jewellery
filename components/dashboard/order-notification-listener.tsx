// components/dashboard/order-notification-listener.tsx
// Client component to listen for real-time order notifications via Socket.io.
// Plays a notification sound and shows a sonner toast for new orders.

"use client";

import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

export function OrderNotificationListener() {
  const router = useRouter();

  useEffect(() => {
    let socket: Socket;

    try {
      socket = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
      });

      socket.on("connect", () => {
        console.log("Dashboard connected to Socket.io server");
        // Register as a store owner to receive relevant events
        socket.emit("register_owner");
      });

      socket.on("new_order", (order: { 
        orderId: string; 
        orderNumber: string; 
        total: number; 
        customerName: string; 
      }) => {
        // 1. Play "cha-ching" sound
        console.log("Attempting to play notification sound...");
        const audio = new Audio("/sounds/order.mp3");
        audio.play()
          .then(() => console.log("Notification sound played successfully"))
          .catch(e => {
            console.warn("Audio play failed. Ensure /public/sounds/order.mp3 exists and browser allows autoplay.", e);
          });

        // 2. Show Sonner toast
        toast.info("New Order! 🛍️", {
          description: `${order.orderNumber} — ${formatCurrency(order.total)} from ${order.customerName}`,
          duration: 10000,
          action: {
            label: "View Order",
            onClick: () => router.push(`/dashboard/orders/${order.orderId}`),
          },
        });

        // 3. Optional: Refresh dashboard data if on analytics/orders page
        // router.refresh();
      });

      socket.on("connect_error", (err) => {
        console.warn("Dashboard socket connection failed. Operational data is still safe.", err.message);
      });

      return () => {
        socket.disconnect();
      };
    } catch (error) {
      console.error("Socket initialization failed:", error);
    }
  }, [router]);

  return null; // This is a logic-only component
}
