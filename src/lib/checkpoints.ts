export type Checkpoint = {
  id: string;
  order: number;
  nameTh: string;
  nameEn: string;
  descriptionTh: string;
  /** The 6-digit code printed/encoded in this checkpoint's physical sign. */
  qrValue: string;
  /**
   * Position of this checkpoint's pin on the market map, in the same user-space
   * units as public/map/market-plan.svg's viewBox — see src/components/map/market-map.tsx.
   * Originally calibrated against "แผนที่จุดเช็คอิน" (the numbered reference image
   * from the art team) by matching its pins to landmark shapes on the actual map
   * artwork (shrine, river strip, mural blocks) since the two aren't pixel-identical
   * crops. When the map artwork was replaced with a version that adds the river and
   * road layers, every store-plot shape kept its id but moved/rescaled uniformly
   * (same affine transform for the whole drawing) — these coordinates were carried
   * over through that exact transform (scale ~0.649098, translate ~+55.58/+29.69),
   * not re-eyeballed, so they still point at the same physical spots.
   */
  mapX: number;
  mapY: number;
  /**
   * Cosmetic-only lean for the pin's round head, in degrees clockwise from
   * straight up (0 = default, straight up). The pin's tail always points at
   * the exact mapX/mapY location above — this only rotates which direction
   * the head floats off to, for checkpoints where "straight up" still lands
   * the head on top of a building. Chosen per-checkpoint by sampling which
   * direction around each pin is clearest of .market-plot/.market-zone shapes
   * in the actual rendered map (see market-map.tsx's checkpoint-pin effect).
   */
  headAngle?: number;
};

// Real check-in points, per "ตำแหน่งติดตั้งป้ายจุด check-in" (site survey PDF from the art/install team).
export const checkpoints: Checkpoint[] = [
  {
    id: "cp-01",
    order: 1,
    nameTh: "ตู้จำหน่ายอาหารปลาอัตโนมัติ",
    nameEn: "Fish Feeding Station",
    descriptionTh: "ตู้จำหน่ายอาหารปลาอัตโนมัติบริเวณริมน้ำ กิจกรรมยอดนิยมสำหรับนักท่องเที่ยวทุกวัย",
    qrValue: "482913",
    mapX: 174.37,
    mapY: 92.65,
  },
  {
    id: "cp-02",
    order: 2,
    nameTh: "เสาปูนบริเวณจุดรับประทานอาหาร",
    nameEn: "Dining Area Pillar",
    descriptionTh: "เสาปูนกลางจุดรับประทานอาหารในตลาด จุดพักระหว่างเดินชมตลาด",
    qrValue: "067254",
    mapX: 146.45,
    mapY: 133.54,
    headAngle: 205,
  },
  {
    id: "cp-03",
    order: 3,
    nameTh: "โซนข้างศูนย์อาหาร หน้าร้านขายของเล่น",
    nameEn: "Toy Shop Corner",
    descriptionTh: "โซนข้างศูนย์อาหาร บริเวณเสาหน้าร้านขายของเล่น",
    qrValue: "739481",
    mapX: 152.52,
    mapY: 121.03,
    headAngle: 302,
  },
  {
    id: "cp-04",
    order: 4,
    nameTh: "ซอยภาพจิตรกรรมฝาผนัง (ตลาดท่านา)",
    nameEn: "Market Mural Alley",
    descriptionTh: "ภาพจิตรกรรมฝาผนังรูปตลาดท่านา บอกเล่าเรื่องราวตลาดในอดีต",
    qrValue: "215608",
    mapX: 127.22,
    mapY: 84.61,
    headAngle: 187,
  },
  {
    id: "cp-05",
    order: 5,
    nameTh: "ซอยภาพจิตรกรรมฝาผนัง (รถสองแถว)",
    nameEn: "Songthaew Mural Alley",
    descriptionTh: "ภาพจิตรกรรมฝาผนังรูปรถสองแถว สัญลักษณ์การเดินทางของชุมชน",
    qrValue: "894027",
    mapX: 102.83,
    mapY: 105.97,
  },
  {
    id: "cp-06",
    order: 6,
    nameTh: "ข้างร้านพรเจริญ",
    nameEn: "Phon Charoen Shop",
    descriptionTh: "จุดเช็คอินข้างร้านพรเจริญ ร้านค้าดั้งเดิมของตลาดท่านา",
    qrValue: "350962",
    mapX: 125.68,
    mapY: 99.79,
  },
  {
    id: "cp-07",
    order: 7,
    nameTh: "ลานจอดรถศาลเจ้าแม่เบิกไพร",
    nameEn: "Chao Mae Boek Phrai Shrine Parking",
    descriptionTh: "ลานจอดรถศาลเจ้าแม่เบิกไพร จุดสิ้นสุดเส้นทางเดินชมตลาด",
    qrValue: "671845",
    mapX: 70.39,
    mapY: 125.21,
    headAngle: 230,
  },
];

export function getCheckpointByQrValue(qrValue: string): Checkpoint | undefined {
  return checkpoints.find((c) => c.qrValue === qrValue.trim());
}
