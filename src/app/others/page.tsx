import Link from "next/link";
import { ExternalLink, ShieldUser, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/lib/site-config";

export default function OthersPage() {
  return (
    <>
      <PageHeader title="อื่นๆ" subtitle="เกี่ยวกับโครงการและลิงก์ที่เกี่ยวข้อง" />

      <main className="flex flex-1 flex-col gap-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">เกี่ยวกับโครงการ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <p>
              โครงการนำเทคโนโลยีเข้ามาแก้ไขปัญหานักท่องเที่ยวลดลงในตลาดท่านา ด้วยการพัฒนาแผนที่ดิจิทัลของตลาดชุมชน
              และกิจกรรม Walk-Rally ที่ใช้ระบบสแกน QR Code เพื่อเพิ่มการมีส่วนร่วมของนักท่องเที่ยว
              กระตุ้นให้สำรวจตลาดอย่างครบถ้วน และสร้างโอกาสทางการค้าให้แก่ผู้ประกอบการในชุมชนอย่างยั่งยืน
            </p>
            <p>โครงการ Community Engagement Program (CEP) โดยนักเรียน{siteConfig.school}</p>
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardContent className="divide-y p-0">
            <a
              href={siteConfig.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-4 transition-colors hover:bg-accent"
            >
              <ExternalLink className="size-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">GitHub Repository</p>
                <p className="text-xs text-muted-foreground">ซอร์สโค้ดของโปรเจกต์นี้</p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </a>

            <Link
              href="/admin"
              className="flex items-center gap-3 p-4 transition-colors hover:bg-accent"
            >
              <ShieldUser className="size-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">สำหรับผู้ดูแลระบบ</p>
                <p className="text-xs text-muted-foreground">จัดการจุดเช็คอินและข้อมูล QR Code</p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
