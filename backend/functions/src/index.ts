// functions/src/index.ts
import express from "express";
import cors from "cors";
import { onRequest } from "firebase-functions/v2/https";

import priceRoutes from "./routes/priceRoutes";
import orderRoutes from "./routes/orderRoutes";
import usersRoutes from "./routes/usersRoutes";
// ✅ [แก้ไข]: เปลี่ยน 'n' เป็น 'N' ในชื่อไฟล์ที่ Import เพื่อแก้ปัญหา Case-Sensitive
import { getNegotiationByIdWithOrder } from "./services/negotiationService"; 

/** priceApi */
const priceApp = express();
priceApp.use(cors({ origin: true }));
priceApp.use(express.json());

// health check
priceApp.get("/", (_req, res) => res.send("priceApi OK"));
priceApp.use("/", priceRoutes);

/** orderApi */
const orderApp = express();
orderApp.use(cors({ origin: true }));
orderApp.use(express.json());
orderApp.get("/", (_req, res) => res.send("orderApi OK"));

// ✅ [NEW] เพิ่ม Endpoint สำหรับดึง Negotiation พร้อม Order details (สำหรับ NegotiationDetailScreen)
orderApp.get('/negotiations/:negotiationId', async (req, res, next) => {
    const negotiationId = req.params.negotiationId;
    try {
        // ใช้ฟังก์ชันที่ถูก Import ด้วยตัว N ใหญ่แล้ว
        const result = await getNegotiationByIdWithOrder(negotiationId); 
        if (result) {
            // คืนค่า Negotiation ที่มี Order object ซ้อนอยู่
            return res.status(200).json(result); 
        } else {
            return res.status(404).json({ error: 'negotiation_not_found' });
        }
    } catch (e) {
        // ส่งต่อไปยัง error handler กลาง
        return next(e);
    }
});


orderApp.use("/", orderRoutes); // มี endpoint /orders, /orders/:id/negotiations ฯลฯ อยู่ในนี้แล้ว

/** usersApi */
const usersApp = express();
usersApp.use(cors({ origin: true }));
usersApp.use(express.json());
usersApp.get("/", (_req, res) => res.send("usersApi OK"));
usersApp.use("/", usersRoutes);



/** error handler กลาง กันแอปล้มเวลา throw */
const errorHandler: express.ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err?.message ?? "Internal Server Error" });
};

priceApp.use(errorHandler);
orderApp.use(errorHandler);
usersApp.use(errorHandler);

/** Export เป็น Cloud Functions v2 (ใช้ region asia-southeast1 ให้ตรง Firestore) */
export const priceApi = onRequest({ region: "asia-southeast1" }, priceApp);
export const orderApi = onRequest({ region: "asia-southeast1" }, orderApp);
export const usersApi = onRequest({ region: "asia-southeast1" }, usersApp);