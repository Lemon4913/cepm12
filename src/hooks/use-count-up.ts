"use client";

import { useEffect, useRef, useState } from "react";

/** Animates a displayed number sliding from its previous value to `target` whenever it changes. */
export function useCountUp(target: number, duration = 500) {
  const [value, setValue] = useState(target);
  const prevRef = useRef(target);

  useEffect(() => {
    const from = prevRef.current;
    const to = target;
    if (from === to) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const effectiveDuration = reduceMotion ? 0 : duration;
    const start = performance.now();
    let frame: number;

    function tick(now: number) {
      const progress = effectiveDuration === 0 ? 1 : Math.min(1, (now - start) / effectiveDuration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        prevRef.current = to;
      }
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}
