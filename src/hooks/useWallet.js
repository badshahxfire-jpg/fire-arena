import { useState, useEffect } from "react";
import { doc, onSnapshot, updateDoc, increment, getDoc, collection, query as firestoreQuery, where, getDocs } from "firebase/firestore";
import { ref, push, update, onValue } from "firebase/database";
import { db, database } from "../firebase";
import { logCoinTransaction } from "../utils/coinHistory";

export function useWallet(user) {
  const [coins, setCoins] = useState(0);
  const [winCoins, setWinCoins] = useState(0);
  const [playerData, setPlayerData] = useState(null);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [withdrawRequests, setWithdrawRequests] = useState([]);

  // Fetch User Wallet Data
  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (snapshot) => {
      if (snapshot.exists()) {
        setCoins(snapshot.data().coins || 0);
        setWinCoins(snapshot.data().winCoins || 0);
        setPlayerData(snapshot.data());
      }
    });
    
    return () => unsubscribe();
  }, [user]);

  // Fetch Payment Requests
  useEffect(() => {
    if (!user) {
      setPaymentRequests([]);
      return;
    }
    const paymentRef = ref(database, "paymentRequests");
    
    const unsubscribe = onValue(paymentRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedData = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        setPaymentRequests(loadedData);
      } else {
        setPaymentRequests([]);
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch Withdraw Requests
  useEffect(() => {
    if (!user) {
      setWithdrawRequests([]);
      return;
    }
    const withdrawRef = ref(database, "withdrawRequests");
    
    const unsubscribe = onValue(withdrawRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedData = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        setWithdrawRequests(loadedData);
      } else {
        setWithdrawRequests([]);
      }
    });
    return () => unsubscribe();
  }, [user]);

  // ================= CHECK TEAMMATE COINS =================
  const checkTeammateCoins = async (teammateUserId, requiredCoins, teammateName) => {
    try {
      if (!teammateUserId) {
        return { 
          hasEnough: false, 
          currentCoins: 0, 
          error: `Teammate ${teammateName} has no User ID!` 
        };
      }
      
      const userRef = doc(db, "users", teammateUserId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        return { 
          hasEnough: false, 
          currentCoins: 0, 
          error: `Teammate "${teammateName}" (${teammateUserId}) not found in system! Please ask them to register first.` 
        };
      }
      
      const userData = userSnap.data();
      const currentCoins = userData.coins || 0;
      
      if (currentCoins < requiredCoins) {
        return { 
          hasEnough: false, 
          currentCoins: currentCoins, 
          error: `❌ Teammate "${teammateName}" has insufficient coins!\n   Needs: 🪙 ${requiredCoins}\n   Has: 🪙 ${currentCoins}` 
        };
      }
      
      return { 
        hasEnough: true, 
        currentCoins: currentCoins, 
        error: null,
        userData: userData
      };
    } catch (error) {
      console.error("Error checking teammate coins:", error);
      return { 
        hasEnough: false, 
        currentCoins: 0, 
        error: `Error checking teammate ${teammateName}: ${error.message}` 
      };
    }
  };

  // ================= CHECK MULTIPLE TEAMMATES COINS =================
  const checkMultipleTeammatesCoins = async (teammatesList, requiredCoins) => {
    const results = [];
    
    for (const teammate of teammatesList) {
      const result = await checkTeammateCoins(teammate.userId, requiredCoins, teammate.ingameName);
      results.push({
        ...teammate,
        ...result
      });
      
      if (!result.hasEnough) {
        return { 
          allHaveEnough: false, 
          results: results,
          error: result.error 
        };
      }
    }
    
    return { 
      allHaveEnough: true, 
      results: results,
      error: null 
    };
  };

  // ================= GET TEAMMATE DETAILS =================
  const getTeammateDetails = async (teammateUserId) => {
    try {
      if (!teammateUserId) return null;
      
      const userRef = doc(db, "users", teammateUserId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) return null;
      
      const userData = userSnap.data();
      return {
        userId: teammateUserId,
        userEmail: userData.email || "",
        gameUid: userData.gameUid || userData.uid || "",
        ingameName: userData.ingameName || userData.displayName || userData.name || "",
        gameLevel: userData.gameLevel || userData.level || "",
        mobileNumber: userData.mobileNumber || userData.phone || "",
        coins: userData.coins || 0
      };
    } catch (error) {
      console.error("Error getting teammate details:", error);
      return null;
    }
  };

  // ================= REFERRAL BONUS ON TOPUP =================
  // Check if user was referred and give bonus to referrer on topup
  const checkReferralBonusOnTopup = async (userId, topupAmount) => {
    // Topup condition removed as per user request
    return;
  };

  // Topup / Add Coins
  const addCoins = async (topupAmount, utrNumber, paymentScreenshot) => {
    if (buttonLoading) return;
    setButtonLoading(true);
    
    try {
      if (!user) {
        alert("Login Required");
        return false;
      }
      
      if (!topupAmount || !utrNumber || !paymentScreenshot) {
        alert("Amount, UTR Number aur Payment Screenshot required ❌");
        return false;
      }
      
      const duplicateUTR = paymentRequests.find((item) => item.utr === utrNumber);
      if (duplicateUTR) {
        alert("Duplicate UTR Detected ❌");
        return false;
      }
      
      const requestRef = await push(ref(database, "paymentRequests"), {
        email: user.email,
        amount: topupAmount,
        utr: utrNumber,
        screenshot: "No Screenshot",
        status: "PENDING",
        requestId: `TOPUP-${Date.now()}`,
        userId: user.uid,
        userUid: user.uid,
        createdAt: new Date().toLocaleString(),
      });
      const requestKey = requestRef.key;
      
      let telegramResult = "PENDING";
      let telegramErrorMsg = "";

      // Send to Telegram
      try {
        const formData = new FormData();
        formData.append("chat_id", "5948674075");
        formData.append("caption", `🔥 NEW PAYMENT REQUEST\n\n👤 User Email: ${user.email}\n🆔 User UID: ${user.uid}\n💰 Amount: ${topupAmount} Coins\n🧾 UTR: ${utrNumber}\n📞 Support: 8085150673`);
        formData.append("photo", paymentScreenshot);
        
        const response = await fetch(`https://dawn-firefly-d1ba.sohrabk502.workers.dev/bot8992852974:AAGlM5_2VojBzr8gRmQ9H3MYMz5-pffbTN8/sendPhoto`, {
          method: "POST",
          body: formData,
        });
        
        const resData = await response.json();
        if (resData.ok) {
          telegramResult = "SUCCESS";
        } else {
          telegramResult = "FAILED";
          telegramErrorMsg = `Telegram API Error: ${resData.description} (Code: ${resData.error_code})`;
          console.error("Telegram API Error:", resData);
        }
      } catch (err) {
        telegramResult = "FAILED";
        telegramErrorMsg = `Network Error: ${err.message}`;
        console.error("Telegram Error:", err);
      }

      // Update Firebase with Telegram status
      try {
        await update(ref(database, `paymentRequests/${requestKey}`), {
          telegramStatus: telegramResult,
          telegramError: telegramErrorMsg
        });
      } catch (dbErr) {
        console.error("Failed to update telegram status in Firebase:", dbErr);
      }
      
      alert("Payment Request Submitted 🔥 Please wait 10 minutes for verification.");
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    } finally {
      setButtonLoading(false);
    }
  };

  // Withdraw Coins
  const withdrawCoins = async (withdrawAmount, withdrawUpi, withdrawName, withdrawNumber) => {
    if (withdrawLoading) return;
    setWithdrawLoading(true);
    
    try {
      if (!user) {
        alert("Login Required");
        return false;
      }
      
      if (!withdrawAmount || !withdrawUpi || !withdrawName || !withdrawNumber) {
        alert("Fill All Details");
        return false;
      }
      
      if (Number(withdrawAmount) > Number(winCoins)) {
        alert("Insufficient Winning Coins ❌\n(Only Winning Coins can be withdrawn)");
        return false;
      }

      if (Number(withdrawAmount) < 30) {
        alert("Minimum withdrawal is 30 Coins ❌");
        return false;
      }

      // Check 24 hour limit (max 500 coins)
      const now = Date.now();
      const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
      let totalWithdrawn24h = 0;

      withdrawRequests.forEach((req) => {
        if (req.userId === user.uid && req.status !== "REJECTED") {
          // Use timestamp if available, else try to parse createdAt
          const reqTime = req.timestamp ? req.timestamp : new Date(req.createdAt || req.requestTime).getTime();
          if (!isNaN(reqTime) && now - reqTime <= twentyFourHoursInMs) {
            totalWithdrawn24h += Number(req.amount || 0);
          }
        }
      });

      if (totalWithdrawn24h + Number(withdrawAmount) > 500) {
        alert(`You can only withdraw a maximum of 500 coins in 24 hours ❌\nYou have already requested ${totalWithdrawn24h} coins in the last 24 hours.`);
        return false;
      }
      
      const requestRef = await push(ref(database, "withdrawRequests"), {
        email: user.email,
        name: withdrawName,
        number: withdrawNumber,
        amount: withdrawAmount,
        upi: withdrawUpi,
        userId: user.uid,
        userUid: user.uid,
        createdAt: new Date().toLocaleString(),
        status: "PENDING",
        requestTime: new Date().toLocaleString(),
        completedTime: "",
        requestId: `WITHDRAW-${Date.now()}`,
        timestamp: Date.now(),
      });
      const requestKey = requestRef.key;
      
      // Auto deduct coins from both total and winning
      await updateDoc(doc(db, "users", user.uid), {
        coins: increment(-Number(withdrawAmount)),
        winCoins: increment(-Number(withdrawAmount)),
      });
      await logCoinTransaction(user.uid, Number(withdrawAmount), "WITHDRAW", "Withdrawn to Bank/UPI", false);
      
      let telegramResult = "PENDING";
      let telegramErrorMsg = "";

      // Send Telegram Alert
      try {
        const response = await fetch(`https://dawn-firefly-d1ba.sohrabk502.workers.dev/bot8992852974:AAGlM5_2VojBzr8gRmQ9H3MYMz5-pffbTN8/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: "5948674075",
            text: `💸 NEW WITHDRAW REQUEST\n\n👤 User: ${user.email}\n🏷️ Name: ${withdrawName}\n📞 Phone: ${withdrawNumber}\n💰 Amount: ${withdrawAmount}\n🏦 UPI: ${withdrawUpi}`,
          }),
        });

        const resData = await response.json();
        if (resData.ok) {
          telegramResult = "SUCCESS";
        } else {
          telegramResult = "FAILED";
          telegramErrorMsg = `Telegram API Error: ${resData.description} (Code: ${resData.error_code})`;
          console.error("Telegram API Error:", resData);
        }
      } catch (err) {
        telegramResult = "FAILED";
        telegramErrorMsg = `Network Error: ${err.message}`;
        console.error("Telegram Error:", err);
      }

      // Update Firebase with Telegram status
      try {
        await update(ref(database, `withdrawRequests/${requestKey}`), {
          telegramStatus: telegramResult,
          telegramError: telegramErrorMsg
        });
      } catch (dbErr) {
        console.error("Failed to update telegram status in Firebase:", dbErr);
      }
      
      alert("Withdraw Request Submitted 🔥 Please wait 10 minutes for processing.");
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    } finally {
      setWithdrawLoading(false);
    }
  };

  // ================= TRANSFER COINS =================
  const transferCoins = async (recipientIdentifier, transferAmount) => {
    if (buttonLoading) return { success: false, message: "Another operation is in progress" };
    setButtonLoading(true);

    try {
      if (!user) {
        return { success: false, message: "Login Required" };
      }

      const amount = Number(transferAmount);
      if (isNaN(amount) || amount <= 0) {
        return { success: false, message: "Please enter a valid amount greater than 0" };
      }

      if (amount > coins) {
        return { success: false, message: `Insufficient coins balance! You have 🪙 ${coins} coins.` };
      }

      const idLower = recipientIdentifier.toLowerCase().trim();
      const idUpper = recipientIdentifier.toUpperCase().trim();

      if (idLower === user.email.toLowerCase() || (playerData?.referralCode && idUpper === playerData.referralCode.toUpperCase())) {
        return { success: false, message: "You cannot transfer coins to yourself!" };
      }

      // 1. Search for recipient in users collection
      const usersRef = collection(db, "users");
      let recipientDoc = null;

      // Try searching by email
      const emailQuery = firestoreQuery(usersRef, where("email", "==", idLower));
      const emailSnap = await getDocs(emailQuery);

      if (!emailSnap.empty) {
        recipientDoc = emailSnap.docs[0];
      } else {
        // Try searching by referralCode
        const refQuery = firestoreQuery(usersRef, where("referralCode", "==", idUpper));
        const refSnap = await getDocs(refQuery);
        if (!refSnap.empty) {
          recipientDoc = refSnap.docs[0];
        }
      }

      if (!recipientDoc) {
        return { success: false, message: "Recipient not found! Check Email/Referral Code." };
      }

      const recipientUid = recipientDoc.id;
      const recipientData = recipientDoc.data();
      const recipientName = recipientData.name || "Player";

      // Double-check recipient ID is not sender ID
      if (recipientUid === user.uid) {
        return { success: false, message: "You cannot transfer coins to yourself!" };
      }

      // 2. Perform database updates (sender deduction and receiver addition)
      const senderRef = doc(db, "users", user.uid);
      const recipientRef = doc(db, "users", recipientUid);

      const senderSnap = await getDoc(senderRef);
      const latestSenderCoins = senderSnap.exists() ? (senderSnap.data().coins || 0) : 0;
      const latestSenderWinCoins = senderSnap.exists() ? (senderSnap.data().winCoins || 0) : 0;

      if (amount > latestSenderCoins) {
        return { success: false, message: `Insufficient coins balance! You have 🪙 ${latestSenderCoins} coins.` };
      }

      const newSenderCoins = latestSenderCoins - amount;
      const newSenderWinCoins = Math.min(latestSenderWinCoins, newSenderCoins);

      const recipientSnap = await getDoc(recipientRef);
      const latestRecipientCoins = recipientSnap.exists() ? (recipientSnap.data().coins || 0) : 0;
      const newRecipientCoins = latestRecipientCoins + amount;

      // Update sender
      await updateDoc(senderRef, {
        coins: newSenderCoins,
        winCoins: newSenderWinCoins
      });

      // Update recipient
      await updateDoc(recipientRef, {
        coins: newRecipientCoins
      });

      // 3. Log transactions
      await logCoinTransaction(
        user.uid,
        amount,
        "COIN_TRANSFER_SENT",
        `Sent coins to ${recipientName} (${recipientData.email || recipientIdentifier})`,
        false
      );

      await logCoinTransaction(
        recipientUid,
        amount,
        "COIN_TRANSFER_RECEIVED",
        `Received coins from ${playerData?.name || user.email}`,
        true
      );

      // 4. Send notifications
      try {
        await push(ref(database, `notifications/${recipientUid}`), {
          title: "🪙 COINS RECEIVED!",
          message: `You received 🪙 ${amount} coins from ${playerData?.name || user.email}!`,
          time: new Date().toLocaleString(),
          seen: false,
        });

        await push(ref(database, `notifications/${user.uid}`), {
          title: "💸 COINS TRANSFERRED!",
          message: `You successfully transferred 🪙 ${amount} coins to ${recipientName}!`,
          time: new Date().toLocaleString(),
          seen: false,
        });
      } catch (notifErr) {
        console.error("Failed to send Firebase notifications:", notifErr);
      }

      return { success: true, message: `Successfully transferred 🪙 ${amount} coins to ${recipientName}!`, recipientName };
    } catch (error) {
      console.error("Coin transfer error:", error);
      return { success: false, message: `Transfer failed: ${error.message}` };
    } finally {
      setButtonLoading(false);
    }
  };

  // ================= VERIFY RECIPIENT =================
  const verifyRecipient = async (recipientIdentifier) => {
    try {
      if (!recipientIdentifier || recipientIdentifier.trim() === "") {
        return { success: false, message: "Please enter Email or Referral Code" };
      }

      const idLower = recipientIdentifier.toLowerCase().trim();
      const idUpper = recipientIdentifier.toUpperCase().trim();

      if (user && (idLower === user.email.toLowerCase() || (playerData?.referralCode && idUpper === playerData.referralCode.toUpperCase()))) {
        return { success: false, message: "You cannot transfer coins to yourself!" };
      }

      const usersRef = collection(db, "users");
      
      // Query email
      const emailQuery = firestoreQuery(usersRef, where("email", "==", idLower));
      const emailSnap = await getDocs(emailQuery);

      if (!emailSnap.empty) {
        const data = emailSnap.docs[0].data();
        return { success: true, name: data.name || "Player", email: data.email };
      }

      // Query referral code
      const refQuery = firestoreQuery(usersRef, where("referralCode", "==", idUpper));
      const refSnap = await getDocs(refQuery);

      if (!refSnap.empty) {
        const data = refSnap.docs[0].data();
        return { success: true, name: data.name || "Player", email: data.email };
      }

      return { success: false, message: "Recipient not found!" };
    } catch (error) {
      console.error("Error verifying recipient:", error);
      return { success: false, message: error.message };
    }
  };

  return {
    coins,
    winCoins,
    playerData,
    buttonLoading,
    withdrawLoading,
    paymentRequests,
    withdrawRequests,
    addCoins,
    withdrawCoins,
    transferCoins,
    verifyRecipient,
    // Teammate functions
    checkTeammateCoins,
    checkMultipleTeammatesCoins,
    getTeammateDetails,
    // Referral function
    checkReferralBonusOnTopup,
  };
}