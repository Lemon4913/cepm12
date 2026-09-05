"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Trophy, ChevronRight } from "lucide-react";
import { useCheckpointProgress } from "@/hooks/use-checkpoint-progress";
import { getPhotoUnlockThreshold } from "@/app/actions/settings";

/**
 * Persistent (unlike AchievementWatcher's one-time toast) call-to-action shown
 * wherever someone is actively scanning — most people never found their way
 * to the achievement photo on their own since it only lived under Others.
 */
export function TrophyBanner() {
  const { scannedCount, hydrated } = useCheckpointProgress();
  const [threshold, setThreshold] = useState<number | null>(null);

  useEffect(() => {
    getPhotoUnlockThreshold()
      .then(setThreshold)
      .catch(() => {
        // Degrade silently — same as AchievementWatcher, not worth surfacing a DB hiccup here.
      });
  }, []);

  if (!hydrated || threshold === null || scannedCount < threshold) return null;

  return (
    <Link
      href="/achievement"
      className="flex items-center gap-3 rounded-xl bg-primary px-4 py-3.5 text-primary-foreground shadow-lg shadow-primary/25 transition-transform active:scale-[0.98]"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
        <Trophy className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold leading-tight">คุณได้รับถ้วยรางวัลแล้ว!</span>
        <span className="block text-sm text-primary-foreground/85">แตะเพื่อถ่ายรูปเก็บความทรงจำ</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-primary-foreground/70" />
    </Link>
  );
}
