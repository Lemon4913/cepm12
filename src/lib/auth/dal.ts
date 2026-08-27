import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "./session";
import type { Role } from "@/db/schema";

/** Memoized per-request: safe to call from multiple components without duplicate DB hits. */
export const getCurrentUser = cache(async () => {
  return getSessionUser();
});

export async function requireUser(allowedRoles?: Role[]) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect("/account");
  }
  return user;
}
