import * as functions from "firebase-functions";
import orderApp from "./routes/orderRoutes";
import priceApp from "./routes/priceRoutes";

export const orderApi = functions.https.onRequest(orderApp);
export const priceApi = functions.https.onRequest(priceApp);
