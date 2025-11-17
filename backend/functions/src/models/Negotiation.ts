import { GradeType, PriceStatus } from "./Order";

export type NegotiationStatus = "open" | "accepted" | "rejected" | "cancelled";
export type NegotiationSide = "factory" | "farmer";

export interface Negotiation {
  id?: string;   // ← optional ตอนสร้างใหม่

  orderId: string;

  factoryId: string;
  farmerId: string;

  province: string;
  amphoe: string;
  grade: GradeType | string;

  requestedPrice: number;     // ราคาตั้งต้นจาก order
  offeredPrice: number;       // ราคาที่ถูกเสนอในรอบล่าสุด
  finalPrice?: number | null; // ราคาที่ตกลงสุดท้าย (ตอน accepted)

  refAvgPrice?: number | null;
  priceStatus?: PriceStatus;

  status: NegotiationStatus;

  lastSide?: NegotiationSide; // รอบล่าสุดใครเป็นคนเสนอ (ฝั่งไหน)
  createdAt: FirebaseFirestore.Timestamp | Date;
  updatedAt: FirebaseFirestore.Timestamp | Date;
}
