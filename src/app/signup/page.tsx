import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { PageHeader } from "@/components/page-header";
import { SignupForm } from "@/components/auth/signup-form";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/account");

  return (
    <>
      <PageHeader title="สมัครสมาชิก" subtitle="สร้างบัญชีเพื่อบันทึกความคืบหน้าและรับข่าวสาร" />
      <main className="flex flex-1 flex-col gap-4 p-4">
        <SignupForm />
        <p className="text-center text-sm text-muted-foreground">
          มีบัญชีอยู่แล้ว?{" "}
          <Link href="/login" className="text-primary underline underline-offset-4">
            เข้าสู่ระบบ
          </Link>
        </p>
      </main>
    </>
  );
}
