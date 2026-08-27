"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type Role } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { generateTotpSecret, verifyTotpToken } from "@/lib/auth/totp";
import { getCurrentUser } from "@/lib/auth/dal";
import {
  createSession,
  deleteSession,
  getPendingAuth,
  setPendingAuth,
  clearPendingAuth,
} from "@/lib/auth/session";
import { SignupSchema, LoginSchema, TotpSchema } from "@/lib/auth/schemas";

export type AuthFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

function roleHome(role: Role) {
  if (role === "admin") return "/admin";
  if (role === "store") return "/store";
  return "/account";
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
  const totpSecret = generateTotpSecret();

  await db.insert(users).values({
    id: userId,
    email,
    passwordHash,
    name,
    role,
    storeName: role === "store" ? storeName : null,
    newsOptIn,
    totpSecret,
    totpEnabled: false,
  });

  await setPendingAuth(userId, "setup");
  redirect("/setup-2fa");
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

  if (!user.totpEnabled) {
    if (!user.totpSecret) {
      await db
        .update(users)
        .set({ totpSecret: generateTotpSecret() })
        .where(eq(users.id, user.id));
    }
    await setPendingAuth(user.id, "setup");
    redirect("/setup-2fa");
  }

  await setPendingAuth(user.id, "verify");
  redirect("/verify-2fa");
}

export async function confirmTotpSetup(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const pending = await getPendingAuth();
  if (!pending || pending.stage !== "setup") {
    redirect("/login");
  }

  const parsed = TotpSchema.safeParse({ token: formData.get("token") });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const rows = await db.select().from(users).where(eq(users.id, pending.userId)).limit(1);
  const user = rows[0];
  if (!user || !user.totpSecret) {
    redirect("/login");
  }

  if (!verifyTotpToken(parsed.data.token, user.totpSecret)) {
    return { error: "รหัสไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง" };
  }

  await db.update(users).set({ totpEnabled: true }).where(eq(users.id, user.id));
  await clearPendingAuth();
  await createSession(user.id);
  redirect(roleHome(user.role));
}

export async function verifyLoginTotp(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const pending = await getPendingAuth();
  if (!pending || pending.stage !== "verify") {
    redirect("/login");
  }

  const parsed = TotpSchema.safeParse({ token: formData.get("token") });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const rows = await db.select().from(users).where(eq(users.id, pending.userId)).limit(1);
  const user = rows[0];
  if (!user || !user.totpEnabled || !user.totpSecret) {
    redirect("/login");
  }

  if (!verifyTotpToken(parsed.data.token, user.totpSecret)) {
    return { error: "รหัสไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง" };
  }

  await clearPendingAuth();
  await createSession(user.id);
  redirect(roleHome(user.role));
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
