// app/(store)/gift-cards/page.tsx
// Gift card purchase page — denomination selection and recipient details

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Gift, CreditCard, Send, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatCurrency } from "@/lib/utils";

const DENOMINATIONS = [
  { value: 500, label: "KES 500" },
  { value: 1000, label: "KES 1,000" },
  { value: 2500, label: "KES 2,500" },
  { value: 5000, label: "KES 5,000" },
];

export default function GiftCardsPage() {
  const router = useRouter();
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"MPESA" | "STRIPE">("MPESA");
  const [senderPhone, setSenderPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    if (!selectedValue) {
      toast.error("Please select a denomination");
      return;
    }

    try {
      setLoading(true);
      // In a real app, this would create a gift card 'order' and redirect to payment.
      // For this implementation, we'll simulate the payment flow redirect.
      // We'll call an API that handles the gift card purchase.
      
      const res = await fetch("/api/gift-cards/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: selectedValue,
          recipientEmail,
          recipientName,
          senderName,
          paymentMethod,
          senderPhone,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to initialize purchase");
      }

      const data = await res.json();
      
      // If it's a simulated "success" for demo purposes, or redirect to checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.success("Gift card purchase successful!");
        router.push("/");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-16">
      <div className="flex flex-col items-center text-center gap-4 mb-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
          <Gift className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">MiDuka Gift Cards</h1>
        <p className="text-muted-foreground text-lg max-w-lg">
          Give the gift of choice. Perfect for birthdays, holidays, or just because.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left: Denominations */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold mb-4">1. Choose Amount</h2>
            <div className="grid grid-cols-2 gap-4">
              {DENOMINATIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setSelectedValue(d.value)}
                  className={cn(
                    "flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all duration-300",
                    selectedValue === d.value
                      ? "border-primary bg-primary/5 shadow-md scale-[1.02]"
                      : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <span className={cn(
                    "text-2xl font-bold",
                    selectedValue === d.value ? "text-primary" : "text-foreground"
                  )}>
                    {formatCurrency(d.value)}
                  </span>
                  {selectedValue === d.value && (
                    <div className="mt-2 text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                      <Check className="h-3 w-3" /> Selected
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-dashed border-border p-6 bg-muted/20">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Preview</h3>
            <div className="aspect-[1.6/1] w-full rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 p-6 text-white flex flex-col justify-between shadow-xl">
              <div className="flex justify-between items-start">
                <Gift className="h-8 w-8 opacity-80" />
                <span className="text-xs font-bold tracking-widest uppercase opacity-80">Gift Card</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-widest opacity-60">Balance</span>
                <span className="text-4xl font-bold">{selectedValue ? formatCurrency(selectedValue) : "KES 0"}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-sm font-medium tracking-tight">MiDuka Store</span>
                <span className="text-[10px] font-mono opacity-60">XXXX-XXXX-XXXX-XXXX</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Details & Purchase */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold mb-4">2. Recipient Details</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipientName">Recipient Name</Label>
                <Input
                  id="recipientName"
                  placeholder="Who is this for?"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipientEmail">Recipient Email (Optional)</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  placeholder="Leave blank to send to yourself"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="rounded-xl h-12"
                />
                <p className="text-[10px] text-muted-foreground">
                  The gift code will be sent to this email address immediately after purchase.
                </p>
              </div>
              <div className="space-y-2 pt-2 border-t">
                <Label htmlFor="senderName">From (Your Name)</Label>
                <Input
                  id="senderName"
                  placeholder="Your name"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="rounded-xl h-12"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">3. Payment</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div 
                  className={`relative flex items-center p-4 border rounded-2xl cursor-pointer transition-colors ${paymentMethod === "MPESA" ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10" : "border-border hover:border-emerald-500/50"}`}
                  onClick={() => setPaymentMethod("MPESA")}
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">M-PESA STK Push</span>
                  </div>
                  <div className={`ml-auto h-4 w-4 rounded-full border border-emerald-500 flex items-center justify-center ${paymentMethod === "MPESA" ? "bg-emerald-500" : ""}`}>
                    {paymentMethod === "MPESA" && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </div>

                <div 
                  className={`relative flex items-center p-4 border rounded-2xl cursor-pointer transition-colors ${paymentMethod === "STRIPE" ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10" : "border-border hover:border-indigo-500/50"}`}
                  onClick={() => setPaymentMethod("STRIPE")}
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">Card Payment</span>
                  </div>
                  <div className={`ml-auto h-4 w-4 rounded-full border border-indigo-500 flex items-center justify-center ${paymentMethod === "STRIPE" ? "bg-indigo-500" : ""}`}>
                    {paymentMethod === "STRIPE" && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </div>

              {paymentMethod === "MPESA" && (
                <div className="space-y-2 mt-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                  <Label htmlFor="senderPhone" className="text-emerald-800 dark:text-emerald-300">M-Pesa Phone Number</Label>
                  <Input
                    id="senderPhone"
                    placeholder="e.g. 0712345678"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    className="rounded-xl h-12 bg-background"
                  />
                  <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80">
                    We will send an STK Push to this number.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4">
            <Button
              size="lg"
              className="w-full rounded-full h-14 text-lg font-bold shadow-xl shadow-indigo-600/20 gap-2"
              onClick={handlePurchase}
              disabled={loading || !selectedValue || (paymentMethod === "MPESA" && !senderPhone)}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  Buy Gift Card — {selectedValue ? formatCurrency(selectedValue) : "Select Amount"}
                </>
              )}
            </Button>
            <p className="text-center text-[10px] text-muted-foreground mt-4 flex items-center justify-center gap-2">
              <Send className="h-3 w-3" /> Secure checkout with Stripe or M-Pesa
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
