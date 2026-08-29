import { requireUser } from "@/lib/auth/dal";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { listAdmins } from "@/app/actions/admin";
import { getPhotoUnlockThreshold } from "@/app/actions/settings";

export default async function AdminPage() {
  const user = await requireUser(["admin"]);
  const [admins, photoThreshold] = await Promise.all([listAdmins(), getPhotoUnlockThreshold()]);

  return (
    <AdminDashboard
      adminName={user.name}
      adminId={user.id}
      admins={admins}
      photoThreshold={photoThreshold}
    />
  );
}
