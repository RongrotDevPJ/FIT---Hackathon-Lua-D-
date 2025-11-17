import { Router, Request, Response } from "express";
import { db } from "../config/firestore";
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
      deliveryDate, details // (เพิ่ม 2 field นี้)
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

    if (type)     ref = ref.where("type", "==", String(type));                 // "sell" | "buy"
    if (status)   ref = ref.where("status", "==", String(status));             // "open" | "matched" | "closed"
    if (grade)    ref = ref.where("grade", "==", String(grade).toUpperCase()); // "AA" | "A" | "B" | "C" | "CC"
    if (province) ref = ref.where("province", "==", String(province));

    ref = ref.orderBy("createdAt", "desc").limit(limit);

    if (startAfterId) {
      const cursor = await db.collection("orders").doc(String(startAfterId)).get();
      const ts = cursor.get("createdAt");
      if (cursor.exists && ts) ref = ref.startAfter(ts);
    }

    const snap = await ref.get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const nextCursor = snap.docs.length ? snap.docs[snap.docs.length - 1].id : null;

    res.json({ items, nextCursor });
    return;
  } catch (e: any) {
    res.status(500).json({ error: e.message });
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
    if (ownerId)  ref = ref.where("ownerId", "==", String(ownerId));
    if (status)   ref = ref.where("status", "==", String(status));             // ตามสคีมา
    if (grade)    ref = ref.where("grade", "==", String(grade).toUpperCase());
    if (province) ref = ref.where("province", "==", String(province));

    ref = ref.orderBy("createdAt", "desc").limit(limit);

    if (startAfterId) {
      const cursor = await db.collection("orders").doc(String(startAfterId)).get();
      const ts = cursor.get("createdAt");
      if (cursor.exists && ts) ref = ref.startAfter(ts);
    }

    const snap = await ref.get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
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

    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ items });
    return;
  } catch (e: any) {
    res.status(500).json({ error: e.message }); return;
  }
});
// GET /orders/:id/matches  → หาออเดอร์ที่เข้าคู่
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
router.patch("/negotiations/:id", async (req: Request, res: Response) => {
  try {
    const negotiationId = req.params.id;
    const { actorId, status } = req.body ?? {};

    if (!actorId || !status) {
      return res.status(400).json({ error: "missing_fields" });
    }

    if (!["accepted", "rejected", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "invalid_status" });
    }

    const updated = await updateNegotiationStatus({
      negotiationId,
      actorId: String(actorId),
      newStatus: status,
    });

    return res.json(updated);
  } catch (e: any) {
    console.error(e);
    if (e?.message === "negotiation_not_found") {
      return res.status(404).json({ error: "negotiation_not_found" });
    }
    return res.status(400).json({ error: e.message ?? "internal_error" });
  }
});

router.get("/negotiations", async (req: Request, res: Response) => {
  try {
    const { farmerId, buyerId } = req.query as any;
    let limit = Number(req.query.limit ?? 20);
    if (Number.isNaN(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    if (!farmerId && !buyerId) {
      return res.status(400).json({ error: "farmerId_or_buyerId_required" });
    }
    if (farmerId && buyerId) {
      return res.status(400).json({ error: "only_one_of_farmerId_or_buyerId" });
    }

    let items;
    if (farmerId) {
      items = await listNegotiationsByFarmer(String(farmerId), limit);
    } else {
      items = await listNegotiationsByBuyer(String(buyerId), limit);
    }

    return res.json({ items });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message ?? "internal_error" });
  }
});


export default router;