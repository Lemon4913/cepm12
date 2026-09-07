"use client";

import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { AdminCheckpointTable } from "@/components/admin-checkpoint-table";
import { AdminManagement } from "@/components/admin/admin-management";
import { StoreRoleManagement } from "@/components/admin/store-role-management";
import { PhotoThresholdForm } from "@/components/admin/photo-threshold-form";
import { StatsOverview } from "@/components/admin/stats-overview";
import { FeedbackSummaryView } from "@/components/admin/feedback-summary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";
import { useCheckpointProgress } from "@/hooks/use-checkpoint-progress";
import type { AdminUserSummary, StoreAccountSummary } from "@/app/actions/admin";
import type { AdminStats } from "@/app/actions/stats";
import type { FeedbackSummary } from "@/app/actions/feedback";

export function AdminDashboard({
  adminName,
  adminId,
  admins,
  storeAccounts,
  photoThreshold,
  stats,
  feedbackSummary,
}: {
  adminName: string;
  adminId: string;
  admins: AdminUserSummary[];
  storeAccounts: StoreAccountSummary[];
  photoThreshold: number;
  stats: AdminStats | null;
  feedbackSummary: FeedbackSummary | null;
}) {
  const { resetProgress } = useCheckpointProgress();

  return (
    <>
      <PageHeader title="ผู้ดูแลระบบ" subtitle={`เข้าสู่ระบบในชื่อ ${adminName}`} wide />

      {/* Below md: same stacked single column as every other page. At md+:
          a 2-column grid — this is the one page with enough distinct cards
          (checkpoints, admins, stores, stats...) that a wide single column
          would just mean very long, very short lines of content. items-start
          keeps shorter cards from stretching to match a taller neighbor. */}
      <main className="flex flex-1 flex-col gap-4 p-4 md:mx-auto md:w-full md:max-w-5xl md:grid md:grid-cols-2 md:items-start md:gap-5 md:p-6">
        {stats ? (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">ภาพรวม</CardTitle>
            </CardHeader>
            <CardContent>
              <StatsOverview stats={stats} />
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">จุดเช็คอิน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              แตะไอคอนวงกลมเพื่อสลับสถานะสแกน (สำหรับทดสอบ) หรือแตะไอคอน QR เพื่อดู/พิมพ์ QR Code
              ประจำจุดนั้น
            </p>
            <AdminCheckpointTable />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">รูปภาพความสำเร็จ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              เมื่อผู้ใช้สแกนครบตามจำนวนนี้ ระบบจะปลดล็อกให้ถ่ายรูปและดาวน์โหลด/แชร์รูปความสำเร็จได้
            </p>
            <PhotoThresholdForm defaultValue={photoThreshold} />
          </CardContent>
        </Card>

        {feedbackSummary ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ความคิดเห็นจากผู้ใช้</CardTitle>
            </CardHeader>
            <CardContent>
              <FeedbackSummaryView summary={feedbackSummary} />
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">ผู้ดูแลระบบ</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminManagement admins={admins} currentUserId={adminId} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">บัญชีร้านค้า</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              กำหนดบัญชีที่สมัครสมาชิกแล้วให้เป็นร้านค้า (และตั้ง/แก้ชื่อร้าน) หรือถอดสิทธิ์กลับเป็นนักท่องเที่ยว
            </p>
            <StoreRoleManagement stores={storeAccounts} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">รีเซ็ตความคืบหน้า</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              ล้างสถานะการสแกนทั้งหมดของบัญชีนี้ (ใช้สำหรับทดสอบระบบ)
            </p>
            <Button
              variant="destructive"
              onClick={() => {
                resetProgress();
                toast.success("รีเซ็ตความคืบหน้าเรียบร้อยแล้ว");
              }}
            >
              รีเซ็ตทั้งหมด
            </Button>
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <LogoutButton />
        </div>
      </main>
    </>
  );
}
