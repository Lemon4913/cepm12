import { redirect } from "next/navigation";
import { getPendingAuth } from "@/lib/auth/session";
import { PageHeader } from "@/components/page-header";
import { TotpForm } from "@/components/auth/totp-form";
import { verifyLoginTotp } from "@/app/actions/auth";

export default async function Verify2faPage() {
  const pending = await getPendingAuth();
  if (!pending || pending.stage !== "verify") redirect("/login");

  return (
    <>
      <PageHeader title="ยืนยันตัวตน" subtitle="กรอกรหัส 6 หลักจากแอป Authenticator ของคุณ" />
      <main className="flex flex-1 flex-col gap-4 p-4">
        <TotpForm action={verifyLoginTotp} submitLabel="เข้าสู่ระบบ" />
      </main>
    </>
  );
}
