import data from "./plot-shops-data.json";
import { pendingStores } from "./pending-stores";
import type { StoreInfo } from "@/app/actions/stores";

/**
 * Which shop sits on which plot of public/map/market-plan.svg, from the
 * team's numbered floor plan + name list (Google Sheet "thanamap"). Derived
 * by registering the SVG's .market-plot outlines onto that hand-numbered
 * drawing and reading the number inside each outline, so plotId ↔ number is
 * geometric, not guessed. Two quirks carried over from the drawing: "49"
 * is written across two tiny adjacent cells and "56" appears twice, so those
 * numbers map to two plots each.
 *
 * This is the baseline the map shows for every plot; anything an admin
 * saves through the map's edit sheet (stores table) overrides it per plot.
 * `pendingSlug` links a plot to the fuller write-up/photos the team already
 * collected in pending-stores-data.json, where the names could be matched.
 */
export type PlotShop = {
  plotId: string;
  /** Number on the team's floor plan / sheet — handy for cross-referencing. */
  number: number;
  name: string;
  pendingSlug?: string;
};

export const plotShops: PlotShop[] = data;

/** Baseline StoreInfo per plot, ready to be overlaid by the database rows. */
export function getDirectoryStores(): Record<string, StoreInfo> {
  const pendingBySlug = new Map(pendingStores.map((p) => [p.slug, p]));
  return Object.fromEntries(
    plotShops.map((shop) => {
      const pending = shop.pendingSlug ? pendingBySlug.get(shop.pendingSlug) : undefined;
      return [
        shop.plotId,
        {
          id: shop.plotId,
          name: shop.name,
          description: pending?.description ?? null,
          photoUrls: pending?.photoUrls ?? [],
        },
      ];
    }),
  );
}
