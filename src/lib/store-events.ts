import "server-only";

/**
 * In-process pub/sub for live map updates — no external broker (Redis/etc),
 * just a module-level singleton. Works because this app runs as one
 * always-on Node process (Railway, `next start`), not serverless/multi-
 * instance; revisit if that ever changes. Powers two things over the SSE
 * stream in src/app/api/store-events/route.ts:
 *  - "store": a plot was saved/cleared — every connected admin's map updates
 *    without a reload, so nobody's looking at stale "still empty" state.
 *  - "editing": someone opened/closed a plot's edit form — lets other admins
 *    see "someone else is already editing this" before they duplicate work.
 */
export type StoreEvent =
  | { type: "store"; plotId: string; info: { name: string | null; description: string | null; photoUrls: string[] } | null }
  | { type: "editing"; plotId: string; clientId: string; editing: boolean };

type Listener = (event: StoreEvent) => void;

const globalForEvents = globalThis as unknown as { storeEventListeners?: Set<Listener> };
const listeners = (globalForEvents.storeEventListeners ??= new Set<Listener>());

export function publishStoreEvent(event: StoreEvent) {
  for (const listener of listeners) listener(event);
}

export function subscribeToStoreEvents(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
