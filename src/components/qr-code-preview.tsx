"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrCodePreview({ value }: { value: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, { width: 256, margin: 1 }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value]);

  if (!dataUrl) {
    return <div className="aspect-square w-full animate-pulse rounded-md bg-muted" />;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={dataUrl} alt={`QR code for ${value}`} className="w-full rounded-md" />;
}
