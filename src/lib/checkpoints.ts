export type Checkpoint = {
  id: string;
  order: number;
  nameTh: string;
  nameEn: string;
  descriptionTh: string;
  /** The 6-digit code printed/encoded in this checkpoint's physical sign. */
  qrValue: string;
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
  },
  {
    id: "cp-02",
    order: 2,
    nameTh: "เสาปูนบริเวณจุดรับประทานอาหาร",
    nameEn: "Dining Area Pillar",
    descriptionTh: "เสาปูนกลางจุดรับประทานอาหารในตลาด จุดพักระหว่างเดินชมตลาด",
    qrValue: "067254",
  },
  {
    id: "cp-03",
    order: 3,
    nameTh: "โซนข้างศูนย์อาหาร หน้าร้านขายของเล่น",
    nameEn: "Toy Shop Corner",
    descriptionTh: "โซนข้างศูนย์อาหาร บริเวณเสาหน้าร้านขายของเล่น",
    qrValue: "739481",
  },
  {
    id: "cp-04",
    order: 4,
    nameTh: "ซอยภาพจิตรกรรมฝาผนัง (ตลาดท่านา)",
    nameEn: "Market Mural Alley",
    descriptionTh: "ภาพจิตรกรรมฝาผนังรูปตลาดท่านา บอกเล่าเรื่องราวตลาดในอดีต",
    qrValue: "215608",
  },
  {
    id: "cp-05",
    order: 5,
    nameTh: "ซอยภาพจิตรกรรมฝาผนัง (รถสองแถว)",
    nameEn: "Songthaew Mural Alley",
    descriptionTh: "ภาพจิตรกรรมฝาผนังรูปรถสองแถว สัญลักษณ์การเดินทางของชุมชน",
    qrValue: "894027",
  },
  {
    id: "cp-06",
    order: 6,
    nameTh: "ข้างร้านพรเจริญ",
    nameEn: "Phon Charoen Shop",
    descriptionTh: "จุดเช็คอินข้างร้านพรเจริญ ร้านค้าดั้งเดิมของตลาดท่านา",
    qrValue: "350962",
  },
  {
    id: "cp-07",
    order: 7,
    nameTh: "ลานจอดรถศาลเจ้าแม่เบิกไพร",
    nameEn: "Chao Mae Boek Phrai Shrine Parking",
    descriptionTh: "ลานจอดรถศาลเจ้าแม่เบิกไพร จุดสิ้นสุดเส้นทางเดินชมตลาด",
    qrValue: "671845",
  },
];

export function getCheckpointByQrValue(qrValue: string): Checkpoint | undefined {
  return checkpoints.find((c) => c.qrValue === qrValue.trim());
}
