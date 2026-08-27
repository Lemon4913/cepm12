import { z } from "zod";

export const SignupSchema = z
  .object({
    name: z.string().trim().min(2, "กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร"),
    email: z.email("อีเมลไม่ถูกต้อง").trim(),
    password: z
      .string()
      .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
      .regex(/[a-zA-Z]/, "ต้องมีตัวอักษรอย่างน้อย 1 ตัว")
      .regex(/[0-9]/, "ต้องมีตัวเลขอย่างน้อย 1 ตัว"),
    role: z.enum(["user", "store"]),
    storeName: z.string().trim().nullish(),
    newsOptIn: z.preprocess((v) => v === "on", z.boolean()),
  })
  .refine((data) => data.role !== "store" || (data.storeName?.trim().length ?? 0) >= 2, {
    message: "กรุณากรอกชื่อร้านค้าอย่างน้อย 2 ตัวอักษร",
    path: ["storeName"],
  });

export const LoginSchema = z.object({
  email: z.email("อีเมลไม่ถูกต้อง").trim(),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export const TotpSchema = z.object({
  token: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "กรุณากรอกรหัส 6 หลักจากแอปยืนยันตัวตน"),
});
