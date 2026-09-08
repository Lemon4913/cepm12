"use server";

import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/dal";
import { publishStoreEvent } from "@/lib/store-events";

export type StoreInfo = {
  id: string;
  name: string | null;
  description: string | null;
  photoUrls: string[];
};

/** Public on purpose — anyone browsing the map needs to read store info, not just admins. */
export async function getStores(): Promise<Record<string, StoreInfo>> {
  const rows = await db
    .select({ id: stores.id, name: stores.name, description: stores.description, photoUrls: stores.photoUrls })
    .from(stores);

  return Object.fromEntries(rows.map((row) => [row.id, row]));
}

export type StoreActionState = { error?: string; success?: string } | null;

const UpsertStoreSchema = z.object({
  plotId: z.string().min(1),
  name: z.string().trim().max(200).optional(),
  description: z.string().trim().max(2000).optional(),
});

/**
 * Name/description only — photos are handled entirely by the dedicated
 * upload/delete/apply-pending actions in store-photos.ts, each writing
 * atomically (array_append/array_remove) the instant it happens. Folding
 * photoUrls into this form too would mean submitting this form with a stale
 * snapshot could silently overwrite a photo another admin just uploaded
 * seconds earlier — exactly the kind of duplicate/lost-work situation
 * multiple admins editing at once are prone to.
 */
export async function upsertStore(_prevState: StoreActionState, formData: FormData): Promise<StoreActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { error: "ไม่มีสิทธิ์เข้าถึง" };
  }

  const parsed = UpsertStoreSchema.safeParse({
    plotId: formData.get("plotId"),
    name: formData.get("name") || undefined,
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) {
    return { error: "ข้อมูลไม่ถูกต้อง" };
  }

  const { plotId, name, description } = parsed.data;

  await db
    .insert(stores)
    .values({ id: plotId, name: name || null, description: description || null, photoUrls: [], updatedAt: new Date() })
    .onConflictDoUpdate({
      target: stores.id,
      set: { name: name || null, description: description || null, updatedAt: new Date() },
    });

  const rows = await db.select({ photoUrls: stores.photoUrls }).from(stores).where(eq(stores.id, plotId)).limit(1);

  publishStoreEvent({
    type: "store",
    plotId,
    info: { name: name || null, description: description || null, photoUrls: rows[0]?.photoUrls ?? [] },
  });

  return { success: "บันทึกข้อมูลร้านค้าแล้ว" };
}

/**
 * Seeds a plot's photos from a picked "pending store" (see
 * src/lib/pending-stores.ts) — a separate, immediate, atomic write (dedupes
 * against whatever's already there) rather than folding into upsertStore,
 * for the same race-safety reason described above.
 */
export async function applyPendingStorePhotos(plotId: string, urls: string[]): Promise<StoreActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { error: "ไม่มีสิทธิ์เข้าถึง" };
  }
  if (urls.length === 0) return null;

  await db.insert(stores).values({ id: plotId, photoUrls: [] }).onConflictDoNothing();
  await db
    .update(stores)
    .set({
      photoUrls: sql`(SELECT array_agg(DISTINCT u) FROM unnest(${stores.photoUrls} || ${urls}::text[]) AS u)`,
      updatedAt: new Date(),
    })
    .where(eq(stores.id, plotId));

  const rows = await db
    .select({ name: stores.name, description: stores.description, photoUrls: stores.photoUrls })
    .from(stores)
    .where(eq(stores.id, plotId))
    .limit(1);
  publishStoreEvent({ type: "store", plotId, info: rows[0] ?? null });

  return { success: "เพิ่มรูปภาพแล้ว" };
}

export async function clearStore(plotId: string): Promise<StoreActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { error: "ไม่มีสิทธิ์เข้าถึง" };
  }

  await db.delete(stores).where(eq(stores.id, plotId));
  publishStoreEvent({ type: "store", plotId, info: null });
  return { success: "ลบข้อมูลร้านค้าแล้ว" };
}

/**
 * Ephemeral "someone's editing this plot" presence — no DB, just a live
 * broadcast so other admins don't start filling in the same plot at the same
 * time. clientId is a random per-tab id (see market-map.tsx) so an admin's
 * own edit doesn't show up as "someone else is editing" in their own UI.
 */
export async function setEditingPresence(plotId: string, clientId: string, editing: boolean): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return;
  publishStoreEvent({ type: "editing", plotId, clientId, editing });
}
