import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Logs a coin transaction for a user.
 * 
 * @param {string} userId - The Firebase UID of the user.
 * @param {number} amount - The amount of coins involved.
 * @param {string} type - Transaction type (e.g., "MATCH_JOIN", "TOPUP", "WITHDRAW", "WINNING", "REFERRAL").
 * @param {string} reason - Detailed reason for the user to see (e.g., "Joined Match #123").
 * @param {boolean} isAddition - True if coins were added to the wallet, false if deducted.
 */
export const logCoinTransaction = async (userId, amount, type, reason, isAddition) => {
  if (!userId || !amount) return;
  
  try {
    const historyRef = collection(db, "users", userId, "coinHistory");
    await addDoc(historyRef, {
      amount: Number(amount),
      type: type,
      reason: reason,
      isAddition: isAddition,
      timestamp: serverTimestamp(),
      dateString: new Date().toLocaleString()
    });
  } catch (error) {
    console.error("Failed to log coin transaction:", error);
  }
};
