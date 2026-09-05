"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/dal";

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
  // One URL/path per line in the textarea.
  photoUrls: z.string().optional(),
});

export async function upsertStore(_prevState: StoreActionState, formData: FormData): Promise<StoreActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { error: "ไม่มีสิทธิ์เข้าถึง" };
  }

  const parsed = UpsertStoreSchema.safeParse({
    plotId: formData.get("plotId"),
    name: formData.get("name") || undefined,
    description: formData.get("description") || undefined,
    photoUrls: formData.get("photoUrls") || undefined,
  });
  if (!parsed.success) {
    return { error: "ข้อมูลไม่ถูกต้อง" };
  }

  const { plotId, name, description, photoUrls } = parsed.data;
  const photoUrlList = (photoUrls ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  await db
    .insert(stores)
    .values({
      id: plotId,
      name: name || null,
      description: description || null,
      photoUrls: photoUrlList,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: stores.id,
      set: { name: name || null, description: description || null, photoUrls: photoUrlList, updatedAt: new Date() },
    });

  return { success: "บันทึกข้อมูลร้านค้าแล้ว" };
}

export async function clearStore(plotId: string): Promise<StoreActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { error: "ไม่มีสิทธิ์เข้าถึง" };
  }

  await db.delete(stores).where(eq(stores.id, plotId));
  return { success: "ลบข้อมูลร้านค้าแล้ว" };
}
