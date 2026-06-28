import { useState, useEffect, useMemo } from "react";
import { ref, onValue, push, update, remove, get, set } from "firebase/database";
import { database } from "../firebase";
import { doc, updateDoc, increment, getDoc, collection, onSnapshot, getDocs, writeBatch } from "firebase/firestore";
import { db, auth } from "../firebase";
import { logCoinTransaction } from "../utils/coinHistory";
import { secureFetch } from "../utils/backendApi";

export function useAdminData(isAdmin) {
  const [totalUsers, setTotalUsers] = useState(0);
  const [allUsers, setAllUsers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceDuration, setMaintenanceDuration] = useState("");
  const [maintenanceEndsAt, setMaintenanceEndsAt] = useState(0);
  const [maintenanceAllowedUsers, setMaintenanceAllowedUsers] = useState([]);
  const [searchedUser, setSearchedUser] = useState(null);

  // Fetch Payment Requests
  useEffect(() => {
    if (!isAdmin) return;
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
  }, [isAdmin]);

  // Fetch Withdraw Requests
  useEffect(() => {
    if (!isAdmin) return;
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
  }, [isAdmin]);

  // Fetch Admin Stats (Persistent Totals)
  const [adminStats, setAdminStats] = useState({ totalDeposits: 0, totalWithdrawals: 0 });
  useEffect(() => {
    if (!isAdmin) return;
    const statsRef = ref(database, "adminStats");
    const unsubscribe = onValue(statsRef, (snapshot) => {
      setAdminStats(snapshot.val() || { totalDeposits: 0, totalWithdrawals: 0 });
    });
    return () => unsubscribe();
  }, [isAdmin]);

  // Auto-cleanup old joined players (older than 20 days)
  useEffect(() => {
    if (!isAdmin) return;

    const parseDate = (dateStr) => {
      if (!dateStr) return 0;
      let time = Date.parse(dateStr);
      if (!isNaN(time)) return time;
      try {
        const cleaned = dateStr.replace(/,/g, '').trim();
        const parts = cleaned.split(/\s+/);
        if (parts.length >= 1) {
          const dateParts = parts[0].split('/');
          if (dateParts.length === 3) {
            const day = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10) - 1;
            const year = parseInt(dateParts[2], 10);
            return new Date(year, month, day).getTime();
          }
        }
      } catch (e) {}
      return 0;
    };

    const cleanupOldData = async (path, dateField = "createdAt", condition = null) => {
      try {
        const refPath = ref(database, path);
        const snapshot = await get(refPath);
        const data = snapshot.val();
        if (!data) return;

        const now = Date.now();
        const twentyDaysMs = 20 * 24 * 60 * 60 * 1000;

        for (const key in data) {
          const item = data[key];
          if (!item) continue;
          
          if (condition && !condition(item)) continue;

          const dateStr = item[dateField];
          if (dateStr) {
            const itemTime = parseDate(dateStr);
            if (itemTime > 0 && (now - itemTime) > twentyDaysMs) {
              console.log(`Auto-deleting old data from ${path}:`, key);
              await remove(ref(database, `${path}/${key}`));
            }
          }
        }
      } catch (e) {
        console.error(`Error cleaning up ${path}:`, e);
      }
    };

    // Run cleanup once on admin load
    cleanupOldData("joinedPlayers", "createdAt");
    cleanupOldData("joinedPerKillPlayers", "createdAt");
    
    // New cleanups
    cleanupOldData("paymentRequests", "time", (item) => item.status && item.status !== "PENDING");
    cleanupOldData("withdrawRequests", "time", (item) => item.status && item.status !== "PENDING");
    cleanupOldData("playerResults", "createdAt");
    cleanupOldData("announcements", "createdAt");
    cleanupOldData("liveTournaments", "createdAt", (item) => item.completed || item.resultPublished);
    cleanupOldData("perKillTournaments", "createdAt", (item) => item.completed || item.resultPublished);
    cleanupOldData("weeklyTournaments", "createdAt", (item) => item.status === "COMPLETED" && item.rewardsDistributed);
  }, [isAdmin]);

  // Fetch Maintenance Mode
  useEffect(() => {
    const maintenanceRef = ref(database, "settings/maintenance");
    const unsubscribe = onValue(maintenanceRef, (snapshot) => {
      const data = snapshot.val();
      if (typeof data === "object" && data !== null) {
        setMaintenanceMode(data.enabled || false);
        setMaintenanceDuration(data.duration || "");
        setMaintenanceEndsAt(data.endsAt || 0);
        setMaintenanceAllowedUsers(data.allowedUsers || []);
      } else {
        setMaintenanceMode(data || false);
        setMaintenanceDuration("");
        setMaintenanceEndsAt(0);
        setMaintenanceAllowedUsers([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch Total Users (One-time fetch to save reads)
  useEffect(() => {
    if (!isAdmin) return;
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        setTotalUsers(snapshot.size);
        const list = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
        setAllUsers(list);
      } catch (error) {
        console.log("Error fetching total users:", error);
      }
    };
    fetchUsers();
  }, [isAdmin]);

  // Fetch Tournaments
  useEffect(() => {
    if (!isAdmin) return;
    const tournamentsRef = ref(database, "liveTournaments");
    const unsubscribe = onValue(tournamentsRef, (tournamentSnap) => {
      const tournamentData = tournamentSnap.val();
      setTournaments(tournamentData ? Object.values(tournamentData) : []);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  // Compute Analytics using useMemo
  const analytics = useMemo(() => {
    const totalTournaments = tournaments.length;
    
    const liveMatches = tournaments.filter((item) => {
      if (!item.matchDate || !item.matchTime) return false;
      const now = new Date();
      const tournamentTime = new Date(`${item.matchDate}T${item.matchTime}`);
      const diff = (tournamentTime - now) / 1000 / 60;
      return diff <= 10 && diff > -7200;
    }).length;

    const adminRevenue = tournaments.reduce((total, item) => total + Number(item.adminProfit || 0), 0);
    const activeDeposits = paymentRequests.filter((item) => item.status === "APPROVED" || item.status === "COMPLETED").reduce((total, item) => total + Number(item.amount || 0), 0);
    const activeWithdrawals = withdrawRequests.filter((item) => item.status === "APPROVED" || item.status === "COMPLETED").reduce((total, item) => total + Number(item.amount || 0), 0);
    
    const totalDeposits = (adminStats?.totalDeposits || 0) + activeDeposits;
    const totalWithdrawals = (adminStats?.totalWithdrawals || 0) + activeWithdrawals;
    
    const pendingTopups = paymentRequests.filter((item) => item.status === "PENDING").length;
    const pendingWithdraws = withdrawRequests.filter((item) => item.status === "PENDING").length;

    return {
      totalUsers,
      totalTournaments,
      totalDeposits,
      totalWithdrawals,
      liveMatches,
      pendingTopups,
      pendingWithdraws,
      adminRevenue: adminRevenue.toFixed(0),
    };
  }, [totalUsers, tournaments, paymentRequests, withdrawRequests, adminStats]);

  // Create Tournament
  const createTournament = async (tournamentData) => {
    try {
      const liveRef = ref(database, "liveTournaments");
      await push(liveRef, {
        ...tournamentData,
        joinedCount: 0,
        currentPrizePool: 0,
        currentAdminProfit: 0,
        roomId: "",
        roomPassword: "",
        resultPublished: false,
        completed: false,
      });

      // Send Push Notification
      try {
        await secureFetch('/api/send-notification', {
          title: "🔥 New Match Added!",
          body: `${tournamentData.tournamentTitle} - Pool: ${tournamentData.totalPrizePool} Coins. Join now!`
        });
      } catch (notifyError) {
        console.error("Failed to send push notification:", notifyError);
      }

      alert("Tournament Created Successfully 🔥");
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    }
  };

  // Approve Payment
  const approvePayment = async (item) => {
    try {
      await updateDoc(doc(db, "users", item.userId), {
        coins: increment(Number(item.amount)),
      });
      await logCoinTransaction(item.userId, Number(item.amount), "TOPUP", `Topup request approved`, true);
      
      await update(ref(database, `paymentRequests/${item.id}`), {
        status: "COMPLETED",
        completedTime: new Date().toLocaleString(),
      });
      alert("Coins Added Successfully 🔥");
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    }
  };

  // Reject Payment
  const rejectPayment = async (item) => {
    try {
      await update(ref(database, `paymentRequests/${item.id}`), {
        status: "REJECTED",
      });
      alert("Payment Rejected ❌");
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    }
  };

  // Delete Payment Requests
  const deletePaymentRequests = async (type) => {
    if (!window.confirm(`Delete ${type} payment requests?`)) return;
    try {
      let sumDeleted = 0;
      if (type === "ALL") {
        for (const item of paymentRequests) {
          if (item.status === "APPROVED" || item.status === "COMPLETED") sumDeleted += Number(item.amount || 0);
        }
        await remove(ref(database, "paymentRequests"));
        alert("All Payment Requests Deleted ✅");
      } else {
        for (const item of paymentRequests) {
          if (item.status === type) {
            if (type === "APPROVED" || type === "COMPLETED") sumDeleted += Number(item.amount || 0);
            await remove(ref(database, `paymentRequests/${item.id}`));
          }
        }
        alert(`${type} Payment Requests Deleted ✅`);
      }

      if (sumDeleted > 0) {
        const statsRef = ref(database, "adminStats/totalDeposits");
        const statsSnap = await get(statsRef);
        await update(ref(database, "adminStats"), { totalDeposits: (statsSnap.val() || 0) + sumDeleted });
      }
    } catch (error) {
      alert(error.message);
    }
  };

  // Approve Withdraw
  const approveWithdraw = async (item) => {
    try {
      await update(ref(database, `withdrawRequests/${item.id}`), {
        status: "COMPLETED",
        completedTime: new Date().toLocaleString(),
      });
      alert("Withdraw Completed ✅");
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    }
  };

  // Reject Withdraw
  const rejectWithdraw = async (item, reason) => {
    try {
      await update(ref(database, `withdrawRequests/${item.id}`), {
        status: "REJECTED",
        completedTime: new Date().toLocaleString(),
        reason: reason || "No reason provided",
      });
      await updateDoc(doc(db, "users", item.userId), {
        coins: increment(Number(item.amount || 0)),
        winCoins: increment(Number(item.amount || 0)),
      });
      await logCoinTransaction(item.userId, Number(item.amount || 0), "WITHDRAW_REFUND", `Withdraw rejected: ${reason || "No reason"}`, true);
      await push(ref(database, `notifications/${item.userId}`), {
        title: "❌ WITHDRAW REJECTED",
        message: `Your withdraw of ${item.amount} coins was rejected.\nReason: ${reason || "No reason provided"}\nCoins refunded.`,
        time: new Date().toLocaleString(),
        seen: false,
      });
      alert("Withdraw Rejected & Coins Refunded 🔥");
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    }
  };
// In useAdminData.js, update the searchUser function
const searchUser = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      setSearchedUser({
        ...userData,
        uid: uid,
        name: userData.name || "Not Set"
      });
      return {
        ...userData,
        uid: uid,
        name: userData.name || "Not Set"
      };
    } else {
      alert("User Not Found ❌");
      setSearchedUser(null);
      return null;
    }
  } catch (err) {
    console.log(err);
    setSearchedUser(null);
    return null;
  }
};
  // Delete Withdraw Requests
  const deleteWithdrawRequests = async (type) => {
    if (!window.confirm(`Delete ${type} withdraw requests?`)) return;
    try {
      let sumDeleted = 0;
      if (type === "ALL") {
        for (const item of withdrawRequests) {
          if (item.status === "APPROVED" || item.status === "COMPLETED") sumDeleted += Number(item.amount || 0);
        }
        await remove(ref(database, "withdrawRequests"));
        alert("All Withdraw Requests Deleted ✅");
      } else {
        for (const item of withdrawRequests) {
          if (item.status === type) {
            if (type === "APPROVED" || type === "COMPLETED") sumDeleted += Number(item.amount || 0);
            await remove(ref(database, `withdrawRequests/${item.id}`));
          }
        }
        alert(`${type} Withdraw Requests Deleted ✅`);
      }

      if (sumDeleted > 0) {
        const statsRef = ref(database, "adminStats/totalWithdrawals");
        const statsSnap = await get(statsRef);
        await update(ref(database, "adminStats"), { totalWithdrawals: (statsSnap.val() || 0) + sumDeleted });
      }
    } catch (error) {
      alert(error.message);
    }
  };

  // Add Manual Coins
  const addManualCoins = async (uid, amount) => {
    if (!uid || !amount) {
      alert("Enter UID and Amount");
      return;
    }
    try {
      await updateDoc(doc(db, "users", uid), {
        coins: increment(Number(amount)),
      });
      await logCoinTransaction(uid, Number(amount), "ADMIN_ADD", "Coins added by admin", true);
      alert("Coins Added Successfully 🔥");
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    }
  };

  // Give Loyal Bonus (streak bonus) and track in Realtime Database under loyalBonuses
  const giveLoyalBonus = async (uid, amount, userName, userEmail) => {
    if (!uid || !amount) {
      alert("Enter UID and Amount");
      return false;
    }
    try {
      // Update coins in Firestore
      await updateDoc(doc(db, "users", uid), {
        coins: increment(Number(amount)),
      });
      // Log coin transaction
      await logCoinTransaction(uid, Number(amount), "LOYAL_BONUS", "Daily loyal active streak bonus", true);
      
      // Update/accumulate in Realtime Database under loyalBonuses/${uid}
      const loyalBonusRef = ref(database, `loyalBonuses/${uid}`);
      const snap = await get(loyalBonusRef);
      const existing = snap.val() || { totalBonus: 0 };
      await set(loyalBonusRef, {
        userId: uid,
        name: userName || "Unknown Player",
        email: userEmail || "",
        totalBonus: Number(existing.totalBonus || 0) + Number(amount),
        lastUpdated: new Date().toLocaleString(),
        lastUpdatedTime: Date.now()
      });

      // Push notification to user's notifications tree
      await push(ref(database, `notifications/${uid}`), {
        title: "🎁 LOYAL BONUS ADDED",
        message: `Congratulations! You received a loyal active bonus of 🪙 ${amount}.`,
        time: new Date().toLocaleString(),
        seen: false,
        timestamp: Date.now()
      });

      alert("Loyal Bonus Given Successfully 🔥");
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    }
  };

  // Deduct Manual Coins
  const deductManualCoins = async (uid, amount) => {
    if (!uid || !amount) {
      alert("Enter UID and Amount");
      return;
    }
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      const currentCoins = userSnap.data()?.coins || 0;
      const deductAmt = Math.min(currentCoins, Number(amount));
      
      await updateDoc(userRef, {
        coins: currentCoins - deductAmt,
      });
      await logCoinTransaction(uid, deductAmt, "ADMIN_DEDUCT", "Coins deducted by admin", false);
      alert("Coins Deducted Successfully 🔥");
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    }
  };

  // Block/Unblock User
  const blockUser = async (uid, isBlocked, reason = "") => {
    try {
      const updateData = { blocked: !isBlocked };
      if (!isBlocked && reason) {
        updateData.blockReason = reason;
      } else if (isBlocked) {
        updateData.blockReason = "";
      }
      
      await updateDoc(doc(db, "users", uid), updateData);
      alert(isBlocked ? "User Unblocked 🔥" : "User Blocked 🚫");
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    }
  };



  const parseDurationToMs = (durationStr) => {
    if (!durationStr) return 0;
    const num = parseInt(durationStr);
    if (isNaN(num)) return 0;
    const lower = durationStr.toLowerCase();
    if (lower.includes("hour") || lower.includes("hr") || lower.includes("h")) {
      return num * 60 * 60 * 1000;
    }
    return num * 60 * 1000;
  };

  const toggleMaintenance = async (duration = "") => {
    const isEnabling = !maintenanceMode;
    const endsAt = duration ? Date.now() + (parseInt(duration) * 60 * 60 * 1000) : 0;
    
    try {
      await update(ref(database), {
        "settings/maintenance": {
          enabled: isEnabling,
          duration: isEnabling ? duration : "",
          endsAt: isEnabling ? endsAt : 0,
          allowedUsers: maintenanceAllowedUsers
        }
      });
      alert(`✅ Maintenance Mode ${isEnabling ? "ENABLED" : "DISABLED"}!`);
    } catch (error) {
      console.error("Error toggling maintenance mode:", error);
      alert("❌ Failed to toggle maintenance mode.");
    }
  };

  const updateMaintenanceAllowedUsers = async (allowedUsers) => {
    try {
      await update(ref(database, "settings/maintenance"), {
        allowedUsers: allowedUsers
      });
      alert("✅ Allowed users updated!");
    } catch (error) {
      console.error("Error updating allowed users:", error);
      alert("❌ Failed to update allowed users.");
    }
  };

  // Migrate Old Users' Coins to Winnings
  const migrateWinnings = async () => {
    if (!window.confirm("Are you sure you want to migrate all existing user coins to their Winning Balance?")) return;
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const batch = writeBatch(db);
      
      let count = 0;
      usersSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.coins > 0 && (!data.winCoins || data.winCoins < data.coins)) {
          batch.update(docSnap.ref, { winCoins: data.coins });
          count++;
        }
      });
      
      if (count > 0) {
        await batch.commit();
        alert(`Successfully migrated ${count} users' coins to Winning Balance!`);
      } else {
        alert("No users needed migration.");
      }
    } catch (error) {
      console.error(error);
      alert("Error migrating: " + error.message);
    }
  };

  const migrateSingleUserWinnings = async (userId, amount) => {
    if (!userId) {
      alert("Please enter a User ID!");
      return;
    }
    const amountToMigrate = Number(amount);
    if (!amount || isNaN(amountToMigrate) || amountToMigrate <= 0) {
      alert("Please enter a valid amount!");
      return;
    }

    if (!window.confirm(`Are you sure you want to migrate 🪙 ${amountToMigrate} to Winning Balance for user ${userId}?`)) return;
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        alert("User not found!");
        return;
      }
      const data = userSnap.data();
      const currentWinCoins = data.winCoins || 0;

      if (currentWinCoins + amountToMigrate > data.coins) {
        alert(`Error: Cannot migrate 🪙 ${amountToMigrate}. User only has 🪙 ${data.coins - currentWinCoins} in Deposit Balance available to migrate.`);
        return;
      }

      await updateDoc(userRef, { winCoins: currentWinCoins + amountToMigrate });
      alert(`Successfully migrated 🪙 ${amountToMigrate} to Winning Balance for user ${userId}!`);
    } catch (error) {
      console.error(error);
      alert("Error migrating: " + error.message);
    }
  };

  return {
    analytics,
    allUsers,
    paymentRequests,
    withdrawRequests,
    maintenanceMode,
    maintenanceDuration,
    maintenanceEndsAt,
    maintenanceAllowedUsers,
    searchedUser,
    createTournament,
    approvePayment,
    rejectPayment,
    deletePaymentRequests,
    approveWithdraw,
    rejectWithdraw,
    deleteWithdrawRequests,
    addManualCoins,
    giveLoyalBonus,
    deductManualCoins,
    blockUser,
    searchUser,
    toggleMaintenance,
    updateMaintenanceAllowedUsers,
    migrateWinnings,
    migrateSingleUserWinnings,
  };
}