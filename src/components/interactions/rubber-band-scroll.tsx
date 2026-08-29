"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const MAX_STRETCH = 0.06; // cap at 6% so it stays subtle, not cartoonish
const RESISTANCE = 250; // higher = more finger travel needed per % of stretch
const WHEEL_IDLE_RESET_MS = 160;

/**
 * Wraps the whole page in a Discord-style elastic "stretch" at the very top/bottom of the
 * scrollable page: pulling further past either edge scales that edge outward, then springs
 * back on release. Touch-driven, with a lighter wheel-based approximation for desktop.
 */
export function RubberBandScroll({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const touchStartY = { current: null as number | null };
    const activeEdge = { current: null as "top" | "bottom" | null };
    let wheelAccum = 0;
    let wheelResetTimer: ReturnType<typeof setTimeout> | null = null;

    function atTop() {
      return window.scrollY <= 0;
    }
    function atBottom() {
      return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1;
    }

    function applyStretch(edge: "top" | "bottom", overscroll: number) {
      if (!el) return;
      const k = Math.min(MAX_STRETCH, Math.sqrt(overscroll) / RESISTANCE);
      el.style.transition = "none";
      el.style.transformOrigin = edge === "bottom" ? "top" : "bottom";
      el.style.transform = `scaleY(${1 + k})`;
    }

    function resetStretch() {
      if (!el) return;
      el.style.transition = "transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1)";
      el.style.transform = "scaleY(1)";
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length !== 1) return;
      touchStartY.current = e.touches[0].clientY;
      activeEdge.current = null;
    }

    function onTouchMove(e: TouchEvent) {
      if (touchStartY.current === null) return;
      const y = e.touches[0].clientY;
      const dy = y - touchStartY.current;

      if (activeEdge.current === null) {
        if (dy > 0 && atTop()) activeEdge.current = "top";
        else if (dy < 0 && atBottom()) activeEdge.current = "bottom";
        else return;
      }

      if (activeEdge.current === "top" && dy > 0 && atTop()) {
        e.preventDefault();
        applyStretch("top", dy);
      } else if (activeEdge.current === "bottom" && dy < 0 && atBottom()) {
        e.preventDefault();
        applyStretch("bottom", -dy);
      } else {
        activeEdge.current = null;
        resetStretch();
      }
    }

    function onTouchEnd() {
      touchStartY.current = null;
      if (activeEdge.current) resetStretch();
      activeEdge.current = null;
    }

    function onWheel(e: WheelEvent) {
      const pushingUpAtTop = atTop() && e.deltaY < 0;
      const pushingDownAtBottom = atBottom() && e.deltaY > 0;

      if (!pushingUpAtTop && !pushingDownAtBottom) {
        if (wheelAccum !== 0) {
          wheelAccum = 0;
          resetStretch();
        }
        return;
      }

      wheelAccum = Math.min(wheelAccum + Math.abs(e.deltaY) * 0.6, 4000);
      applyStretch(pushingUpAtTop ? "top" : "bottom", wheelAccum);

      if (wheelResetTimer) clearTimeout(wheelResetTimer);
      wheelResetTimer = setTimeout(() => {
        wheelAccum = 0;
        resetStretch();
      }, WHEEL_IDLE_RESET_MS);
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("wheel", onWheel);
      if (wheelResetTimer) clearTimeout(wheelResetTimer);
    };
  }, []);

  return (
    <div ref={ref} className={cn("flex w-full flex-1 flex-col", className)}>
      {children}
    </div>
  );
}
