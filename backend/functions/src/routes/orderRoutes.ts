// File: backend/functions/src/routes/orderRoutes.ts

import { Router, Request, Response } from "express";
import { db } from "../config/firestore";
// ✅ แก้ไข: เพิ่มการ Import FirebaseFirestore สำหรับ Type Annotation
import * as FirebaseFirestore from "firebase-admin/firestore"; 
import { evaluatePrice, GradeType } from "../services/priceService";
import { Order } from "../models/Order";
import { findMatchesForOrder } from "../services/orderService";
import {
  createOrUpdateNegotiation,
  updateNegotiationStatus,
  listNegotiationsOfOrder,
  listNegotiationsByFarmer,
  listNegotiationsByBuyer,
} from "../services/negotiationService";


const router = Router();

/** POST /orders — สร้างออเดอร์ + ประเมินราคากลาง */
router.post("/orders", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      type, ownerId, province, amphoe, grade, amountKg, requestedPrice,
      deliveryDate, details
    } = req.body ?? {};

    if (
      !type || !ownerId || !province || !amphoe || !grade ||
      requestedPrice === undefined || amountKg === undefined
    ) {
      res.status(400).json({ error: "missing_fields" });
      return;
    }

    const g = String(grade).toUpperCase() as GradeType;

    const evalResult = await evaluatePrice(String(province), g, Number(requestedPrice));

    const doc: Order = {
      ownerId: String(ownerId),
      type: String(type) as any, // "sell" | "buy"
      province: String(province),
      amphoe: String(amphoe),
      grade: g,
      amountKg: Number(amountKg),
      requestedPrice: Number(requestedPrice),
      status: "open",
      createdAt: new Date(),

      // (เพิ่ม 2 field นี้)
      deliveryDate: deliveryDate ? String(deliveryDate) : null,
      details: details ? String(details) : null,

      suggestedAvgPrice: evalResult.reference?.avgPrice ?? null,
      priceStatus: evalResult.status,
      priceDiffPercent: evalResult.diffPercent,
    };

    const ref = await db.collection("orders").add(doc);

    res.status(201).json({ firestoreId: ref.id, order: { id: ref.id, ...doc } });
    return;
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err?.message ?? "internal_error" });
    return;
  }
});

/** GET /orders/my?ownerId=...&type=&status=&grade=&province=&limit=&startAfterId= */
router.get("/orders/my", async (req: Request, res: Response): Promise<void> => {
  try {
    const { ownerId, type, status, grade, province, startAfterId } = req.query as any;
    let limit = Number(req.query.limit ?? 20);
    if (Number.isNaN(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    if (!ownerId) { res.status(400).json({ error: "ownerId_required" }); return; }

    let ref: FirebaseFirestore.Query = db.collection("orders")
      .where("ownerId", "==", String(ownerId));

    if (type) ref = ref.where("type", "==", String(type));                 // "sell" | "buy"
    if (status) ref = ref.where("status", "==", String(status));             // "open" | "matched" | "closed"
    if (grade) ref = ref.where("grade", "==", String(grade).toUpperCase()); // "AA" | "A" | "B" | "C" | "CC"
    if (province) ref = ref.where("province", "==", String(province));

    ref = ref.orderBy("createdAt", "desc").limit(limit);

    if (startAfterId) {
      const cursor = await db.collection("orders").doc(String(startAfterId)).get();
      const ts = cursor.get("createdAt");
      if (cursor.exists && ts) ref = ref.startAfter(ts);
    }

    const snap = await ref.get();

    // 📍 [FIX]: แปลง Timestamp เป็น ISO String
    const items = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        // แปลง Timestamp ใน Firestore เป็น ISO String
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
        matchedAt: data.matchedAt ? data.matchedAt.toDate().toISOString() : null,
      }
    });

    const nextCursor = snap.docs.length ? snap.docs[snap.docs.length - 1].id : null;

    res.json({ items, nextCursor });
    return;
  } catch (e: any) {
    console.error("Error in /orders/my:", e); // เพิ่ม log
    res.status(500).json({ error: e.message ?? "Internal Server Error" });
    return;
  }
});

