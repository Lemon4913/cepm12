"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { checkpointProgress } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/dal";
import { checkpoints } from "@/lib/checkpoints";

async function listMyProgress(userId: string): Promise<string[]> {
  const rows = await db
    .select({ checkpointId: checkpointProgress.checkpointId })
    .from(checkpointProgress)
    .where(eq(checkpointProgress.userId, userId));
  return rows.map((r) => r.checkpointId);
}

/** Returns null when the caller is a guest (not logged in) rather than an authenticated user with zero progress. */
export async function getMyProgress(): Promise<string[] | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return listMyProgress(user.id);
}

export async function markCheckpointScanned(checkpointId: string): Promise<string[] | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!checkpoints.some((c) => c.id === checkpointId)) return listMyProgress(user.id);

  await db
    .insert(checkpointProgress)
    .values({ id: crypto.randomUUID(), userId: user.id, checkpointId })
    .onConflictDoNothing();
  return listMyProgress(user.id);
}

export async function toggleCheckpointScanned(checkpointId: string): Promise<string[] | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const existing = await db
    .select({ id: checkpointProgress.id })
    .from(checkpointProgress)
    .where(and(eq(checkpointProgress.userId, user.id), eq(checkpointProgress.checkpointId, checkpointId)))
    .limit(1);

  if (existing[0]) {
    await db.delete(checkpointProgress).where(eq(checkpointProgress.id, existing[0].id));
  } else if (checkpoints.some((c) => c.id === checkpointId)) {
    await db.insert(checkpointProgress).values({ id: crypto.randomUUID(), userId: user.id, checkpointId });
  }
  return listMyProgress(user.id);
}

export async function resetMyProgress(): Promise<string[] | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  await db.delete(checkpointProgress).where(eq(checkpointProgress.userId, user.id));
  return [];
}

/** Merges checkpoint ids scanned anonymously (localStorage) into the now-logged-in account. */
export async function mergeLocalProgress(checkpointIds: string[]): Promise<string[] | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const validIds = checkpointIds.filter((id) => checkpoints.some((c) => c.id === id));
  if (validIds.length > 0) {
    await db
      .insert(checkpointProgress)
      .values(validIds.map((checkpointId) => ({ id: crypto.randomUUID(), userId: user.id, checkpointId })))
      .onConflictDoNothing();
  }
  return listMyProgress(user.id);
}
