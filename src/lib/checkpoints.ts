export type Checkpoint = {
  id: string;
  order: number;
  nameTh: string;
  nameEn: string;
  descriptionTh: string;
  /** Value encoded in this checkpoint's printed QR code. */
  qrValue: string;
};

// Placeholder checkpoint data for the Talat Tha Na walk-rally.
// Replace with real check-in points once the art team delivers the survey data.
export const checkpoints: Checkpoint[] = [
  {
    id: "cp-01",
    order: 1,
    nameTh: "ท่าเรือตลาดท่านา",
    nameEn: "Talat Tha Na Pier",
    descriptionTh: "จุดเริ่มต้นทางประวัติศาสตร์ อดีตท่าเรือขนส่งข้าวเปลือกและข้าวสารริมแม่น้ำนครไชยศรี",
    qrValue: "cepm12:checkpoint:cp-01",
  },
  {
    id: "cp-02",
    order: 2,
    nameTh: "ตรอกจิตรกรรมฝาผนัง",
    nameEn: "Mural Alley",
    descriptionTh: "ภาพจิตรกรรมฝาผนังที่บอกเล่าเอกลักษณ์และวิถีชีวิตของชุมชนตลาดท่านา",
    qrValue: "cepm12:checkpoint:cp-02",
  },
  {
    id: "cp-03",
    order: 3,
    nameTh: "จุดให้อาหารปลา",
    nameEn: "Fish Feeding Point",
    descriptionTh: "ตู้อาหารปลาริมน้ำ กิจกรรมยอดนิยมสำหรับนักท่องเที่ยวทุกวัย",
    qrValue: "cepm12:checkpoint:cp-03",
  },
  {
    id: "cp-04",
    order: 4,
    nameTh: "ตลาดร้านค้าดั้งเดิม",
    nameEn: "Old Market Row",
    descriptionTh: "แถวร้านค้าดั้งเดิมอายุกว่า 140 ปี จำหน่ายสินค้าและของกินพื้นถิ่น",
    qrValue: "cepm12:checkpoint:cp-04",
  },
  {
    id: "cp-05",
    order: 5,
    nameTh: "ศาลาประวัติศาสตร์ชุมชน",
    nameEn: "Community History Pavilion",
    descriptionTh: "จุดรวบรวมเรื่องราวความเป็นมาของตลาดท่านาตั้งแต่สมัยรัชกาลที่ 1",
    qrValue: "cepm12:checkpoint:cp-05",
  },
  {
    id: "cp-06",
    order: 6,
    nameTh: "จุดจอดรถชุมชน",
    nameEn: "Community Parking Point",
    descriptionTh: "พื้นที่จอดรถที่จัดการโดยหน่วยงานและผู้นำชุมชน จุดสิ้นสุดเส้นทาง",
    qrValue: "cepm12:checkpoint:cp-06",
  },
];

export function getCheckpointByQrValue(qrValue: string): Checkpoint | undefined {
  return checkpoints.find((c) => c.qrValue === qrValue.trim());
}
