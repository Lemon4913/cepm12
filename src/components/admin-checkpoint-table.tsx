"use client";

import { useState } from "react";
import { checkpoints } from "@/lib/checkpoints";
import { useCheckpointProgress } from "@/hooks/use-checkpoint-progress";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { QrCodePreview } from "@/components/qr-code-preview";
import { CheckCircle2, Circle, QrCode, Printer } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminCheckpointTable() {
  const { isScanned, toggleScanned, hydrated } = useCheckpointProgress();
  const [qrCheckpointId, setQrCheckpointId] = useState<string | null>(null);
  const qrCheckpoint = checkpoints.find((c) => c.id === qrCheckpointId) ?? null;

  return (
    <>
      <ul className="flex flex-col gap-2">
        {checkpoints.map((cp) => {
          const scanned = hydrated && isScanned(cp.id);
          return (
            <li
              key={cp.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3",
                scanned ? "border-primary/30 bg-primary/5" : "border-border",
              )}
            >
              <button
                type="button"
                onClick={() => toggleScanned(cp.id)}
                className="shrink-0"
                aria-label={scanned ? "ยกเลิกสถานะสแกน" : "ตั้งเป็นสแกนแล้ว"}
              >
                {scanned ? (
                  <CheckCircle2 className="size-5 text-primary" />
                ) : (
                  <Circle className="size-5 text-muted-foreground" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {cp.order}. {cp.nameTh}
                </p>
                <p className="truncate text-xs text-muted-foreground">{cp.qrValue}</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="shrink-0"
                onClick={() => setQrCheckpointId(cp.id)}
                aria-label="แสดง QR Code"
              >
                <QrCode className="size-4" />
              </Button>
            </li>
          );
        })}
      </ul>

      <Dialog open={qrCheckpoint !== null} onOpenChange={(open) => !open && setQrCheckpointId(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>{qrCheckpoint?.nameTh}</DialogTitle>
            <DialogDescription>พิมพ์ QR Code นี้ติดตั้งที่จุดเช็คอิน</DialogDescription>
          </DialogHeader>
          {qrCheckpoint ? (
            <div data-print-root className="flex flex-col items-center gap-3 print:w-[300px]">
              <QrCodePreview value={qrCheckpoint.qrValue} />
              <p className="text-center text-lg font-semibold">{qrCheckpoint.nameTh}</p>
              <p className="text-center font-mono text-2xl tracking-[0.3em]">{qrCheckpoint.qrValue}</p>
            </div>
          ) : null}
          <Button variant="outline" onClick={() => window.print()} className="print:hidden">
            <Printer className="size-4" />
            พิมพ์
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
