import { db } from "../config/firestore";
import { Timestamp } from "firebase-admin/firestore";
import * as priceSvc from "../services/priceService";

export type OrderType = "sell" | "buy";
export type OrderStatus = "open" | "matched" | "closed" | "cancelled";
export type PriceStatus = priceSvc.PriceStatus;

export interface Order {
  id?: string;

  // owner / type
  ownerId: string;          // ใครเป็นคนโพสต์
  type: OrderType;          // sell | buy

  // product & location
  product?: string;         // เช่น ลำไย/มะม่วง (ถ้ามี)
  grade: priceSvc.GradeType;
  amountKg?: number;
  province: string;
  amphoe?: string;

  // price
  requestedPrice: number;   // ราคาที่ขอ
  refAvgPrice?: number;     // ราคากลางเฉลี่ยจาก reference
  priceStatus?: PriceStatus;// below_ref | normal | above_ref | no_ref
  priceDiffPercent?: number | null;

  // state
  status: OrderStatus;      // เริ่มด้วย open

  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

const COL = "orders";

export async function createOrder(payload: Omit<Order, "id" | "createdAt" | "updatedAt" | "refAvgPrice" | "priceStatus" | "priceDiffPercent">): Promise<Order> {
  // validate เบื้องต้น
  if (!payload.ownerId) throw new Error("ownerId is required");
  if (!payload.type) throw new Error("type is required");
  if (!payload.grade) throw new Error("grade is required");
  if (!payload.province) throw new Error("province is required");
  if (typeof payload.requestedPrice !== "number") throw new Error("requestedPrice must be number");

  // คำนวณเทียบราคากลาง (ถ้ามี)
  const g = String(payload.grade).toUpperCase() as priceSvc.GradeType;
  const evalResult = await priceSvc.evaluatePrice(payload.province, g, payload.requestedPrice);

  const doc = {
    ...payload,
    refAvgPrice: evalResult.reference?.avgPrice ?? undefined,
    priceStatus: evalResult.status,
    priceDiffPercent: evalResult.diffPercent,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const ref = await db.collection(COL).add(doc);
  const snap = await ref.get();
  return { id: snap.id, ...(snap.data() as Omit<Order, "id">) };
}

export interface MyOrdersQuery {
  ownerId: string;          // จำเป็น
  type?: OrderType;         // ตัวกรองเพิ่มเติม
  status?: OrderStatus;
  grade?: priceSvc.GradeType;
  province?: string;
  limit?: number;           // default 20
  startAfterId?: string;    // keyset pagination
}

export async function listMyOrders(q: MyOrdersQuery) {
  if (!q.ownerId) throw new Error("ownerId is required");

  let ref: FirebaseFirestore.Query = db.collection(COL)
    .where("ownerId", "==", q.ownerId);

  if (q.type)     ref = ref.where("type", "==", q.type);
  if (q.status)   ref = ref.where("status", "==", q.status);
  if (q.grade)    ref = ref.where("grade", "==", q.grade);
  if (q.province) ref = ref.where("province", "==", q.province);

  const limit = Math.min(Math.max(q.limit ?? 20, 1), 100);
  ref = ref.orderBy("createdAt", "desc").limit(limit);

  if (q.startAfterId) {
    const cursor = await db.collection(COL).doc(q.startAfterId).get();
    const ts = cursor.get("createdAt");
    if (cursor.exists && ts) ref = ref.startAfter(ts);
  }

  const snap = await ref.get();
  const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Order,"id">) }));
  const nextCursor = snap.docs.length ? snap.docs[snap.docs.length - 1].id : null;

  return { items, nextCursor };
}

// ==== MATCHING LOGIC ====

export interface MatchResult {
  id: string;
  priority: "same_amphoe" | "same_province";
  order: Order;
}

export async function findMatchesForOrder(
  orderId: string,
  opts?: { limit?: number }
): Promise<MatchResult[]> {
  const limit = opts?.limit && opts.limit > 0
    ? Math.min(opts.limit, 50)
    : 20;

  // เอา order ต้นทางก่อน
  const baseSnap = await db.collection(COL).doc(orderId).get();
  if (!baseSnap.exists) {
    throw new Error("order_not_found");
  }
  const base = { id: baseSnap.id, ...(baseSnap.data() as Omit<Order, "id">) };

  const counterpartType: OrderType = base.type === "sell" ? "buy" : "sell";

  const results: MatchResult[] = [];
  const usedIds = new Set<string>([orderId]);

  // 1) จังหวัด + อำเภอเดียวกัน
  let q1: FirebaseFirestore.Query = db.collection(COL)
    .where("type", "==", counterpartType)
    .where("status", "==", "open")
    .where("grade", "==", base.grade)
    .where("province", "==", base.province)
    .where("amphoe", "==", base.amphoe);

  const snap1 = await q1.limit(limit).get();
  for (const doc of snap1.docs) {
    if (usedIds.has(doc.id)) continue;

    usedIds.add(doc.id);
    results.push({
      id: doc.id,
      priority: "same_amphoe",
      order: { id: doc.id, ...(doc.data() as Omit<Order, "id">) },
    });
  }

  // 2) จังหวัดเดียวกัน (แต่ไม่นับตัวที่อำเภอเดียวกันซ้ำ)
  if (results.length < limit) {
    const remain = limit - results.length;

    let q2: FirebaseFirestore.Query = db.collection(COL)
      .where("type", "==", counterpartType)
      .where("status", "==", "open")
      .where("grade", "==", base.grade)
      .where("province", "==", base.province);

    const snap2 = await q2.limit(remain * 2).get(); // ดึงเผื่อแล้วค่อยกรองทีหลัง

    for (const doc of snap2.docs) {
      if (usedIds.has(doc.id)) continue; // กันซ้ำ province+amphoe
      const data = doc.data() as Omit<Order, "id">;

      if (data.amphoe === base.amphoe) continue; // กันเคสอำเภอเดียวกันที่ถูกดึงมาซ้ำ
      usedIds.add(doc.id);

      results.push({
        id: doc.id,
        priority: "same_province",
        order: { id: doc.id, ...data },
      });

      if (results.length >= limit) break;
    }
  }

  return results;
}
