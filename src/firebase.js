import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase web client configuration. These values identify the project;
// authorization is enforced by Firebase Authentication and Firestore rules.
const firebaseConfig = {
  apiKey: 'AIzaSyAaHp6NRiMkE',
  authDomain: 'trend-entegre.firebaseapp.com',
  projectId: 'trend-entegre',
  storageBucket: 'trend-entegre.firebasestorage.app',
  messagingSenderId: '520870169459',
  appId: '1:520870169459:web:a0bd95ab18a1c6c4089306'
};

export const firebaseReady = true;
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
