"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updatePhotoUnlockThreshold, type SettingsActionState } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: SettingsActionState = null;

export function PhotoThresholdForm({ defaultValue }: { defaultValue: number }) {
  const [state, formAction, pending] = useActionState(updatePhotoUnlockThreshold, initialState);

  useEffect(() => {
    if (state?.success) toast.success(state.success);
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <Label htmlFor="threshold">จำนวนจุดที่ต้องสแกนเพื่อปลดล็อกรูปภาพความสำเร็จ</Label>
      <div className="flex gap-2">
        <Input
          id="threshold"
          name="threshold"
          type="number"
          min={1}
          max={100}
          defaultValue={defaultValue}
          required
          className="max-w-24"
        />
        <Button type="submit" disabled={pending} className="shrink-0">
          บันทึก
        </Button>
      </div>
      {state?.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
    </form>
  );
}
