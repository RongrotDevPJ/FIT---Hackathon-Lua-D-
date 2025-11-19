import { GradeType, PriceStatus } from "./Order";
import type { Timestamp } from "firebase-admin/firestore";

export type NegotiationStatus = "open" | "accepted" | "rejected" | "cancelled";
export type NegotiationSide = "factory" | "farmer";

export interface Negotiation {
  id?: string;   

  orderId: string;

  factoryId: string;
  farmerId: string;

  province: string;
  amphoe: string;
  grade: GradeType | string;
  
  amountKg: number; // ✅ เพิ่ม amountKg สำหรับเจรจาปริมาณ

  requestedPrice: number;     
  offeredPrice: number;       
  finalPrice?: number | null; 

  refAvgPrice?: number | null;
  priceStatus?: PriceStatus;

  status: NegotiationStatus;

  lastSide?: NegotiationSide; 
  createdAt: Timestamp | Date; 
  updatedAt: Timestamp | Date; 
}