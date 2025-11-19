// firebaseConfig.js (เวอร์ชัน Compat Mode)

// 1. Import 'compat' (v8) mode for the main app
import firebase from 'firebase/compat/app';

// 2. Import the 'compat' services you need (auth and firestore)
// This "bolts on" .auth() and .firestore() to the firebase object
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
// หากคุณใช้ service อื่นเช่น Storage ในไฟล์อื่น ให้เพิ่ม:
// import 'firebase/compat/storage';

// 3. Add the config from your friend (lua-database)
const firebaseConfig = {
  apiKey: "AIzaSyDVyo3uYzD8AjL-1fhK-LFxvTlJY_Xqrso",
  authDomain: "lua-database.firebaseapp.com",
  projectId: "lua-database",
  storageBucket: "lua-database.firebasestorage.app",
  messagingSenderId: "37698274124",
  appId: "1:37698274124:web:ad77ed57205c51bb6445e9",
  measurementId: "G-2SL58MS5XB"
};

// 4. Initialize the app (if not already initialized)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// 5. Export the 'firebase' object (which your v8 code expects)
export { firebase };