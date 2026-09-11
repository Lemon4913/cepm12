"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, LocateOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { CheckpointDetail } from "@/components/map/market-map";
import { checkpoints } from "@/lib/checkpoints";
import { useCheckpointProgress } from "@/hooks/use-checkpoint-progress";
import { MARKET_GEO, REAL_MAP_LAYER_OFFSETS, CHECKPOINT_LAYER, georeference, parseViewBox } from "@/lib/map-geo";

const SVG_NS = "http://www.w3.org/2000/svg";
/**
 * Inkscape layer labels in market-plan.svg that draw scenery (river, roads)
 * rather than buildings. The calibration in map-geo.ts was fitted so these
 * land on the real river/roads, but on top of actual tiles they're redundant
 * (and slightly cover OSM's own), so only the buildings are shown here.
 */
const SCENERY_LAYERS = new Set(["mea naam", "taNON"]);

/**
 * The floor plan drawn on top of real OpenStreetMap tiles at the market's
 * actual location, with the same numbered checkpoint pins as the floor-plan
 * view and an optional "where am I" dot so visitors on site can orient
 * themselves. Read-only — store plots aren't clickable here; that lives in
 * MarketMap. Leaflet touches `window` at import time, so this component must
 * only ever be loaded client-side (see map-view-switcher.tsx).
 */
