"use server";

import sharp from "sharp";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { stores, storePhotos } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/dal";
import { publishStoreEvent } from "@/lib/store-events";

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024; // raw upload cap, before compression
const MAX_DIMENSION = 1600; // longest side, px — plenty for a phone-sized card image

export type UploadPhotoState = { error?: string; url?: string } | null;

async function broadcastStore(plotId: string) {
  const rows = await db
    .select({ name: stores.name, description: stores.description, photoUrls: stores.photoUrls })
    .from(stores)
    .where(eq(stores.id, plotId))
    .limit(1);
  publishStoreEvent({ type: "store", plotId, info: rows[0] ?? null });
}

/** Ensures a stores row exists for plotId without clobbering any existing name/description. */
async function ensureStoreRow(plotId: string) {
  await db.insert(stores).values({ id: plotId, photoUrls: [] }).onConflictDoNothing();
}

export async function uploadStorePhoto(plotId: string, formData: FormData): Promise<UploadPhotoState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { error: "ไม่มีสิทธิ์เข้าถึง" };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "ไม่พบไฟล์รูปภาพ" };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น" };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: "ไฟล์ใหญ่เกินไป (สูงสุด 12MB)" };
  }

  let resized: Buffer;
  try {
    const raw = Buffer.from(await file.arrayBuffer());
    resized = await sharp(raw)
      .rotate() // apply EXIF orientation, then drop it
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
  } catch {
    return { error: "ไม่สามารถประมวลผลรูปภาพนี้ได้ ลองไฟล์อื่น" };
  }

  const photoId = crypto.randomUUID();
  const url = `/api/store-photos/${photoId}`;

  await db.insert(storePhotos).values({
    id: photoId,
    storeId: plotId,
    data: resized.toString("base64"),
    contentType: "image/jpeg",
  });

  await ensureStoreRow(plotId);
  // array_append + a fresh row lookup for the broadcast keep this correct even
  // if two admins upload to the same plot at the same moment — no read-modify-
  // write race on photoUrls.
  await db
    .update(stores)
    .set({ photoUrls: sql`array_append(${stores.photoUrls}, ${url})`, updatedAt: new Date() })
    .where(eq(stores.id, plotId));

  await broadcastStore(plotId);

  return { url };
}

export async function deleteStorePhoto(plotId: string, photoUrl: string): Promise<{ error?: string } | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { error: "ไม่มีสิทธิ์เข้าถึง" };
  }

  await db
    .update(stores)
    .set({ photoUrls: sql`array_remove(${stores.photoUrls}, ${photoUrl})`, updatedAt: new Date() })
    .where(eq(stores.id, plotId));

  const photoId = photoUrl.split("/").pop();
  if (photoId) {
    await db.delete(storePhotos).where(eq(storePhotos.id, photoId));
  }

  await broadcastStore(plotId);

  return null;
}
