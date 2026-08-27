"use client";

import { useEffect, useRef, useState } from "react";
import type QrScanner from "qr-scanner";
import { CameraOff } from "lucide-react";

export function QrCodeScanner({
  onDecode,
  paused = false,
}: {
  onDecode: (result: string) => void;
  paused?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!videoRef.current) return;
      const { default: QrScannerLib } = await import("qr-scanner");
      if (cancelled || !videoRef.current) return;

      const scanner = new QrScannerLib(
        videoRef.current,
        (result) => onDecode(typeof result === "string" ? result : result.data),
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: "environment",
        },
      );
      scannerRef.current = scanner;

      try {
        await scanner.start();
      } catch {
        if (!cancelled) {
          setError("ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการใช้งานกล้องในเบราว์เซอร์");
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      scannerRef.current?.stop();
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!scannerRef.current) return;
    if (paused) scannerRef.current.stop();
    else scannerRef.current.start().catch(() => {});
  }, [paused]);

  if (error) {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-lg border bg-muted text-center">
        <CameraOff className="size-8 text-muted-foreground" />
        <p className="px-6 text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-black">
      <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
    </div>
  );
}
