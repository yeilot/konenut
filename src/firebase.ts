import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// הגדרות קבועות כדי למנוע בעיות טעינה בפריסה
const firebaseConfig = {
  "projectId": "ai-studio-applet-webapp-e9dd9",
  "appId": "1:670608490894:web:38d9c18f671bb2f177a4df",
  "apiKey": "AIzaSyAWQsC3yxLXNi5QpwMi-2KiJxe9wQ3f1xQ",
  "authDomain": "ai-studio-applet-webapp-e9dd9.firebaseapp.com",
  "firestoreDatabaseId": "ai-studio-55e7e51f-31f0-41e8-892c-4ef6489457a8",
  "storageBucket": "ai-studio-applet-webapp-e9dd9.firebasestorage.app",
  "messagingSenderId": "670608490894"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
