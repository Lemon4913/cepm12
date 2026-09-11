"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, LocateOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkpoints } from "@/lib/checkpoints";
import { useCheckpointProgress } from "@/hooks/use-checkpoint-progress";
import { MARKET_GEO, georeference, parseViewBox } from "@/lib/map-geo";

const SVG_NS = "http://www.w3.org/2000/svg";

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
  const { isScanned } = useCheckpointProgress();

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
    const inner = document.importNode(parsed.documentElement, true);
    const vb = parseViewBox(svgMarkup);
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
      const marker = L.marker(geo.toLatLng(cp.mapX, cp.mapY), {
        icon: pinIcon(cp.order, false),
        title: cp.nameTh,
        keyboard: true,
      }).addTo(map);
      marker.bindPopup(() => popupContent(cp, isScanned(cp.id)), { closeButton: false, offset: [0, -6] });
      markers.set(cp.id, marker);
    }

    // Nudge the initial view so the whole floor plan is in frame regardless of
    // the container's aspect ratio, instead of trusting a fixed zoom.
    map.fitBounds(geo.bounds, { padding: [16, 16], maxZoom: 19 });

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
    <div className="relative h-[calc(100dvh-13rem)] w-full overflow-hidden rounded-lg border bg-muted md:h-[calc(100dvh-11.5rem)]">
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

/** Built with DOM APIs rather than an HTML string so checkpoint text is never interpreted as markup. */
function popupContent(cp: (typeof checkpoints)[number], scanned: boolean) {
  const root = document.createElement("div");
  root.className = "flex flex-col gap-1 text-sm";
  const title = document.createElement("p");
  title.className = "font-semibold";
  title.textContent = `${cp.order}. ${cp.nameTh}`;
  const sub = document.createElement("p");
  sub.className = "text-xs text-muted-foreground";
  sub.textContent = cp.nameEn;
  const status = document.createElement("p");
  status.className = scanned ? "text-xs font-medium text-primary" : "text-xs text-muted-foreground";
  status.textContent = scanned ? "สแกนแล้ว" : "ยังไม่สแกน";
  root.append(title, sub, status);
  return root;
}
