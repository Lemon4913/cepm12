"use client";

import { useActionState, useEffect, useLayoutEffect, useRef, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { toast } from "sonner";
import { ImageOff, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { upsertStore, clearStore, type StoreInfo, type StoreActionState } from "@/app/actions/stores";
import { checkpoints } from "@/lib/checkpoints";
import { useCheckpointProgress } from "@/hooks/use-checkpoint-progress";
import { pendingStores } from "@/lib/pending-stores";

const initialActionState: StoreActionState = null;
const SVG_NS = "http://www.w3.org/2000/svg";

type StoreMap = Record<string, StoreInfo>;
type SavedFields = { name: string; description: string; photoUrls: string[] };

export function MarketMap({
  svgMarkup,
  stores,
  isAdmin,
}: {
  svgMarkup: string;
  stores: StoreMap;
  isAdmin: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const [storesState, setStoresState] = useState<StoreMap>(stores);
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [selectedCheckpointId, setSelectedCheckpointId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const { isScanned } = useCheckpointProgress();

  // The map's own intrinsic size, read straight out of the markup string —
  // known synchronously, unlike measuring the injected DOM after mount.
  const [svgW, svgH] = (() => {
    const w = svgMarkup.match(/<svg[^>]*\swidth="([\d.]+)"/)?.[1];
    const h = svgMarkup.match(/<svg[^>]*\sheight="([\d.]+)"/)?.[1];
    return [w ? Number(w) : 256, h ? Number(h) : 256];
  })();

  // react-zoom-pan-pinch's own centering (fitOnInit, centerView, and
  // centerOnInit + initialScale all funnel into the same internal formula)
  // produces a wildly wrong offset for this content — reproduced with every
  // one of those APIs during development, so it isn't a timing fluke. Compute
  // both the fit scale AND the centered position ourselves and hand the
  // library fixed initial values instead of trusting any of its centering.
  const [initialTransform, setInitialTransform] = useState<{ scale: number; x: number; y: number } | null>(null);
  useLayoutEffect(() => {
    const maybeEl = outerRef.current;
    if (!maybeEl) return;
    const el = maybeEl;

    function tryFit(): boolean {
      const scale = Math.min(el.clientWidth / svgW, el.clientHeight / svgH);
      if (!(scale > 0) || !Number.isFinite(scale)) return false;
      const x = (el.clientWidth - svgW * scale) / 2;
      const y = (el.clientHeight - svgH * scale) / 2;
      setInitialTransform({ scale, x, y });
      return true;
    }

    // The container can measure 0x0 on the very first layout pass in some
    // cases (e.g. dvh not resolved yet) — a one-shot measurement would then
    // strand the map unsized forever. Fall back to watching for the first
    // real size instead of just giving up.
    if (tryFit()) return;
    const observer = new ResizeObserver(() => {
      if (tryFit()) observer.disconnect();
    });
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mark plots that already have a name so they stand out on the map — see
  // .market-plot[data-has-info] in globals.css. Also re-runs once
  // initialTransform resolves, since the container only mounts then.
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    root.querySelectorAll<SVGElement>("[data-plot-id]").forEach((el) => {
      const id = el.getAttribute("data-plot-id");
      el.setAttribute("data-has-info", id && storesState[id]?.name ? "true" : "false");
    });
  }, [storesState, initialTransform]);

  // Draw the checkpoint pins once, as real children of the injected <svg> (not a
  // separate overlay) so they pan/zoom in lockstep with the map for free, and
  // paint on top of the store plots since they're appended last.
  useEffect(() => {
    const root = containerRef.current;
    const svg = root?.querySelector("svg");
    if (!svg) return;

    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("class", "checkpoint-pins");
    for (const cp of checkpoints) {
      const pin = document.createElementNS(SVG_NS, "g");
      pin.setAttribute("data-checkpoint-id", cp.id);
      pin.setAttribute("class", "checkpoint-pin");
      pin.setAttribute("transform", `translate(${cp.mapX}, ${cp.mapY})`);

      const circle = document.createElementNS(SVG_NS, "circle");
      circle.setAttribute("r", "6.5");
      pin.appendChild(circle);

      const label = document.createElementNS(SVG_NS, "text");
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("dominant-baseline", "central");
      label.setAttribute("y", "0.5");
      label.textContent = String(cp.order);
      pin.appendChild(label);

      g.appendChild(pin);
    }
    svg.appendChild(g);
    return () => g.remove();
  }, [initialTransform]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    function onClick(e: MouseEvent) {
      const target = e.target as Element;
      const pin = target.closest("[data-checkpoint-id]");
      if (pin) {
        setSelectedCheckpointId(pin.getAttribute("data-checkpoint-id"));
        return;
      }
      const plot = target.closest("[data-plot-id]");
      const id = plot?.getAttribute("data-plot-id");
      if (id) {
        setSelectedPlotId(id);
        setEditing(false);
      }
    }
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [initialTransform]);

  const selectedStore = selectedPlotId ? storesState[selectedPlotId] : undefined;
  const selectedCheckpoint = selectedCheckpointId
    ? checkpoints.find((c) => c.id === selectedCheckpointId)
    : undefined;

  function handleSheetOpenChange(open: boolean) {
    if (!open) {
      setSelectedPlotId(null);
      setSelectedCheckpointId(null);
      setEditing(false);
    }
  }

  function handleSaved(plotId: string, data: SavedFields) {
    setStoresState((prev) => ({
      ...prev,
      [plotId]: { id: plotId, name: data.name || null, description: data.description || null, photoUrls: data.photoUrls },
    }));
    setEditing(false);
  }

  function handleCleared(plotId: string) {
    setStoresState((prev) => {
      const next = { ...prev };
      delete next[plotId];
      return next;
    });
    setSelectedPlotId(null);
  }

  return (
    <>
      <div ref={outerRef} className="relative h-[calc(100dvh-10.5rem)] w-full overflow-hidden rounded-lg border bg-muted">
        {initialTransform && (
          <TransformWrapper
            key={initialTransform.scale}
            initialScale={initialTransform.scale}
            initialPositionX={initialTransform.x}
            initialPositionY={initialTransform.y}
            minScale={initialTransform.scale}
            maxScale={8}
            // Default bounds let you drag the map fully off-screen once it's
            // zoomed out smaller than the viewport (its whole allowed pan slack
            // equals how much smaller it is) — that's the "boundary too far
            // away, lost the map" bug. This halves that slack so some part of
            // the map always stays on screen no matter how far you pan.
            centerZoomedOut
            // The library's default "smooth" wheel mode multiplies this step by
            // the wheel event's raw deltaY. A plain mouse fires one wheel event
            // per notch with deltaY ~100, so a step meant for "per notch" (e.g.
            // 0.4) becomes a scale jump of ~40 — instantly past both zoom
            // bounds. This step is calibrated for that multiplication instead,
            // so a mouse notch moves the scale by ~0.4 — brisk, but still
            // gradual rather than snapping straight to min/max in one notch.
            wheel={{ step: 0.004 }}
            doubleClick={{ mode: "zoomIn" }}
          >
            {/* contentClass deliberately left at its default (shrink-to-fit)
                size, not stretched to the wrapper — our initialScale/position
                math above assumes content is the SVG's true intrinsic size
                (212x125-ish), not the wrapper's size stretched over it. */}
            <TransformComponent wrapperClass="!h-full !w-full">
              <div ref={containerRef} className="market-map-svg" dangerouslySetInnerHTML={{ __html: svgMarkup }} />
            </TransformComponent>
          </TransformWrapper>
        )}
        <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-background/90 px-3 py-1 text-center text-xs text-muted-foreground shadow">
          ลากเพื่อเลื่อน · บีบนิ้ว/เลื่อนล้อเมาส์เพื่อซูม · แตะจุดเพื่อดูข้อมูลร้านค้า
        </p>
      </div>

      <Sheet open={selectedPlotId !== null || selectedCheckpointId !== null} onOpenChange={handleSheetOpenChange}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
          {selectedCheckpoint && <CheckpointDetail checkpoint={selectedCheckpoint} scanned={isScanned(selectedCheckpoint.id)} />}
          {selectedPlotId &&
            (editing ? (
              <StoreEditForm
                plotId={selectedPlotId}
                store={selectedStore}
                onSaved={(data) => handleSaved(selectedPlotId, data)}
                onCancel={() => setEditing(false)}
                onCleared={() => handleCleared(selectedPlotId)}
              />
            ) : (
              <StoreDetail store={selectedStore} isAdmin={isAdmin} onEdit={() => setEditing(true)} />
            ))}
        </SheetContent>
      </Sheet>
    </>
  );
}

function CheckpointDetail({ checkpoint, scanned }: { checkpoint: (typeof checkpoints)[number]; scanned: boolean }) {
  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive text-xs font-semibold text-primary-foreground">
            {checkpoint.order}
          </span>
          {checkpoint.nameTh}
        </SheetTitle>
        <SheetDescription>{checkpoint.nameEn}</SheetDescription>
      </SheetHeader>
      <div className="flex flex-col gap-3 px-4 pb-4">
        <p className="text-sm leading-relaxed text-muted-foreground">{checkpoint.descriptionTh}</p>
        {scanned ? (
          <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
            <CheckCircle2 className="size-4" />
            สแกนแล้ว
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">ยังไม่สแกน — ไปที่แท็บ &quot;สแกน QR&quot; เพื่อเช็คอินจุดนี้</p>
        )}
      </div>
    </>
  );
}

function StoreDetail({
  store,
  isAdmin,
  onEdit,
}: {
  store: StoreInfo | undefined;
  isAdmin: boolean;
  onEdit: () => void;
}) {
  const hasInfo = !!store?.name;
  return (
    <>
      <SheetHeader>
        <SheetTitle>{hasInfo ? store.name : "ยังไม่มีข้อมูลจุดนี้"}</SheetTitle>
        {!hasInfo && (
          <SheetDescription>
            {isAdmin ? "เพิ่มชื่อ รูปภาพ และรายละเอียดร้านนี้ได้เลย" : "ผู้ดูแลระบบยังไม่ได้เพิ่มข้อมูลจุดนี้"}
          </SheetDescription>
        )}
      </SheetHeader>

      <div className="flex flex-col gap-3 px-4 pb-4">
        {hasInfo && store.photoUrls.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {store.photoUrls.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt={store.name ?? ""} className="h-32 w-32 shrink-0 rounded-lg border object-cover" />
            ))}
          </div>
        )}
        {hasInfo && store.photoUrls.length === 0 && (
          <div className="flex h-20 items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground">
            <ImageOff className="size-4" />
            ยังไม่มีรูปภาพ
          </div>
        )}
        {hasInfo && store.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">{store.description}</p>
        )}

        {isAdmin && (
          <Button variant="outline" onClick={onEdit}>
            <Pencil className="size-4" />
            {hasInfo ? "แก้ไขข้อมูล" : "เพิ่มข้อมูล"}
          </Button>
        )}
      </div>
    </>
  );
}

