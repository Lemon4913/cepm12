import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getPendingAuth } from "@/lib/auth/session";
import { totpKeyUri } from "@/lib/auth/totp";
import { PageHeader } from "@/components/page-header";
import { TotpForm } from "@/components/auth/totp-form";
import { confirmTotpSetup } from "@/app/actions/auth";
import { Card, CardContent } from "@/components/ui/card";

export default async function Setup2faPage() {
  const pending = await getPendingAuth();
  if (!pending || pending.stage !== "setup") redirect("/login");

  const rows = await db.select().from(users).where(eq(users.id, pending.userId)).limit(1);
  const user = rows[0];
  if (!user || !user.totpSecret) redirect("/login");

  const uri = totpKeyUri(user.email, user.totpSecret);
  const qrDataUrl = await QRCode.toDataURL(uri, { width: 240, margin: 1 });

  return (
    <>
      <PageHeader
        title="ตั้งค่ายืนยันตัวตนสองขั้นตอน"
        subtitle="สแกน QR ด้วยแอป Authenticator แล้วกรอกรหัส 6 หลัก"
      />
      <main className="flex flex-1 flex-col gap-4 p-4">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="TOTP QR code" className="w-48 rounded-md" />
            <p className="text-center text-xs text-muted-foreground">
              ใช้ Google Authenticator, Authy หรือแอปที่รองรับ TOTP อื่นๆ
              <br />
              หรือกรอกรหัสลับด้วยตนเอง:{" "}
              <span className="font-mono text-foreground">{user.totpSecret}</span>
            </p>
          </CardContent>
        </Card>
        <TotpForm action={confirmTotpSetup} submitLabel="ยืนยันและเปิดใช้งาน" />
      </main>
    </>
  );
}
