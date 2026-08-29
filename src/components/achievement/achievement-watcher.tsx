"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCheckpointProgress } from "@/hooks/use-checkpoint-progress";
import { getPhotoUnlockThreshold } from "@/app/actions/settings";
import { fireConfetti } from "@/lib/confetti";

const CELEBRATED_KEY = "cepm12:achievement-celebrated";

/** Mounted once globally (root layout). Fires a one-time toast the moment scan progress crosses the unlock threshold. */
export function AchievementWatcher() {
  const { scannedCount, hydrated } = useCheckpointProgress();
  const [threshold, setThreshold] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    getPhotoUnlockThreshold()
      .then(setThreshold)
      .catch(() => {
        // Degrade silently — this is a background watcher, not worth surfacing a DB hiccup to guests.
      });
  }, []);

  useEffect(() => {
    if (!hydrated || threshold === null || scannedCount < threshold) return;

    let alreadyCelebrated = false;
    try {
      alreadyCelebrated = window.localStorage.getItem(CELEBRATED_KEY) === "1";
    } catch {
      alreadyCelebrated = true; // fail closed: don't nag if storage is unavailable
    }
    if (alreadyCelebrated) return;

    try {
      window.localStorage.setItem(CELEBRATED_KEY, "1");
    } catch {
      // ignore — worst case the toast can fire again later
    }

    fireConfetti();
    toast.success(`สำรวจครบ ${threshold} จุดแล้ว! ถ่ายรูปเก็บความทรงจำได้เลย`, {
      duration: 8000,
      action: {
        label: "ถ่ายรูป",
        onClick: () => router.push("/achievement"),
      },
    });
  }, [hydrated, threshold, scannedCount, router]);

  return null;
}
