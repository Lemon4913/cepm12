import { requireUser } from "@/lib/auth/dal";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { MarketStallIllustration } from "@/components/illustrations/market-stall-illustration";

export default async function StorePage() {
  const user = await requireUser(["store", "admin"]);

  return (
    <>
      <PageHeader title="หน้าร้านค้า" subtitle={user.storeName ?? user.name} />
      <main className="flex flex-1 flex-col gap-4 p-4">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <MarketStallIllustration className="size-24 text-primary/70" />
            <div className="space-y-1">
              <p className="font-medium">เครื่องมือสำหรับร้านค้ากำลังจัดทำ</p>
              <p className="text-sm text-muted-foreground">
                เร็วๆ นี้ร้านค้าจะสามารถดูสถิตินักท่องเที่ยวที่แวะจุดเช็คอินใกล้ร้าน
                และอัปเดตข้อมูลร้านของตัวเองได้ที่หน้านี้
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
