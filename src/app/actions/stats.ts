"use server";

import { count } from "drizzle-orm";
import { db } from "@/db";
import { users, checkpointProgress } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/dal";
import { checkpoints } from "@/lib/checkpoints";

export type AdminStats = {
  totalUsers: number;
  usersByRole: { role: string; count: number }[];
  totalScans: number;
  checkpointCounts: { id: string; nameTh: string; count: number }[];
};

export async function getAdminStats(): Promise<AdminStats | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;

  const [totalUsersRow] = await db.select({ value: count() }).from(users);
  const roleRows = await db.select({ role: users.role, value: count() }).from(users).groupBy(users.role);
  const [totalScansRow] = await db.select({ value: count() }).from(checkpointProgress);
  const scanRows = await db
    .select({ checkpointId: checkpointProgress.checkpointId, value: count() })
    .from(checkpointProgress)
    .groupBy(checkpointProgress.checkpointId);

  const scanCountByCheckpoint = new Map(scanRows.map((r) => [r.checkpointId, r.value]));
  const checkpointCounts = checkpoints
    .map((cp) => ({ id: cp.id, nameTh: cp.nameTh, count: scanCountByCheckpoint.get(cp.id) ?? 0 }))
    .sort((a, b) => b.count - a.count);

  return {
    totalUsers: totalUsersRow?.value ?? 0,
    usersByRole: roleRows.map((r) => ({ role: r.role, count: r.value })),
    totalScans: totalScansRow?.value ?? 0,
    checkpointCounts,
  };
}
