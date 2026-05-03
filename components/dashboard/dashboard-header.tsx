// components/dashboard/dashboard-header.tsx

"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { User, LogOut, Bell } from "lucide-react";
import { signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NotificationCenter } from "@/components/dashboard/notifications/notification-center";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

export function DashboardHeader({ userName }: { userName: string }) {
  // Only need unreadCount here — NotificationCenter runs its own
  // instance of the hook, both poll independently at the same interval
  // so they stay in sync without any prop passing.
  const { unreadCount } = useNotifications();

  return (
    <div className="flex items-center gap-3">
      <ThemeToggle />

      {/* Bell → opens NotificationCenter in a popover */}
      <Popover>
        <PopoverTrigger
          className={cn(
            "hidden sm:inline-flex items-center justify-center rounded-full relative",
            "h-9 w-9 border border-transparent bg-transparent",
            "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <Bell className="h-5 w-5" />
          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <NotificationCenter />
        </PopoverContent>
      </Popover>

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "inline-flex items-center justify-center rounded-full",
            "h-9 w-9 bg-muted",
            "hover:bg-muted/80 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <User className="h-5 w-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{userName}</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/" className="cursor-pointer">
              View Storefront
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => void signOut({ callbackUrl: "/auth/login" })}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}