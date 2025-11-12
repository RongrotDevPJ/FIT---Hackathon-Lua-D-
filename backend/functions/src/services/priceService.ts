import { db } from "../config/firestore";
import * as admin from 'firebase-admin';

export type GradeType = 'AA' | 'A' | 'B' | 'C' | 'CC';
export type PriceStatus = 'below_ref' | 'normal' | 'above_ref' | 'no_ref';

export interface ReferencePrice {
  id: string;
  province: string;
  grade: GradeType;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  source: string;
  updatedAt: admin.firestore.Timestamp;
}

export interface EvaluateResult {
  status: PriceStatus;
  diffPercent: number | null;
  reference: ReferencePrice | null;
}

// ดึง reference price ล่าสุดตาม province + grade
export async function getReferencePrice(
  province: string,
  grade: GradeType
): Promise<ReferencePrice | null> {
  const snap = await db
    .collection('reference_prices')
    .where('province', '==', province)
    .where('grade', '==', grade)
    .orderBy('updatedAt', 'desc')
    .limit(1)
    .get();

  if (snap.empty) {
    return null;
  }

  const doc = snap.docs[0];
  const data = doc.data();

  const ref: ReferencePrice = {
    id: doc.id,
    province: data.province,
    grade: data.grade,
    minPrice: data.minPrice,
    maxPrice: data.maxPrice,
    avgPrice: data.avgPrice,
    source: data.source,
    updatedAt: data.updatedAt,
  };

  return ref;
}

// ประเมินราคากับ avgPrice
export async function evaluatePrice(
  province: string,
  grade: GradeType,
  requestedPrice: number
): Promise<EvaluateResult> {
  const ref = await getReferencePrice(province, grade);

  if (!ref) {
    return {
      status: 'no_ref',
      diffPercent: null,
      reference: null,
    };
  }

  const diffPercent =
    ((requestedPrice - ref.avgPrice) / ref.avgPrice) * 100;

  let status: PriceStatus = 'normal';

  if (diffPercent <= -20) {
    status = 'below_ref';
  } else if (diffPercent >= 20) {
    status = 'above_ref';
  } else {
    status = 'normal';
  }

  return {
    status,
    diffPercent,
    reference: ref,
  };
}
