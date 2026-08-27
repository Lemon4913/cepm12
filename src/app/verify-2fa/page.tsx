import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getPendingAuth } from "@/lib/auth/session";
import { PageHeader } from "@/components/page-header";
import { OtpForm } from "@/components/auth/otp-form";

export default async function Verify2faPage() {
  const pending = await getPendingAuth();
  if (!pending) redirect("/login");

  const rows = await db.select({ email: users.email }).from(users).where(eq(users.id, pending.userId)).limit(1);
  const user = rows[0];
  if (!user) redirect("/login");

  return (
    <>
      <PageHeader title="ยืนยันตัวตน" subtitle={`เราส่งรหัส 6 หลักไปที่ ${user.email}`} />
      <main className="flex flex-1 flex-col gap-4 p-4">
        <OtpForm />
      </main>
    </>
  );
}
