"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { UserMinus } from "lucide-react";
import { promoteToAdmin, demoteAdmin, type AdminActionState, type AdminUserSummary } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AdminActionState = null;

export function AdminManagement({
  admins,
  currentUserId,
}: {
  admins: AdminUserSummary[];
  currentUserId: string;
}) {
  const [state, formAction, pending] = useActionState(promoteToAdmin, initialState);
  const [demoting, startDemote] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      formRef.current?.reset();
    }
  }, [state]);

  function handleDemote(userId: string) {
    startDemote(async () => {
      const result = await demoteAdmin(userId);
      if (result?.error) toast.error(result.error);
      else toast.success(result?.success ?? "สำเร็จ");
    });
  }

  return (
    <div className="space-y-4">
      <ul className="flex flex-col gap-2">
        {admins.map((admin) => (
          <li key={admin.id} className="flex items-center justify-between gap-2 rounded-md border p-2.5 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium">
                {admin.name}
                {admin.id === currentUserId ? " (คุณ)" : ""}
              </p>
              <p className="truncate text-xs text-muted-foreground">{admin.email}</p>
            </div>
            {admin.id !== currentUserId ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={demoting}
                onClick={() => handleDemote(admin.id)}
                aria-label={`ถอดสิทธิ์ผู้ดูแลระบบของ ${admin.name}`}
                className="shrink-0"
              >
                <UserMinus className="size-4 text-destructive" />
              </Button>
            ) : null}
          </li>
        ))}
      </ul>

      <form ref={formRef} action={formAction} className="flex flex-col gap-1.5">
        <Label htmlFor="admin-email">เพิ่มผู้ดูแลระบบ (ต้องเป็นอีเมลที่สมัครสมาชิกแล้ว)</Label>
        <div className="flex gap-2">
          <Input id="admin-email" name="email" type="email" placeholder="you@example.com" required />
          <Button type="submit" disabled={pending} className="shrink-0">
            เพิ่ม
          </Button>
        </div>
        {state?.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
      </form>
    </div>
  );
}
