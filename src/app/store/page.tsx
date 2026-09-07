import Link from "next/link";
import { MapPinned } from "lucide-react";
import { requireUser } from "@/lib/auth/dal";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarketStallIllustration } from "@/components/illustrations/market-stall-illustration";

export default async function StorePage() {
  const user = await requireUser(["store", "admin"]);

  return (
    <>
      <PageHeader title="หน้าร้านค้า" subtitle={user.storeName ?? user.name} />
      <main className="flex flex-1 flex-col gap-4 p-4 md:mx-auto md:w-full md:max-w-2xl md:gap-5 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ข้อมูลร้านบนแผนที่</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              ตอนนี้ชื่อ รูปภาพ และรายละเอียดร้านของคุณบนแผนที่ตลาด ผู้ดูแลระบบเป็นผู้เพิ่ม/แก้ไขให้ —
              ถ้ายังไม่เห็นร้านของคุณ หรืออยากแก้ไขข้อมูล ติดต่อผู้ดูแลระบบได้เลย
            </p>
            <Button render={<Link href="/map" />} nativeButton={false} variant="outline">
              <MapPinned className="size-4" />
              ไปดูแผนที่ตลาด
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <MarketStallIllustration className="size-24 text-primary/70" />
            <div className="space-y-1">
              <p className="font-medium">เครื่องมือแก้ไขข้อมูลร้านด้วยตัวเองกำลังจัดทำ</p>
              <p className="text-sm text-muted-foreground">
                เร็วๆ นี้ร้านค้าจะสามารถดูสถิตินักท่องเที่ยวที่แวะจุดเช็คอินใกล้ร้าน
                และอัปเดตข้อมูลร้านของตัวเองได้โดยตรงที่หน้านี้
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
