import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { MarketStallIllustration } from "@/components/illustrations/market-stall-illustration";

export default function MapPage() {
  return (
    <>
      <PageHeader title="แผนที่ตลาดท่านา" subtitle="Talat Tha Na Map" />

      <main className="flex flex-1 flex-col gap-4 p-4">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <MarketStallIllustration className="size-24 text-primary/70" />
            <div className="space-y-1">
              <p className="font-medium">แผนที่กำลังจัดทำ</p>
              <p className="text-sm text-muted-foreground">
                กำลังรอไฟล์เวกเตอร์แผนที่จากทีมศิลปะ เมื่อพร้อมแล้วผู้ใช้จะสามารถดูข้อมูลแต่ละโซนของตลาดท่านา
                และซูมดูรายละเอียดเพิ่มเติมได้ที่หน้านี้
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
