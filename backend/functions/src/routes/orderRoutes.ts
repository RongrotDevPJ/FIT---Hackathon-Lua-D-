import { Router, Request, Response } from "express";
import { db } from "../config/firestore";
import { evaluatePrice, GradeType } from "../services/priceService";
import { Order } from "../models/Order";

const router = Router();

/** POST /orders — สร้างออเดอร์ + ประเมินราคากลาง */
router.post("/orders", async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, ownerId, province, amphoe, grade, amountKg, requestedPrice } = req.body ?? {};

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

export default router;
