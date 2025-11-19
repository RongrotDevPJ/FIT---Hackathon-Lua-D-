import { db } from "../config/firestore";
import { Timestamp } from "firebase-admin/firestore";
// ใช้ * as admin เพื่อให้แน่ใจว่า Type ของ Query ถูกต้อง
import * as admin from 'firebase-admin'; 
import { Order } from "../models/Order";
import {
  Negotiation,
  NegotiationStatus,
  NegotiationSide,
} from "../models/Negotiation";

const ORDERS_COL = "orders";
const NEGOS_COL = "negotiations";

// ✅ [NEW] 1. Interface สำหรับ Negotiation ที่มี Order details - ถูก EXPORT แล้ว
export interface NegotiationWithOrder extends Negotiation {
    order: Order & { id: string };
}

/**
 * ดึง Negotiation พร้อม Order details ต้นฉบับ (ใช้โดย Frontend: NegotiationDetailScreen)
 */
// ✅ [NEW] 2. ฟังก์ชันใหม่ - ถูก EXPORT แล้ว
export async function getNegotiationByIdWithOrder(negotiationId: string): Promise<NegotiationWithOrder | null> {
    const negoSnap = await db.collection(NEGOS_COL).doc(negotiationId).get();
    if (!negoSnap.exists) return null;

    const negotiation = { id: negoSnap.id, ...negoSnap.data() } as Negotiation;
    
    // ดึงรายละเอียด Order ต้นฉบับ
    const orderSnap = await db.collection(ORDERS_COL).doc(negotiation.orderId).get();
    if (!orderSnap.exists) {
        // Order ถูกลบไปแล้ว ถือว่าข้อมูลไม่สมบูรณ์
        throw new Error(`Original Order not found for negotiationId: ${negotiationId}, OrderId: ${negotiation.orderId}`);
    }
    const order = { id: orderSnap.id, ...orderSnap.data() } as Order & { id: string };

    return { ...negotiation, order };
};


/**
 * โหลด order + ตีความว่าใครเป็น factory / farmer จาก order.type
 */
async function resolveRoles(
  orderId: string,
  actorId: string
): Promise<{
  order: Order & { id: string };
  farmerId: string;
  factoryId: string;
  actorSide: NegotiationSide;
}> {
  const snap = await db.collection(ORDERS_COL).doc(orderId).get();
  if (!snap.exists) throw new Error("order_not_found");

  const data = snap.data() as Order;
  const order: Order & { id: string } = { id: snap.id, ...data };

  let farmerId: string;
  let factoryId: string;
  let actorSide: NegotiationSide;

  if (order.type === "sell") {
    // คนโพสต์ขาย = เกษตรกร
    farmerId = order.ownerId;
    factoryId = actorId;
  } else {
    // order.type === "buy"
    factoryId = order.ownerId;
    farmerId = actorId;
  }

  if (actorId === farmerId) actorSide = "farmer";
  else if (actorId === factoryId) actorSide = "factory";
  else {
    // ถ้า actorId ไม่ตรงทั้งสองฝั่ง → ถือว่าไม่ถูกต้อง
    throw new Error("actor_not_related_to_order");
  }

  return { order, farmerId, factoryId, actorSide };
}

/**
 * สร้างหรืออัปเดตรอบต่อรอง (counter offer) สำหรับ order หนึ่ง
 */
