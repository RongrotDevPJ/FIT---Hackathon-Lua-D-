import express, { Request, Response } from "express";
import { db } from "../config/firestore";
import { evaluatePrice, GradeType } from "../services/priceService";
import { Order } from "../models/Order";

const app = express();
app.use(express.json());


// POST /orders  = สร้างออเดอร์ + เช็คราคากลาง
app.post("/orders", async (req: Request, res: Response) => {
  try {
    const {
      type,          // 'sell' หรือ 'buy'
      ownerId,
      province,
      amphoe,
      grade,         // 'B' | 'C' | 'CC'
      amountKg,
      requestedPrice,
    } = req.body;

    if (!type || !ownerId || !province || !amphoe || !grade || !requestedPrice) {
      return res.status(400).json({ error: "missing_fields" });
    }

    const g = String(grade).toUpperCase() as GradeType;

    // เรียกประเมินราคาจาก reference_prices
    const evalResult = await evaluatePrice(
      province,
      g,
      Number(requestedPrice)
    );

    // สร้างเอกสาร order ลง Firestore (ตัวอย่างง่าย ๆ)
const doc: Order = {
  ownerId,
  type,
  province,
  amphoe,
  grade: g,
  amountKg: Number(amountKg),
  requestedPrice: Number(requestedPrice),
  status: "open",
  createdAt: new Date(),
  suggestedAvgPrice: evalResult.reference?.avgPrice ?? null,
  priceStatus: evalResult.status,
  priceDiffPercent: evalResult.diffPercent,
};

    const ref = await db.collection("orders").add({
      ...doc,
      createdAt: new Date(),
    });

    return res.status(201).json({
  firestoreId: ref.id, 
  order: doc,          
});

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "internal_error" });
  }
});

// default export app เพื่อให้ index.ts นำไป wrap เป็น Cloud Function
export default app;
