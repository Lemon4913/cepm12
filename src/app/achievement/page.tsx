"use client";

import { useEffect, useState } from "react";
import { Lock, PartyPopper, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AchievementPhotoCard } from "@/components/achievement/achievement-photo-card";
import { useCheckpointProgress } from "@/hooks/use-checkpoint-progress";
import { getPhotoUnlockThreshold } from "@/app/actions/settings";

export default function AchievementPage() {
  const { scannedCount, total, hydrated } = useCheckpointProgress();
  const [threshold, setThreshold] = useState<number | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    getPhotoUnlockThreshold()
      .then(setThreshold)
      .catch(() => setLoadFailed(true));
  }, []);

  const ready = hydrated && threshold !== null;
  const unlocked = ready && scannedCount >= (threshold as number);

  return (
    <>
      <PageHeader title="รูปภาพความสำเร็จ" subtitle="ถ่ายรูปเก็บความทรงจำเมื่อสำรวจตลาดท่านาครบตามเป้า" />

      <main className="flex flex-1 flex-col gap-4 p-4">
        {loadFailed ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <TriangleAlert className="size-10 text-muted-foreground" />
              <p className="font-medium">โหลดข้อมูลไม่สำเร็จ</p>
              <p className="text-sm text-muted-foreground">กรุณาลองรีเฟรชหน้านี้อีกครั้ง</p>
            </CardContent>
          </Card>
        ) : !ready ? null : unlocked ? (
          <>
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <PartyPopper className="size-8 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">ยินดีด้วย! คุณสำรวจครบ {scannedCount}/{total} จุดแล้ว</p>
                  <p className="text-sm text-muted-foreground">
                    ถ่ายรูปตัวเองแล้วดาวน์โหลดหรือแชร์ไปยังโซเชียลมีเดียได้เลย
                  </p>
                </div>
              </CardContent>
            </Card>
            <AchievementPhotoCard scannedCount={scannedCount} total={total} />
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <Lock className="size-16 text-primary/70" />
              <div className="w-full max-w-xs space-y-2">
                <p className="font-medium">
                  สแกนอีก {(threshold as number) - scannedCount} จุด เพื่อปลดล็อกรูปภาพความสำเร็จ
                </p>
                <Progress value={(scannedCount / (threshold as number)) * 100} />
                <p className="text-xs text-muted-foreground">
                  {scannedCount} / {threshold} จุด
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
