import { pgTable, pgEnum, text, boolean, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const roles = ["admin", "store", "user"] as const;
export type Role = (typeof roles)[number];

export const roleEnum = pgEnum("role", roles);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default("user"),
  storeName: text("store_name"),
  newsOptIn: boolean("news_opt_in").notNull().default(false),
  // HMAC of the current pending one-time code, if any (never store the raw code).
  otpCodeHash: text("otp_code_hash"),
  otpExpiresAt: timestamp("otp_expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const checkpointProgress = pgTable(
  "checkpoint_progress",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    checkpointId: text("checkpoint_id").notNull(),
    scannedAt: timestamp("scanned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("checkpoint_progress_user_checkpoint_idx").on(table.userId, table.checkpointId)],
);

/** Singleton row (id always 1) holding site-wide, admin-editable settings. */
export const appSettings = pgTable("app_settings", {
  id: integer("id").primaryKey(),
  photoUnlockThreshold: integer("photo_unlock_threshold").notNull().default(5),
});
