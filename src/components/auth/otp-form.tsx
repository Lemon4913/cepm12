"use client";

import { useActionState, useTransition } from "react";
import { toast } from "sonner";
import { verifyOtp, resendOtp, type AuthFormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthFormState = null;

export function OtpForm() {
  const [state, formAction, pending] = useActionState(verifyOtp, initialState);
  const [resending, startResend] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        {state?.error ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="code">รหัส 6 หลักจากอีเมล</Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoComplete="one-time-code"
            placeholder="000000"
            className="text-center text-lg tracking-[0.5em]"
            required
          />
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? "กำลังตรวจสอบ..." : "ยืนยัน"}
        </Button>
      </form>

      <Button
        type="button"
        variant="ghost"
        disabled={resending}
        onClick={() => {
          startResend(async () => {
            const result = await resendOtp();
            if (result?.error) {
              toast.error(result.error);
            } else {
              toast.success("ส่งรหัสใหม่ไปที่อีเมลของคุณแล้ว");
            }
          });
        }}
      >
        {resending ? "กำลังส่ง..." : "ส่งรหัสอีกครั้ง"}
      </Button>
    </div>
  );
}
