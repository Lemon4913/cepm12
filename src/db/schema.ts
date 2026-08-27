import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

export const roles = ["admin", "store", "user"] as const;
export type Role = (typeof roles)[number];

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: roles }).notNull().default("user"),
  storeName: text("store_name"),
  newsOptIn: integer("news_opt_in", { mode: "boolean" }).notNull().default(false),
  // HMAC of the current pending one-time code, if any (never store the raw code).
  otpCodeHash: text("otp_code_hash"),
  otpExpiresAt: integer("otp_expires_at", { mode: "timestamp" }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const checkpointProgress = sqliteTable(
  "checkpoint_progress",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    checkpointId: text("checkpoint_id").notNull(),
    scannedAt: text("scanned_at")
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [uniqueIndex("checkpoint_progress_user_checkpoint_idx").on(table.userId, table.checkpointId)],
);
