import { GradeType, PriceStatus } from './Order';

export type NegotiationStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface Negotiation {
  id: string;                       // Firestore document id
  orderId: string;                 

  factoryId: string;                
  farmerId: string;                 

  province: string;
  amphoe: string;
  grade: GradeType | string;

  // ราคาที่เกี่ยวข้องกับดีลนี้
  requestedPrice: number;           
  offeredPrice: number;             
  finalPrice?: number | null;       

  // เทียบกับราคากลาง
  refAvgPrice?: number | null;
  priceStatus?: PriceStatus;        // below_ref / normal / above_ref / no_ref

  status: NegotiationStatus;

  createdAt: FirebaseFirestore.Timestamp | Date;
  updatedAt: FirebaseFirestore.Timestamp | Date;
}
