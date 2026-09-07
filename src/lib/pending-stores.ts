import data from "./pending-stores-data.json";

/**
 * Store name/description/photos collected by the team (docs/CEP proposal's
 * field data-collection effort) but not yet placed on the map — there's no
 * reliable way to know which SVG plot each belongs to (the source hand-drawn
 * floor plan that has that mapping is a GoodNotes file, not machine-readable,
 * and the docx write-ups only give fuzzy landmark hints like "beside the
 * shrine"). An admin picks one of these from the map's edit sheet
 * (src/components/map/market-map.tsx) to fill in a plot they've identified
 * themselves, instead of retyping the name/description/photos by hand.
 */
export type PendingStore = {
  slug: string;
  sourceFolder: string;
  name: string;
  description: string | null;
  photoUrls: string[];
};

export const pendingStores: PendingStore[] = data;
