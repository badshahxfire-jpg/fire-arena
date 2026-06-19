import { getDatabase } from "firebase/database";
import { initializeApp } from "firebase/app";
import { getFirestore} from "firebase/firestore";
import {
getToken
} from "firebase/messaging";

import {
getMessaging
} from "firebase/messaging";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from "firebase/auth";

import {
  getStorage
} from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBhElj_3kG-8X09JsQS5t0IJR9I_mzYQJc",
  authDomain: "fire-baadshah-arena.firebaseapp.com",
  projectId: "fire-baadshah-arena",
  storageBucket:
"fire-baadshah-arena.firebasestorage.app",
  messagingSenderId: "501695322845",
  appId: "1:501695322845:web:45747610276974719d5934",
  measurementId: "G-H336VWVB2M",
};

const app = initializeApp(firebaseConfig);

export const messaging =
getMessaging(app);

export const auth = getAuth(app);
export const database = getDatabase(app);
export const db = getFirestore(app);
export const storage =
getStorage(app);
export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
};
