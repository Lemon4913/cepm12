"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/dal";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return user;
}

export type AdminUserSummary = { id: string; name: string; email: string };

export async function listAdmins(): Promise<AdminUserSummary[]> {
  await requireAdmin();
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.role, "admin"));
}

export type AdminActionState = { error?: string; success?: string } | null;

const EmailSchema = z.email();

export async function promoteToAdmin(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = EmailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { error: "อีเมลไม่ถูกต้อง" };
  }

  const rows = await db
    .select({ id: users.id, name: users.name, role: users.role })
    .from(users)
    .where(eq(users.email, parsed.data))
    .limit(1);
  const target = rows[0];

  if (!target) {
    return { error: "ไม่พบผู้ใช้ที่มีอีเมลนี้ในระบบ — ต้องสมัครสมาชิกก่อน จึงจะเพิ่มเป็นผู้ดูแลระบบได้" };
  }
  if (target.role === "admin") {
    return { error: "ผู้ใช้นี้เป็นผู้ดูแลระบบอยู่แล้ว" };
  }

  await db.update(users).set({ role: "admin" }).where(eq(users.id, target.id));
  return { success: `เพิ่ม ${target.name} เป็นผู้ดูแลระบบเรียบร้อยแล้ว` };
}

export async function demoteAdmin(userId: string): Promise<AdminActionState> {
  const me = await requireAdmin();

  if (me.id === userId) {
    return { error: "ไม่สามารถถอดสิทธิ์ผู้ดูแลระบบของตัวเองได้" };
  }

  const admins = await listAdmins();
  if (admins.length <= 1) {
    return { error: "ต้องมีผู้ดูแลระบบอย่างน้อย 1 คนเสมอ" };
  }

  await db.update(users).set({ role: "user" }).where(eq(users.id, userId));
  return { success: "ถอดสิทธิ์ผู้ดูแลระบบเรียบร้อยแล้ว" };
}

export type StoreAccountSummary = { id: string; name: string; email: string; storeName: string | null };

export async function listStoreAccounts(): Promise<StoreAccountSummary[]> {
  await requireAdmin();
  return db
    .select({ id: users.id, name: users.name, email: users.email, storeName: users.storeName })
    .from(users)
    .where(eq(users.role, "store"));
}

const AssignStoreSchema = z.object({
  email: z.email(),
  storeName: z.string().trim().min(2, "กรุณากรอกชื่อร้านค้าอย่างน้อย 2 ตัวอักษร"),
});

/**
 * Sets an existing (non-admin) account to the "store" role, and sets/renames its
 * storeName — also the only way to fix a store's name after signup, since there's
 * no self-service store-profile editing yet.
 */
export async function assignStoreRole(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = AssignStoreSchema.safeParse({
    email: formData.get("email"),
    storeName: formData.get("storeName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const rows = await db
    .select({ id: users.id, name: users.name, role: users.role })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  const target = rows[0];

  if (!target) {
    return { error: "ไม่พบผู้ใช้ที่มีอีเมลนี้ในระบบ — ต้องสมัครสมาชิกก่อน จึงจะกำหนดเป็นร้านค้าได้" };
  }
  if (target.role === "admin") {
    return { error: "ผู้ใช้นี้เป็นผู้ดูแลระบบอยู่ — ถอดสิทธิ์ผู้ดูแลระบบก่อน จึงจะกำหนดเป็นร้านค้าได้" };
  }

  await db
    .update(users)
    .set({ role: "store", storeName: parsed.data.storeName })
    .where(eq(users.id, target.id));
  return { success: `กำหนด ${target.name} เป็นบัญชีร้านค้า "${parsed.data.storeName}" เรียบร้อยแล้ว` };
}

export async function revertStoreToUser(userId: string): Promise<AdminActionState> {
  await requireAdmin();

  await db.update(users).set({ role: "user", storeName: null }).where(eq(users.id, userId));
  return { success: "ถอดสิทธิ์บัญชีร้านค้าเรียบร้อยแล้ว" };
}
