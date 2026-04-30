// app/dashboard/layout.tsx
// Seller dashboard layout

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { LayoutDashboard, Package, Tags, ShoppingCart, Users, BarChart, Settings, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/categories", label: "Categories", icon: Tags },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart },
  { href: "/dashboard/settings", label: "Store Settings", icon: Settings },
];

function SidebarContent({ storeName }: { storeName: string }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-6 border-b border-border">
        <span className="text-xl font-bold text-primary">{storeName}</span>
      </div>
      <div className="flex-1 py-4 space-y-1 overflow-y-auto">
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </div>
      <div className="p-4 border-t border-border">
        <Link
          href="/"
          className="flex w-full items-center justify-center gap-2 rounded-4xl bg-muted px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          View Store
        </Link>
      </div>
    </div>
  );
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session || session.user.role !== "STORE_OWNER") {
    redirect("/auth/login");
  }

  const storeSettings = await prisma.storeSettings.findFirst();
  const storeName = storeSettings?.storeName || "MiDuka";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r border-border bg-card md:block">
        <SidebarContent storeName={storeName} />
      </aside>

      {/* Mobile Header & Sidebar */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:hidden">
          <span className="text-xl font-bold text-primary">{storeName}</span>
          <Sheet>
            <SheetTrigger className="md:hidden flex h-10 w-10 items-center justify-center rounded-md hover:bg-muted hover:text-foreground transition-colors">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent storeName={storeName} />
            </SheetContent>
          </Sheet>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
