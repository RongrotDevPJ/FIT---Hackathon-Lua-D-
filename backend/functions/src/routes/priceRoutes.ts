import express, { Router, Request, Response } from "express";
import { db } from "../config/firestore";
import { Timestamp } from "firebase-admin/firestore";
import * as priceSvc from "../services/priceService"; 
const router = Router();
router.use(express.json());

// DEV ONLY — seed mock reference prices
router.post("/seed-ref", async (_req: Request, res: Response): Promise<void> => {
  try {
    const batch = db.batch();
    const now = Timestamp.now(); // 
    const data = [
      { id: "CM-AA-2025", province: "เชียงใหม่", grade: "AA", minPrice: 46, maxPrice: 56, avgPrice: 51, source: "mock/manual", updatedAt: now },
      { id: "CM-A-2025",  province: "เชียงใหม่", grade: "A",  minPrice: 34, maxPrice: 42, avgPrice: 38, source: "mock/manual", updatedAt: now },
      { id: "CM-B-2025",  province: "เชียงใหม่", grade: "B",  minPrice: 18, maxPrice: 26, avgPrice: 22,  source: "mock/manual", updatedAt: now },
      { id: "CM-C-2025",  province: "เชียงใหม่", grade: "C",  minPrice: 10, maxPrice: 18, avgPrice: 14,  source: "mock/manual", updatedAt: now },
      { id: "CM-CC-2025", province: "เชียงใหม่", grade: "CC", minPrice: 5,  maxPrice: 10, avgPrice: 7.5, source: "mock/manual", updatedAt: now }
    ];
    data.forEach(d => batch.set(db.collection("reference_prices").doc(d.id), d));
    await batch.commit();
    res.json({ ok: true, inserted: data.length }); return;
  } catch (e: any) {
    res.status(500).json({ error: e.message }); return;
  }
});

// GET /reference?province=เชียงใหม่&grade=B[&price=24]
router.get("/reference", async (req: Request, res: Response): Promise<void> => {
  try {
    const { province, grade, price } = req.query as { province?: string; grade?: string; price?: string|number; };
    if (!province || !grade) { res.status(400).json({ error: "province and grade are required" }); return; }

    const g = String(grade).toUpperCase() as priceSvc.GradeType;

    if (price !== undefined) {
      const result = await priceSvc.evaluatePrice(province, g, Number(price));
      res.json(result); return;
    }

    const ref = await priceSvc.getReferencePrice(province, g);
    if (!ref) { res.status(404).json({ message: "no reference price" }); return; }
    res.json(ref); return;
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "internal_error" }); return;
  }
});

export default router;
