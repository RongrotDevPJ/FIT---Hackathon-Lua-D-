import { db } from "../config/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { Order } from "../models/Order";
import {
  Negotiation,
  NegotiationStatus,
  NegotiationSide,
} from "../models/Negotiation";

const ORDERS_COL = "orders";
const NEGOS_COL = "negotiations";

/**
 * โหลด order + ตีความว่าใครเป็น factory / farmer จาก order.type
 * - ถ้า order.type = "sell" → ownerId = farmer, actor = factory
 * - ถ้า order.type = "buy"  → ownerId = factory, actor = farmer
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
 * - ถ้าไม่เคยมี negotiation ระหว่าง farmer/factory คู่นี้ → สร้างใหม่
 * - ถ้ามีแล้วและ status = open → อัปเดตรอบล่าสุด (offeredPrice / amount / updatedAt)
 */
export async function createOrUpdateNegotiation(opts: {
  orderId: string;
  actorId: string;
  offeredPrice: number;
  amountKg: number;
  refAvgPrice?: number | null;
  priceStatus?: string | null;
}): Promise<Negotiation & { id: string }> {
  const { orderId, actorId, offeredPrice, refAvgPrice, priceStatus } = opts;

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

    const updated: Negotiation = {
      ...data,
      offeredPrice,
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
 * เปลี่ยนสถานะ negotiation (accept / reject / cancel)
 * - ถ้า accepted → อัปเดต order.status = "matched" + finalPrice + matchedAt
 */
export async function updateNegotiationStatus(opts: {
  negotiationId: string;
  actorId: string;
  newStatus: NegotiationStatus; // "accepted" | "rejected" | "cancelled"
}): Promise<Negotiation & { id: string }> {
  const { negotiationId, actorId, newStatus } = opts;

  const snap = await db.collection(NEGOS_COL).doc(negotiationId).get();
  if (!snap.exists) throw new Error("negotiation_not_found");

  const data = snap.data() as Negotiation & { id?: string };

  if (data.status !== "open") {
    throw new Error("negotiation_not_open");
  }

  // ตรวจว่า actorId เป็นหนึ่งในคู่เจรจา
  if (actorId !== data.farmerId && actorId !== data.factoryId) {
    throw new Error("actor_not_in_negotiation");
  }

  const nowDate = Timestamp.now().toDate();

  const updated: Negotiation = {
    ...data,
    status: newStatus,
    updatedAt: nowDate,
  };

  const batch = db.batch();
  const negoRef = db.collection(NEGOS_COL).doc(negotiationId);
  batch.set(negoRef, updated, { merge: true });

  // ถ้า accept → ปิดดีล + เซ็ต finalPrice + อัปเดต order
  if (newStatus === "accepted") {
    const orderRef = db.collection(ORDERS_COL).doc(data.orderId);
    batch.set(
      orderRef,
      {
        status: "matched",
        matchedAt: nowDate,
        // ใช้ offeredPrice รอบสุดท้ายเป็น finalPrice ของดีล
        finalPrice: data.offeredPrice ?? null,
      } as any,
      { merge: true }
    );
  }

  await batch.commit();
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
  limit = 50
): Promise<(Negotiation & { id: string })[]> {
  let q = db
    .collection(NEGOS_COL)
    .where("farmerId", "==", farmerId)
    .orderBy("updatedAt", "desc")
    .limit(limit);

  const snap = await q.get();
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Negotiation) }));
}

// ดึง negotiation ตาม buyer (โรงงาน)
export async function listNegotiationsByBuyer(
  buyerId: string,
  limit = 50
): Promise<(Negotiation & { id: string })[]> {
  let q = db
    .collection(NEGOS_COL)
    .where("factoryId", "==", buyerId)
    .orderBy("updatedAt", "desc")
    .limit(limit);

  const snap = await q.get();
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Negotiation) }));
}
