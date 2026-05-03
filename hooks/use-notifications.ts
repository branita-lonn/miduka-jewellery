// hooks/use-notifications.ts
// Shared hook so both the bell badge and NotificationCenter
// stay in sync without prop drilling or a context provider.

import { useState, useEffect, useCallback } from "react";

export interface DashboardNotification {
  id: string;
  type: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard/notifications");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll every 2 minutes
    const interval = setInterval(fetchNotifications, 120000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markRead = useCallback(async (id: string | null = null) => {
    try {
      const response = await fetch("/api/dashboard/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id } : { all: true }),
      });
      if (!response.ok) throw new Error("Failed to update");

      if (id) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch {
      throw new Error("Failed to update notifications.");
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return { notifications, loading, unreadCount, markRead, refetch: fetchNotifications };
}