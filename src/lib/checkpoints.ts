export type Checkpoint = {
  id: string;
  order: number;
  nameTh: string;
  nameEn: string;
  descriptionTh: string;
  /**
   * Optional longer write-up (history, local beliefs) shown under the short
   * description in the checkpoint sheet — for checkpoints that are actual
   * landmarks rather than just a pillar or corner.
   */
  aboutTh?: string;
  /**
   * Optional photos of the spot, paths under public/checkpoints/. One photo
   * renders full-width; several render as a swipeable strip. Keep them
   * web-sized (≤1280px, ~200 KB) — visitors load these on the market's mobile signal.
   */
  imageUrls?: string[];
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
    aboutTh:
      "แม่น้ำนครชัยศรี คือชื่อเรียกของแม่น้ำท่าจีนในช่วงที่ไหลผ่านพื้นที่ จ.นครปฐม ซึ่งในอดีตแม่น้ำนครชัยศรี" +
      "เป็นเส้นทางคมนาคมขนส่งสินค้า การค้าขาย และการเกษตรที่สำคัญมาก เป็นแหล่งหล่อเลี้ยงชีวิตและอู่ข้าวอู่น้ำของชาวนครปฐม",
    imageUrls: [
      "/shops/fish-feeding-1.jpg",
      "/checkpoints/cp-01-1.jpg",
      "/checkpoints/cp-01-2.jpg",
      "/checkpoints/cp-01-3.jpg",
      "/checkpoints/cp-01-4.jpg",
    ],
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
    imageUrls: ["/checkpoints/cp-02-1.jpg", "/checkpoints/cp-02-2.jpg", "/checkpoints/cp-02-3.jpg"],
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
    imageUrls: ["/checkpoints/cp-03-1.jpg", "/checkpoints/cp-03-2.jpg", "/checkpoints/cp-03-3.jpg", "/checkpoints/cp-03-4.jpg"],
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
    aboutTh:
      "ตลาดท่านาในอดีตเป็นย่านการค้าขายริมน้ำ ซึ่งมีตั้งแต่ข้าวเปลือกและผลผลิตทางการเกษตร " +
      "สินค้าอุปโภคทางเรือ และผลไม้ชื่อดังในท้องถิ่น",
    imageUrls: ["/checkpoints/cp-04.jpg"],
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
    aboutTh:
      "การเดินทางมาตลาดท่านาจากตัวเมืองนครปฐม สามารถเดินทางด้วยรถสองแถวใหญ่สีเหลืองสายนครปฐม–ท่านา " +
      "โดยรถจะวิ่งผ่านถนนเพชรเกษมและตลาดท่านาโดยตรง",
    imageUrls: ["/checkpoints/cp-05.jpg"],
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
    aboutTh:
      "อาคารบ้านเรือนภายในตลาดท่านามีเอกลักษณ์เป็นห้องแถวไม้โบราณ 2 ชั้น และสถาปัตยกรรมกึ่งพาณิชย์ " +
      "สะท้อนถึงกลิ่นอายชุมชนไทยเชื้อสายจีนริมน้ำกว่า 100 ปี",
    imageUrls: [
      "/checkpoints/cp-06-1.jpg",
      "/checkpoints/cp-06-2.jpg",
      "/checkpoints/cp-06-3.jpg",
      "/checkpoints/cp-06-4.jpg",
      "/checkpoints/cp-06-5.jpg",
    ],
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
    aboutTh:
      "ศาลเจ้าแม่เบิกไพร ตลาดท่านา อ.นครชัยศรี จ.นครปฐม เป็นศาลของเจ้าแม่หม่าโจ้ว (เทียงโหวเซี้ยบ้อ) " +
      "โดยชาวบ้านในชุมชนตลาดท่านาได้ร่วมใจกันอัญเชิญเทวรูปหรือผงธูปมาจากศาลเจ้าแม่เบิกไพร อ.บ้านโป่ง จ.ราชบุรี " +
      "มาประดิษฐานไว้ที่ริมน้ำนครชัยศรี โดยมีความเชื่อว่าเจ้าแม่จะช่วยคุ้มครองการเดินทางทางน้ำและการค้าขาย",
    imageUrls: ["/checkpoints/cp-07.webp"],
    qrValue: "671845",
    mapX: 70.39,
    mapY: 125.21,
    headAngle: 230,
  },
];

export function getCheckpointByQrValue(qrValue: string): Checkpoint | undefined {
  return checkpoints.find((c) => c.qrValue === qrValue.trim());
}
