"use client";

import { useActionState, useState } from "react";
import { signup, type AuthFormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const initialState: AuthFormState = null;

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, initialState);
  const [role, setRole] = useState<"user" | "store">("user");

  return (
    <form action={action} className="flex flex-col gap-4">
      {state?.error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="name">ชื่อ</Label>
        <Input id="name" name="name" placeholder="ชื่อของคุณ" required autoComplete="name" />
        {state?.fieldErrors?.name ? (
          <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">อีเมล</Label>
        <Input id="email" name="email" type="email" placeholder="you@example.com" required autoComplete="email" />
        {state?.fieldErrors?.email ? (
          <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">รหัสผ่าน</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="อย่างน้อย 8 ตัวอักษร มีตัวอักษรและตัวเลข"
        />
        {state?.fieldErrors?.password ? (
          <p className="text-xs text-destructive">{state.fieldErrors.password[0]}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label>ประเภทบัญชี</Label>
        <RadioGroup name="role" value={role} onValueChange={(v) => setRole(v as "user" | "store")} className="gap-2">
          <label className="flex items-center gap-2 rounded-md border p-2.5 text-sm has-[[data-state=checked]]:border-primary">
            <RadioGroupItem value="user" id="role-user" />
            นักท่องเที่ยว / ผู้ใช้ทั่วไป
          </label>
          <label className="flex items-center gap-2 rounded-md border p-2.5 text-sm has-[[data-state=checked]]:border-primary">
            <RadioGroupItem value="store" id="role-store" />
            ผู้ประกอบการ / ร้านค้า
          </label>
        </RadioGroup>
      </div>

      {role === "store" ? (
        <div className="space-y-1.5">
          <Label htmlFor="storeName">ชื่อร้านค้า</Label>
          <Input id="storeName" name="storeName" placeholder="ชื่อร้านของคุณ" required />
          {state?.fieldErrors?.storeName ? (
            <p className="text-xs text-destructive">{state.fieldErrors.storeName[0]}</p>
          ) : null}
        </div>
      ) : null}

      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <Checkbox name="newsOptIn" className="mt-0.5" />
        รับข่าวสารและกิจกรรมใหม่ๆ จากตลาดท่านาทางอีเมล
      </label>

      <Button type="submit" disabled={pending}>
        {pending ? "กำลังสมัคร..." : "สมัครสมาชิก"}
      </Button>
    </form>
  );
}
