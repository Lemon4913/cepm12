"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Plays a cheap CSS slide-in on the new page's content whenever the route changes —
 * no page snapshot, just a transform/opacity animation on a normal DOM node (see the
 * `.page-transition` rules in globals.css, gated by the `data-nav-direction` attribute
 * that src/lib/view-transition-navigate.ts stamps onto <html> right before navigating).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-transition flex w-full flex-1 flex-col">
      {children}
    </div>
  );
}
