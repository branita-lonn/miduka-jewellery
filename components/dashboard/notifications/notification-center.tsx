// components/dashboard/notifications/notification-center.tsx
// Component to display real-time operational alerts for the seller.

"use client";

import { 
  Bell, 
  Check, 
  Package, 
  AlertTriangle, 
  ExternalLink,
  Loader2,
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNotifications } from "@/hooks/use-notifications";

export function NotificationCenter() {
  const { notifications, loading, unreadCount, markRead } = useNotifications();

  const handleMarkRead = async (id: string | null = null) => {
    try {
      await markRead(id);
      if (!id) toast.success("All notifications marked as read.");
    } catch {
      toast.error("Failed to update notifications.");
    }
  };

  return (
    <Card className=" border-border/50 bg-card/50 shadow-sm overflow-hidden h-full flex flex-col">
      <CardHeader className="bg-muted/30 flex flex-row items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="h-5 w-5 text-primary" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-rose-500 rounded-full border border-background" />
            )}
          </div>
          <div>
            <CardTitle className="text-lg">Notifications</CardTitle>
            <CardDescription className="text-[10px] uppercase tracking-wider">Operational Alerts</CardDescription>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => handleMarkRead()} className="text-[10px] h-7 rounded-full gap-1">
            <Check className="h-3 w-3" />
            Mark all read
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[200px] gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-xs">Checking for alerts...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] gap-2 text-muted-foreground px-6 text-center">
              <Bell className="h-8 w-8 opacity-20" />
              <p className="text-xs italic">All clear! No new notifications.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    "p-4 flex gap-3 transition-colors group relative",
                    !notif.isRead ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/20"
                  )}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                    notif.type === "NEW_ORDER" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                  )}>
                    {notif.type === "NEW_ORDER" ? <Package className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {notif.type.replace("_", " ")}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className={cn("text-xs leading-snug", !notif.isRead ? "font-bold" : "text-muted-foreground")}>
                      {notif.message}
                    </p>
                    {notif.link && (
                      <Link href={notif.link} className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline font-medium">
                        View details
                        <ExternalLink className="h-2 w-2" />
                      </Link>
                    )}
                  </div>
                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      className="opacity-0 group-hover:opacity-100 absolute top-4 right-4 p-1 hover:bg-background rounded-full transition-opacity"
                    >
                      <Check className="h-3 w-3 text-emerald-500" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="bg-muted/10 py-3 flex justify-center border-t border-border/30">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">End of alerts</p>
      </CardFooter>
    </Card>
  );
}