export async function createOrUpdateNegotiation(opts: {
  orderId: string;
  actorId: string;
  offeredPrice: number;
  amountKg: number; 
  refAvgPrice?: number | null;
  priceStatus?: string | null;
}): Promise<Negotiation & { id: string }> {
  const { orderId, actorId, offeredPrice, amountKg, refAvgPrice, priceStatus } = opts; 

  const { order, farmerId, factoryId, actorSide } = await resolveRoles(
    orderId,
    actorId
  );

  if (order.status !== "open") {
    throw new Error("order_not_open");
  }

  // หา negotiation เดิม (open) ระหว่าง farmer–factory คู่เดียวกัน
  let query = db
    .collection(NEGOS_COL)
    .where("orderId", "==", orderId)
    .where("farmerId", "==", farmerId)
    .where("factoryId", "==", factoryId)
    .where("status", "==", "open")
    .orderBy("updatedAt", "desc")
    .limit(1);

  const snap = await query.get();
  const nowDate = Timestamp.now().toDate();

  if (snap.empty) {
    // ---------- ยังไม่มี → สร้างใหม่ ----------
    const doc: Negotiation = {
      orderId,
      farmerId,
      factoryId,

      province: order.province,
      amphoe: order.amphoe,
      grade: order.grade,
      amountKg: amountKg, // บันทึก amountKg ตั้งแต่รอบแรก

      requestedPrice: order.requestedPrice,
      offeredPrice,
      finalPrice: null,

      refAvgPrice: refAvgPrice ?? order.suggestedAvgPrice ?? null,
      priceStatus: (priceStatus as any) ?? order.priceStatus,

      status: "open",
      lastSide: actorSide,
      createdAt: nowDate,
      updatedAt: nowDate,
    };

    const ref = await db.collection(NEGOS_COL).add(doc);
    return { id: ref.id, ...doc };
  } else {
    // ---------- มีแล้ว → อัปเดตข้อเสนอรอบใหม่ ----------
    const ref = snap.docs[0].ref;
    const data = snap.docs[0].data() as Negotiation;

    // [CHECK]: ตรวจสอบว่าฝ่ายที่กำลังจะต่อรองราคา (counter offer) ไม่ใช่ฝ่ายเดิม
    if (actorSide === data.lastSide) {
      throw new Error("negotiation_not_your_turn");
    }
    
    // [LOGIC]: หากเป็นรอบต่อรอง ต้องตรวจสอบว่า Farmer ไม่ได้เปลี่ยน amountKg
    if (actorSide === 'farmer' && amountKg !== data.amountKg) {
      throw new Error("farmer_cannot_change_amount_during_counter_offer");
    }

    const updated: Negotiation = {
      ...data,
      offeredPrice,
      amountKg: amountKg, // อัปเดต amountKg
      lastSide: actorSide,
      // อัปเดต refAvgPrice/priceStatus ถ้าส่งมาใหม่
      refAvgPrice:
        refAvgPrice !== undefined ? refAvgPrice : data.refAvgPrice ?? null,
      priceStatus:
        (priceStatus as any) !== undefined
          ? (priceStatus as any)
          : data.priceStatus,
      updatedAt: nowDate,
    };

    await ref.set(updated, { merge: true });
    return { id: ref.id, ...updated };
  }
}

/**
 * เปลี่ยนสถานะ negotiation (accept / reject / cancel / counter)
 */
