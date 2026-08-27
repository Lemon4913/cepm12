"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { CheckpointList } from "@/components/checkpoint-list";
import { getCheckpointByQrValue } from "@/lib/checkpoints";
import { useCheckpointProgress } from "@/hooks/use-checkpoint-progress";

const QrCodeScanner = dynamic(
  () => import("@/components/qr-code-scanner").then((m) => m.QrCodeScanner),
  { ssr: false },
);

export default function ScanPage() {
  const { isScanned, markScanned } = useCheckpointProgress();
  const [paused, setPaused] = useState(false);
  const lastValueRef = useRef<string | null>(null);

  const handleDecode = useCallback(
    (value: string) => {
      if (value === lastValueRef.current) return;
      lastValueRef.current = value;

      const checkpoint = getCheckpointByQrValue(value);
      if (!checkpoint) {
        toast.error("QR Code นี้ไม่ใช่จุดเช็คอินของตลาดท่านา");
        setTimeout(() => (lastValueRef.current = null), 1500);
        return;
      }

      if (isScanned(checkpoint.id)) {
        toast.info(`สแกน "${checkpoint.nameTh}" ไปแล้ว`);
      } else {
        markScanned(checkpoint.id);
        toast.success(`เช็คอินสำเร็จ: ${checkpoint.nameTh}`);
        setPaused(true);
        setTimeout(() => setPaused(false), 1500);
      }
      setTimeout(() => (lastValueRef.current = null), 1500);
    },
    [isScanned, markScanned],
  );

  return (
    <>
      <PageHeader title="สแกน QR Code" subtitle="ส่องกล้องไปที่ QR Code ประจำจุดเช็คอิน" />

      <main className="flex flex-1 flex-col gap-4 p-4">
        <QrCodeScanner onDecode={handleDecode} paused={paused} />

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">จุดเช็คอินทั้งหมด</h2>
          <CheckpointList />
        </section>
      </main>
    </>
  );
}
