"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { checkpoints } from "@/lib/checkpoints";
import {
  getMyProgress,
  markCheckpointScanned,
  toggleCheckpointScanned,
  resetMyProgress,
  mergeLocalProgress,
} from "@/app/actions/progress";

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

function writeLocalIds(ids: Set<string>) {
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
function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function useCheckpointProgress() {
  const localRaw = useSyncExternalStore(subscribe, readRaw, getServerSnapshot);
  const mounted = useMounted();

  // null = guest (or not yet checked); a Set means the visitor is signed in.
  const [remoteIds, setRemoteIds] = useState<Set<string> | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getMyProgress().then((serverIds) => {
      if (cancelled) return;
      if (serverIds === null) {
        setAuthChecked(true);
        return;
      }

      const localIds = parseIds(readRaw());
      const missing = [...localIds].filter((id) => !serverIds.includes(id));

      if (missing.length === 0) {
        setRemoteIds(new Set(serverIds));
        setAuthChecked(true);
        return;
      }

      mergeLocalProgress(missing).then((merged) => {
        if (cancelled) return;
        setRemoteIds(new Set(merged ?? serverIds));
        setAuthChecked(true);
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const authed = remoteIds !== null;
  const hydrated = mounted && authChecked;
  const scannedIds = authed ? remoteIds : parseIds(localRaw);

  const markScanned = useCallback(
    (checkpointId: string) => {
      if (authed) {
        markCheckpointScanned(checkpointId).then((ids) => {
          if (ids) setRemoteIds(new Set(ids));
        });
        return;
      }
      const ids = parseIds(readRaw());
      if (ids.has(checkpointId)) return;
      ids.add(checkpointId);
      writeLocalIds(ids);
    },
    [authed],
  );

  const toggleScanned = useCallback(
    (checkpointId: string) => {
      if (authed) {
        toggleCheckpointScanned(checkpointId).then((ids) => {
          if (ids) setRemoteIds(new Set(ids));
        });
        return;
      }
      const ids = parseIds(readRaw());
      if (ids.has(checkpointId)) ids.delete(checkpointId);
      else ids.add(checkpointId);
      writeLocalIds(ids);
    },
    [authed],
  );

  const resetProgress = useCallback(() => {
    if (authed) {
      resetMyProgress().then((ids) => {
        setRemoteIds(new Set(ids ?? []));
      });
      return;
    }
    writeLocalIds(new Set());
  }, [authed]);

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
