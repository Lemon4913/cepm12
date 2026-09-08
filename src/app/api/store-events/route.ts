import { subscribeToStoreEvents } from "@/lib/store-events";

export const dynamic = "force-dynamic";

/**
 * Server-Sent Events stream for live map updates (see src/lib/store-events.ts
 * for why SSE + in-process pub/sub instead of a real message broker). One-way
 * push only — clients still call the normal server actions to write; this
 * just tells everyone else a write happened.
 */
export async function GET() {
  const encoder = new TextEncoder();

  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      unsubscribe = subscribeToStoreEvents((event) => {
        try {
          send(event.type, event);
        } catch {
          // controller already closed (client disconnected) — unsubscribe below handles cleanup
        }
      });

      // Without an immediate first byte, some browsers/proxies don't flip
      // EventSource to readyState OPEN until the first real event or the
      // first heartbeat — up to 25s of the client silently not being "live"
      // yet even though the connection succeeded. Confirmed during testing.
      controller.enqueue(encoder.encode(": connected\n\n"));

      // Keeps intermediary proxies/load balancers from timing out an idle
      // connection, and doubles as a liveness signal for the client.
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          // ignore — cancel() below will clean up
        }
      }, 25000);
    },
    cancel() {
      unsubscribe?.();
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
