"use client";

import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { AdminCheckpointTable } from "@/components/admin-checkpoint-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";
import { useCheckpointProgress } from "@/hooks/use-checkpoint-progress";

export function AdminDashboard({ adminName }: { adminName: string }) {
  const { resetProgress } = useCheckpointProgress();

  return (
    <>
      <PageHeader title="ผู้ดูแลระบบ" subtitle={`เข้าสู่ระบบในชื่อ ${adminName}`} />

      <main className="flex flex-1 flex-col gap-4 p-4">
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

        <LogoutButton />
      </main>
    </>
  );
}
