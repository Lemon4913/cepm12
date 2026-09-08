import { eq } from "drizzle-orm";
import { db } from "@/db";
import { storePhotos } from "@/db/schema";

export const dynamic = "force-dynamic";

/** Streams an uploaded store photo out of Postgres — see storePhotos in src/db/schema.ts for why it's stored there instead of on disk. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const rows = await db
    .select({ data: storePhotos.data, contentType: storePhotos.contentType })
    .from(storePhotos)
    .where(eq(storePhotos.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return new Response("Not found", { status: 404 });
  }

  const bytes = Buffer.from(row.data, "base64");
  return new Response(bytes, {
    headers: {
      "Content-Type": row.contentType,
      // Uploaded photos are immutable (a re-upload gets a new id) — safe to cache hard.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
