import { readFile } from "node:fs/promises";
import path from "node:path";
import { PageHeader } from "@/components/page-header";
import { MapViewSwitcher } from "@/components/map/map-view-switcher";
import { getStores, type StoreInfo } from "@/app/actions/stores";
import { getDirectoryStores } from "@/lib/plot-shops";
import { getCurrentUser } from "@/lib/auth/dal";

export default async function MapPage() {
  const svgMarkup = await readFile(path.join(process.cwd(), "public", "map", "market-plan.svg"), "utf-8");

  // Every plot starts from the team's shop directory (name, and where known,
  // description/photos); rows an admin saved in the database override those
  // per plot. The map itself (pan/zoom over the site plan) doesn't need the
  // database, so don't let a DB hiccup take down browsing — on failure the
  // directory alone is shown.
  let stores: Record<string, StoreInfo> = getDirectoryStores();
  let isAdmin = false;
  try {
    const [storesResult, user] = await Promise.all([getStores(), getCurrentUser()]);
    stores = { ...stores, ...storesResult };
    isAdmin = user?.role === "admin";
  } catch {
    // swallow — MarketMap renders fine with just the directory
  }

  return (
    <>
      <PageHeader title="แผนที่ตลาดท่านา" subtitle="Talat Tha Na Map" wide />

      <main className="flex flex-1 flex-col gap-3 p-4 md:mx-auto md:w-full md:max-w-5xl md:gap-4 md:p-6">
        <MapViewSwitcher svgMarkup={svgMarkup} stores={stores} isAdmin={isAdmin} />
      </main>
    </>
  );
}
