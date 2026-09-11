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
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Emails an admin has pre-authorized to become admin on their first signup —
 * for handing admin access to a teammate who hasn't made an account yet,
 * instead of requiring them to sign up first and then get manually promoted.
 * Consumed (deleted) the moment a matching signup happens; see signup() in
 * src/app/actions/auth.ts.
 */
export const pendingAdminEmails = pgTable("pending_admin_emails", {
  email: text("email").primaryKey(),
  addedByUserId: text("added_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
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

export const feedback = pgTable("feedback", {
  id: text("id").primaryKey(),
  // Nullable: feedback is open to guests too, not just signed-in accounts.
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * One row per clickable plot on the market map. `id` is the plot's stable
 * `data-plot-id` from public/map/market-plan.svg (the shape's own SVG id) —
 * not a generated key — so a row only exists once someone has actually filled
 * it in. A plot with no row yet renders as an empty "no info" placeholder.
 */
export const stores = pgTable("stores", {
  id: text("id").primaryKey(),
  name: text("name"),
  description: text("description"),
  // Each entry is either a plain static path (e.g. a pending-store's
  // /pending-stores/<slug>/1.jpg, checked into the repo) or "/api/store-photos/<id>"
  // pointing at a row in storePhotos below — both are just strings an <img> can load.
  photoUrls: text("photo_urls").array().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Uploaded store photos, stored as base64 in Postgres rather than on disk —
 * this app's only deploy target (Railway) doesn't guarantee a persistent,
 * publicly-servable filesystem path across deploys, and adding real object
 * storage (S3-compatible bucket + credentials) is more infra than this
 * project's scale justifies. Images are resized/compressed with sharp before
 * storing (see src/app/actions/store-photos.ts) to keep row size reasonable.
 * Served back out by src/app/api/store-photos/[id]/route.ts.
 */
export const storePhotos = pgTable("store_photos", {
  id: text("id").primaryKey(),
  storeId: text("store_id").notNull(),
  data: text("data").notNull(),
  contentType: text("content_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
