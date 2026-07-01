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
  const additionTypes = ["COIN_TRANSFER_RECEIVE", "REFUND", "ADMIN_ADD", "LOYALTY_BONUS", "REFERRAL_BONUS"];
  const isAddition = additionTypes.includes(type);

  await historyRef.add({
    amount: Number(amount),
    type: type,
    description: description,
    reason: description,
    isAddition: isAddition,
    isBonus: isBonus,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    date: new Date().toLocaleString(),
    dateString: new Date().toLocaleString()
  });
}

// -------------------------------------------------------------
// Endpoint: Securely Join Tournament
// -------------------------------------------------------------
app.post("/api/join-tournament", verifyToken, async (req, res) => {
  const uid = req.user.uid;
  const { tournamentId, tournamentTitle, entryFee, teamMembers, selectedSlot, totalSlots } = req.body;

  if (!tournamentId || entryFee === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const fee = Number(entryFee);

  // If teamMembers is provided, we deduct from all members. Otherwise just the current user (SOLO).
  const userIdsToDeduct = teamMembers && Array.isArray(teamMembers)
    ? teamMembers.map(m => m.userId)
    : [uid];

  const deductions = {};
  let actualSlot = null;

  try {
    // Attempt slot locking if selectedSlot is provided
    if (selectedSlot !== undefined) {
      const slotNum = Number(selectedSlot);
      const maxSlots = Number(totalSlots || 100);
      const locksRef = rtdb.ref(`slotLocks/${tournamentId}`);

      await locksRef.transaction((currentLocks) => {
        const locks = currentLocks || {};
        
        // 1. Check if the requested slot is free
        if (!locks[slotNum]) {
          actualSlot = slotNum;
          locks[slotNum] = { bookedBy: uid, bookedAt: Date.now() };
          return locks;
        }
        
        // 2. If requested slot is taken, find the next available free slot
        for (let s = 1; s <= maxSlots; s++) {
          if (!locks[s]) {
            actualSlot = s;
            locks[s] = { bookedBy: uid, bookedAt: Date.now() };
            return locks;
          }
        }
        
        // 3. If no slots are available, abort
        return;
      });

      if (!actualSlot) {
        return res.status(400).json({ error: "Tournament is full!" });
      }
    }

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
        const winCoinsDeducted = currentWinCoins - newWinCoins;

        deductions[item.uid] = {
          winCoinsDeducted,
          coinsDeducted: fee
        };

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
        `Joined Tournament (${tournamentTitle || tournamentId})`
      );
    }

    return res.json({ 
      success: true, 
      message: "Joined successfully and coins deducted", 
      deductions,
      bookedSlot: actualSlot 
    });
  } catch (error) {
    if (selectedSlot !== undefined && actualSlot) {
      try {
        await rtdb.ref(`slotLocks/${tournamentId}/${actualSlot}`).remove();
      } catch (err) {
        console.error("Failed to release slot lock:", err);
      }
    }
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
    
    const updates = {};
    const notificationId = Date.now().toString();
    const notificationData = {
      title: title,
      message: body,
      time: new Date().toLocaleString(),
      type: "match_update",
      seen: false
    };

    usersSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      const uid = docSnap.id;
      
      if (data.fcmToken) {
        tokens.push(data.fcmToken);
      }
      
      updates[`notifications/${uid}/${notificationId}`] = notificationData;
    });

    try {
      await rtdb.ref().update(updates);
      console.log(`Successfully sent in-app notifications to ${usersSnapshot.size} users.`);
    } catch (inAppErr) {
      console.error("Failed to send in-app notifications:", inAppErr);
    }

    if (tokens.length === 0) {
      console.log("No registered FCM tokens found for global push.");
      return;
    }

    console.log(`Sending global push notification to ${tokens.length} devices...`);

    const message = {
      notification: {
        title: title,
        body: body,
        image: "https://fire-baadshah-arena.vercel.app/logo.png"
      },
      android: {
        priority: "high",
        notification: {
          channelId: "fba_alerts",
          sound: "default"
        }
      },
      apns: {
        payload: {
          aps: {
            contentAvailable: true,
            sound: "default"
          }
        }
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
        image: "https://fire-baadshah-arena.vercel.app/logo.png"
      },
      android: {
        priority: "high",
        notification: {
          channelId: "fba_alerts",
          sound: "default"
        }
      },
      apns: {
        payload: {
          aps: {
            contentAvailable: true,
            sound: "default"
          }
        }
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

const activeUserListeners = new Set();
rtdb.ref("notifications").on("child_added", (userSnap) => {
  const userId = userSnap.key;
  
  if (activeUserListeners.has(userId)) return;
  activeUserListeners.add(userId);
  
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

    // If it's a silent push (like global updates), don't trigger a personal FCM push
    if (notif.silentPush) return;

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
  const mode = tournament.tournamentType || "SOLO";
  await sendGlobalPushNotification(
    "New Match Created! 🎮",
    `Join "${tournament.tournamentTitle}" (${mode}) now. Entry: 🪙 ${tournament.entryFee}, Map: ${tournament.selectedMap}.`
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
  const mode = tournament.tournamentType || "SOLO";
  await sendGlobalPushNotification(
    "New Per Kill Match Created! ⚔️",
    `Join "${tournament.tournamentTitle}" (${mode}) now. Entry: 🪙 ${tournament.entryFee}, Map: ${tournament.selectedMap}.`
  );
});

const loadedWeeklyTournaments = new Set();
// 3b. Listen for new weekly matches
rtdb.ref("weeklyTournaments").on("child_added", async (snapshot) => {
  const id = snapshot.key;
  const tournament = snapshot.val();
  if (!tournament) return;

  if (!isServerLive) {
    loadedWeeklyTournaments.add(id);
    return;
  }

  if (loadedWeeklyTournaments.has(id)) return;
  loadedWeeklyTournaments.add(id);

  console.log("New Weekly tournament created! Sending global push...", tournament.title);
  const mode = tournament.format || "SOLO";
  await sendGlobalPushNotification(
    "New Weekly Match Created! 📅",
    `Join "${tournament.title}" (${mode}) now. Entry: 🪙 ${tournament.entryFee}, Prize Pool: 🪙 ${tournament.prizePool}.`
  );
});

// 4. Listen for app updates to notify all users
let initialUpdateConfigSkip = true;
rtdb.ref("settings/appUpdate").on("value", async (snapshot) => {
  const updateData = snapshot.val();
  if (!updateData) return;

  if (initialUpdateConfigSkip) {
    initialUpdateConfigSkip = false;
    return;
  }

  if (!isServerLive) return;

  console.log("App update configuration changed! Sending global push...", updateData.latestVersion);
  
  // Send FCM Push Notification to all devices
  await sendGlobalPushNotification(
    "New App Update Available! 🚀",
    `Version ${updateData.latestVersion} is now live! Please update your app to get the latest features.`
  );

  // Send In-app Notification to all users
  try {
    const usersSnapshot = await db.collection("users").get();
    const promises = [];
    usersSnapshot.forEach(docSnap => {
      const userId = docSnap.id;
      const userNotifRef = rtdb.ref(`notifications/${userId}`).push();
      promises.push(userNotifRef.set({
        title: "🚀 NEW APP UPDATE",
        message: `Version ${updateData.latestVersion} is available. Release notes: ${updateData.releaseNotes || 'Bug fixes and performance improvements.'}`,
        time: new Date().toLocaleString(),
        seen: false,
        timestamp: Date.now(),
        silentPush: true // Prevent duplicate FCM push from listener
      }));
    });
    await Promise.all(promises);
    console.log("Global in-app notifications created successfully for update.");
  } catch (err) {
    console.error("Error creating global in-app notifications:", err);
  }
});

// -------------------------------------------------------------
// Endpoint: Register FCM Token to Topic
// -------------------------------------------------------------
app.post("/api/register-token", verifyToken, async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Missing token" });

  try {
    // Subscribe the device token to the "all_users" topic
    await admin.messaging().subscribeToTopic([token], "all_users");
    
    // Optionally save token in user doc
    await db.collection("users").doc(req.user.uid).set({
      fcmToken: token
    }, { merge: true });

    return res.json({ success: true, message: "Token registered successfully" });
  } catch (error) {
    console.error("Error registering token:", error);
    return res.status(500).json({ error: "Failed to register token" });
  }
});

// -------------------------------------------------------------
// Endpoint: Send Push Notification (Admin only)
// -------------------------------------------------------------
app.post("/api/send-notification", verifyToken, async (req, res) => {
  const { title, body } = req.body;
  
  if (!title || !body) {
    return res.status(400).json({ error: "Missing title or body" });
  }

  try {
    // Verify admin
    const ADMIN_UID = "FAVc9zfAgoYs1d1BDr2EoDwSw0x1";
    const userDoc = await db.collection("users").doc(req.user.uid).get();
    const isAdmin = req.user.uid === ADMIN_UID || (userDoc.exists && userDoc.data().role === "admin");
    if (!isAdmin) {
      return res.status(403).json({ error: "Unauthorized. Admin only." });
    }

    const message = {
      notification: { 
        title, 
        body,
        image: "https://fire-baadshah-arena.vercel.app/logo.png"
      },
      android: {
        priority: "high",
        notification: {
          channelId: "fba_alerts",
          sound: "default"
        }
      },
      apns: {
        payload: {
          aps: {
            contentAvailable: true,
            sound: "default"
          }
        }
      },
      topic: "all_users"
    };

    const response = await admin.messaging().send(message);
    return res.json({ success: true, message: "Notification sent successfully", response });
  } catch (error) {
    console.error("Error sending notification:", error);
    return res.status(500).json({ error: "Failed to send notification" });
  }
});

// -------------------------------------------------------------
// Endpoint: Send Push Notification to Specific User (Admin only)
// -------------------------------------------------------------
app.post("/api/send-personal-notification", verifyToken, async (req, res) => {
  const { targetUserId, title, body } = req.body;
  
  if (!targetUserId || !title || !body) {
    return res.status(400).json({ error: "Missing targetUserId, title or body" });
  }

  try {
    // Verify admin
    const ADMIN_UID = "FAVc9zfAgoYs1d1BDr2EoDwSw0x1";
    const userDoc = await db.collection("users").doc(req.user.uid).get();
    const isAdmin = req.user.uid === ADMIN_UID || (userDoc.exists && userDoc.data().role === "admin");
    if (!isAdmin) {
      return res.status(403).json({ error: "Unauthorized. Admin only." });
    }

    const targetUserDoc = await db.collection("users").doc(targetUserId).get();
    if (!targetUserDoc.exists) {
      return res.status(404).json({ error: "Target user not found" });
    }
    
    // 1. Save to RTDB for in-app notification (bell icon) ALWAYS
    // The global listener in server.js will automatically detect this RTDB entry
    // and trigger sendPersonalPushNotification! So we do NOT need to send it again here.
    try {
      await rtdb.ref(`notifications/${targetUserId}`).push({
        title,
        message: body,
        timestamp: admin.database.ServerValue.TIMESTAMP,
        seen: false
      });
      
      // If targetToken is missing, we still saved to RTDB, so it's a partial success
      if (!targetToken) {
        return res.json({ success: true, message: "Message saved to in-app notifications (User has no FCM token for popup)" });
      }

      return res.json({ success: true, message: "Personal notification sent successfully" });
    } catch (dbErr) {
      console.error("Failed to save to RTDB:", dbErr);
      return res.status(500).json({ error: "Failed to send personal notification" });
    }
  } catch (error) {
    console.error("Error sending personal notification:", error);
    return res.status(500).json({ error: "Failed to send personal notification" });
  }
});

// -------------------------------------------------------------
// Auto-Delete Old Match Results (Older than 7 days)
// -------------------------------------------------------------
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

async function cleanupOldMatches() {
  try {
    const now = Date.now();
    
    // Clean up classic matchResults
    const matchResultsRef = rtdb.ref("matchResults");
    const matchResultsSnap = await matchResultsRef.get();
    
    if (matchResultsSnap.exists()) {
      const data = matchResultsSnap.val();
      for (const [key, match] of Object.entries(data)) {
        // Handle explicit timestamp or parse createdAt string
        let matchTime = 0;
        if (match.timestamp) {
          matchTime = match.timestamp;
        } else if (match.createdAt) {
          matchTime = new Date(match.createdAt).getTime();
        }
        
        if (matchTime && (now - matchTime > SEVEN_DAYS_MS)) {
          await matchResultsRef.child(key).remove();
          console.log(`Auto-deleted old matchResult: ${key}`);
        }
      }
    }

    // Clean up perKillMatchResults
    const perKillRef = rtdb.ref("perKillMatchResults");
    const perKillSnap = await perKillRef.get();
    
    if (perKillSnap.exists()) {
      const data = perKillSnap.val();
      for (const [key, match] of Object.entries(data)) {
        let matchTime = 0;
        if (match.timestamp) {
          matchTime = match.timestamp;
        } else if (match.time || match.createdAt) {
          matchTime = new Date(match.time || match.createdAt).getTime();
        }
        
        if (matchTime && (now - matchTime > SEVEN_DAYS_MS)) {
          await perKillRef.child(key).remove();
          console.log(`Auto-deleted old perKillMatchResult: ${key}`);
        }
      }
    }
  } catch (error) {
    console.error("Error running auto-cleanup:", error);
  }
}

// Run cleanup immediately on start, and then every 12 hours
cleanupOldMatches();
setInterval(cleanupOldMatches, 12 * 60 * 60 * 1000);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
