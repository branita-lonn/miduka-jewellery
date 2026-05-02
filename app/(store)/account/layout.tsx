// file: app/(store)/account/layout.tsx
// purpose: Provide SEO metadata for the account route to prevent indexing

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Account | MiDuka",
  robots: {
    index: false,
    follow: false,
  },
};

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AccountSidebar from "@/components/store/account-sidebar";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/account");
  }

  const customer = {
    name: session.user.name ?? null,
    email: session.user.email ?? null,
  };

  return (
    <div className="container mx-auto py-6 lg:py-10 px-4 md:px-8">
      <div className="flex flex-row gap-4 lg:gap-8">
        <aside className="shrink-0 z-30">
          <AccountSidebar customer={customer} />
        </aside>
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
