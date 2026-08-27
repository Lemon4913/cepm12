"use client";

import { useActionState } from "react";
import type { AuthFormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthFormState = null;

export function TotpForm({
  action,
  submitLabel,
}: {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="token">รหัส 6 หลัก</Label>
        <Input
          id="token"
          name="token"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          autoComplete="one-time-code"
          placeholder="000000"
          className="text-center text-lg tracking-[0.5em]"
          required
        />
        {state?.fieldErrors?.token ? (
          <p className="text-xs text-destructive">{state.fieldErrors.token[0]}</p>
        ) : null}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "กำลังตรวจสอบ..." : submitLabel}
      </Button>
    </form>
  );
}
