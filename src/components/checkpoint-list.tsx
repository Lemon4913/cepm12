"use client";

import type { CSSProperties } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { checkpoints } from "@/lib/checkpoints";
import { useCheckpointProgress } from "@/hooks/use-checkpoint-progress";
import { useJustBecameTrue } from "@/hooks/use-just-became-true";
import { cn } from "@/lib/utils";

function CheckpointRow({
  cp,
  scanned,
  index,
}: {
  cp: (typeof checkpoints)[number];
  scanned: boolean;
  index: number;
}) {
  const justScanned = useJustBecameTrue(scanned);

  return (
    <li
      style={{ "--stagger-index": index } as CSSProperties}
      className={cn(
        "animate-list-item-in flex items-center gap-3 rounded-lg border p-3 transition-colors",
        scanned ? "border-primary/30 bg-primary/5" : "border-border",
      )}
    >
      {scanned ? (
        <CheckCircle2 className={cn("size-5 shrink-0 text-primary", justScanned && "animate-pop-check")} />
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
          scanned ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        {scanned ? "สแกนแล้ว" : "ยังไม่สแกน"}
      </span>
    </li>
  );
}

export function CheckpointList() {
  const { isScanned, hydrated } = useCheckpointProgress();

  return (
    <ul className="flex flex-col gap-2">
      {checkpoints.map((cp, index) => (
        <CheckpointRow key={cp.id} cp={cp} scanned={hydrated && isScanned(cp.id)} index={index} />
      ))}
    </ul>
  );
}