/** GET /orders?ownerId=&status=&grade=&province=&limit=&startAfterId= */
router.get("/orders", async (req: Request, res: Response): Promise<void> => {
  try {
    const { ownerId, status, grade, province, startAfterId } = req.query as any;
    let limit = Number(req.query.limit ?? 20);
    if (Number.isNaN(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    let ref: FirebaseFirestore.Query = db.collection("orders");
    if (ownerId) ref = ref.where("ownerId", "==", String(ownerId));
    if (status) ref = ref.where("status", "==", String(status));             // ตามสคีมา
    if (grade) ref = ref.where("grade", "==", String(grade).toUpperCase());
    if (province) ref = ref.where("province", "==", String(province));

    ref = ref.orderBy("createdAt", "desc").limit(limit);

    if (startAfterId) {
      const cursor = await db.collection("orders").doc(String(startAfterId)).get();
      const ts = cursor.get("createdAt");
      if (cursor.exists && ts) ref = ref.startAfter(ts);
    }

    const snap = await ref.get();
    // 📍 [FIX]: แปลง Timestamp เป็น ISO String
    const items = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
        matchedAt: data.matchedAt ? data.matchedAt.toDate().toISOString() : null,
      }
    });
    const nextCursor = snap.docs.length ? snap.docs[snap.docs.length - 1].id : null;

    res.json({ items, nextCursor });
    return;
  } catch (e: any) {
    res.status(500).json({ error: e.message });
    return;
  }
});

/** GET /orders/:id */
router.get("/orders/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await db.collection("orders").doc(req.params.id).get();
    if (!doc.exists) { res.status(404).json({ message: "not_found" }); return; }
    res.json({ id: doc.id, ...doc.data() });
    return;
  } catch (e: any) {
    res.status(500).json({ error: e.message }); return;
  }
});

/** GET /orders/:id/negotiations */
router.get("/orders/:id/negotiations", async (req: Request, res: Response): Promise<void> => {
  try {
    let limit = Number(req.query.limit ?? 20);
    if (Number.isNaN(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    const snap = await db
      .collection("negotiations")
      .where("orderId", "==", req.params.id)
      .orderBy("updatedAt", "desc")
      .limit(limit)
      .get();

    // 📍 [FIX]: แปลง Timestamp เป็น ISO String
    const items = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
      }
    });
    res.json({ items });
    return;
  } catch (e: any) {
    res.status(500).json({ error: e.message }); return;
  }
});

// GET /orders/:id/matches  → หาออเดอร์ที่เข้าคู่
router.get("/orders/:id/matches", async (req: Request, res: Response) => {
  try {
    let limit = Number(req.query.limit ?? 20);
    if (Number.isNaN(limit) || limit <= 0) limit = 20;
    if (limit > 50) limit = 50;

    const items = await findMatchesForOrder(req.params.id, { limit });
    return res.json({ items });
  } catch (e: any) {
    if (e?.message === "order_not_found") {
      return res.status(404).json({ error: "order_not_found" });
    }
    console.error(e);
    return res.status(500).json({ error: e?.message ?? "internal_error" });
  }
});

router.post("/orders/:id/negotiations", async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;
    const { actorId, offeredPrice, amountKg, refAvgPrice, priceStatus } =
      req.body ?? {};

    if (
      !actorId ||
      offeredPrice === undefined ||
      amountKg === undefined
    ) {
      return res.status(400).json({ error: "missing_fields" });
    }

    const nego = await createOrUpdateNegotiation({
      orderId,
      actorId: String(actorId),
      offeredPrice: Number(offeredPrice),
      amountKg: Number(amountKg),
      refAvgPrice:
        refAvgPrice !== undefined ? Number(refAvgPrice) : undefined,
      priceStatus,
    });

    return res.status(201).json(nego);
  } catch (e: any) {
    console.error(e);
    return res.status(400).json({ error: e.message ?? "internal_error" });
  }
});

router.get("/orders/:id/negotiations", async (req: Request, res: Response) => {
  try {
    let limit = Number(req.query.limit ?? 50);
    if (Number.isNaN(limit) || limit <= 0) limit = 50;
    if (limit > 100) limit = 100;

    const items = await listNegotiationsOfOrder(req.params.id, limit);
    return res.json({ items });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});


// -----------------------------------------------------------
// ✅ [ROUTE สำหรับดึงรายละเอียดการเจรจาเดียว]
// -----------------------------------------------------------
/** GET /negotiations/:id - ดึงรายละเอียดการเจรจาเดียว */
router.get("/negotiations/:id", async (req: Request, res: Response) => {
  try {
    const doc = await db.collection("negotiations").doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "negotiation_not_found" });
    }

    const data = doc.data();
    // แปลง Timestamp เพื่อให้ Frontend รับได้
    const item = {
      id: doc.id,
      ...data,
      createdAt: data?.createdAt && typeof data.createdAt.toDate === 'function'
        ? data.createdAt.toDate().toISOString()
        : data?.createdAt,
      updatedAt: data?.updatedAt && typeof data.updatedAt.toDate === 'function'
        ? data.updatedAt.toDate().toISOString()
        : data?.updatedAt,
    }

    return res.json(item);
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message ?? "internal_error" });
  }
});

