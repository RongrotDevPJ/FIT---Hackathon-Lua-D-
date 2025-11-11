
export type OrderType = 'sell' | 'buy';          // sell = เกษตรกรขาย, buy = โรงงานรับซื้อ
export type OrderStatus = 'open' | 'matched' | 'closed';

export type GradeType = 'B' | 'C' | 'CC';        // โฟกัสที่ B / C / CC
export type PriceStatus = 'below_ref' | 'normal' | 'above_ref' | 'no_ref';

export interface Order {
  id: string;                     // Firestore document id
  type: OrderType;
  ownerId: string;                

  province: string;
  amphoe: string;
  grade: GradeType | string;      

  // ถ้า type = "sell" -> ใช้ amountKg
  amountKg?: number;

  // ถ้า type = "buy" -> ใช้ quotaKg
  quotaKg?: number;

  requestedPrice: number;         

  // ข้อมูลอ้างอิงจากราคากลาง (ถ้ามี)
  refAvgPrice?: number | null;
  priceStatus?: PriceStatus;      // below_ref / normal / above_ref / no_ref
  priceDiffPercent?: number | null;

  status: OrderStatus;
  createdAt: FirebaseFirestore.Timestamp | Date;
}
