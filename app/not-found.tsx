// app/not-found.tsx
// Custom 404 page

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4">
      <h1 className="text-8xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Sorry, the page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" className={buttonVariants() + " rounded-4xl px-8"}>Back to Home</Link>
    </div>
  );
}
