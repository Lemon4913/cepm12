"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { UserMinus } from "lucide-react";
import {
  assignStoreRole,
  revertStoreToUser,
  type AdminActionState,
  type StoreAccountSummary,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AdminActionState = null;

export function StoreRoleManagement({ stores }: { stores: StoreAccountSummary[] }) {
  const [state, formAction, pending] = useActionState(assignStoreRole, initialState);
  const [reverting, startRevert] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      formRef.current?.reset();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  function handleRevert(userId: string) {
    startRevert(async () => {
      const result = await revertStoreToUser(userId);
      if (result?.error) toast.error(result.error);
      else toast.success(result?.success ?? "สำเร็จ");
    });
  }

  return (
    <div className="space-y-4">
      <ul className="flex flex-col gap-2">
        {stores.map((store) => (
          <li key={store.id} className="flex items-center justify-between gap-2 rounded-md border p-2.5 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium">{store.storeName ?? store.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {store.name} · {store.email}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={reverting}
              onClick={() => handleRevert(store.id)}
              aria-label={`ถอดสิทธิ์ร้านค้าของ ${store.name}`}
              className="shrink-0"
            >
              <UserMinus className="size-4 text-destructive" />
            </Button>
          </li>
        ))}
        {stores.length === 0 && <p className="text-xs text-muted-foreground">ยังไม่มีบัญชีร้านค้า</p>}
      </ul>

      <form ref={formRef} action={formAction} className="flex flex-col gap-1.5">
        <Label htmlFor="store-account-email">กำหนดบัญชีร้านค้า (ต้องเป็นอีเมลที่สมัครสมาชิกแล้ว)</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input id="store-account-email" name="email" type="email" placeholder="you@example.com" required />
          <Input name="storeName" placeholder="ชื่อร้านค้า" required className="sm:max-w-40" />
          <Button type="submit" disabled={pending} className="shrink-0">
            กำหนด
          </Button>
        </div>
      </form>
    </div>
  );
}
