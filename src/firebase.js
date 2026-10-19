import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyABF_3h9jvRvg38l7BAhmZrigZBuNCgyKA",
  authDomain: "fire-arena-cf3d0.firebaseapp.com",
  projectId: "fire-arena-cf3d0",
  storageBucket: "fire-arena-cf3d0.firebasestorage.app",
  messagingSenderId: "95348298908",
  appId: "1:95348298908:web:36b2a140ec73c5e115c959",
  measurementId: "G-KCRTS08MM6",
  databaseURL: "https://fire-arena-cf3d0-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Messaging only if supported (e.g. not supported in incognito or some browsers)
export let messaging = null;
isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
  }
}).catch(console.error);

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
};
