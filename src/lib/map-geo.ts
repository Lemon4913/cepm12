/**
 * Georeferencing for the market floor plan (public/map/market-plan.svg) so it
 * can be drawn on top of a real-world map (see src/components/map/real-world-map.tsx).
 *
 * The floor plan is an unreferenced drawing — its coordinates are just SVG
 * user units. Three numbers tie it to the earth:
 *
 *   center       — where the floor plan's centre point sits, in WGS84.
 *   bearingDeg   — compass bearing the floor plan's +x axis (left → right)
 *                  points to. 90 = east (no rotation), 0 = north.
 *   metersPerUnit — real-world size of one SVG user unit.
 *
 * Calibrated by least-squares fitting the drawing's own river ("mea naam")
 * and road ("taNON") layers to OpenStreetMap: the drawn road onto the real
 * road loop around the market (ถนนเลียบแม่น้ำนครชัยศรี / ถนนธรรมสพน์ and the
 * service road on the north side) and the drawn river bank onto the real
 * bank of แม่น้ำท่าจีน — median residual ~2 m for the bank, ~5 m for roads.
 * If the artwork is redrawn, refit rather than nudging by eye; the drawn
 * scenery is accurate enough that eyeballing against the pink retail
 * outline (OSM way 544062946) lands ~35 m off.
 */
export const MARKET_GEO = {
  center: { lat: 13.801805, lng: 100.186489 },
  bearingDeg: 86.6,
  metersPerUnit: 1.552,
  /** Sensible zoom to open the real-world map at (Leaflet zoom level). */
  initialZoom: 18,
} as const;

/** Metres per degree of latitude (near-constant) and longitude (at a latitude). */
const M_PER_DEG_LAT = 110_574;
function mPerDegLng(lat: number) {
  return 111_320 * Math.cos((lat * Math.PI) / 180);
}

export type ViewBox = { x: number; y: number; w: number; h: number };

/** Parse the viewBox out of the floor plan's <svg> root. */
export function parseViewBox(svgMarkup: string): ViewBox {
  const raw = svgMarkup.match(/<svg[^>]*\sviewBox="([^"]+)"/)?.[1];
  const [x = 0, y = 0, w = 256, h = 256] = raw?.trim().split(/[\s,]+/).map(Number) ?? [];
  return { x, y, w, h };
}

/**
 * Everything needed to place the floor plan on a Leaflet map:
 * - the axis-aligned box (in SVG units) that the *rotated* floor plan fits in,
 *   which becomes the outer <svg> viewBox handed to L.svgOverlay,
 * - the <g transform> that rotates the original drawing inside that box,
 * - the lat/lng bounds of that box,
 * - a mapper from floor-plan coordinates (e.g. a checkpoint's mapX/mapY) to lat/lng.
 */
export function georeference(viewBox: ViewBox) {
  const { center, bearingDeg, metersPerUnit } = MARKET_GEO;
  // SVG rotate() is clockwise on screen; +x pointing at `bearing` means
  // rotating "east" (90°) by bearing − 90.
  const thetaDeg = bearingDeg - 90;
  const theta = (thetaDeg * Math.PI) / 180;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);

  const { w, h } = viewBox;
  const outerW = Math.abs(w * cos) + Math.abs(h * sin);
  const outerH = Math.abs(w * sin) + Math.abs(h * cos);

  // Centre the original drawing in the outer box, then spin it about its own centre.
  const transform = `translate(${outerW / 2} ${outerH / 2}) rotate(${thetaDeg}) translate(${-w / 2} ${-h / 2})`;

  const halfLat = (outerH * metersPerUnit) / 2 / M_PER_DEG_LAT;
  const halfLng = (outerW * metersPerUnit) / 2 / mPerDegLng(center.lat);
  const bounds: [[number, number], [number, number]] = [
    [center.lat - halfLat, center.lng - halfLng], // south-west
    [center.lat + halfLat, center.lng + halfLng], // north-east
  ];

  function toLatLng(mapX: number, mapY: number): [number, number] {
    // floor-plan user units → centred on the drawing → rotated → outer box coords
    const lx = mapX - viewBox.x - w / 2;
    const ly = mapY - viewBox.y - h / 2;
    const rx = lx * cos - ly * sin + outerW / 2;
    const ry = lx * sin + ly * cos + outerH / 2;
    // outer box coords → fraction of the box → lat/lng (y grows southward)
    const lat = bounds[1][0] - (ry / outerH) * (bounds[1][0] - bounds[0][0]);
    const lng = bounds[0][1] + (rx / outerW) * (bounds[1][1] - bounds[0][1]);
    return [lat, lng];
  }

  return { outerW, outerH, transform, bounds, toLatLng };
}
