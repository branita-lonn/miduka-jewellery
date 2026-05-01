// components/store/review-card.tsx
// Displays an individual review with author, rating, text, photos, and voting

"use client";

import { useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle, MessageSquare, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import type { ReviewWithRelations } from "@/types";
import { toast } from "sonner";

interface ReviewCardProps {
  review: ReviewWithRelations;
  onVoteSuccess?: (newCount: number) => void;
}

export function ReviewCard({ review, onVoteSuccess }: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const customerName = review.customer.name || "Anonymous";
  const initials = customerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  // Format name: John Doe -> John D.
  const formattedName = review.customer.name 
    ? review.customer.name.split(" ").map((n, i, arr) => i === arr.length - 1 && i > 0 ? `${n[0]}.` : n).join(" ")
    : "Anonymous";

  const handleVote = async (isHelpful: boolean) => {
    if (isVoting) return;

    // Optimistic update
    const currentCount = review._count?.votes || 0;
    const newCount = isHelpful ? currentCount + 1 : Math.max(0, currentCount - 1);
    onVoteSuccess?.(newCount);

    try {
      setIsVoting(true);
      const res = await fetch(`/api/reviews/${review.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHelpful }),
      });

      if (res.status === 401) {
        toast.error("Please login to vote");
        onVoteSuccess?.(currentCount); // Rollback
        return;
      }

      if (!res.ok) throw new Error();

      const data = await res.json();
      onVoteSuccess?.(data.helpfulCount); // Sync with server
      toast.success("Vote recorded");
    } catch (error) {
      toast.error("Something went wrong");
      onVoteSuccess?.(currentCount); // Rollback
    } finally {
      setIsVoting(false);
    }
  };

  const shouldTruncate = review.body.length > 200;
  const displayText = isExpanded || !shouldTruncate 
    ? review.body 
    : `${review.body.substring(0, 200)}...`;

  return (
    <div className="flex flex-col gap-4 bg-card rounded-4xl p-6 border border-border/40 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 rounded-2xl border border-border/50">
            <AvatarImage src={review.customer.image || ""} alt={customerName} />
            <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{formattedName}</span>
              {review.isVerifiedPurchase && (
                <Badge variant="secondary" className="h-5 px-1.5 gap-1 bg-green-500/10 text-green-600 border-none rounded-lg font-medium text-[10px]">
                  <CheckCircle className="h-3 w-3" />
                  Verified Purchase
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3 w-3",
                      i < review.rating
                        ? "fill-amber-400 text-amber-400"
                        : "fill-muted text-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {review.title && (
          <h4 className="font-bold text-foreground">{review.title}</h4>
        )}
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
          {displayText}
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-primary font-medium ml-1 hover:underline focus:outline-none"
            >
              {isExpanded ? "Read less" : "Read more"}
            </button>
          )}
        </p>
      </div>

      {/* Photos */}
      {review.photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {review.photos.map((photo, i) => (
            <Dialog key={i}>
              <DialogTrigger asChild>
                <div className="relative h-20 w-20 rounded-2xl overflow-hidden cursor-zoom-in hover:opacity-90 transition-opacity border border-border/40">
                  <Image
                    src={photo}
                    alt={`Review photo ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl p-0 border-none bg-transparent shadow-none">
                <div className="relative aspect-auto max-h-[90vh] flex items-center justify-center">
                  <img
                    src={photo}
                    alt="Full size review photo"
                    className="max-w-full max-h-[90vh] rounded-3xl object-contain"
                  />
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      )}

      {/* Helpful voting */}
      <div className="flex items-center gap-4 pt-2">
        <span className="text-xs text-muted-foreground">Was this helpful?</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleVote(true)}
            disabled={isVoting}
            className="h-8 rounded-xl gap-1.5 text-xs border-border/50 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            Yes {review._count?.votes || 0 > 0 ? `(${review._count?.votes})` : ""}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleVote(false)}
            disabled={isVoting}
            className="h-8 rounded-xl gap-1.5 text-xs border-border/50 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 transition-all"
          >
            <ThumbsDown className="h-3.5 w-3.5" />
            No
          </Button>
        </div>
      </div>

      {/* Seller Reply */}
      {review.reply && (
        <div className="bg-muted/50 rounded-3xl p-4 border border-border/30 mt-2">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Store Reply</span>
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(review.reply.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed italic">
            "{review.reply.body}"
          </p>
        </div>
      )}
    </div>
  );
}
