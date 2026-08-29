"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Download, Share2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;
const FILE_NAME = "talat-tha-na-achievement.png";

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  const scale = Math.max(CARD_WIDTH / img.width, CARD_HEIGHT / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  const x = (CARD_WIDTH - w) / 2;
  const y = (CARD_HEIGHT - h) / 2;
  ctx.drawImage(img, x, y, w, h);
}

async function composite(file: File, scannedCount: number, total: number): Promise<string> {
  const img = await loadImage(file);
  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  drawCover(ctx, img);

  const gradient = ctx.createLinearGradient(0, CARD_HEIGHT * 0.55, 0, CARD_HEIGHT);
  gradient.addColorStop(0, "rgba(9, 20, 19, 0)");
  gradient.addColorStop(1, "rgba(9, 20, 19, 0.92)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, CARD_HEIGHT * 0.55, CARD_WIDTH, CARD_HEIGHT * 0.45);

  const pad = 64;
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#4fb3ac";
  ctx.font = "700 34px 'IBM Plex Sans Thai', sans-serif";
  ctx.fillText("ตลาดท่านา · TALAT THA NA", pad, CARD_HEIGHT - 220);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 68px 'IBM Plex Sans Thai', sans-serif";
  ctx.fillText(`สำรวจครบ ${scannedCount}/${total} จุดแล้ว!`, pad, CARD_HEIGHT - 140);

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "500 36px 'IBM Plex Sans Thai', sans-serif";
  ctx.fillText("ภารกิจเดินสำรวจตลาดท่านา สำเร็จ 🎉", pad, CARD_HEIGHT - 80);

  return canvas.toDataURL("image/png");
}

export function AchievementPhotoCard({ scannedCount, total }: { scannedCount: number; total: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const dataUrl = await composite(file, scannedCount, total);
      setCardDataUrl(dataUrl);
    } catch {
      toast.error("สร้างรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setBusy(false);
    }
  }

  function handleDownload() {
    if (!cardDataUrl) return;
    const a = document.createElement("a");
    a.href = cardDataUrl;
    a.download = FILE_NAME;
    a.click();
  }

  async function handleShare() {
    if (!cardDataUrl) return;
    try {
      const blob = await (await fetch(cardDataUrl)).blob();
      const file = new File([blob], FILE_NAME, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "ตลาดท่านา",
          text: `สำรวจตลาดท่านาครบ ${scannedCount}/${total} จุดแล้ว!`,
        });
      } else {
        handleDownload();
        toast.info("อุปกรณ์นี้แชร์รูปโดยตรงไม่ได้ ดาวน์โหลดรูปไว้แล้ว นำไปโพสต์ได้เลย");
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      toast.error("แชร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {cardDataUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cardDataUrl} alt="รูปภาพความสำเร็จ" className="w-full rounded-lg border" />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
              <RotateCcw className="size-4" />
              ถ่ายใหม่
            </Button>
            <Button onClick={handleShare} disabled={busy}>
              <Share2 className="size-4" />
              แชร์
            </Button>
          </div>
          <Button variant="secondary" onClick={handleDownload} disabled={busy}>
            <Download className="size-4" />
            ดาวน์โหลดรูปภาพ
          </Button>
        </>
      ) : (
        <Button onClick={() => inputRef.current?.click()} disabled={busy} size="lg">
          <Camera className="size-4" />
          {busy ? "กำลังสร้างรูปภาพ..." : "ถ่ายรูป / เลือกรูปภาพ"}
        </Button>
      )}
    </div>
  );
}
