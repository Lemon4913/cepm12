import { requireUser } from "@/lib/auth/dal";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { listAdmins, listStoreAccounts, listPendingAdminEmails } from "@/app/actions/admin";
import { getPhotoUnlockThreshold } from "@/app/actions/settings";
import { getAdminStats } from "@/app/actions/stats";
import { getFeedbackSummary } from "@/app/actions/feedback";

export default async function AdminPage() {
  const user = await requireUser(["admin"]);
  const [admins, storeAccounts, pendingAdminEmails, photoThreshold, stats, feedbackSummary] = await Promise.all([
    listAdmins(),
    listStoreAccounts(),
    listPendingAdminEmails(),
    getPhotoUnlockThreshold(),
    getAdminStats(),
    getFeedbackSummary(),
  ]);

  return (
    <AdminDashboard
      adminName={user.name}
      adminId={user.id}
      admins={admins}
      storeAccounts={storeAccounts}
      pendingAdminEmails={pendingAdminEmails}
      photoThreshold={photoThreshold}
      stats={stats}
      feedbackSummary={feedbackSummary}
    />
  );
}
