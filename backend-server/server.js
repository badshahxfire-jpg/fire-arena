const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK
// You can pass the credentials either via serviceAccountKey.json or a FIREBASE_SERVICE_ACCOUNT env variable
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
  : require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com` // Realtime Database URL
});

const db = admin.firestore();
const rtdb = admin.database();

// Middleware to verify Firebase Auth ID Token
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }

  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // contains uid, email, etc.
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}

// -------------------------------------------------------------
// Helper to log transaction to Firestore
// -------------------------------------------------------------
async function logCoinTransaction(userId, amount, type, description, isBonus = false) {
  const historyRef = db.collection("users").doc(userId).collection("coinHistory");
  await historyRef.add({
    amount: Number(amount),
    type: type,
    description: description,
    isBonus: isBonus,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    date: new Date().toLocaleString()
  });
}

// -------------------------------------------------------------
// Endpoint: Securely Join Tournament
// -------------------------------------------------------------
app.post("/api/join-tournament", verifyToken, async (req, res) => {
  const uid = req.user.uid;
  const { tournamentId, entryFee, teamMembers } = req.body;

  if (!tournamentId || entryFee === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const fee = Number(entryFee);

  // If teamMembers is provided, we deduct from all members. Otherwise just the current user (SOLO).
  const userIdsToDeduct = teamMembers && Array.isArray(teamMembers)
    ? teamMembers.map(m => m.userId)
    : [uid];

  try {
    await db.runTransaction(async (transaction) => {
      const userDocs = [];
      
      // 1. Fetch all user documents first
      for (const targetUid of userIdsToDeduct) {
        const userRef = db.collection("users").doc(targetUid);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          throw new Error(`User profile not found for ID: ${targetUid}`);
        }
        userDocs.push({ ref: userRef, doc: userDoc, uid: targetUid });
      }

      // 2. Check balance for all users
      for (const item of userDocs) {
        const currentCoins = item.doc.data().coins || 0;
        if (currentCoins < fee) {
          throw new Error(`User ${item.doc.data().playerName || item.uid} has insufficient coins.`);
        }
      }

      // 3. Deduct coins and log for all users
      for (const item of userDocs) {
        const currentCoins = item.doc.data().coins || 0;
        const currentWinCoins = item.doc.data().winCoins || 0;

        const newCoins = currentCoins - fee;
        const newWinCoins = Math.min(currentWinCoins, newCoins);

        transaction.update(item.ref, {
          coins: newCoins,
          winCoins: newWinCoins
        });
      }
    });

    // 4. Log transactions for everyone outside the Firestore transaction
    for (const targetUid of userIdsToDeduct) {
      await logCoinTransaction(
        targetUid,
        fee,
        "TOURNAMENT_JOIN",
        `Joined Tournament (${tournamentId})`
      );
    }

    return res.json({ success: true, message: "Joined successfully and coins deducted" });
  } catch (error) {
    console.error("Join tournament error:", error);
    return res.status(400).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// Endpoint: Securely Transfer Coins
// -------------------------------------------------------------
app.post("/api/transfer-coins", verifyToken, async (req, res) => {
  const senderUid = req.user.uid;
  const { recipientIdentifier, transferAmount } = req.body;

  if (!recipientIdentifier || !transferAmount) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const amount = Number(transferAmount);
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: "Invalid transfer amount" });
  }

  const idLower = recipientIdentifier.toLowerCase().trim();
  const idUpper = recipientIdentifier.toUpperCase().trim();

  try {
    // Find recipient
    const usersRef = db.collection("users");
    let recipientDoc = null;

    // Search by email
    const emailQuery = await usersRef.where("email", "==", idLower).limit(1).get();
    if (!emailQuery.empty) {
      recipientDoc = emailQuery.docs[0];
    } else {
      // Search by referral code
      const refQuery = await usersRef.where("referralCode", "==", idUpper).limit(1).get();
      if (!refQuery.empty) {
        recipientDoc = refQuery.docs[0];
      }
    }

    if (!recipientDoc) {
      return res.status(404).json({ error: "Recipient not found!" });
    }

    const recipientUid = recipientDoc.id;
    const recipientData = recipientDoc.data();
    const recipientName = recipientData.name || "Player";

    if (recipientUid === senderUid) {
      return res.status(400).json({ error: "You cannot transfer coins to yourself!" });
    }

    const senderRef = db.collection("users").doc(senderUid);
    const recipientRef = db.collection("users").doc(recipientUid);

    await db.runTransaction(async (transaction) => {
      const senderDoc = await transaction.get(senderRef);
      const recipientSnap = await transaction.get(recipientRef);

      const latestSenderCoins = senderDoc.exists ? (senderDoc.data().coins || 0) : 0;
      const latestSenderWinCoins = senderDoc.exists ? (senderDoc.data().winCoins || 0) : 0;

      if (amount > latestSenderCoins) {
        throw new Error("Insufficient coins balance");
      }

      const newSenderCoins = latestSenderCoins - amount;
      const newSenderWinCoins = Math.min(latestSenderWinCoins, newSenderCoins);
      const newRecipientCoins = (recipientSnap.data().coins || 0) + amount;

      transaction.update(senderRef, {
        coins: newSenderCoins,
        winCoins: newSenderWinCoins
      });

      transaction.update(recipientRef, {
        coins: newRecipientCoins
      });
    });

    // Log transactions
    await logCoinTransaction(
      senderUid,
      amount,
      "COIN_TRANSFER_SENT",
      `Sent coins to ${recipientName} (${recipientData.email || recipientIdentifier})`
    );

    await logCoinTransaction(
      recipientUid,
      amount,
      "COIN_TRANSFER_RECEIVED",
      `Received coins from ${req.user.email}`
    );

    return res.json({ 
      success: true, 
      message: `Transferred ${amount} coins successfully`,
      recipientName,
      recipientUid
    });
  } catch (error) {
    console.error("Coin transfer error:", error);
    return res.status(400).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// Endpoint: Securely Withdraw Coins
// -------------------------------------------------------------
app.post("/api/withdraw-coins", verifyToken, async (req, res) => {
  const uid = req.user.uid;
  const { withdrawAmount, withdrawName, withdrawNumber, withdrawUpi } = req.body;

  if (!withdrawAmount || !withdrawName || !withdrawNumber || !withdrawUpi) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const amount = Number(withdrawAmount);
  const userRef = db.collection("users").doc(uid);

  try {
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error("User profile not found");
      }

      const currentCoins = userDoc.data().coins || 0;
      const currentWinCoins = userDoc.data().winCoins || 0;

      if (amount > currentCoins || amount > currentWinCoins) {
        throw new Error("Insufficient balance to withdraw");
      }

      transaction.update(userRef, {
        coins: currentCoins - amount,
        winCoins: currentWinCoins - amount
      });
    });

    // Write request to Realtime Database (rtdb) for Admin panel
    const requestRef = rtdb.ref("withdrawRequests").push();
    const requestKey = requestRef.key;

    const requestData = {
      email: req.user.email,
      name: withdrawName,
      number: withdrawNumber,
      amount: withdrawAmount,
      upi: withdrawUpi,
      userId: uid,
      userUid: uid,
      createdAt: new Date().toLocaleString(),
      status: "PENDING",
      requestTime: new Date().toLocaleString(),
      completedTime: "",
      requestId: `WITHDRAW-${Date.now()}`,
      timestamp: Date.now()
    };

    await requestRef.set(requestData);

    // Log Firestore transaction
    await logCoinTransaction(uid, amount, "WITHDRAW", "Withdrawn to Bank/UPI", false);

    // Trigger Telegram Notification
    try {
      const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
      const response = await fetch(`https://dawn-firefly-d1ba.sohrabk502.workers.dev/bot8992852974:AAGlM5_2VojBzr8gRmQ9H3MYMz5-pffbTN8/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: "5948674075",
          text: `💸 NEW WITHDRAW REQUEST\n\n👤 User: ${req.user.email}\n🏷️ Name: ${withdrawName}\n📞 Phone: ${withdrawNumber}\n💰 Amount: ${withdrawAmount}\n🏦 UPI: ${withdrawUpi}`,
        }),
      });
      const resData = await response.json();
      if (resData.ok) {
        await rtdb.ref(`withdrawRequests/${requestKey}`).update({ telegramStatus: "SUCCESS" });
      } else {
        await rtdb.ref(`withdrawRequests/${requestKey}`).update({ 
          telegramStatus: "FAILED", 
          telegramError: resData.description 
        });
      }
    } catch (tgErr) {
      console.error("Telegram notification failed:", tgErr);
    }

    return res.json({ success: true, message: "Withdraw request submitted successfully" });
  } catch (error) {
    console.error("Withdraw error:", error);
    return res.status(400).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// Push Notifications Core Helpers & Listeners
// -------------------------------------------------------------
async function sendGlobalPushNotification(title, body) {
  try {
    const usersSnapshot = await db.collection("users").get();
    const tokens = [];
    usersSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.fcmToken) {
        tokens.push(data.fcmToken);
      }
    });

    if (tokens.length === 0) {
      console.log("No registered FCM tokens found for global push.");
      return;
    }

    console.log(`Sending global push notification to ${tokens.length} devices...`);

    const message = {
      notification: {
        title: title,
        body: body,
      },
      tokens: tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Successfully sent ${response.successCount} global messages; ${response.failureCount} failed.`);
  } catch (error) {
    console.error("Error sending global push notification:", error);
  }
}

async function sendPersonalPushNotification(userId, title, body) {
  try {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return;
    const data = userDoc.data();
    const token = data.fcmToken;
    if (!token) {
      console.log(`User ${userId} does not have a registered FCM token.`);
      return;
    }

    const message = {
      notification: {
        title: title,
        body: body,
      },
      token: token,
    };

    const response = await admin.messaging().send(message);
    console.log(`Successfully sent personal notification to user ${userId}:`, response);
  } catch (error) {
    console.error(`Error sending personal push notification to user ${userId}:`, error);
  }
}

const loadedNotificationIds = new Set();
const loadedTournaments = new Set();
const loadedPerKillTournaments = new Set();
let isServerLive = false;

// Activate notification listeners after 4 seconds to skip startup records
setTimeout(() => {
  isServerLive = true;
  console.log("Push notification listener is now live and active! 🔥");
}, 4000);

// 1. Listen for personal user notifications
rtdb.ref("notifications").on("child_added", (userSnap) => {
  const userId = userSnap.key;
  
  rtdb.ref(`notifications/${userId}`).on("child_added", async (notifSnap) => {
    const notifId = notifSnap.key;
    const notif = notifSnap.val();
    if (!notif) return;

    if (!isServerLive) {
      loadedNotificationIds.add(notifId);
      return;
    }

    if (loadedNotificationIds.has(notifId)) return;
    loadedNotificationIds.add(notifId);

    console.log(`New notification detected for user ${userId}: ${notif.title}`);
    await sendPersonalPushNotification(userId, notif.title, notif.message);
  });
});

// 2. Listen for new classic matches
rtdb.ref("liveTournaments").on("child_added", async (snapshot) => {
  const id = snapshot.key;
  const tournament = snapshot.val();
  if (!tournament) return;

  if (!isServerLive) {
    loadedTournaments.add(id);
    return;
  }

  if (loadedTournaments.has(id)) return;
  loadedTournaments.add(id);

  console.log("New tournament created! Sending global push...", tournament.tournamentTitle);
  await sendGlobalPushNotification(
    "New Match Created! 🎮",
    `Join "${tournament.tournamentTitle}" now. Entry: 🪙 ${tournament.entryFee}, Map: ${tournament.selectedMap}.`
  );
});

// 3. Listen for new per kill matches
rtdb.ref("perKillTournaments").on("child_added", async (snapshot) => {
  const id = snapshot.key;
  const tournament = snapshot.val();
  if (!tournament) return;

  if (!isServerLive) {
    loadedPerKillTournaments.add(id);
    return;
  }

  if (loadedPerKillTournaments.has(id)) return;
  loadedPerKillTournaments.add(id);

  console.log("New Per Kill tournament created! Sending global push...", tournament.tournamentTitle);
  await sendGlobalPushNotification(
    "New Per Kill Match Created! ⚔️",
    `Join "${tournament.tournamentTitle}" now. Entry: 🪙 ${tournament.entryFee}, Map: ${tournament.selectedMap}.`
  );
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Secure Server running on port ${PORT}`));
