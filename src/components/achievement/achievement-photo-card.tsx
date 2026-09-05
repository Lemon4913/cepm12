"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Download, Share2, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Square to match the winner frame's own aspect ratio — cropping the selfie to
// a non-square canvas here would either distort the frame or letterbox it.
const CARD_SIZE = 1080;
const FILE_NAME = "talat-tha-na-achievement.png";
const FRAME_SRC = "/achievement/winner-frame.png";

let framePromise: Promise<HTMLImageElement> | null = null;
function loadFrame(): Promise<HTMLImageElement> {
  if (!framePromise) {
    framePromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.src = FRAME_SRC;
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load winner frame"));
    });
  }
  return framePromise;
}

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

function drawCover(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  size: number,
) {
  const scale = Math.max(size / sourceWidth, size / sourceHeight);
  const w = sourceWidth * scale;
  const h = sourceHeight * scale;
  ctx.drawImage(source, (size - w) / 2, (size - h) / 2, w, h);
}

// Shared by both capture paths (live camera frame or a picked file) — draws
// whatever image source cover-fit into the square, then the frame on top.
async function compositeFrom(source: CanvasImageSource, sourceWidth: number, sourceHeight: number): Promise<string> {
  const frame = await loadFrame();
  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = CARD_SIZE;
  canvas.height = CARD_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  drawCover(ctx, source, sourceWidth, sourceHeight, CARD_SIZE);
  ctx.drawImage(frame, 0, 0, CARD_SIZE, CARD_SIZE);

  return canvas.toDataURL("image/png");
}

async function compositeFile(file: File): Promise<string> {
  const img = await loadImage(file);
  return compositeFrom(img, img.naturalWidth, img.naturalHeight);
}

type Phase = "idle" | "camera" | "result";

export function AchievementPhotoCard({ scannedCount, total }: { scannedCount: number; total: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Which flow produced the current result, so "ถ่ายใหม่" (retake) knows
  // whether to restart the live camera or reopen the file picker.
  const retakeModeRef = useRef<"camera" | "file">("camera");

  const [phase, setPhase] = useState<Phase>("idle");
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Stop the camera light the moment the video element for it is gone —
  // covers both an explicit cancel/capture and the user navigating away mid-preview.
  useEffect(() => {
    if (phase === "camera" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [phase]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  async function startCamera() {
    setCameraError(null);
    retakeModeRef.current = "camera";
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: CARD_SIZE }, height: { ideal: CARD_SIZE } },
        audio: false,
      });
      streamRef.current = stream;
      setPhase("camera");
    } catch {
      setCameraError("ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการใช้งานกล้อง หรือเลือกรูปภาพแทน");
    }
  }

  function handleCancelCamera() {
    stopCamera();
    setPhase("idle");
  }

  function handleCapture() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    setBusy(true);
    compositeFrom(video, video.videoWidth, video.videoHeight)
      .then((dataUrl) => {
        setCardDataUrl(dataUrl);
        stopCamera();
        setPhase("result");
      })
      .catch(() => toast.error("สร้างรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"))
      .finally(() => setBusy(false));
  }

  async function handleFile(file: File) {
    retakeModeRef.current = "file";
    setBusy(true);
    try {
      const dataUrl = await compositeFile(file);
      setCardDataUrl(dataUrl);
      setPhase("result");
    } catch {
      toast.error("สร้างรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setBusy(false);
    }
  }

  function handleRetake() {
    setCardDataUrl(null);
    if (retakeModeRef.current === "camera") {
      startCamera();
    } else {
      inputRef.current?.click();
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
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {phase === "result" && cardDataUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cardDataUrl} alt="รูปภาพความสำเร็จ" className="w-full rounded-lg border" />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={handleRetake} disabled={busy}>
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
      ) : phase === "camera" ? (
        <>
          <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-black">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Same frame drawn into the final composite — lets the user line
                themselves up with it live instead of guessing before capture. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={FRAME_SRC} alt="" className="pointer-events-none absolute inset-0 h-full w-full" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={handleCancelCamera} disabled={busy}>
              <X className="size-4" />
              ยกเลิก
            </Button>
            <Button onClick={handleCapture} disabled={busy}>
              <Camera className="size-4" />
              {busy ? "กำลังสร้างรูปภาพ..." : "ถ่ายภาพ"}
            </Button>
          </div>
        </>
      ) : (
        <>
          <Button onClick={startCamera} disabled={busy} size="lg">
            <Camera className="size-4" />
            ถ่ายรูป
          </Button>
          {cameraError && (
            <div className="flex flex-col gap-2 rounded-lg border bg-muted p-3 text-center text-sm text-muted-foreground">
              <p>{cameraError}</p>
              <Button variant="outline" onClick={() => inputRef.current?.click()}>
                เลือกรูปภาพจากคลัง
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
