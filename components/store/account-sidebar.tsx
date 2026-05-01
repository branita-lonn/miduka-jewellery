// components/store/account-sidebar.tsx
// Account navigation sidebar for logged-in customers

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Package, 
  Heart, 
  MapPin, 
  User, 
  ChevronRight,
  Coins
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "My Orders",
    href: "/account/orders",
    icon: Package,
  },
  {
    title: "Wishlist",
    href: "/account/wishlist",
    icon: Heart,
  },
  {
    title: "Loyalty Points",
    href: "/account/loyalty",
    icon: Coins,
  },
  {
    title: "Addresses",
    href: "/account/addresses",
    icon: MapPin,
  },
  {
    title: "Profile Settings",
    href: "/account/profile",
    icon: User,
  },
];

interface AccountSidebarProps {
  customer: {
    name: string | null;
    email: string | null;
  };
}

export default function AccountSidebar({ customer }: AccountSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-card border rounded-3xl overflow-hidden shadow-sm">
      {/* Customer Info Header */}
      <div className="p-6 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {customer.name?.[0]?.toUpperCase() || customer.email?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex flex-col min-w-0">
            <p className="font-semibold truncate text-sm">
              {customer.name || "Customer"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {customer.email}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 group",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn(
                      "w-4 h-4 transition-colors",
                      isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                    )} />
                    {item.title}
                  </div>
                  <ChevronRight className={cn(
                    "w-3 h-3 transition-transform duration-200",
                    isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                  )} />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
