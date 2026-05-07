import { Metadata } from "next";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { prisma } from "@/lib/prisma";
import { Mail, Phone, MessageCircle } from "lucide-react";

export const revalidate = 3600; // ISR: 1 hour

export async function generateMetadata(): Promise<Metadata> {
  const settings = await prisma.storeSettings.findFirst();
  const content = settings?.contactPage || "";

  return {
    title: "Contact Us",
    description: content ? content.substring(0, 155) : "Contact Us",
  };
}

export default async function ContactPage() {
  const settings = await prisma.storeSettings.findFirst();
  const content = settings?.contactPage;
  const email = settings?.contactEmail;
  const phone = settings?.contactPhone;
  const whatsapp = settings?.whatsappNumber;

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
            Contact Us
          </li>
        </ol>
      </nav>
      
      <div className="grid md:grid-cols-2 gap-12">
        <div className="prose dark:prose-invert max-w-none">
          {content ? (
            <ReactMarkdown>{content}</ReactMarkdown>
          ) : (
            <p>Get in touch with us using the contact details provided.</p>
          )}
        </div>
        
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Contact Information</h3>
          <ul className="space-y-4">
            {email && (
              <li className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-full text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a href={`mailto:${email}`} className="font-medium hover:underline">{email}</a>
                </div>
              </li>
            )}
            {phone && (
              <li className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-full text-primary">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <a href={`tel:${phone}`} className="font-medium hover:underline">{phone}</a>
                </div>
              </li>
            )}
            {whatsapp && (
              <li className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-full text-primary">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">WhatsApp</p>
                  <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`} className="font-medium hover:underline" target="_blank" rel="noopener noreferrer">{whatsapp}</a>
                </div>
              </li>
            )}
            {!email && !phone && !whatsapp && (
              <li className="text-muted-foreground italic">No contact information available.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
