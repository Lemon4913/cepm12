import type { AdminStats } from "@/app/actions/stats";

const roleLabel: Record<string, string> = {
  admin: "ผู้ดูแลระบบ",
  store: "ร้านค้า",
  user: "นักท่องเที่ยว",
};

export function StatsOverview({ stats }: { stats: AdminStats }) {
  const maxCount = Math.max(1, ...stats.checkpointCounts.map((c) => c.count));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border bg-muted/40 p-3">
          <p className="text-2xl font-semibold tabular-nums">{stats.totalUsers}</p>
          <p className="text-xs text-muted-foreground">ผู้ใช้ทั้งหมด</p>
        </div>
        <div className="rounded-lg border bg-muted/40 p-3">
          <p className="text-2xl font-semibold tabular-nums">{stats.totalScans}</p>
          <p className="text-xs text-muted-foreground">จำนวนการสแกนทั้งหมด</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {stats.usersByRole.map((r) => (
          <span key={r.role} className="rounded-full bg-muted px-2.5 py-1">
            {roleLabel[r.role] ?? r.role}: {r.count}
          </span>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">จุดเช็คอินยอดนิยม</p>
        <ul className="flex flex-col gap-1.5">
          {stats.checkpointCounts.map((cp) => (
            <li key={cp.id} className="flex items-center gap-2 text-sm">
              <span className="w-32 shrink-0 truncate sm:w-40">{cp.nameTh}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(cp.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right tabular-nums text-muted-foreground">{cp.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
