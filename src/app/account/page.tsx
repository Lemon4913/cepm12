import Link from "next/link";
import { ShieldCheck, Store, MapPinned } from "lucide-react";
import { requireUser } from "@/lib/auth/dal";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressSummaryCard } from "@/components/progress-summary-card";
import { CheckpointList } from "@/components/checkpoint-list";
import { NewsOptInToggle } from "@/components/account/news-opt-in-toggle";
import { LogoutButton } from "@/components/auth/logout-button";

const roleLabel: Record<string, string> = {
  admin: "ผู้ดูแลระบบ",
  store: "ผู้ประกอบการ",
  user: "นักท่องเที่ยว",
};

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader title="บัญชีของฉัน" subtitle={user.email} />

      <main className="flex flex-1 flex-col gap-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{user.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{roleLabel[user.role] ?? user.role}</Badge>
              {user.storeName ? <Badge variant="secondary">{user.storeName}</Badge> : null}
              <Badge variant="outline" className="gap-1">
                <ShieldCheck className="size-3.5" />
                เปิดใช้ 2FA แล้ว
              </Badge>
            </div>

            <NewsOptInToggle defaultChecked={user.newsOptIn} />

            {user.role === "admin" ? (
              <Link
                href="/admin"
                className="flex items-center gap-2 rounded-md border p-2.5 text-sm hover:bg-accent"
              >
                <ShieldCheck className="size-4 text-muted-foreground" />
                ไปยังหน้าผู้ดูแลระบบ
              </Link>
            ) : null}
            {user.role === "store" ? (
              <Link
                href="/store"
                className="flex items-center gap-2 rounded-md border p-2.5 text-sm hover:bg-accent"
              >
                <Store className="size-4 text-muted-foreground" />
                ไปยังหน้าร้านค้า
              </Link>
            ) : null}
            <Link href="/scan" className="flex items-center gap-2 rounded-md border p-2.5 text-sm hover:bg-accent">
              <MapPinned className="size-4 text-muted-foreground" />
              สแกน QR Code จุดเช็คอิน
            </Link>
          </CardContent>
        </Card>

        <ProgressSummaryCard />

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">จุดเช็คอินของฉัน</h2>
          <CheckpointList />
        </section>

        <LogoutButton />
      </main>
    </>
  );
}
