import { Star } from "lucide-react";
import type { FeedbackSummary } from "@/app/actions/feedback";

export function FeedbackSummaryView({ summary }: { summary: FeedbackSummary }) {
  if (summary.totalCount === 0) {
    return <p className="text-sm text-muted-foreground">ยังไม่มีความคิดเห็นจากผู้ใช้</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Star className="size-5 fill-primary text-primary" />
        <span className="text-xl font-semibold tabular-nums">{summary.averageRating.toFixed(1)}</span>
        <span className="text-sm text-muted-foreground">/ 5 ({summary.totalCount} รายการ)</span>
      </div>

      <ul className="flex flex-col gap-2">
        {summary.recent.map((item) => (
          <li key={item.id} className="rounded-md border p-2.5 text-sm">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`size-3.5 ${i < item.rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
                />
              ))}
            </div>
            {item.comment ? <p className="mt-1 text-muted-foreground">{item.comment}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
