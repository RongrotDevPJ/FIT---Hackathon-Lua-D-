// functions/src/index.ts
import express from "express";
import cors from "cors";
import { onRequest } from "firebase-functions/v2/https";

import priceRoutes from "./routes/priceRoutes";
import orderRoutes from "./routes/orderRoutes";
import usersRoutes from "./routes/usersRoutes";

function makeApp(name: string, basePath: string, routes: express.Router) {
  const app = express();
  app.use(cors({ origin: true }));
  app.use(express.json());

  app.get("/", (_req, res) => res.send(`${name} OK`));
  app.get([basePath, `${basePath}/`], (_req, res) => res.send(`${name} OK`));

  app.use(basePath, routes);
  app.use("/", routes);

  // error handler
  app.use(((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ message: err?.message ?? "Internal Server Error" });
  }) as express.ErrorRequestHandler);

  return app;
}

export const priceApi = onRequest(
  { region: "asia-southeast1" },
  makeApp("priceApi", "/api/price", priceRoutes)
);
export const orderApi = onRequest(
  { region: "asia-southeast1" },
  makeApp("orderApi", "/api/order", orderRoutes)
);
export const usersApi = onRequest(
  { region: "asia-southeast1" },
  makeApp("usersApi", "/api/users", usersRoutes)
);
