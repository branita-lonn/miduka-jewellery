import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600; // ISR: 1 hour

export async function generateMetadata(): Promise<Metadata> {
  const settings = await prisma.storeSettings.findFirst();
  const content = settings?.aboutPage || "";

  return {
    title: "About Us",
    description: content ? content.substring(0, 155) : "About Us",
  };
}

export default async function AboutPage() {
  const settings = await prisma.storeSettings.findFirst();
  const content = settings?.aboutPage;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          </li>
          <li>
            <span aria-hidden="true">→</span>
          </li>
          <li aria-current="page" className="text-foreground font-medium">
            About Us
          </li>
        </ol>
      </nav>
      <div className="prose dark:prose-invert max-w-none">
        {content ? (
          <ReactMarkdown>{content}</ReactMarkdown>
        ) : (
          <p>Policy not yet defined.</p>
        )}
      </div>
    </div>
  );
}
