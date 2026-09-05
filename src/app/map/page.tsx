import { readFile } from "node:fs/promises";
import path from "node:path";
import { PageHeader } from "@/components/page-header";
import { MarketMap } from "@/components/map/market-map";
import { getStores, type StoreInfo } from "@/app/actions/stores";
import { getCurrentUser } from "@/lib/auth/dal";

export default async function MapPage() {
  const svgMarkup = await readFile(path.join(process.cwd(), "public", "map", "market-plan.svg"), "utf-8");

  // The map itself (pan/zoom over the site plan) doesn't need the database —
  // only the per-plot name/photo/description does. Don't let a DB hiccup take
  // down browsing the map too; just fall back to "no info yet" for every plot.
  let stores: Record<string, StoreInfo> = {};
  let isAdmin = false;
  try {
    const [storesResult, user] = await Promise.all([getStores(), getCurrentUser()]);
    stores = storesResult;
    isAdmin = user?.role === "admin";
  } catch {
    // swallow — MarketMap renders fine with an empty stores map
  }

  return (
    <>
      <PageHeader title="แผนที่ตลาดท่านา" subtitle="Talat Tha Na Map" />

      <main className="flex flex-1 flex-col gap-3 p-4">
        <MarketMap svgMarkup={svgMarkup} stores={stores} isAdmin={isAdmin} />
      </main>
    </>
  );
}
