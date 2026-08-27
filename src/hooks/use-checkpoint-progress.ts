"use client";

import { useCallback, useSyncExternalStore } from "react";
import { checkpoints } from "@/lib/checkpoints";

const STORAGE_KEY = "cepm12:scanned-checkpoints";
const listeners = new Set<() => void>();

function parseIds(raw: string | null): Set<string> {
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function readRaw(): string | null {
  return window.localStorage.getItem(STORAGE_KEY);
}

function writeIds(ids: Set<string>) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  listeners.forEach((listener) => listener());
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getServerSnapshot(): string | null {
  return null;
}

// Mirrors React's recommended hydration-safe "mounted" check.
function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function useCheckpointProgress() {
  const raw = useSyncExternalStore(subscribe, readRaw, getServerSnapshot);
  const hydrated = useHydrated();
  const scannedIds = parseIds(raw);

  const markScanned = useCallback((checkpointId: string) => {
    const ids = parseIds(readRaw());
    if (ids.has(checkpointId)) return;
    ids.add(checkpointId);
    writeIds(ids);
  }, []);

  const toggleScanned = useCallback((checkpointId: string) => {
    const ids = parseIds(readRaw());
    if (ids.has(checkpointId)) ids.delete(checkpointId);
    else ids.add(checkpointId);
    writeIds(ids);
  }, []);

  const resetProgress = useCallback(() => {
    writeIds(new Set());
  }, []);

  return {
    hydrated,
    scannedIds,
    scannedCount: scannedIds.size,
    total: checkpoints.length,
    isScanned: (id: string) => scannedIds.has(id),
    markScanned,
    toggleScanned,
    resetProgress,
  };
}
