import { requireUser } from "@/lib/auth/dal";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { listAdmins } from "@/app/actions/admin";
import { getPhotoUnlockThreshold } from "@/app/actions/settings";
import { getAdminStats } from "@/app/actions/stats";
import { getFeedbackSummary } from "@/app/actions/feedback";

export default async function AdminPage() {
  const user = await requireUser(["admin"]);
  const [admins, photoThreshold, stats, feedbackSummary] = await Promise.all([
    listAdmins(),
    getPhotoUnlockThreshold(),
    getAdminStats(),
    getFeedbackSummary(),
  ]);

  return (
    <AdminDashboard
      adminName={user.name}
      adminId={user.id}
      admins={admins}
      photoThreshold={photoThreshold}
      stats={stats}
      feedbackSummary={feedbackSummary}
    />
  );
}