export function RealWorldMap({ svgMarkup }: { svgMarkup: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const locateRef = useRef<{ watchId: number; dot: L.CircleMarker; ring: L.Circle } | null>(null);
  const [locating, setLocating] = useState(false);
  const [selectedCheckpointId, setSelectedCheckpointId] = useState<string | null>(null);
  const { isScanned } = useCheckpointProgress();
  const selectedCheckpoint = selectedCheckpointId ? checkpoints.find((c) => c.id === selectedCheckpointId) : undefined;

  // Build the map once. Everything that depends on changing state (scanned
  // pins, geolocation) is layered on in separate effects below.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;
    const markers = markersRef.current;

    const geo = georeference(parseViewBox(svgMarkup));

    const map = L.map(container, {
      center: [MARKET_GEO.center.lat, MARKET_GEO.center.lng],
      zoom: MARKET_GEO.initialZoom,
      // OSM only serves tiles to z19; let people zoom two more stops into the
      // (upscaled) tiles so the floor plan gets big enough to read on a phone.
      maxZoom: 21,
      zoomControl: true,
      attributionControl: true,
    });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 21,
      maxNativeZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Wrap the original drawing in an outer <svg> big enough to hold it
    // rotated, so Leaflet's axis-aligned overlay bounds still line up.
    const parsed = new DOMParser().parseFromString(svgMarkup, "image/svg+xml");
    const inner = document.importNode(parsed.documentElement, true) as unknown as SVGSVGElement;
    const vb = parseViewBox(svgMarkup);
    // (Attribute selectors can't express the namespaced inkscape:label, so scan the groups instead.)
    for (const g of inner.querySelectorAll<SVGGElement>("g")) {
      const label = g.getAttribute("inkscape:label") ?? "";
      if (SCENERY_LAYERS.has(label)) g.style.display = "none";
      const nudge = REAL_MAP_LAYER_OFFSETS[label];
      // Prepend so the nudge applies in the parent's space, after any transform the layer already has.
      if (nudge) g.setAttribute("transform", `translate(${nudge.dx} ${nudge.dy}) ${g.getAttribute("transform") ?? ""}`.trim());
    }
    inner.setAttribute("x", "0");
    inner.setAttribute("y", "0");
    inner.setAttribute("width", String(vb.w));
    inner.setAttribute("height", String(vb.h));

    const outer = document.createElementNS(SVG_NS, "svg");
    outer.setAttribute("viewBox", `0 0 ${geo.outerW} ${geo.outerH}`);
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("transform", geo.transform);
    g.appendChild(inner);
    outer.appendChild(g);

    L.svgOverlay(outer, geo.bounds, { interactive: false, opacity: 0.92 }).addTo(map);

    for (const cp of checkpoints) {
      const nudge = REAL_MAP_LAYER_OFFSETS[CHECKPOINT_LAYER[cp.id] ?? ""] ?? { dx: 0, dy: 0 };
      const marker = L.marker(geo.toLatLng(cp.mapX + nudge.dx, cp.mapY + nudge.dy), {
        icon: pinIcon(cp.order, false),
        title: cp.nameTh,
        keyboard: true,
      }).addTo(map);
      // Tapping a pin opens the same bottom sheet as the floor-plan tab
      // (rather than a Leaflet popup) so checkpoint info reads identically
      // in both views.
      marker.on("click", () => setSelectedCheckpointId(cp.id));
      markers.set(cp.id, marker);
    }

    // Open on the buildings regardless of the container's aspect ratio.
    // getBBox ignores the display:none scenery and reports in the nested
    // <svg>'s own viewBox units — the same space checkpoints use.
    const bbox = inner.getBBox();
    const corners = [
      geo.toLatLng(bbox.x, bbox.y),
      geo.toLatLng(bbox.x + bbox.width, bbox.y),
      geo.toLatLng(bbox.x, bbox.y + bbox.height),
      geo.toLatLng(bbox.x + bbox.width, bbox.y + bbox.height),
    ];
    map.fitBounds(L.latLngBounds(corners), { padding: [24, 24], maxZoom: 19 });

    mapRef.current = map;
    return () => {
      stopLocating();
      map.remove();
      mapRef.current = null;
      markers.clear();
    };
    // svgMarkup is read from disk on the server and never changes for a mounted page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recolour pins as checkpoints get scanned (progress is shared app-wide via
  // the hook's module store, so this also reacts to scans made elsewhere).
  useEffect(() => {
    for (const cp of checkpoints) {
      markersRef.current.get(cp.id)?.setIcon(pinIcon(cp.order, isScanned(cp.id)));
    }
  }, [isScanned]);

  function stopLocating() {
    const active = locateRef.current;
    if (!active) return;
    navigator.geolocation.clearWatch(active.watchId);
    active.dot.remove();
    active.ring.remove();
    locateRef.current = null;
    setLocating(false);
  }

  function startLocating() {
    const map = mapRef.current;
    if (!map || locateRef.current || !("geolocation" in navigator)) return;
    const dot = L.circleMarker([0, 0], { radius: 7, color: "#fff", weight: 2, fillColor: "#2563eb", fillOpacity: 1 });
    const ring = L.circle([0, 0], { radius: 0, color: "#2563eb", weight: 1, fillColor: "#2563eb", fillOpacity: 0.12 });
    let centered = false;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const here: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        dot.setLatLng(here).addTo(map);
        ring.setLatLng(here).setRadius(pos.coords.accuracy).addTo(map);
        if (!centered) {
          centered = true;
          map.panTo(here);
        }
      },
      () => stopLocating(),
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 },
    );
    locateRef.current = { watchId, dot, ring };
    setLocating(true);
  }

  return (
    // `isolate` keeps Leaflet's own z-indexes (panes 400, controls 1000)
    // inside this box so the bottom sheet (z-50, fixed) can still cover it.
    <div className="relative isolate z-0 h-[calc(100dvh-13rem)] w-full overflow-hidden rounded-lg border bg-muted md:h-[calc(100dvh-11.5rem)]">
      <div ref={containerRef} className="real-world-map h-full w-full" />
      <Button
        type="button"
        size="sm"
        variant={locating ? "default" : "outline"}
        onClick={locating ? stopLocating : startLocating}
        className="absolute top-2 right-2 z-[1000] shadow"
      >
        {locating ? <LocateOff className="size-4" /> : <LocateFixed className="size-4" />}
        {locating ? "ซ่อนตำแหน่งของฉัน" : "ตำแหน่งของฉัน"}
      </Button>
      <p className="pointer-events-none absolute bottom-6 left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-background/90 px-3 py-1 text-center text-xs whitespace-nowrap text-muted-foreground shadow">
        แผนผังตลาดซ้อนบนแผนที่จริง · แตะหมุดเพื่อดูจุดเช็คอิน
      </p>

      <Sheet open={selectedCheckpointId !== null} onOpenChange={(open) => !open && setSelectedCheckpointId(null)}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
          {selectedCheckpoint && <CheckpointDetail checkpoint={selectedCheckpoint} scanned={isScanned(selectedCheckpoint.id)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/** Same look as the floor-plan pins: red circle with the checkpoint number, green once scanned. */
function pinIcon(order: number, scanned: boolean) {
  return L.divIcon({
    className: "",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `<span class="flex size-[26px] items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-md ${
      scanned ? "bg-primary" : "bg-destructive"
    }">${order}</span>`,
  });
}

