import { PageHeader } from "@/components/page-header";
import { ProgressSummaryCard } from "@/components/progress-summary-card";
import { CheckpointList } from "@/components/checkpoint-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <>
      <PageHeader title="ตลาดท่านา" subtitle="Talat Tha Na Market · นครไชยศรี นครปฐม" />

      <main className="flex flex-1 flex-col gap-4 p-4">
        <ProgressSummaryCard />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">เกี่ยวกับตลาดท่านา</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <p>
              ตลาดท่านา ตั้งอยู่ที่ตำบลนครไชยศรี อำเภอนครไชยศรี จังหวัดนครปฐม เป็นตลาดชุมชนริมแม่น้ำนครไชยศรีที่มีอายุกว่า 140 ปี
              มีรากฐานมาตั้งแต่สมัยรัชกาลที่ 1 และพัฒนาเป็นชุมชนค้าขายสำคัญในสมัยรัชกาลที่ 5
            </p>
            <p>
              ชื่อ &ldquo;ตลาดท่านา&rdquo; มีที่มาจากการที่บริเวณนี้เคยเป็นท่าเรือสำหรับซื้อขายและขนส่งข้าวเปลือก ข้าวสาร
              ด้วยทำเลติดริมน้ำที่สะดวกต่อการคมนาคมทางเรือ
            </p>
          </CardContent>
        </Card>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            จุดเช็คอิน (Checkpoints)
          </h2>
          <CheckpointList />
        </section>
      </main>
    </>
  );
}