export async function updateNegotiationStatus(opts: {
  negotiationId: string;
  actorId: string;
  action: 'accepted' | 'rejected' | 'cancelled' | 'negotiating';
  newPrice?: number; 
  newAmountKg?: number; 
}): Promise<Negotiation & { id: string }> {
  const { negotiationId, actorId, action, newPrice, newAmountKg } = opts; 

  const snap = await db.collection(NEGOS_COL).doc(negotiationId).get();
  if (!snap.exists) throw new Error("negotiation_not_found");

  const data = snap.data() as Negotiation & { id?: string };

  if (data.status !== "open") {
    throw new Error("negotiation_not_open");
  }

  // ตรวจว่า actorId เป็นหนึ่งในคู่เจรจา และหา actorSide
  let actorSide: NegotiationSide;
  if (actorId === data.farmerId) actorSide = "farmer";
  else if (actorId === data.factoryId) actorSide = "factory";
  else {
    throw new Error("actor_not_in_negotiation");
  }

  // [CHECK]: ตรวจสอบตาเดินของคู่เจรจา
  if (action !== 'cancelled' && actorSide === data.lastSide) {
    throw new Error("negotiation_not_your_turn");
  }


  const nowDate = Timestamp.now().toDate();

  const updatePayload: Partial<Negotiation> = {
    updatedAt: nowDate,
  };

  if (action === 'negotiating') {
    // อัปเดตราคาใหม่และระบุว่าใครต่อรองล่าสุด
    if (newPrice === undefined) {
      throw new Error("newPrice_required_for_negotiating");
    }
    
    let finalAmountKg = data.amountKg; // ฐานข้อมูลเริ่มต้นใช้ amountKg เดิม

    // [LOGIC]: การจัดการ amountKg ขึ้นอยู่กับบทบาท
    if (actorSide === 'farmer') {
        // เกษตรกรต่อรองได้แค่ราคาเท่านั้น น้ำหนักต้องคงเดิม
        if (newAmountKg !== undefined && newAmountKg !== data.amountKg) {
            // หากเกษตรกรพยายามส่งน้ำหนักใหม่ที่แตกต่างจากเดิม ให้ reject
            throw new Error("farmer_cannot_change_amount");
        }
        // ใช้ amountKg เดิม
        finalAmountKg = data.amountKg; 

    } else if (actorSide === 'factory') {
        // โรงงานสามารถต่อรองได้ทั้งราคาและปริมาณ
        if (newAmountKg === undefined) {
            // หากโรงงานต่อรองราคา แต่ไม่ได้ส่งปริมาณมา ให้ใช้ปริมาณเดิม ( lenient )
            finalAmountKg = data.amountKg; 
        } else {
            // ใช้ปริมาณใหม่ที่โรงงานเสนอ
            finalAmountKg = newAmountKg;
        }
    }
    
    // บันทึก payload
    updatePayload.offeredPrice = newPrice;
    updatePayload.amountKg = finalAmountKg; // ✅ ใช้ค่า finalAmountKg ที่คำนวณแล้ว
    updatePayload.lastSide = actorSide;
    
  } else {
    // 'accepted', 'rejected', หรือ 'cancelled' 
    updatePayload.status = action as NegotiationStatus;
    if (action === 'accepted') {
      updatePayload.finalPrice = data.offeredPrice ?? null;
      // Note: amountKg ใน order จะถูกอัปเดตตาม negotiation.amountKg
    }
  }

  const batch = db.batch();
  const negoRef = db.collection(NEGOS_COL).doc(negotiationId);
  batch.set(negoRef, updatePayload, { merge: true }); 

  // ถ้า accept → ปิดดีล + เซ็ต finalPrice + อัปเดต order
  if (action === "accepted") {
    const orderRef = db.collection(ORDERS_COL).doc(data.orderId);
    batch.set(
      orderRef,
      {
        status: "matched",
        matchedAt: nowDate,
        finalPrice: data.offeredPrice ?? null,
        // ✅ [NEW] อัปเดต amountKg ใน Order ด้วยปริมาณที่ตกลงกัน
        amountKg: data.amountKg, 
      } as any,
      { merge: true }
    );
  }

  await batch.commit();
  
  const updated: Negotiation = {
    ...data,
    ...updatePayload,
  } as Negotiation;

  return { id: negotiationId, ...updated };
}

/**
 * ดึงรายการ negotiation ของ order หนึ่ง (เรียงจากล่าสุด)
 */
export async function listNegotiationsOfOrder(
  orderId: string,
  limit = 50
): Promise<(Negotiation & { id: string })[]> {
  let q = db
    .collection(NEGOS_COL)
    .where("orderId", "==", orderId)
    .orderBy("updatedAt", "desc")
    .limit(limit);

  const snap = await q.get();
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Negotiation),
  }));
}


// ดึง negotiation ตาม farmer
export async function listNegotiationsByFarmer(
  farmerId: string,
  limit = 50,
  status?: NegotiationStatus
): Promise<(Negotiation & { id: string })[]> {
  
  let q: admin.firestore.Query = db
    .collection(NEGOS_COL)
    .where("farmerId", "==", farmerId);
    
  // ✅ [NEW LOGIC] กรองตาม status
  if (status) {
      q = q.where("status", "==", status);
  }
  
  q = q.orderBy("updatedAt", "desc").limit(limit);

  const snap = await q.get();
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Negotiation) }));
}

// ดึง negotiation ตาม buyer (โรงงาน)
export async function listNegotiationsByBuyer(
  buyerId: string,
  limit = 50,
  status?: NegotiationStatus
): Promise<(Negotiation & { id: string })[]> {
  
  let q: admin.firestore.Query = db
    .collection(NEGOS_COL)
    .where("factoryId", "==", buyerId);
    
  // ✅ [NEW LOGIC] กรองตาม status
  if (status) {
      q = q.where("status", "==", status);
  }

  q = q.orderBy("updatedAt", "desc").limit(limit);

  const snap = await q.get();
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Negotiation) }));
}