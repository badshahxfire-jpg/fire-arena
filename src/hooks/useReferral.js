import { useState, useEffect } from "react";
import { ref, push, update, get, query, orderByChild, equalTo, set } from "firebase/database";
import { doc, updateDoc, increment, getDoc, collection, query as firestoreQuery, where, getDocs } from "firebase/firestore";
import { logCoinTransaction } from "../utils/coinHistory";
import { database, db } from "../firebase";

export function useReferral(user) {
  const [referralCode, setReferralCode] = useState(null);
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    totalEarned: 0
  });
  const [referralHistory, setReferralHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [referralConditions, setReferralConditions] = useState({
    minTournamentsJoined: 3,
    referrerBonusAmount: 20,
    newUserBonusAmount: 10
  });

  // Generate unique referral code for user
  const generateReferralCode = (userId, name) => {
    // Format: FIRE + 6 random digits + first 3 letters of name
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const nameCode = name ? name.substring(0, 3).toUpperCase() : "USR";
    return `FIRE${randomDigits}${nameCode}`;
  };

  // Create referral code for new user during registration
  const createReferralCode = async (userId, name) => {
    try {
      const code = generateReferralCode(userId, name);
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        referralCode: code,
        referredBy: null,
        referralStats: {
          totalReferrals: 0,
          completedReferrals: 0,
          pendingReferrals: 0,
          totalEarned: 0
        }
      });
      setReferralCode(code);
      return code;
    } catch (error) {
      console.error("Error creating referral code:", error);
      return null;
    }
  };

  // Get user's referral code
  const getUserReferralCode = async (userId) => {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const code = userSnap.data().referralCode;
        setReferralCode(code);
        return code;
      }
      return null;
    } catch (error) {
      console.error("Error getting referral code:", error);
      return null;
    }
  };

  // Register new user with referral code
  const registerWithReferral = async (newUserId, newUserEmail, newUserName, referralCodeUsed) => {
    try {
      // Find the referrer by referral code
      const usersRef = collection(db, "users");
      const q = firestoreQuery(usersRef, where("referralCode", "==", referralCodeUsed));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { success: false, error: "Invalid referral code!" };
      }
      
      const referrerDoc = querySnapshot.docs[0];
      const referrerId = referrerDoc.id;
      const referrerData = referrerDoc.data();
      
      // Check if referrer is referring themselves
      if (referrerId === newUserId) {
        return { success: false, error: "You cannot refer yourself!" };
      }
      
      // Give new user instant bonus (10 coins)
      const userRef = doc(db, "users", newUserId);
      await updateDoc(userRef, {
        coins: increment(referralConditions.newUserBonusAmount),
        referredBy: referralCodeUsed,
        referredAt: new Date().toLocaleString()
      });
      
      // Create referral record in database
      const referralRef = ref(database, "referrals");
      const newReferralRef = push(referralRef);
      await set(newReferralRef, {
        id: newReferralRef.key,
        referrerId: referrerId,
        referrerName: referrerData.name || referrerData.email,
        referrerEmail: referrerData.email,
        newUserId: newUserId,
        newUserName: newUserName,
        newUserEmail: newUserEmail,
        referralCode: referralCodeUsed,
        newUserBonus: referralConditions.newUserBonusAmount,
        referrerBonus: 0,
        status: "pending", // pending, completed, expired
        completedBy: null, // "topup" or "tournaments"
        createdAt: new Date().toLocaleString(),
        completedAt: null,
        newUserTopupAmount: 0,
        newUserTournamentsJoined: 0
      });
      
      // Update referrer's referral stats
      const referrerStats = referrerData.referralStats || {
        totalReferrals: 0,
        completedReferrals: 0,
        pendingReferrals: 0,
        totalEarned: 0
      };
      
      await updateDoc(doc(db, "users", referrerId), {
        "referralStats.totalReferrals": (referrerStats.totalReferrals || 0) + 1,
        "referralStats.pendingReferrals": (referrerStats.pendingReferrals || 0) + 1
      });
      
      // Send notification to referrer
      await push(ref(database, `notifications/${referrerId}`), {
        title: "🎉 NEW REFERRAL!",
        message: `${newUserName} joined using your referral code! You'll get ${referralConditions.referrerBonusAmount} coins when they add 50+ coins OR join 3 tournaments.`,
        time: new Date().toLocaleString(),
        seen: false,
      });
      
      return { 
        success: true, 
        bonus: referralConditions.newUserBonusAmount,
        message: `✅ Registered successfully! You got ${referralConditions.newUserBonusAmount} bonus coins!`
      };
      
    } catch (error) {
      console.error("Error in referral registration:", error);
      return { success: false, error: error.message };
    }
  };

  // Check and update referral status when user adds coins (topup)
  const checkReferralOnTopup = async (userId, topupAmount) => {
    try {
      // Get user data
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;
      
      const userData = userSnap.data();
      const referredBy = userData.referredBy;
      
      if (!referredBy) return; // User not referred by anyone
      
      // Find the referral record
      const referralsRef = ref(database, "referrals");
      const snapshot = await get(referralsRef);
      const referrals = snapshot.val();
      
      let referralRecord = null;
      let referralId = null;
      
      for (const key in referrals) {
        if (referrals[key].newUserId === userId && referrals[key].status === "pending") {
          referralRecord = referrals[key];
          referralId = key;
          break;
        }
      }
      
      if (!referralRecord) return;
      
      // Update topup amount
      const newTopupAmount = (referralRecord.newUserTopupAmount || 0) + topupAmount;
      
      await update(ref(database, `referrals/${referralId}`), {
        newUserTopupAmount: newTopupAmount
      });
      
      // Check if condition met (50+ coins added)
      if (newTopupAmount >= referralConditions.minTopupAmount && referralRecord.status === "pending") {
        await completeReferral(referralId, referralRecord, "topup");
      }
      
    } catch (error) {
      console.error("Error checking referral on topup:", error);
    }
  };

  // Check and update referral status when user joins tournament
  const checkReferralOnTournamentJoin = async (userId) => {
    try {
      // Get user data
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;
      
      const userData = userSnap.data();
      const referredBy = userData.referredBy;
      
      if (!referredBy) return; // User not referred by anyone
      
      // Find the referral record
      const referralsRef = ref(database, "referrals");
      const snapshot = await get(referralsRef);
      const referrals = snapshot.val();
      
      let referralRecord = null;
      let referralId = null;
      
      for (const key in referrals) {
        if (referrals[key].newUserId === userId && referrals[key].status === "pending") {
          referralRecord = referrals[key];
          referralId = key;
          break;
        }
      }
      
      if (!referralRecord) return;
      
      // Update tournaments joined count
      const newTournamentsCount = (referralRecord.newUserTournamentsJoined || 0) + 1;
      
      await update(ref(database, `referrals/${referralId}`), {
        newUserTournamentsJoined: newTournamentsCount
      });
      
      // Check if condition met (3+ tournaments joined)
      if (newTournamentsCount >= referralConditions.minTournamentsJoined && referralRecord.status === "pending") {
        await completeReferral(referralId, referralRecord, "tournaments");
      }
      
    } catch (error) {
      console.error("Error checking referral on tournament join:", error);
    }
  };

  // Complete referral and give bonus to referrer
  const completeReferral = async (referralId, referralRecord, completedBy) => {
    try {
      const referrerId = referralRecord.referrerId;
      
      // Give bonus to referrer
      await updateDoc(doc(db, "users", referrerId), {
        coins: increment(referralConditions.referrerBonusAmount),
        "referralStats.completedReferrals": increment(1),
        "referralStats.pendingReferrals": increment(-1),
        "referralStats.totalEarned": increment(referralConditions.referrerBonusAmount)
      });
      
      await logCoinTransaction(referrerId, referralConditions.referrerBonusAmount, "REFERRAL_BONUS", `Referral completed by ${referralRecord.newUserName}`, true);
      
      // Update referral record
      await update(ref(database, `referrals/${referralId}`), {
        status: "completed",
        completedBy: completedBy,
        referrerBonus: referralConditions.referrerBonusAmount,
        completedAt: new Date().toLocaleString()
      });
      
      // Send notification to referrer
      await push(ref(database, `notifications/${referrerId}`), {
        title: "💰 REFERRAL BONUS EARNED!",
        message: `Your referral ${referralRecord.newUserName} ${completedBy === "topup" ? "added 50+ coins" : "joined 3 tournaments"}! You got ${referralConditions.referrerBonusAmount} bonus coins!`,
        time: new Date().toLocaleString(),
        seen: false,
      });
      
      console.log(`Referral completed: ${referralId} by ${completedBy}`);
      
    } catch (error) {
      console.error("Error completing referral:", error);
    }
  };

  // Get user's referral statistics
  const getUserReferralStats = async (userId) => {
    try {
      setLoading(true);
      
      let stats = {
        totalReferrals: 0,
        completedReferrals: 0,
        pendingReferrals: 0,
        totalEarned: 0
      };

      // Get user data
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      
      // Get referral history
      const referralsRef = ref(database, "referrals");
      const snapshot = await get(referralsRef);
      const referrals = snapshot.val();
      
      const history = [];
      let calculatedTotal = 0;
      let calculatedCompleted = 0;
      let calculatedPending = 0;
      let calculatedEarned = 0;

      for (const key in referrals) {
        if (referrals[key].referrerId === userId) {
          const refItem = referrals[key];
          history.push({
            id: key,
            ...refItem
          });
          calculatedTotal++;
          if (refItem.status === "completed") {
            calculatedCompleted++;
            calculatedEarned += Number(refItem.referrerBonus || 20);
          } else if (refItem.status === "pending") {
            calculatedPending++;
          }
        }
      }
      
      stats = {
        totalReferrals: calculatedTotal,
        completedReferrals: calculatedCompleted,
        pendingReferrals: calculatedPending,
        totalEarned: calculatedEarned
      };
      
      setReferralStats(stats);

      // Self-heal: update stats in Firestore if they are out of sync
      if (userSnap.exists()) {
        const dbStats = userSnap.data().referralStats || {};
        if (
          dbStats.totalReferrals !== calculatedTotal ||
          dbStats.completedReferrals !== calculatedCompleted ||
          dbStats.pendingReferrals !== calculatedPending ||
          dbStats.totalEarned !== calculatedEarned
        ) {
          await updateDoc(userRef, {
            "referralStats.totalReferrals": calculatedTotal,
            "referralStats.completedReferrals": calculatedCompleted,
            "referralStats.pendingReferrals": calculatedPending,
            "referralStats.totalEarned": calculatedEarned
          });
        }
      }
      
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
              
              let hours = 0, minutes = 0, seconds = 0;
              if (parts[1]) {
                const timeParts = parts[1].split(':');
                hours = parseInt(timeParts[0] || '0', 10);
                minutes = parseInt(timeParts[1] || '0', 10);
                seconds = parseInt(timeParts[2] || '0', 10);
              }
              const d = new Date(year, month, day, hours, minutes, seconds);
              if (!isNaN(d.getTime())) return d.getTime();
            }
          }
        } catch (e) {
          console.error("Failed to parse date:", dateStr, e);
        }
        return 0;
      };

      // Sort by date (newest first), falling back to Firebase key ordering
      history.sort((a, b) => {
        const timeA = parseDate(a.createdAt);
        const timeB = parseDate(b.createdAt);
        if (timeA !== timeB) {
          return timeB - timeA;
        }
        return (b.id || "").localeCompare(a.id || "");
      });
      setReferralHistory(history);
      
      return { stats, history };
      
    } catch (error) {
      console.error("Error getting referral stats:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get referral code for current user
  useEffect(() => {
    if (user?.uid) {
      getUserReferralCode(user.uid);
      getUserReferralStats(user.uid);
    }
  }, [user]);

  // Share referral code
  const shareReferralCode = async () => {
    const code = referralCode || await getUserReferralCode(user?.uid);
    if (!code) {
      alert("Referral code not available!");
      return;
    }
    
    const appLink = window.location.origin;
    const shareText = `🔥 Join FireBaadshah Arena using my referral code: ${code}\n\nGet ${referralConditions.newUserBonusAmount} bonus coins on registration! Download now: ${appLink}`;
    
    try {
      const { Share } = await import("@capacitor/share");
      await Share.share({
        title: "Join FireBaadshah Arena",
        text: shareText,
        dialogTitle: "Share Referral Code",
      });
    } catch (err) {
      console.error("Share API failed:", err);
      if (navigator.share) {
        try {
          await navigator.share({
            title: "Join FireBaadshah Arena",
            text: shareText,
          });
          return;
        } catch (navErr) {
          console.error("Navigator Share API failed:", navErr);
        }
      }
      copyToClipboard(code);
    }
  };
  
  // Copy to clipboard
  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    alert(`✅ Referral code ${code} copied to clipboard! Share it with friends.`);
  };

  return {
    referralCode,
    referralStats,
    referralHistory,
    referralConditions,
    loading,
    createReferralCode,
    getUserReferralCode,
    registerWithReferral,
    checkReferralOnTopup,
    checkReferralOnTournamentJoin,
    getUserReferralStats,
    shareReferralCode,
    copyToClipboard
  };
}