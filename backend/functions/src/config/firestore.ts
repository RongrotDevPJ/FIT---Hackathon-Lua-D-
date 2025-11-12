import * as admin from 'firebase-admin';

// กัน initializeApp ซ้ำ
if (admin.apps.length === 0) {
  admin.initializeApp();
}

export const db = admin.firestore();
export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;
