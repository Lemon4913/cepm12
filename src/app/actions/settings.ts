"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/dal";

const SETTINGS_ID = 1;
const DEFAULT_PHOTO_UNLOCK_THRESHOLD = 5;

async function ensureSettingsRow() {
  const rows = await db.select().from(appSettings).where(eq(appSettings.id, SETTINGS_ID)).limit(1);
  if (rows[0]) return rows[0];

  await db
    .insert(appSettings)
    .values({ id: SETTINGS_ID, photoUnlockThreshold: DEFAULT_PHOTO_UNLOCK_THRESHOLD })
    .onConflictDoNothing();

  const created = await db.select().from(appSettings).where(eq(appSettings.id, SETTINGS_ID)).limit(1);
  return created[0] ?? { id: SETTINGS_ID, photoUnlockThreshold: DEFAULT_PHOTO_UNLOCK_THRESHOLD };
}

/** Public on purpose — guests need this too, to know when the achievement photo unlocks. */
export async function getPhotoUnlockThreshold(): Promise<number> {
  const row = await ensureSettingsRow();
  return row.photoUnlockThreshold;
}

export type SettingsActionState = { error?: string; success?: string } | null;

export async function updatePhotoUnlockThreshold(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { error: "ไม่มีสิทธิ์เข้าถึง" };
  }

  const value = Number(formData.get("threshold"));
  if (!Number.isInteger(value) || value < 1 || value > 100) {
    return { error: "กรุณากรอกจำนวนเต็มระหว่าง 1-100" };
  }

  await ensureSettingsRow();
  await db.update(appSettings).set({ photoUnlockThreshold: value }).where(eq(appSettings.id, SETTINGS_ID));
  return { success: `บันทึกแล้ว — ปลดล็อกที่ ${value} จุด` };
}
