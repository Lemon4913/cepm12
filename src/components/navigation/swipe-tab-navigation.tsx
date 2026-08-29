"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { TAB_PATHS } from "@/lib/tab-order";
import { navigateWithDirection } from "@/lib/view-transition-navigate";

const SWIPE_MIN_DISTANCE = 60;
const SWIPE_MAX_DURATION = 600;
const SWIPE_DIRECTION_RATIO = 1.5;

function isInsideNoSwipeZone(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return !!target.closest(
    '[data-slot="dialog-content"], [data-slot="dialog-overlay"], [role="dialog"], video, canvas, [data-no-swipe]',
  );
}

/** Mounted once globally: swiping left/right switches between the 4 bottom-nav tabs. */
export function SwipeTabNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (e.touches.length !== 1 || isInsideNoSwipeZone(e.target)) {
        touchStart.current = null;
        return;
      }
      const t = e.touches[0];
      touchStart.current = { x: t.clientX, y: t.clientY, time: Date.now() };
    }

    function onTouchEnd(e: TouchEvent) {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start) return;

      const t = e.changedTouches[0];
      if (!t) return;

      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      const dt = Date.now() - start.time;

      if (dt > SWIPE_MAX_DURATION) return;
      if (Math.abs(dx) < SWIPE_MIN_DISTANCE) return;
      if (Math.abs(dx) < Math.abs(dy) * SWIPE_DIRECTION_RATIO) return;

      const currentIndex = TAB_PATHS.indexOf(pathnameRef.current as (typeof TAB_PATHS)[number]);
      if (currentIndex === -1) return; // on a subpage (e.g. /admin, /login) — don't hijack it

      const nextIndex = dx < 0 ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex < 0 || nextIndex >= TAB_PATHS.length) return;

      navigateWithDirection(router, TAB_PATHS[nextIndex], dx < 0 ? "forward" : "back");
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [router]);

  return null;
}
