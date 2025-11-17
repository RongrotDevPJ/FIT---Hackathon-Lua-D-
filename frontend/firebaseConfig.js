// firebaseConfig.js

// --- [1. Import "เครื่องมือ" ที่ถูกต้อง] ---
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- [2. "กุญแจ" (Config) ที่เพื่อนคุณให้มา (ถูกต้อง 100%)] ---
const firebaseConfig = {
  apiKey: "AIzaSyDVyo3uYzD8AjL-1fhK-LFxvTlJY_Xqrso",
  authDomain: "lua-database.firebaseapp.com",
  projectId: "lua-database",
  storageBucket: "lua-database.firebasestorage.app",
  messagingSenderId: "37698274124",
  appId: "1:37698274124:web:ad77ed57205c51bb6445e9",
  measurementId: "G-2SL58MS5XB"
};

// --- [3. "ต่อสายไฟ"] ---
const app = initializeApp(firebaseConfig);

// --- [4. "ส่งออก" เครื่องมือที่เราจะใช้ในหน้าอื่น] ---
export const auth = getAuth(app);
export const db = getFirestore(app);