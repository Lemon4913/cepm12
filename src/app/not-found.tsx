import Link from "next/link";
import { Compass } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <PageHeader title="ไม่พบหน้านี้" subtitle="404" />
      <main className="flex flex-1 flex-col gap-4 p-4">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Compass className="size-10 text-muted-foreground" />
            <div className="space-y-1">
              <p className="font-medium">หลงทางแล้วสิ</p>
              <p className="text-sm text-muted-foreground">
                ไม่พบหน้าที่คุณกำลังมองหา อาจถูกย้ายหรือลบไปแล้ว
              </p>
            </div>
            <Button render={<Link href="/" />} nativeButton={false} className="mt-2">
              กลับหน้าแรก
            </Button>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
