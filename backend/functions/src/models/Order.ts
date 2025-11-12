export type OrderType = "sell" | "buy";
export type OrderStatus = "open" | "matched" | "closed";
export type GradeType = "AA" | "A" | "B" | "C" | "CC";
export type PriceStatus = "below_ref" | "normal" | "above_ref" | "no_ref";

export interface Order {
  id?: string;
  ownerId: string;
  type: OrderType;
  province: string;
  amphoe: string;
  grade: GradeType;
  amountKg: number;
  requestedPrice: number;
  status: OrderStatus;
  createdAt?: Date;
  matchedAt?: Date | null;

  suggestedAvgPrice?: number | null;
  priceStatus?: PriceStatus;
  priceDiffPercent?: number | null;
}
