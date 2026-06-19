import {
  doc,
  updateDoc,
  increment,
  addDoc,
  collection,
  serverTimestamp,
  getDoc,
  setDoc,
} from "firebase/firestore";

import { db } from "../firebase";


// USER WALLET CREATE
export const createWallet = async (
  uid: string,
  name: string,
  email: string
) => {

  try {

    await setDoc(doc(db, "users", uid), {
      name,
      email,
      coins: 0,
      nameChanged: false,
      createdAt: serverTimestamp(),
    });

    console.log("Wallet Created");

  } catch (error) {

    console.log(error);

  }

};


// ADD COINS
export const addCoins = async (
  uid: string,
  amount: number
) => {

  try {

    await updateDoc(doc(db, "users", uid), {
      coins: increment(amount),
    });

    await addDoc(collection(db, "walletTransactions"), {
      uid,
      type: "credit",
      amount,
      message: "Coins Added",
      createdAt: serverTimestamp(),
    });

    console.log("Coins Added");

  } catch (error) {

    console.log(error);

  }

};


// DEDUCT COINS
export const deductCoins = async (
  uid: string,
  amount: number
) => {

  try {

    await updateDoc(doc(db, "users", uid), {
      coins: increment(-amount),
    });

    await addDoc(collection(db, "walletTransactions"), {
      uid,
      type: "debit",
      amount,
      message: "Tournament Entry Fee",
      createdAt: serverTimestamp(),
    });

    console.log("Coins Deducted");

  } catch (error) {

    console.log(error);

  }

};


// CHECK BALANCE
export const checkBalance = async (
  uid: string
) => {

  try {

    const userRef = doc(db, "users", uid);

    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {

      return userSnap.data().coins;

    }

    return 0;

  } catch (error) {

    console.log(error);

    return 0;

  }

};