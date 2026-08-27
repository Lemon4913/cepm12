"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { checkpoints } from "@/lib/checkpoints";
import { useCheckpointProgress } from "@/hooks/use-checkpoint-progress";
import { cn } from "@/lib/utils";

export function CheckpointList() {
  const { isScanned, hydrated } = useCheckpointProgress();

  return (
    <ul className="flex flex-col gap-2">
      {checkpoints.map((cp) => {
        const scanned = hydrated && isScanned(cp.id);
        return (
          <li
            key={cp.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border p-3 transition-colors",
              scanned ? "border-primary/30 bg-primary/5" : "border-border",
            )}
          >
            {scanned ? (
              <CheckCircle2 className="size-5 shrink-0 text-primary" />
            ) : (
              <Circle className="size-5 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {cp.order}. {cp.nameTh}
              </p>
              <p className="truncate text-xs text-muted-foreground">{cp.nameEn}</p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                scanned
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {scanned ? "สแกนแล้ว" : "ยังไม่สแกน"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
