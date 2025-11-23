import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProductFeedbackDialogProps {
  productId: string;
  productName: string;
  orderId: string;
  sellerId: string;
  orderStatus: string;
  existingFeedback?: {
    id: string;
    rating: number;
    comment: string | null;
  } | null;
}

export const ProductFeedbackDialog = ({
  productId,
  productName,
  orderId,
  sellerId,
  orderStatus,
  existingFeedback,
}: ProductFeedbackDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(existingFeedback?.rating || 0);
  const [comment, setComment] = useState(existingFeedback?.comment || "");
  const [hoveredStar, setHoveredStar] = useState(0);
  const canGiveFeedback = orderStatus === "delivered";

  const submitFeedback = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (rating === 0) throw new Error("Please select a rating");

      const { error } = await supabase.from("feedback").insert({
        reviewer_id: user.id,
        reviewee_id: sellerId,
        order_id: orderId,
        product_id: productId,
        rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recent-purchased-products"] });
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback!",
      });
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (existingFeedback) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            View Feedback
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your Feedback</DialogTitle>
            <DialogDescription>for {productName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-6 w-6 ${
                    star <= existingFeedback.rating
                      ? "fill-primary text-primary"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            {existingFeedback.comment && (
              <div className="rounded-lg border bg-muted p-3">
                <p className="text-sm">{existingFeedback.comment}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="gap-2"
          disabled={!canGiveFeedback}
          variant={canGiveFeedback ? "default" : "outline"}
        >
          <MessageSquare className="h-4 w-4" />
          {canGiveFeedback ? "Give Feedback" : "Feedback after delivery"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate Your Purchase</DialogTitle>
          <DialogDescription>for {productName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Rating *</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredStar || rating)
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Comment (Optional)</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              rows={4}
            />
          </div>
          <Button
            onClick={() => submitFeedback.mutate()}
            disabled={rating === 0 || submitFeedback.isPending}
            className="w-full"
          >
            {submitFeedback.isPending ? "Submitting..." : "Submit Feedback"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
