import Constants from 'expo-constants';
import { Platform } from 'react-native';

// --- (นี่คือการตั้งค่า API ของคุณ - สำหรับ Production) ---
// Project ID: lua-database
// Region: asia-southeast1 
export const API_BASE_URL = 'https://asia-southeast1-lua-database.cloudfunctions.net'; 
// ------------------------------------

// ลบ Logic เก่าที่คำนวณ Host/Port สำหรับ Emulator ออกทั้งหมด

console.log(`[API Config] Connecting to Production: ${API_BASE_URL}`);