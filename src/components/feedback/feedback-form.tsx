"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { submitFeedback, type FeedbackActionState } from "@/app/actions/feedback";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: FeedbackActionState = null;

export function FeedbackForm() {
  const [state, formAction, pending] = useActionState(submitFeedback, initialState);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  if (state?.success) {
    return <p className="py-4 text-center text-sm text-muted-foreground">{state.success}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="rating" value={rating} />

      <div className="space-y-1.5">
        <Label>ให้คะแนนความพึงพอใจ</Label>
        <div className="flex gap-1" role="radiogroup" aria-label="ให้คะแนน 1 ถึง 5 ดาว">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} ดาว`}
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1"
            >
              <Star
                className={cn(
                  "size-8 transition-colors",
                  (hoverRating || rating) >= value
                    ? "fill-primary text-primary"
                    : "fill-transparent text-muted-foreground",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="comment">ความคิดเห็นเพิ่มเติม (ไม่บังคับ)</Label>
        <textarea
          id="comment"
          name="comment"
          maxLength={500}
          rows={3}
          placeholder="บอกเราหน่อยว่าชอบอะไร หรืออยากให้ปรับปรุงอะไร"
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {state?.error ? <p className="text-xs text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={pending || rating === 0}>
        {pending ? "กำลังส่ง..." : "ส่งความคิดเห็น"}
      </Button>
    </form>
  );
}
