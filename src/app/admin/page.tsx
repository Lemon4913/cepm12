import { requireUser } from "@/lib/auth/dal";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default async function AdminPage() {
  const user = await requireUser(["admin"]);
  return <AdminDashboard adminName={user.name} />;
}
