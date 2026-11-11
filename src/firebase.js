import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "FIREBASE_API_KEY",
  authDomain: "trend-entegre.firebaseapp.com",
  databaseURL: "https://trend-entegre-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "trend-entegre",
  storageBucket: "trend-entegre.firebasestorage.app",
  messagingSenderId: "520870169459",
  appId: "1:520870169459:web:a0bd95ab18a1c6c4089306"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);
