import React, { useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { 
  CheckCircle, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare, 
  MoreHorizontal, 
  Star, 
  Trash, 
  User,
  AlertCircle,
  X
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReviewReplyForm } from "./review-reply-form";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ReviewWithRelationsDashboard {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  photos: string[];
  isVerifiedPurchase: boolean;
  createdAt: Date;
  product: {
    name: string;
    images: { url: string }[];
  };
  customer: {
    name: string | null;
    email: string | null;
  };
  reply: {
    id: string;
    body: string;
  } | null;
}

interface ReviewsClientProps {
  initialReviews: ReviewWithRelationsDashboard[];
}

export function ReviewsClient({ initialReviews }: ReviewsClientProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [ratingFilter, setRatingFilter] = useState("all");
  const [awaitingReplyFilter, setAwaitingReplyFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredReviews = reviews.filter((review) => {
    const matchesRating = ratingFilter === "all" || review.rating.toString() === ratingFilter;
    const matchesAwaiting = !awaitingReplyFilter || !review.reply;
    const matchesSearch = 
      review.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (review.customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    return matchesRating && matchesAwaiting && matchesSearch;
  });

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setReviews(reviews.filter((r) => r.id !== id));
      toast.success("Review deleted");
      setDeletingId(null);
    } catch (error) {
      toast.error("Failed to delete review");
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
    if (replyingId === id) setReplyingId(null);
  };

  const toggleReply = (id: string) => {
    setReplyingId(replyingId === id ? null : id);
    if (expandedId !== id) setExpandedId(id);
  };

  const handleReplySuccess = async () => {
    // Refresh reviews from server or update locally
    // For simplicity, we'll suggest a full refresh via router.refresh() in the parent or just fetch again
    // But since this is a client component, let's just fetch the updated review
    try {
      const res = await fetch(`/api/dashboard/reviews/${expandedId}`); // We need to implement this or just refresh all
      // Actually, let's just update the local state for now by fetching all again for simplicity
      window.location.reload(); 
    } catch (error) {}
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
          <p className="text-muted-foreground">Manage and respond to customer feedback</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search product or customer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs rounded-xl"
        />
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-[150px] rounded-xl">
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={awaitingReplyFilter ? "default" : "outline"}
          onClick={() => setAwaitingReplyFilter(!awaitingReplyFilter)}
          className="rounded-xl gap-2"
        >
          {awaitingReplyFilter ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          Awaiting Reply
        </Button>
      </div>

      <div className="rounded-4xl border border-border/50 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="w-[300px]">Product</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No reviews found.
                </TableCell>
              </TableRow>
            ) : (
              filteredReviews.map((review) => (
                <React.Fragment key={review.id}>
                  <TableRow className={cn(
                    "group hover:bg-muted/30 transition-colors border-border/50",
                    expandedId === review.id && "bg-muted/30 border-none"
                  )}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                          {review.product.images[0] ? (
                            <Image 
                              src={review.product.images[0].url} 
                              alt={review.product.name} 
                              fill 
                              className="object-cover" 
                              sizes="40px"
                            />
                          ) : (
                            <div className="w-full h-full bg-primary/10" />
                          )}
                        </div>
                        <span className="font-medium line-clamp-1">{review.product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{review.customer.name || "Anonymous"}</span>
                        <span className="text-[10px] text-muted-foreground">{review.customer.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-bold">{review.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(review.createdAt), "MMM d, yyyy")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {review.isVerifiedPurchase && (
                          <Badge variant="outline" className="w-fit text-[10px] h-5 bg-green-500/5 text-green-600 border-green-500/20 rounded-lg">
                            Verified
                          </Badge>
                        )}
                        {review.reply ? (
                          <Badge variant="outline" className="w-fit text-[10px] h-5 bg-primary/5 text-primary border-primary/20 rounded-lg">
                            Replied
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="w-fit text-[10px] h-5 bg-amber-500/5 text-amber-600 border-amber-500/20 rounded-lg">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(review.id)}
                          className="h-8 w-8 p-0 rounded-xl"
                        >
                          {expandedId === review.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => toggleReply(review.id)} className="rounded-lg">
                              <MessageSquare className="mr-2 h-4 w-4" />
                              {review.reply ? "Edit Reply" : "Reply"}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive rounded-lg"
                              onClick={() => setDeletingId(review.id)}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {/* Inline Delete Confirmation */}
                  {deletingId === review.id && (
                    <TableRow className="bg-destructive/5 hover:bg-destructive/5 border-border/50">
                      <TableCell colSpan={6}>
                        <div className="flex items-center justify-between px-10 py-2">
                          <div className="flex items-center gap-2 text-destructive font-medium text-sm">
                            <AlertCircle className="h-4 w-4" />
                            Are you sure you want to delete this review? This action cannot be undone.
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingId(null)}
                              className="rounded-xl h-8"
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(review.id)}
                              className="rounded-xl h-8 px-4 shadow-sm"
                            >
                              Confirm Delete
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {expandedId === review.id && deletingId !== review.id && (
                    <TableRow className="bg-muted/30 hover:bg-muted/30 border-border/50">
                      <TableCell colSpan={6} className="p-0">
                        <div className="px-14 pb-6 space-y-4">
                          <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
                            {review.title && <h4 className="font-bold text-sm mb-1">{review.title}</h4>}
                            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                              {review.body}
                            </p>
                            {review.photos.length > 0 && (
                              <div className="flex gap-2 mt-4">
                                {review.photos.map((photo, i) => (
                                  <div key={i} className="relative h-16 w-16 rounded-xl overflow-hidden border">
                                    <Image 
                                      src={photo} 
                                      alt="Review photo" 
                                      fill 
                                      className="object-cover" 
                                      sizes="64px"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {replyingId === review.id || review.reply ? (
                            <div className="pl-6 border-l-2 border-primary/20">
                              {replyingId === review.id ? (
                                <ReviewReplyForm 
                                  reviewId={review.id}
                                  initialBody={review.reply?.body}
                                  onSuccess={handleReplySuccess}
                                  onCancel={() => setReplyingId(null)}
                                />
                              ) : (
                                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <MessageSquare className="h-4 w-4 text-primary" />
                                      <span className="text-xs font-bold text-primary">Store Reply</span>
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-6 px-2 text-[10px] rounded-lg"
                                      onClick={() => setReplyingId(review.id)}
                                    >
                                      Edit
                                    </Button>
                                  </div>
                                  <p className="text-sm italic text-foreground/80">
                                    "{review.reply?.body}"
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex justify-end">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="rounded-xl gap-2"
                                onClick={() => setReplyingId(review.id)}
                              >
                                <MessageSquare className="h-4 w-4" />
                                Write Reply
                              </Button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
