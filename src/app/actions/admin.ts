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