// -----------------------------------------------------------
// ✅ [MODIFIED ROUTE อัปเดตสถานะ/ราคา (รองรับ amountKg และแก้ไข Validation)]
// -----------------------------------------------------------
/** PUT /negotiations/:id - อัปเดตสถานะหรือราคา (Accept/Reject/Counter) */
router.put("/negotiations/:id", async (req: Request, res: Response) => {
  try {
    const negotiationId = req.params.id;
    // 📍 MODIFIED: รับ 'newAmountKg'
    const { actorId, action, newPrice, newAmountKg } = req.body ?? {};

    if (!actorId || !action) {
      return res.status(400).json({ error: "missing_fields" });
    }

    if (!["accepted", "rejected", "negotiating", "cancelled"].includes(action)) {
      return res.status(400).json({ error: "invalid_action" });
    }

    const priceValue = Number(newPrice);
    const amountValue = Number(newAmountKg); 

    if (action === 'negotiating') {
        // ตรวจสอบ newPrice
        if (newPrice === undefined || isNaN(priceValue) || priceValue <= 0) {
            return res.status(400).json({ error: "newPrice_invalid_or_missing_for_negotiating" });
        }
        
        // ⚠️ ลบการตรวจสอบ amountKg ที่เข้มงวดออก เพื่อให้ Service Layer จัดการตามบทบาท
        if (newAmountKg !== undefined && (isNaN(amountValue) || amountValue <= 0)) {
             return res.status(400).json({ error: "amountKg_invalid_format" });
        }
    }

    // 📍 อัปเดต: เรียกใช้ updateNegotiationStatus ด้วย action, newPrice, และ newAmountKg
    const updated = await updateNegotiationStatus({
      negotiationId,
      actorId: String(actorId),
      action: action, // ส่ง action ใหม่ไป
      newPrice: priceValue > 0 ? priceValue : undefined,
      newAmountKg: newAmountKg !== undefined ? amountValue : undefined, // ส่ง amountKg ไป
    });

    return res.json(updated);
  } catch (e: any) {
    console.error(e);
    if (e?.message === "negotiation_not_found") {
      return res.status(404).json({ error: "negotiation_not_found" });
    }
    // ส่ง Error ที่มาจาก Service Layer (เช่น farmer_cannot_change_amount)
    return res.status(400).json({ error: e.message ?? "internal_error" });
  }
});


/** * GET /negotiations
 * 📍 FIX: แปลง Timestamp เป็น ISO String ก่อนส่งกลับ
 */
router.get("/negotiations", async (req: Request, res: Response) => {
  try {
    // ✅ FIX 1: ดึงค่า status จาก query
    const { farmerId, buyerId, status } = req.query as any; 
    let limit = Number(req.query.limit ?? 20);
    if (Number.isNaN(limit) || limit < 1) limit = 20;
    // ⬇️ [FIXED]: ปรับ Hard Limit เป็น 200 ตามความต้องการของคุณ
    if (limit > 200) limit = 200; 

    if (!farmerId && !buyerId) {
      return res.status(400).json({ error: "farmerId_or_buyerId_required" });
    }
    if (farmerId && buyerId) {
      return res.status(400).json({ error: "only_one_of_farmerId_or_buyerId" });
    }

    let rawItems;
    if (farmerId) {
      // ✅ FIX 2: ส่ง status เข้าไปใน listNegotiationsByFarmer
      // NOTE: status ที่ส่งมาจะเป็น undefined หากเรียกแบบรวมทั้งหมด ซึ่ง listNegotiationsByFarmer จะจัดการให้
      rawItems = await listNegotiationsByFarmer(String(farmerId), limit, status as any);
    } else {
      // ✅ FIX 3: ส่ง status เข้าไปใน listNegotiationsByBuyer
      // NOTE: status ที่ส่งมาจะเป็น undefined หากเรียกแบบรวมทั้งหมด ซึ่ง listNegotiationsByBuyer จะจัดการให้
      rawItems = await listNegotiationsByBuyer(String(buyerId), limit, status as any);
    }

    // ✅ [FIX] แปลง Timestamp เป็น ISO String
    const items = rawItems.map((item: any) => ({
      ...item,
      createdAt: item.createdAt && typeof item.createdAt.toDate === 'function'
        ? item.createdAt.toDate().toISOString()
        : item.createdAt,
      updatedAt: item.updatedAt && typeof item.updatedAt.toDate === 'function'
        ? item.updatedAt.toDate().toISOString()
        : item.updatedAt,
    }));

    return res.json({ items });
  } catch (e: any) {
    console.error("Error in /negotiations:", e);
    return res.status(500).json({ error: e.message ?? "internal_error" });
  }
});


export default router;