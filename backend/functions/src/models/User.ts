
export type UserRole = 'farmer' | 'factory' | 'admin';

export interface User {
  id: string;                 // Firestore document id
  name: string;
  role: UserRole;
  province: string;           
  amphoe: string;             
  phone: string;

  // เฉพาะโรงงาน (factory) เท่านั้นที่อาจมีค่าเหล่านี้
  type?: string;              // ประเภทโรงงาน เช่น "อบแห้ง", "น้ำลำไย"
  avgPrice?: number;          
  capacityKg?: number;        // กำลังรับซื้อ (กก.)

  createdAt: FirebaseFirestore.Timestamp | Date;
}
