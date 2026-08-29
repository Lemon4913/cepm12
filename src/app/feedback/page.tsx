import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { FeedbackForm } from "@/components/feedback/feedback-form";

export default function FeedbackPage() {
  return (
    <>
      <PageHeader title="ให้คะแนนการใช้งาน" subtitle="ความคิดเห็นของคุณช่วยให้เราปรับปรุงเว็บแอปนี้ได้ดีขึ้น" />
      <main className="flex flex-1 flex-col gap-4 p-4">
        <Card>
          <CardContent className="pt-6">
            <FeedbackForm />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
