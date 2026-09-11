"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import {
  preAuthorizeAdminEmail,
  revokePendingAdminEmail,
  type AdminActionState,
  type PendingAdminEmail,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AdminActionState = null;

export function PendingAdminManagement({ pending: pendingEmails }: { pending: PendingAdminEmail[] }) {
  const [state, formAction, pending] = useActionState(preAuthorizeAdminEmail, initialState);
  const [revoking, startRevoke] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      formRef.current?.reset();
    }
  }, [state]);

  function handleRevoke(email: string) {
    startRevoke(async () => {
      const result = await revokePendingAdminEmail(email);
      if (result?.error) toast.error(result.error);
      else toast.success(result?.success ?? "สำเร็จ");
    });
  }

  return (
    <div className="space-y-4">
      <ul className="flex flex-col gap-2">
        {pendingEmails.map((entry) => (
          <li key={entry.email} className="flex items-center justify-between gap-2 rounded-md border p-2.5 text-sm">
            <p className="min-w-0 truncate">{entry.email}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={revoking}
              onClick={() => handleRevoke(entry.email)}
              aria-label={`ยกเลิกสิทธิ์ล่วงหน้าของ ${entry.email}`}
              className="shrink-0"
            >
              <X className="size-4 text-destructive" />
            </Button>
          </li>
        ))}
        {pendingEmails.length === 0 && <p className="text-xs text-muted-foreground">ยังไม่มีอีเมลที่รอสิทธิ์ล่วงหน้า</p>}
      </ul>

      <form ref={formRef} action={formAction} className="flex flex-col gap-1.5">
        <Label htmlFor="pending-admin-email">ให้สิทธิ์ผู้ดูแลระบบล่วงหน้า (ก่อนสมัครสมาชิก)</Label>
        <div className="flex gap-2">
          <Input id="pending-admin-email" name="email" type="email" placeholder="you@example.com" required />
          <Button type="submit" disabled={pending} className="shrink-0">
            เพิ่ม
          </Button>
        </div>
        {state?.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
      </form>
    </div>
  );
}
