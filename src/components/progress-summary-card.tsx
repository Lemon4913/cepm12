"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCheckpointProgress } from "@/hooks/use-checkpoint-progress";

export function ProgressSummaryCard() {
  const { scannedCount, total, hydrated } = useCheckpointProgress();
  const percent = total === 0 ? 0 : Math.round((scannedCount / total) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ความคืบหน้าการสแกน</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-semibold tabular-nums">
            {hydrated ? scannedCount : "–"}
            <span className="text-base font-normal text-muted-foreground"> / {total} จุด</span>
          </span>
          <span className="text-sm text-muted-foreground">{hydrated ? percent : 0}%</span>
        </div>
        <Progress value={hydrated ? percent : 0} />
      </CardContent>
    </Card>
  );
}
