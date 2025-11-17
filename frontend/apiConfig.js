import Constants from 'expo-constants';
import { Platform } from 'react-native';

// --- (นี่คือการตั้งค่า API ของคุณ - สำหรับ Emulator) ---
const API_PORT = 5001; // Port ของ Firebase Emulator
// Path ที่ถูกต้องคือ /PROJECT_ID/REGION (ตามการตั้งค่าใน firebase.json)
const API_PATH = '/lua-database/asia-southeast1'; 
// ------------------------------------

/**
 * ฟังก์ชันนี้จะ "คำนวณ" IP ที่ถูกต้องให้เราอัตโนมัติ
 * - สำหรับ Android Emulator จะใช้ '10.0.2.2'
 * - สำหรับ iOS Simulator/Web จะใช้ 'localhost'
 */
const getApiHost = () => {
  // 1. ตรวจจับ OS
  const os = Platform.OS;

  // 2. ตรวจสอบว่ารันบนอุปกรณ์จริง (Expo Go) หรือ Simulator/Web
  // (Constants.isDevice จะเป็น true ถ้าเป็นมือถือจริง)
  const isDevice = Constants.isDevice;

  // 3. หา hostUri (เช่น "localhost:8081" หรือ "192.168.1.10:8081")
  const hostUri = Constants.manifest?.hostUri;
  
  // 4. แยกเอาเฉพาะ Hostname (เช่น "localhost" หรือ "192.168.1.10")
  const host = hostUri ? hostUri.split(':')[0] : 'localhost';

  // --- (Logic การตัดสินใจ) ---

  // ถ้าเป็น Android Emulator (OS คือ android แต่ *ไม่ได้* รันบนเครื่องจริง)
  if (os === 'android' && !isDevice) {
    return '10.0.2.2'; // ใช้ IP พิเศษของ Android Emulator
  }

  // ถ้าเป็นกรณีอื่นๆ (Web, iOS Simulator, Expo Go)
  // ให้ใช้ 'host' ที่เราหามาได้เลย
  return host;
};

// 5. สร้าง URL ทั้งหมด (ใช้ HTTP)
const host = getApiHost();
export const API_BASE_URL = `http://${host}:${API_PORT}${API_PATH}`;

// (ใส่ console.log ไว้ดูใน Terminal ว่ามันเลือก URL ถูกต้อง)
console.log(`[API Config] Connecting to: ${API_BASE_URL}`);