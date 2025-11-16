// src/config/firestore.ts
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp(); // ใช้ค่า default ของโปรเจ็กต์ lua-database
}

const db = admin.firestore();

// ถ้า Firestore Emulator ทำงานอยู่ CLI จะตั้งตัวแปรนี้ให้เอง
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
// บางเครื่อง FUNCTIONS_EMULATOR จะเป็น "true" ตอนรัน functions emulator
const isFunctionsEmu = process.env.FUNCTIONS_EMULATOR === "true";

if (emulatorHost && isFunctionsEmu) {
  // สำหรับ admin SDK รุ่นใหม่ แค่ตั้ง env ก็พอ แต่ใส่ settings() ก็ไม่เสียหาย
  db.settings({ host: emulatorHost, ssl: false });
  console.log(`[Firestore] Using emulator at ${emulatorHost}`);
} else {
  console.log("[Firestore] Using Cloud Firestore (production)");
}

export { db, admin };
