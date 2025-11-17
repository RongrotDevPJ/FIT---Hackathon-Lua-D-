// functions/src/index.ts
import express from "express";
import cors from "cors";
import { onRequest } from "firebase-functions/v2/https";

import priceRoutes from "./routes/priceRoutes";
import orderRoutes from "./routes/orderRoutes";
import usersRoutes from "./routes/usersRoutes";

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

/*
ตัวอย่างเรียกจริง (production):

- Base ของ Functions:
  https://asia-southeast1-lua-database.cloudfunctions.net

- priceApi:
  GET https://asia-southeast1-lua-database.cloudfunctions.net/priceApi/
  GET https://asia-southeast1-lua-database.cloudfunctions.net/priceApi/reference?province=เชียงใหม่&grade=B

- orderApi:
  GET  https://asia-southeast1-lua-database.cloudfunctions.net/orderApi/orders
  GET  https://asia-southeast1-lua-database.cloudfunctions.net/orderApi/orders/{orderId}/matches
  POST https://asia-southeast1-lua-database.cloudfunctions.net/orderApi/orders/{orderId}/negotiations
  ...

- usersApi:
  POST https://asia-southeast1-lua-database.cloudfunctions.net/usersApi/users       (register)
  POST https://asia-southeast1-lua-database.cloudfunctions.net/usersApi/login      (login – เราเขียนไว้แล้วใน routes)
*/
