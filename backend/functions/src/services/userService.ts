import { db } from "../config/firestore";
import { Timestamp } from "firebase-admin/firestore";

export type UserRole = "farmer" | "buyer" | "admin";

export interface User {
  id?: string;
  name: string;
  role: UserRole;
  phone?: string;
  province?: string;
  amphoe?: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

/** collection name */
const COL = "users";

function nowTs() {
  return Timestamp.now();
}

/** สร้างผู้ใช้ใหม่ */
export async function createUser(payload: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
  if (!payload.name) throw new Error("name is required");
  if (!payload.role) throw new Error("role is required");

  const docRef = await db.collection(COL).add({
    ...payload,
    createdAt: nowTs(),
    updatedAt: nowTs(),
  });

  const snap = await docRef.get();
  return { id: snap.id, ...(snap.data() as Omit<User, "id">) };
}

/** อ่านผู้ใช้ตาม id */
export async function getUserById(id: string): Promise<User | null> {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as Omit<User, "id">) };
}

/** อัปเดตผู้ใช้ตาม id (partial update) */
export async function updateUser(id: string, patch: Partial<User>): Promise<void> {
  const allowed: (keyof User)[] = ["name", "role", "phone", "province", "amphoe"];
  const data: Partial<User> = {};
  for (const k of allowed) {
    if (k in patch && typeof (patch as any)[k] !== "undefined") {
      (data as any)[k] = (patch as any)[k];
    }
  }
  if (Object.keys(data).length === 0) return;
  (data as any).updatedAt = nowTs();
  await db.collection(COL).doc(id).set(data, { merge: true });
}

/** ลบผู้ใช้ */
export async function deleteUser(id: string): Promise<void> {
  await db.collection(COL).doc(id).delete();
}

export interface ListUsersQuery {
  role?: UserRole;
  province?: string;
  amphoe?: string;
  limit?: number;      // default 20
  startAfterId?: string; // สำหรับเพจจิ้งแบบ keyset (ใช้ doc snapshot)
}

/** ดึงรายชื่อผู้ใช้ + ฟิลเตอร์ + เพจจิ้ง */
export async function listUsers(q: ListUsersQuery) {
  const limit = Math.min(Math.max(q.limit ?? 20, 1), 100);

  let ref: FirebaseFirestore.Query = db.collection(COL);

  if (q.role) ref = ref.where("role", "==", q.role);
  if (q.province) ref = ref.where("province", "==", q.province);
  if (q.amphoe) ref = ref.where("amphoe", "==", q.amphoe);

  ref = ref.orderBy("createdAt", "desc").limit(limit);

  if (q.startAfterId) {
    const cursorDoc = await db.collection(COL).doc(q.startAfterId).get();
    if (cursorDoc.exists && cursorDoc.get("createdAt")) {
      ref = ref.startAfter(cursorDoc.get("createdAt"));
    }
  }

  const snap = await ref.get();
  const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<User, "id">) }));
  const nextCursor = snap.docs.length ? snap.docs[snap.docs.length - 1].id : null;

  return { items, nextCursor };
}
