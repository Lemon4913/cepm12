"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateNewsOptIn } from "@/app/actions/auth";
import { Checkbox } from "@/components/ui/checkbox";

export function NewsOptInToggle({ defaultChecked }: { defaultChecked: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox
        defaultChecked={defaultChecked}
        disabled={pending}
        onCheckedChange={(checked) => {
          startTransition(async () => {
            const formData = new FormData();
            if (checked) formData.set("newsOptIn", "on");
            await updateNewsOptIn(formData);
            toast.success(checked ? "สมัครรับข่าวสารแล้ว" : "ยกเลิกรับข่าวสารแล้ว");
          });
        }}
      />
      รับข่าวสารและกิจกรรมใหม่ๆ จากตลาดท่านาทางอีเมล
    </label>
  );
}
