"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { toast } from "sonner";
import { ImageOff, Pencil, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { upsertStore, clearStore, type StoreInfo, type StoreActionState } from "@/app/actions/stores";

const initialActionState: StoreActionState = null;

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
  const [storesState, setStoresState] = useState<StoreMap>(stores);
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  // Mark plots that already have a name so they stand out on the map — see
  // .market-plot[data-has-info] in globals.css.
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    root.querySelectorAll<SVGElement>("[data-plot-id]").forEach((el) => {
      const id = el.getAttribute("data-plot-id");
      el.setAttribute("data-has-info", id && storesState[id]?.name ? "true" : "false");
    });
  }, [storesState]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    function onClick(e: MouseEvent) {
      const plot = (e.target as Element).closest("[data-plot-id]");
      const id = plot?.getAttribute("data-plot-id");
      if (id) {
        setSelectedPlotId(id);
        setEditing(false);
      }
    }
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, []);

  const selectedStore = selectedPlotId ? storesState[selectedPlotId] : undefined;

  function handleSheetOpenChange(open: boolean) {
    if (!open) {
      setSelectedPlotId(null);
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
      <div className="relative h-[calc(100dvh-10.5rem)] w-full overflow-hidden rounded-lg border bg-muted">
        <TransformWrapper
          minScale={0.4}
          maxScale={8}
          centerOnInit
          fitOnInit="contain"
          wheel={{ step: 0.15 }}
          doubleClick={{ mode: "zoomIn" }}
        >
          <TransformComponent wrapperClass="!h-full !w-full" contentClass="!h-full !w-full">
            <div ref={containerRef} className="market-map-svg" dangerouslySetInnerHTML={{ __html: svgMarkup }} />
          </TransformComponent>
        </TransformWrapper>
        <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-background/90 px-3 py-1 text-center text-xs text-muted-foreground shadow">
          ลากเพื่อเลื่อน · บีบนิ้ว/เลื่อนล้อเมาส์เพื่อซูม · แตะจุดเพื่อดูข้อมูลร้านค้า
        </p>
      </div>

      <Sheet open={selectedPlotId !== null} onOpenChange={handleSheetOpenChange}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
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

  useEffect(() => {
    if (state?.success) {
      const data = formRef.current ? new FormData(formRef.current) : null;
      if (data) {
        onSaved({
          name: String(data.get("name") ?? ""),
          description: String(data.get("description") ?? ""),
          photoUrls: String(data.get("photoUrls") ?? "")
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
        });
      }
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="store-name">ชื่อร้าน</Label>
        <Input id="store-name" name="name" defaultValue={store?.name ?? ""} maxLength={200} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="store-description">รายละเอียด</Label>
        <Textarea id="store-description" name="description" defaultValue={store?.description ?? ""} maxLength={2000} rows={4} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="store-photos">รูปภาพ (ลิงก์/พาธ บรรทัดละ 1 รูป)</Label>
        <Textarea
          id="store-photos"
          name="photoUrls"
          defaultValue={store?.photoUrls.join("\n") ?? ""}
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
