
import express, { Request, Response } from "express";
import { getReferencePrice, evaluatePrice, GradeType } from "../services/priceService";

const app = express();
app.use(express.json());

// GET /reference?province=เชียงใหม่&grade=B&price=28
app.get("/reference", async (req: Request, res: Response) => {
  try {
    const { province, grade, price } = req.query;

    if (!province || !grade) {
      return res.status(400).json({ error: "province and grade are required" });
    }

    const g = String(grade).toUpperCase() as GradeType;

    // ถ้ามี price ใน query → evaluate ให้เลย
    if (price) {
      const result = await evaluatePrice(
        String(province),
        g,
        Number(price)
      );
      return res.json(result);
    }

    // ถ้าไม่มี price → ดึง reference price เฉย ๆ
    const ref = await getReferencePrice(String(province), g);
    if (!ref) {
      return res.status(404).json({ message: "no reference price" });
    }

    return res.json(ref);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "internal_error" });
  }
});

export default app;
