"use client";

import { useState, type FormEvent } from "react";
import { Keyboard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ManualCodeEntry({ onSubmitCode }: { onSubmitCode: (code: string) => void }) {
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = value.trim();
    if (!/^\d{6}$/.test(code)) return;
    onSubmitCode(code);
    setValue("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Keyboard className="size-4 text-muted-foreground" />
          กล้องใช้งานไม่ได้?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-muted-foreground">
          กรอกรหัส 6 หลักที่พิมพ์อยู่บนป้ายจุดเช็คอินแทนการสแกน
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="text-center text-lg tracking-[0.4em]"
            aria-label="รหัส 6 หลักประจำจุดเช็คอิน"
          />
          <Button type="submit" disabled={value.length !== 6}>
            ยืนยัน
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
