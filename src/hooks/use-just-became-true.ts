"use client";

import { useEffect, useRef, useState } from "react";

/** Returns true for `duration` ms right after `value` flips from false to true — for a one-shot "pop" animation. */
export function useJustBecameTrue(value: boolean, duration = 700) {
  const prevRef = useRef(value);
  const [justChanged, setJustChanged] = useState(false);

  useEffect(() => {
    if (value && !prevRef.current) {
      setJustChanged(true);
      const timer = setTimeout(() => setJustChanged(false), duration);
      prevRef.current = value;
      return () => clearTimeout(timer);
    }
    prevRef.current = value;
  }, [value, duration]);

  return justChanged;
}
