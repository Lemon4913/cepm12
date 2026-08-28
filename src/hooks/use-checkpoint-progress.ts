"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { checkpoints } from "@/lib/checkpoints";
import {
  getMyProgress,
  markCheckpointScanned,
  toggleCheckpointScanned,
  resetMyProgress,
  mergeLocalProgress,
} from "@/app/actions/progress";

const STORAGE_KEY = "cepm12:scanned-checkpoints";

/**
 * Module-level store shared by every mounted useCheckpointProgress() instance
 * on the page, so marking a checkpoint scanned in one component (e.g. the scan
 * page) is instantly visible in another (e.g. the checkpoint list rendered
 * below it) — not just after that specific instance re-fetches on next mount.
 */
type Store = {
  authed: boolean;
  ready: boolean;
  ids: Set<string>;
};

const SERVER_SNAPSHOT: Store = { authed: false, ready: false, ids: new Set() };
let store: Store = SERVER_SNAPSHOT;
let initStarted = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function setStore(next: Partial<Store>) {
  store = { ...store, ...next };
  notify();
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function getSnapshot(): Store {
  return store;
}

function getServerSnapshot(): Store {
  return SERVER_SNAPSHOT;
}

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

function readLocalRaw(): string | null {
  return window.localStorage.getItem(STORAGE_KEY);
}

function writeLocalIds(ids: Set<string>) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

// Mirrors React's recommended hydration-safe "mounted" check.
function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

async function init() {
  const serverIds = await getMyProgress();

  if (serverIds === null) {
    setStore({ authed: false, ready: true, ids: parseIds(readLocalRaw()) });
    return;
  }

  const localIds = parseIds(readLocalRaw());
  const missing = [...localIds].filter((id) => !serverIds.includes(id));
  const finalIds = missing.length > 0 ? await mergeLocalProgress(missing) : serverIds;
  setStore({ authed: true, ready: true, ids: new Set(finalIds ?? serverIds) });
}

export function useCheckpointProgress() {
  const mounted = useMounted();
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!initStarted) {
      initStarted = true;
      init();
    }

    // Cross-tab sync for guests only — authed state already goes through the shared store above.
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY && !store.authed) {
        setStore({ ids: parseIds(readLocalRaw()) });
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const { authed, ready, ids: scannedIds } = snapshot;
  const hydrated = mounted && ready;

  const markScanned = useCallback((checkpointId: string) => {
    if (store.authed) {
      markCheckpointScanned(checkpointId).then((ids) => {
        if (ids) setStore({ ids: new Set(ids) });
      });
      return;
    }
    const ids = parseIds(readLocalRaw());
    if (ids.has(checkpointId)) return;
    ids.add(checkpointId);
    writeLocalIds(ids);
    setStore({ ids });
  }, []);

  const toggleScanned = useCallback((checkpointId: string) => {
    if (store.authed) {
      toggleCheckpointScanned(checkpointId).then((ids) => {
        if (ids) setStore({ ids: new Set(ids) });
      });
      return;
    }
    const ids = parseIds(readLocalRaw());
    if (ids.has(checkpointId)) ids.delete(checkpointId);
    else ids.add(checkpointId);
    writeLocalIds(ids);
    setStore({ ids });
  }, []);

  const resetProgress = useCallback(() => {
    if (store.authed) {
      resetMyProgress().then((ids) => setStore({ ids: new Set(ids ?? []) }));
      return;
    }
    writeLocalIds(new Set());
    setStore({ ids: new Set() });
  }, []);

  return {
    hydrated,
    authed,
    scannedIds,
    scannedCount: scannedIds.size,
    total: checkpoints.length,
    isScanned: (id: string) => scannedIds.has(id),
    markScanned,
    toggleScanned,
    resetProgress,
  };
}
