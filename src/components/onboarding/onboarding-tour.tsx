"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPinned, QrCode, UserPlus, Sparkles, Info } from "lucide-react";

const SEEN_KEY = "cepm12:onboarding-seen";
export const REOPEN_ONBOARDING_EVENT = "cepm12:open-onboarding";

// Mirrors React's recommended hydration-safe "mounted" check (same pattern as
// useCheckpointProgress) — avoids an SSR/client render mismatch without
// needing to call setState from inside an effect body.
function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

const steps = [
  {
    icon: Info,
    title: "ยินดีต้อนรับสู่ตลาดท่านา",
    body: "เว็บแอปนี้ช่วยพาคุณสำรวจตลาดท่านาผ่านจุดเช็คอินต่างๆ ในตลาด มาดูวิธีใช้งานกันสั้นๆ",
  },
  {
    icon: MapPinned,
    title: "4 แท็บด้านล่างจอ",
    body: "ข้อมูลทั่วไป (ประวัติตลาด + ความคืบหน้า), แผนที่ (เร็วๆ นี้), สแกน QR และอื่นๆ (บัญชี/ข้อมูลโครงการ)",
  },
  {
    icon: QrCode,
    title: "สแกน QR ที่จุดเช็คอิน",
    body: 'ไปที่แท็บ "สแกน QR" แล้วส่องกล้องไปที่ป้าย QR Code ตามจุดต่างๆ ในตลาด หรือพิมพ์รหัส 6 หลักแทนได้ถ้ากล้องใช้งานไม่ได้',
  },
  {
    icon: Sparkles,
    title: "สแกนครบ รับรูปความสำเร็จ",
    body: "เมื่อสแกนครบตามจำนวนที่กำหนด จะปลดล็อกให้ถ่ายรูปและดาวน์โหลด/แชร์ไปโซเชียลมีเดียได้",
  },
  {
    icon: UserPlus,
    title: "สมัครสมาชิก (ไม่บังคับ)",
    body: "สมัครสมาชิกเพื่อบันทึกความคืบหน้าไว้กับบัญชี ใช้ต่อได้แม้เปลี่ยนเครื่อง — ไม่สมัครก็ใช้งานได้ตามปกติ",
  },
];

export function OnboardingTour() {
  const mounted = useMounted();
  const [dismissed, setDismissed] = useState(false);
  const [forceOpen, setForceOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    function handleReopen() {
      setStep(0);
      setDismissed(false);
      setForceOpen(true);
    }
    window.addEventListener(REOPEN_ONBOARDING_EVENT, handleReopen);
    return () => window.removeEventListener(REOPEN_ONBOARDING_EVENT, handleReopen);
  }, []);

  let hasSeenBefore = true;
  if (mounted) {
    try {
      hasSeenBefore = window.localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      hasSeenBefore = true; // fail closed: don't force the tour if storage is unavailable
    }
  }

  // forceOpen (manual replay) always wins over the "already seen" flag — only
  // the very first, automatic show should be gated by hasSeenBefore.
  const open = forceOpen || (mounted && !dismissed && !hasSeenBefore);

  function finish() {
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // ignore — worst case the tour shows again next visit
    }
    setDismissed(true);
    setForceOpen(false);
  }

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const Icon = current.icon;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) finish();
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
          <DialogTitle>{current.title}</DialogTitle>
          <DialogDescription>{current.body}</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-1.5 py-2">
          {steps.map((s, i) => (
            <span
              key={s.title}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-5 bg-primary" : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between">
          <Button variant="ghost" onClick={finish}>
            ข้าม
          </Button>
          <Button
            onClick={() => {
              if (isLast) finish();
              else setStep((s) => s + 1);
            }}
          >
            {isLast ? "เริ่มใช้งาน" : "ถัดไป"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
