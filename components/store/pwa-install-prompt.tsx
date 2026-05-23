// file: components/store/pwa-install-prompt.tsx
// purpose: Client component to show PWA install prompt at the bottom of the screen

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import Image from "next/image";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// 1. Define the props interface
interface PwaInstallPromptProps {
  storeName?: string;
  logoUrl?: string;
}

export function PwaInstallPrompt({ 
  storeName = "MiDuka", 
  logoUrl = "/icons/icon-192.png"
}: PwaInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem("pwa_prompt_dismissed");
    if (isDismissed) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      localStorage.setItem("pwa_prompt_dismissed", "true");
      setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa_prompt_dismissed", "true");
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-card border border-border rounded-3xl p-4 shadow-lg flex items-center gap-3">
        {/* Left: Dynamic Store Icon */}
        <div className="flex-shrink-0">
          <Image
            src={logoUrl}
            alt={storeName}
            width={32}
            height={32}
            className="rounded-lg object-cover aspect-square"
          />
        </div>

        {/* Centre: Dynamic Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">Add {storeName} to your home screen</p>
          <p className="text-xs text-muted-foreground truncate">Shop faster, offline support</p>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button onClick={handleInstall} size="sm" className="rounded-full px-4 text-sm h-8">
            Install
          </Button>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </div>
    </div>
  );
}