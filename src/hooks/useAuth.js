import { useState, useEffect } from "react";
import { 
  auth, 
  database,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, increment, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { ref, update as dbUpdate, get, push, set } from "firebase/database";
import { createWallet } from "../services/walletService";
import { generateReferralCode } from "../utils/generateReferralCode";
import { logCoinTransaction } from "../utils/coinHistory";

// Generate or get Device ID (stored in localStorage, persists across sessions)
// Uses a deterministic browser fingerprint as fallback/identifier so clearing localStorage doesn't bypass block
const getDeviceId = () => {
  try {
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("FBA-Fingerprint", 2, 15);
      const canvasData = canvas.toDataURL();
      
      const info = [
        navigator.userAgent,
        navigator.language,
        screen.colorDepth,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset()
      ].join('|');
      
      let hash = 0;
      const str = canvasData + '||' + info;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      deviceId = 'dev-' + Math.abs(hash);
      localStorage.setItem("deviceId", deviceId);
    }
    return deviceId;
  } catch (e) {
    console.warn("localStorage is not available. Using session deviceId.", e);
    return `session-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  }
};

export function useAuth(ADMIN_UID) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerBlocked, setRegisterBlocked] = useState(false);

  const deviceId = getDeviceId();

  // Check if this device already has a registered account
  const checkDeviceHasAccount = async () => {
    try {
      const deviceRef = ref(database, `deviceRegistrations/${deviceId}`);
      const snapshot = await get(deviceRef);
      return snapshot.exists();
    } catch (error) {
      console.error("Device check error:", error);
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const isUserAdmin = currentUser.uid === ADMIN_UID;
        setIsAdmin(isUserAdmin);
        if (isUserAdmin) {
          try {
            localStorage.setItem("isAdminDevice", "true");
          } catch (e) {
            console.warn(e);
          }
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    const checkDevice = async () => {
      let isAdminDevice = false;
      try {
        isAdminDevice = localStorage.getItem("isAdminDevice") === "true";
      } catch (e) {}

      if (isAdminDevice) {
        setRegisterBlocked(false);
        return;
      }

      let isRegisteredLocal = false;
      try {
        isRegisteredLocal = localStorage.getItem("fb_registered") === "true";
      } catch (e) {
        console.warn(e);
      }

      if (isRegisteredLocal) {
        setRegisterBlocked(true);
      } else {
        const hasAccount = await checkDeviceHasAccount();
        if (hasAccount) {
          try {
            localStorage.setItem("fb_registered", "true");
          } catch (e) {
            console.warn(e);
          }
          setRegisterBlocked(true);
        }
      }
    };
    checkDevice();

    return () => unsubscribe();
  }, [ADMIN_UID]);

  // Register User (Only if device has no account) - WITH REFERRAL
  const registerUser = async (email, password, playerName, referralCode = null) => {
    if (registerLoading) return false;
    setRegisterLoading(true);
    
    try {
      // Check if this device already has a registered account (database or localStorage)
      let isAdminDevice = false;
      try {
        isAdminDevice = localStorage.getItem("isAdminDevice") === "true";
      } catch (e) {}

      const deviceHasAccount = !isAdminDevice && ((localStorage.getItem("fb_registered") === "true") || await checkDeviceHasAccount());
      
      if (deviceHasAccount) {
        localStorage.setItem("fb_registered", "true");
        alert("You can signup only one account");
        return false;
      }
      
      // Check if email already exists (optional)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      
      // Generate unique referral code for new user
      const newReferralCode = generateReferralCode(newUser.uid, playerName);
      
      // Initialize user data with referral fields
      const userData = {
        name: playerName || "Player",
        email: email,
        coins: 0,
        winCoins: 0,
        wins: 0,
        top3: 0,
        createdAt: new Date().toLocaleString(),
        nameChanged: false,
        registeredDeviceId: deviceId,
        deviceInfo: navigator.userAgent,
        referralCode: newReferralCode,
        referralStats: {
          totalReferrals: 0,
          completedReferrals: 0,
          pendingReferrals: 0,
          totalEarned: 0
        },
        referredBy: null
      };
      
      // ========== PROCESS REFERRAL CODE IF PROVIDED ==========
      let referralBonus = 0;
      let referrerId = null;
      
      if (referralCode && referralCode.trim() !== "") {
        try {
          // Find the referrer by referral code
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("referralCode", "==", referralCode.toUpperCase()));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const referrerDoc = querySnapshot.docs[0];
            referrerId = referrerDoc.id;
            const referrerData = referrerDoc.data();
            
            // Check if referrer is not referring themselves
            if (referrerId !== newUser.uid) {
              // Give new user bonus (10 coins)
              referralBonus = 10;
              userData.coins = referralBonus;
              userData.referredBy = referralCode.toUpperCase();
              
              // Create referral record in database
              const referralRef = ref(database, "referrals");
              const newReferralRef = push(referralRef);
              await set(newReferralRef, {
                id: newReferralRef.key,
                referrerId: referrerId,
                referrerName: referrerData.name || referrerData.email,
                referrerEmail: referrerData.email,
                newUserId: newUser.uid,
                newUserName: playerName || "Player",
                newUserEmail: email,
                referralCode: referralCode.toUpperCase(),
                newUserBonus: 10,
                referrerBonus: 0,
                status: "pending",
                completedBy: null,
                createdAt: new Date().toLocaleString(),
                completedAt: null,
                newUserTopupAmount: 0,
                newUserTournamentsJoined: 0
              });
              
              // Update referrer's stats
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
                message: `${playerName || "Someone"} joined using your referral code! You'll get 20 coins when they play 3 matches.`,
                time: new Date().toLocaleString(),
                seen: false,
              });
              
              console.log(`✅ Referral bonus given: ${referralBonus} coins to ${email}`);
              console.log(`✅ Referral record created for referrer: ${referrerId}`);
            }
          } else {
            console.log(`❌ Invalid referral code: ${referralCode}`);
          }
        } catch (refError) {
          console.error("Referral processing error:", refError);
          // Continue registration even if referral fails
        }
      }
      
      // Save user data
      await setDoc(doc(db, "users", newUser.uid), userData);
      
      if (referralBonus > 0) {
        await logCoinTransaction(newUser.uid, referralBonus, "REFERRAL_BONUS", `Signup bonus using referral code ${referralCode.toUpperCase()}`, true);
      }
      
      // Mark this device as having a registered account
      const deviceRef = ref(database, `deviceRegistrations/${deviceId}`);
      await dbUpdate(deviceRef, {
        userId: newUser.uid,
        email: email,
        registeredAt: new Date().toLocaleString(),
        deviceInfo: navigator.userAgent
      });
      
      // Mark this device as having a registered account locally
      try {
        localStorage.setItem("fb_registered", "true");
      } catch (e) {
        console.warn(e);
      }

      setUser(newUser);
      if (newUser.uid === ADMIN_UID) {
        setIsAdmin(true);
      }
      
      let successMessage = `✅ Account Created Successfully!`;
      if (referralBonus > 0) {
        successMessage += `\n🎁 You got ${referralBonus} bonus coins from referral!`;
      }
      successMessage += `\n💰 Your referral code: ${newReferralCode}`;
      alert(successMessage);
      return true;
      
    } catch (error) {
      alert(error.message);
      return false;
    } finally {
      setRegisterLoading(false);
    }
  };

  // Login User (Can login any account, even from device that already has registration)
  const loginUser = async (email, password) => {
    if (loginLoading) return false;
    setLoginLoading(true);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const loggedInUser = userCredential.user;
      
      // Check if user is blocked
      const userDoc = await getDoc(doc(db, "users", loggedInUser.uid));
      if (userDoc.exists() && userDoc.data().blocked) {
        alert("Your Account Is Blocked 🚫");
        await signOut(auth);
        return false;
      }
      
      // Update last login
      await updateDoc(doc(db, "users", loggedInUser.uid), {
        lastLogin: new Date().toLocaleString()
      });
      
      setUser(loggedInUser);
      const isUserAdmin = loggedInUser.uid === ADMIN_UID;
      setIsAdmin(isUserAdmin);
      if (isUserAdmin) {
        try {
          localStorage.setItem("isAdminDevice", "true");
        } catch (e) {
          console.warn(e);
        }
      }
      alert("✅ Login Successful!");
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    } finally {
      setLoginLoading(false);
    }
  };

  // Logout
  const logoutUser = async () => {
    await signOut(auth);
    setUser(null);
    setIsAdmin(false);
    alert("Logged Out");
  };

  // Change Player Name
  const changePlayerName = async (userId, newName) => {
    if (!newName) {
      alert("Enter New Name");
      return false;
    }
    try {
      await updateDoc(doc(db, "users", userId), {
        name: newName,
        nameChanged: true,
      });
      alert("Name Changed Successfully 🔥");
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    }
  };

  // Forgot Password
  const forgotPassword = async (email) => {
    if (!email) {
      alert("Enter Your Email");
      return false;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password Reset Link Sent To Your Email ✅");
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    }
  };

  return {
    user,
    isAdmin,
    loading,
    loginLoading,
    registerLoading,
    registerBlocked,
    loginUser,
    registerUser,
    logoutUser,
    forgotPassword,
    changePlayerName,
  };
}