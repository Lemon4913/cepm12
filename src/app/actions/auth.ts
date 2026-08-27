"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type Role } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { generateOtpCode, hashOtpCode, otpExpiryDate, verifyOtpCode } from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/auth/email";
import { getCurrentUser } from "@/lib/auth/dal";
import { createSession, deleteSession, getPendingAuth, setPendingAuth, clearPendingAuth } from "@/lib/auth/session";
import { SignupSchema, LoginSchema, OtpSchema } from "@/lib/auth/schemas";

export type AuthFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

const OTP_RESEND_COOLDOWN_MS = 30 * 1000;

function roleHome(role: Role) {
  if (role === "admin") return "/admin";
  if (role === "store") return "/store";
  return "/account";
}

/** Generates a fresh code, stores its hash, and emails it. Enforces a short resend cooldown. */
async function issueOtp(userId: string, email: string): Promise<{ error?: string }> {
  const rows = await db
    .select({ otpExpiresAt: users.otpExpiresAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const existingExpiry = rows[0]?.otpExpiresAt;
  if (existingExpiry) {
    const sentAt = existingExpiry.getTime() - 10 * 60 * 1000;
    if (Date.now() - sentAt < OTP_RESEND_COOLDOWN_MS) {
      return { error: "เพิ่งส่งรหัสไปเมื่อสักครู่ กรุณารอสักครู่ก่อนขอรหัสใหม่" };
    }
  }

  const code = generateOtpCode();
  await db
    .update(users)
    .set({ otpCodeHash: hashOtpCode(code), otpExpiresAt: otpExpiryDate() })
    .where(eq(users.id, userId));

  await sendOtpEmail(email, code);
  return {};
}

export async function signup(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = SignupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    storeName: formData.get("storeName"),
    newsOptIn: formData.get("newsOptIn"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password, role, storeName, newsOptIn } = parsed.data;

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return { error: "อีเมลนี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบแทน" };
  }

  const passwordHash = await hashPassword(password);
  const userId = crypto.randomUUID();

  await db.insert(users).values({
    id: userId,
    email,
    passwordHash,
    name,
    role,
    storeName: role === "store" ? storeName : null,
    newsOptIn,
  });

  await issueOtp(userId, email);
  await setPendingAuth(userId);
  redirect("/verify-2fa");
}

export async function login(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { email, password } = parsed.data;

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }

  await issueOtp(user.id, user.email);
  await setPendingAuth(user.id);
  redirect("/verify-2fa");
}

export async function verifyOtp(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const pending = await getPendingAuth();
  if (!pending) {
    redirect("/login");
  }

  const parsed = OtpSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const rows = await db.select().from(users).where(eq(users.id, pending.userId)).limit(1);
  const user = rows[0];
  if (!user || !user.otpCodeHash || !user.otpExpiresAt) {
    redirect("/login");
  }

  if (!verifyOtpCode(parsed.data.code, user.otpCodeHash, user.otpExpiresAt)) {
    return { error: "รหัสไม่ถูกต้องหรือหมดอายุแล้ว กรุณาลองใหม่ หรือขอรหัสใหม่" };
  }

  await db.update(users).set({ otpCodeHash: null, otpExpiresAt: null }).where(eq(users.id, user.id));
  await clearPendingAuth();
  await createSession(user.id);
  redirect(roleHome(user.role));
}

export async function resendOtp(): Promise<AuthFormState> {
  const pending = await getPendingAuth();
  if (!pending) {
    redirect("/login");
  }

  const rows = await db.select({ email: users.email }).from(users).where(eq(users.id, pending.userId)).limit(1);
  const user = rows[0];
  if (!user) {
    redirect("/login");
  }

  const result = await issueOtp(pending.userId, user.email);
  return result.error ? { error: result.error } : null;
}

export async function logout() {
  await deleteSession();
  redirect("/");
}

export async function updateNewsOptIn(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const newsOptIn = formData.get("newsOptIn") === "on";
  await db.update(users).set({ newsOptIn }).where(eq(users.id, user.id));
  revalidatePath("/account");
}
