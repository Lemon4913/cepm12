"use server";

import { z } from "zod";
import { avg, count, desc } from "drizzle-orm";
import { db } from "@/db";
import { feedback } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/dal";

const FeedbackSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
});

export type FeedbackActionState = { error?: string; success?: string } | null;

/** Open to guests too — feedback shouldn't require an account. */
export async function submitFeedback(
  _prevState: FeedbackActionState,
  formData: FormData,
): Promise<FeedbackActionState> {
  const parsed = FeedbackSchema.safeParse({
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) {
    return { error: "กรุณาให้คะแนน 1-5 ดาว" };
  }

  const user = await getCurrentUser();
  await db.insert(feedback).values({
    id: crypto.randomUUID(),
    userId: user?.id ?? null,
    rating: parsed.data.rating,
    comment: parsed.data.comment || null,
  });

  return { success: "ขอบคุณสำหรับความคิดเห็นของคุณ!" };
}

export type FeedbackSummary = {
  averageRating: number;
  totalCount: number;
  recent: { id: string; rating: number; comment: string | null; createdAt: string }[];
};

export async function getFeedbackSummary(): Promise<FeedbackSummary | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;

  const [agg] = await db.select({ avgRating: avg(feedback.rating), total: count() }).from(feedback);
  const recentRows = await db
    .select({
      id: feedback.id,
      rating: feedback.rating,
      comment: feedback.comment,
      createdAt: feedback.createdAt,
    })
    .from(feedback)
    .orderBy(desc(feedback.createdAt))
    .limit(10);

  return {
    averageRating: agg?.avgRating ? Number(agg.avgRating) : 0,
    totalCount: agg?.total ?? 0,
    recent: recentRows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
  };
}
