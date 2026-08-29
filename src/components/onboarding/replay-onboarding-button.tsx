"use client";

import { HelpCircle, ChevronRight } from "lucide-react";
import { REOPEN_ONBOARDING_EVENT } from "@/components/onboarding/onboarding-tour";

export function ReplayOnboardingButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(REOPEN_ONBOARDING_EVENT))}
      className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-accent"
    >
      <HelpCircle className="size-5 text-muted-foreground" />
      <div className="flex-1">
        <p className="text-sm font-medium">ดูคำแนะนำการใช้งานอีกครั้ง</p>
        <p className="text-xs text-muted-foreground">แนะนำวิธีใช้งานเว็บแอปแบบย่อ</p>
      </div>
      <ChevronRight className="size-4 text-muted-foreground" />
    </button>
  );
}
