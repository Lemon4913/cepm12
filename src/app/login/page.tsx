import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { PageHeader } from "@/components/page-header";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/account");

  return (
    <>
      <PageHeader title="เข้าสู่ระบบ" subtitle="สำหรับผู้ดูแลระบบ ร้านค้า และนักท่องเที่ยว" />
      <main className="flex flex-1 flex-col gap-4 p-4">
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          ยังไม่มีบัญชี?{" "}
          <Link href="/signup" className="text-primary underline underline-offset-4">
            สมัครสมาชิก
          </Link>
        </p>
      </main>
    </>
  );
}