function StoreEditForm({
  plotId,
  store,
  onSaved,
  onCancel,
  onCleared,
}: {
  plotId: string;
  store: StoreInfo | undefined;
  onSaved: (data: SavedFields) => void;
  onCancel: () => void;
  onCleared: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(upsertStore, initialActionState);
  const [clearing, setClearing] = useState(false);
  const [name, setName] = useState(store?.name ?? "");
  const [description, setDescription] = useState(store?.description ?? "");
  const [photoUrls, setPhotoUrls] = useState(store?.photoUrls.join("\n") ?? "");

  function handlePickPending(slug: string) {
    const picked = pendingStores.find((p) => p.slug === slug);
    if (!picked) return;
    setName(picked.name);
    setDescription(picked.description ?? "");
    setPhotoUrls(picked.photoUrls.join("\n"));
  }

  useEffect(() => {
    if (state?.success) {
      onSaved({
        name,
        description,
        photoUrls: photoUrls
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      });
      toast.success(state.success);
    } else if (state?.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  async function handleClear() {
    setClearing(true);
    const result = await clearStore(plotId);
    setClearing(false);
    if (result?.success) {
      toast.success(result.success);
      onCleared();
    } else if (result?.error) {
      toast.error(result.error);
    }
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3 px-4 pb-4">
      <SheetHeader className="px-0">
        <SheetTitle>{store?.name ? "แก้ไขข้อมูลร้านค้า" : "เพิ่มข้อมูลร้านค้า"}</SheetTitle>
      </SheetHeader>
      <input type="hidden" name="plotId" value={plotId} />

      {pendingStores.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pending-store-picker">เลือกจากร้านที่รอลงข้อมูล (ไม่บังคับ)</Label>
          <select
            id="pending-store-picker"
            defaultValue=""
            onChange={(e) => e.target.value && handlePickPending(e.target.value)}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="" disabled>
              — เลือกร้าน —
            </option>
            {pendingStores.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            กรอกข้อมูลไว้แล้วแต่ยังไม่รู้ว่าเป็นจุดไหนบนแผนที่ — เลือกร้านที่ตรงกับจุดนี้ แล้วกด &quot;บันทึก&quot;
            ด้านล่าง ระบบจะกรอกชื่อ/รายละเอียด/รูปให้อัตโนมัติ (ยังแก้ไขเพิ่มเติมได้ก่อนบันทึก)
          </p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="store-name">ชื่อร้าน</Label>
        <Input id="store-name" name="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={200} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="store-description">รายละเอียด</Label>
        <Textarea
          id="store-description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={4}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="store-photos">รูปภาพ (ลิงก์/พาธ บรรทัดละ 1 รูป)</Label>
        <Textarea
          id="store-photos"
          name="photoUrls"
          value={photoUrls}
          onChange={(e) => setPhotoUrls(e.target.value)}
          rows={3}
          placeholder={`/stores/${plotId}/1.jpg`}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          ยกเลิก
        </Button>
        <Button type="submit" disabled={pending}>
          บันทึก
        </Button>
      </div>

      {store?.name && (
        <Button type="button" variant="ghost" className="text-destructive" onClick={handleClear} disabled={clearing}>
          <Trash2 className="size-4" />
          ลบข้อมูลจุดนี้
        </Button>
      )}
    </form>
  );
}
