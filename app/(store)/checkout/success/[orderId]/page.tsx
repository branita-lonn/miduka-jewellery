// app/(store)/checkout/success/[orderId]/page.tsx
// Order Confirmation Page

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle2, Package, MapPin, CreditCard, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { sendWhatsAppOrderConfirmation } from "@/lib/whatsapp";

export default async function CheckoutSuccessPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      shippingAddress: true,
      items: {
        include: {
          product: { include: { images: { take: 1, orderBy: { sortOrder: "asc" } } } },
          variant: true,
        },
      },
    },
  });

  const settings = await prisma.storeSettings.findFirst();

  if (!order) return notFound();

  return (
    <div className="container max-w-4xl mx-auto px-4 py-16">
      <div className="flex flex-col items-center text-center gap-4 mb-12">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Order Confirmed!</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Thank you for your purchase, {(order.customer?.name ?? order.guestName ?? "Guest").split(" ")[0]}.
          </p>
          <p className="text-sm font-medium mt-1">
            Order #{order.id.slice(-8).toUpperCase()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Col: Details */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" /> Order Details
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{order.createdAt.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{order.customer?.email ?? order.guestEmail}</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Shipping Info
            </h2>
            <div className="text-sm">
              <p>{order.customer?.name ?? order.guestName}</p>
              <p className="text-muted-foreground">{order.shippingAddress.phone ?? order.guestPhone}</p>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                {order.shippingAddress.addressLine1} {order.shippingAddress.addressLine2}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.county} {order.shippingAddress.postalCode}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" /> Payment
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="font-medium">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${
                  order.paymentStatus === "PAID" 
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : order.paymentStatus === "FAILED"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
              
              {order.paymentMethod === "MPESA" && order.paymentStatus === "PENDING" && (
                <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
                  <p className="font-semibold mb-1">Waiting for M-Pesa Payment</p>
                  <p>Please check your phone and enter your PIN. Once paid, refresh this page.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Summary */}
        <div>
          <div className="rounded-3xl border border-border bg-card p-6 space-y-6">
            <h2 className="text-lg font-bold">Order Summary</h2>
            
            <div className="space-y-4 divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 pt-4 first:pt-0">
                  <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-muted border border-border flex-shrink-0">
                    {/* Placeholder for image - standard Next.js Image would go here but we skipped pulling it for brevity */}
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground z-10 shadow-sm border border-background">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium line-clamp-2">{item.product.name}</p>
                    {item.variant && (
                      <p className="text-muted-foreground text-xs">
                        {[item.variant.colour, item.variant.size].filter(Boolean).join(" / ")}
                      </p>
                    )}
                  </div>
                  <div className="text-sm font-medium">
                    {formatCurrency(Number(item.unitPrice) * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-sm border-t border-border pt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(Number(order.subtotal))}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount</span>
                  <span>−{formatCurrency(Number(order.discountAmount))}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatCurrency(Number(order.shippingCost))}</span>
              </div>
            </div>

            <div className="flex justify-between text-lg font-bold border-t border-border pt-4">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(Number(order.total))}</span>
            </div>
          </div>
        </div>
      </div>

        </Link>
      </div>

      {settings?.whatsappEnabled && settings?.whatsappNumber && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Optional</p>
          <a
            href={sendWhatsAppOrderConfirmation({
              buyerName: order.customer?.name ?? order.guestName ?? "Guest",
              orderNumber: order.id.slice(-8).toUpperCase(),
              orderItems: order.items.map(item => ({
                name: item.product.name,
                quantity: item.quantity,
                price: Number(item.unitPrice)
              })),
              total: Number(order.total),
              storeWhatsAppNumber: settings.whatsappNumber,
              storeName: settings.storeName,
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-12 gap-2 px-8 rounded-full bg-[#25D366] text-white hover:bg-[#128C7E] font-bold transition-colors shadow-lg"
          >
            <MessageCircle className="h-5 w-5" />
            Confirm via WhatsApp
          </a>
          <p className="text-[10px] text-muted-foreground max-w-xs text-center">
            Clicking this will open WhatsApp with a pre-filled message for our support team.
          </p>
        </div>
      )}
    </div>
  );
}
