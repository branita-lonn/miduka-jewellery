/**
 * file: components/store/chat-widget.tsx
 * purpose: Floating AI shopping assistant widget with streaming responses
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatWidget({ storeName }: { storeName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showCallout, setShowCallout] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Extract product slug from URL if on a product page
  // Example path: /products/black-boots
  const productSlug = pathname.startsWith("/products/") ? pathname.split("/")[2] : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Show callout bubble after 5 seconds if not previously dismissed
  useEffect(() => {
    if (isOpen) return;
    const calloutDismissed = localStorage.getItem("assistant_callout_dismissed");
    if (calloutDismissed) return;

    const timer = setTimeout(() => setShowCallout(true), 5000);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const dismissCallout = () => {
    setShowCallout(false);
    localStorage.setItem("assistant_callout_dismissed", "true");
  };

  const handleOpen = () => {
    setIsOpen(true);
    setShowCallout(false);
    setHasInteracted(true);
    localStorage.setItem("assistant_callout_dismissed", "true");
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: `Hi! I'm your shopping assistant. How can I help you today? You can ask me about products, sizing, or delivery.`,
        },
      ]);
    }
  };

  const handleSend = async (content: string = input) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          context: { productSlug },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      setIsStreaming(true);
      const reader = response.body?.getReader();
      let assistantContent = "";

      // Add a placeholder assistant message that we will update
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          if (chunk.includes("[ERROR: AI_ALL_PROVIDERS_FAILED]")) {
            throw new Error("AI_ALL_PROVIDERS_FAILED");
          }
          assistantContent += chunk;

          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].content = assistantContent;
            return newMessages;
          });
        }
      }
    } catch (error: unknown) {
      console.error("[CHAT_WIDGET_ERROR]", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm having trouble right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const suggestedPrompts = [
    "What's your return policy?",
    "Do you offer delivery to Nairobi?",
    "Help me find a gift",
  ];

  return (
    <div className="fixed bottom-20 right-6 z-50 flex flex-col items-end sm:bottom-6">
      {/* Chat Panel */}
      {isOpen && (
        <div
          className={cn(
            "mb-4 flex flex-col overflow-hidden border bg-card shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95 slide-in-from-bottom-10",
            "h-[80vh] w-[90vw] rounded-3xl sm:h-[520px] sm:w-[380px]"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-primary p-4 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold">{storeName} Assistant</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex max-w-[85%] flex-col",
                  m.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div
                  className={cn(
                    "px-4 py-2 text-sm whitespace-pre-wrap",
                    m.role === "user"
                      ? "rounded-3xl rounded-tr-none bg-primary text-primary-foreground"
                      : "rounded-3xl rounded-tl-none bg-muted text-foreground"
                  )}
                >
                  {m.content}
                  {isStreaming && i === messages.length - 1 && m.role === "assistant" && (
                    <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-current align-middle" />
                  )}
                </div>
              </div>
            ))}
            {isLoading && !isStreaming && (
              <div className="flex max-w-[85%] mr-auto items-start">
                <div className="rounded-3xl rounded-tl-none bg-muted px-4 py-2">
                  {/* A11Y: Added role and label to spinner */}
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" role="status" aria-label="Loading" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts */}
          {messages.length === 1 && !isLoading && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {suggestedPrompts.map((p) => (
                <button
                  key={p}
                  className="rounded-full border bg-background px-3 py-1 text-xs hover:bg-muted transition-colors"
                  onClick={() => handleSend(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="border-t p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="rounded-full"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="rounded-full shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Callout Bubble — appears after 5s, dismissible, persists via localStorage */}
      {showCallout && !isOpen && (
        <div className="mb-3 animate-in fade-in zoom-in duration-300">
          <div className="relative bg-primary text-primary-foreground px-4 py-3 rounded-2xl shadow-xl max-w-[220px] text-sm font-medium">
            Hi! I'm your shopping assistant. Ask me anything!
            <button
              onClick={dismissCallout}
              className="absolute -top-2 -right-2 bg-muted text-muted-foreground rounded-full p-0.5 shadow-md hover:bg-accent transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
            {/* Arrow pointing down toward the toggle button */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-primary rotate-45" />
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <Button
        size="icon"
        className={cn(
          "relative h-14 w-14 rounded-full shadow-xl transition-all duration-300 hover:scale-105",
          isOpen && "rotate-90 scale-0 opacity-0 pointer-events-none"
        )}
        onClick={handleOpen}
      >
        <MessageCircle className="h-7 w-7" />
        {/* Ping dot — shown until user has interacted with the widget */}
        {!hasInteracted && (
          <span className="absolute top-0 right-0 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-destructive" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
          </span>
        )}
      </Button>
    </div>
  );
}