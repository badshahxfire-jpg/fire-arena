import "./App.css";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ref, update, remove, push, get, onValue } from "firebase/database";
import { database, db, messaging } from "./firebase";
import { doc, updateDoc, increment, getDoc, setDoc } from "firebase/firestore";
import { getToken, onMessage } from "firebase/messaging";
import { secureFetch } from "./utils/backendApi";
import AppUpdatePopup from "./components/Popups/AppUpdatePopup";
import AppUpdateAdmin from "./components/Admin/AppUpdateAdmin";

// Hooks
import { useAuth } from "./hooks/useAuth";
import { useTournaments } from "./hooks/useTournaments";
import { useWallet } from "./hooks/useWallet";
import { useNotifications } from "./hooks/useNotifications";
import { useAdminData } from "./hooks/useAdminData";
import { useResults } from "./hooks/useResults";
import { logCoinTransaction } from "./utils/coinHistory";
import { getPrizeByPosition } from "./utils/prizeDistribution";

// Main Components
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import PromoCarousel from "./components/PromoCarousel";
import ActivePoll from "./components/ActivePoll";
import GameModes from "./components/GameModes";
import UpcomingMatches from "./components/UpcomingMatches";
import LiveMatches from "./components/LiveMatches";
import Leaderboard from "./components/Leaderboard";
import TournamentWinners from "./components/TournamentWinners";
import Footer from "./components/Footer";

// Popup Components
import LoginPopup from "./components/Popups/LoginPopup";
import RegisterPopup from "./components/Popups/RegisterPopup";
import WalletPopup from "./components/Popups/WalletPopup";
import WithdrawPopup from "./components/Popups/WithdrawPopup";
import ProfilePopup from "./components/Popups/ProfilePopup";
import HistoryPopup from "./components/Popups/HistoryPopup";
import PerKillHistoryPopup from "./components/Popups/PerKillHistoryPopup";
import ContactPopup from "./components/Popups/ContactPopup";
import JoinPopup from "./components/Popups/JoinPopup";
import TutorialPopup from "./components/Popups/TutorialPopup";
import NotificationsPopup from "./components/Popups/NotificationsPopup";
import ReferralPopup from "./components/Popups/ReferralPopup";
import UserActivityPopup from "./components/Admin/UserActivityPopup";
import BonusWinnersPopup from "./components/Popups/BonusWinnersPopup";
import BlockedUsersPopup from "./components/Popups/BlockedUsersPopup";
import OfflineBlockPopup from "./components/Popups/OfflineBlockPopup";
import WelcomeScratchCard from "./components/Popups/WelcomeScratchCard";

// Admin Components
import AdminAnalytics from "./components/Admin/AdminAnalytics";
import PaymentRequests from "./components/Admin/PaymentRequests";
import WithdrawRequests from "./components/Admin/WithdrawRequests";
import CreateTournament from "./components/Admin/CreateTournament";
import MatchResults from "./components/Admin/MatchResults";
import UserProfileCheck from "./components/Admin/UserProfileCheck";
import MaintenanceMode from "./components/Admin/MaintenanceMode";
import AdminPromos from "./components/Admin/AdminPromos";
import AdminPolls from "./components/Admin/AdminPolls";
import CoinHistoryPopup from "./components/Popups/CoinHistoryPopup";
import UpcomingGamesPopup from "./components/Popups/UpcomingGamesPopup";
import ManualCoins from "./components/Admin/ManualCoins";
import AdminMatchResults from "./components/Admin/AdminMatchResults";
import StaffManagement from "./components/Admin/StaffManagement";

// Per Kill System Components & Hook (Isolated)
import { usePerKillTournaments } from "./hooks/usePerKillTournaments";
import CreatePerKillTournament from "./components/Admin/CreatePerKillTournament";
import PerKillMatchResults from "./components/Admin/PerKillMatchResults";
import UpcomingPerKillMatches from "./components/UpcomingPerKillMatches";
import LivePerKillMatches from "./components/LivePerKillMatches";
import AnnouncementBanner from "./components/AnnouncementBanner";
import AdminAnnouncements from "./components/Admin/AdminAnnouncements";
import ThemeSwitcher from "./components/ThemeSwitcher";
import ThemeParticles from "./components/ThemeParticles";
import ZoomControl from "./components/ZoomControl";
import LoadingScreen from "./components/LoadingScreen";
import { playClickSound, playSuccessSound, playErrorSound } from "./utils/soundEffects";

// Weekly Tournament Components
import { useWeeklyTournaments } from "./hooks/useWeeklyTournaments";
import WeeklyDashboard from "./components/Weekly/WeeklyDashboard";
import AdminWeeklyDashboard from "./components/Admin/Weekly/AdminWeeklyDashboard";
import CalculatorWidget from "./components/Admin/CalculatorWidget";

const ADMIN_UID = "FAVc9zfAgoYs1d1BDr2EoDwSw0x1";


export default function FireBaadshahArena() {
  // ================= UI State =================
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showWithdrawPopup, setShowWithdrawPopup] = useState(false);
  const [showCoinHistory, setShowCoinHistory] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPerKillHistory, setShowPerKillHistory] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [showLoyal, setShowLoyal] = useState(false);
  const [showBonusWinners, setShowBonusWinners] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [showJoinPopup, setShowJoinPopup] = useState(false);
  const [showUpcomingGames, setShowUpcomingGames] = useState(false);
  const [selectedMode, setSelectedMode] = useState("SOLO");
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [adminPage, setAdminPage] = useState("users");
  const [showTopupAdminPopup, setShowTopupAdminPopup] = useState(false);
  const [showWithdrawAdminPopup, setShowWithdrawAdminPopup] = useState(false);
  
  // Result Popup States
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [showResultAnalyticsPopup, setShowResultAnalyticsPopup] = useState(false);
  const [selectedPublishTournament, setSelectedPublishTournament] = useState(null);
  const [currentSystemMode, setCurrentSystemMode] = useState("classic"); // "classic" or "perkill"
  const [activeMatchTab, setActiveMatchTab] = useState("UPCOMING"); // "UPCOMING" or "LIVE"
  const [selectedPerKillMode, setSelectedPerKillMode] = useState("SOLO");

  // App Update States
  const [showUpdatePopup, setShowUpdatePopup] = useState(false);
  const [isForceUpdate, setIsForceUpdate] = useState(false);
  const [updateConfig, setUpdateConfig] = useState(null);

  // Welcome Bonus States
  const [showWelcomeBonus, setShowWelcomeBonus] = useState(false);
  const [hasPostponedWelcomeBonus, setHasPostponedWelcomeBonus] = useState(false);

  // Ref to hold the latest UI states for the back button listener
  const stateRef = useRef();
  stateRef.current = {
    showLogin,
    showRegister,
    showWallet,
    showWithdrawPopup,
    showCoinHistory,
    showProfile,
    showHistory,
    showPerKillHistory,
    showContact,
    showTutorial,
    showNotifications,
    showReferral,
    showLoyal,
    showBonusWinners,
    showJoinPopup,
    showUpcomingGames,
    showTopupAdminPopup,
    showWithdrawAdminPopup,
    showResultPopup,
    selectedTournament,
    selectedPublishTournament,
    showUpdatePopup,
    isForceUpdate
  };

  function isVersionOlder(current, latest) {
    if (!current || !latest) return false;
    const cParts = current.split(".").map((x) => parseInt(x, 10) || 0);
    const lParts = latest.split(".").map((x) => parseInt(x, 10) || 0);
    for (let i = 0; i < Math.max(cParts.length, lParts.length); i++) {
      const cVal = cParts[i] || 0;
      const lVal = lParts[i] || 0;
      if (cVal < lVal) return true;
      if (cVal > lVal) return false;
    }
    return false;
  }



  // ================= Custom Hooks =================
  const {
    user,
    isAdmin,
    loginUser,
    registerUser,
    logoutUser,
    forgotPassword,
    changePlayerName,
    changePassword,
    loading,
    loginLoading,
    registerLoading,
    registerBlocked,
    offlineBlockedUser,
    setOfflineBlockedUser,
    isSuperAdmin,
  } = useAuth(ADMIN_UID);

  const {
    liveTournaments: livePerKillTournaments,
    joinedPlayers: joinedPerKillPlayers,
    matchResults: perKillMatchResults,
    joinLoading: perKillJoinLoading,
    createPerKillTournament,
    joinTournament: joinPerKillTournament,
    cancelTournament: cancelPerKillTournament,
    publishRoomDetails: publishPerKillRoomDetails,
    updateTournamentTime: updatePerKillTournamentTime,
    updateTournamentSlots: updatePerKillTournamentSlots,
    publishResults: publishPerKillResults,
    deletePerKillMatchHistory,
    deleteAllPerKillMatchHistory
  } = usePerKillTournaments(user);

  const {
    liveTournaments,
    joinedPlayers,
    joinedHistory,
    matchResults,
    leaderboard,
    joinLoading,
    joinTournament,
    publishRoomDetails,
    cancelTournament,
    updateTournamentTime,
    updateTournamentSlots,
    cancelLoading,
    deleteMatchHistory,
    deleteAllUserMatchHistory,
  } = useTournaments(user);


  const {
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
    coinHistory
  } = useWallet(user, isAdmin);

  // Force Logout effect if password is changed on another device
  useEffect(() => {
    if (playerData?.forceLogoutAt) {
      try {
        const sessionTime = parseInt(localStorage.getItem("loginSessionTimestamp") || "0");
        if (sessionTime < playerData.forceLogoutAt) {
          alert("Your password was changed from another device. You have been logged out.");
          logoutUser();
        }
      } catch (e) {
        console.warn(e);
      }
    }
  }, [playerData?.forceLogoutAt, logoutUser]);

  const {
    notifications,
    unseenCount,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    isSoundMuted,
    toggleMute,
  } = useNotifications(user);

  // Auto-Block for 15 Days Inactivity
  useEffect(() => {
    if (user && playerData && !isAdmin) {
      const checkAndAutoBlock = async () => {
        const now = Date.now();
        const lastActive = playerData.lastActiveTimestamp || now;
        const daysInactive = (now - lastActive) / (1000 * 60 * 60 * 24);

        if (daysInactive >= 15 && !playerData.blocked) {
          // Auto block user
          await updateDoc(doc(db, "users", user.uid), {
            blocked: true,
            blockReason: "Offline Regular",
            lastActiveTimestamp: now
          });
          logoutUser(); // Sign them out
        } else if (!playerData.blocked) {
          // Update lastActiveTimestamp if it's been more than 1 hour to avoid too many writes
          if (now - lastActive > 1000 * 60 * 60) {
            await updateDoc(doc(db, "users", user.uid), {
              lastActiveTimestamp: now
            });
          }
        }
      };
      checkAndAutoBlock();
    }
  }, [user, playerData?.lastActiveTimestamp, playerData?.blocked, isAdmin, logoutUser]);

  const {
    analytics,
    allUsers,
    maintenanceMode,
    maintenanceDuration,
    maintenanceEndsAt,
    maintenanceAllowedUsers,
    searchedUser,
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
    createTournament,
    migrateWinnings,
    migrateSingleUserWinnings,
  } = useAdminData(isAdmin);

  const {
    playerResults,
    resultAnalytics,
    resultLoading,
    submitResult,
    approveResult,
    rejectResult,
    publishFinalResults,
  } = useResults();

  const {
    weeklyTournaments,
    createWeeklyTournament,
    joinWeeklyTournament,
    updateStatus,
    updateTeamRank,
    cancelWeeklyTournament,
    updateRoomDetails,
    distributeWeeklyRewards,
    generateLobbies,
    updateLobbyDetails,
    advancePhase,
    updateTournamentRules
  } = useWeeklyTournaments(user);

  // ================= User Stats for History =================
  const userStats = {
    matchesPlayed: joinedHistory.filter((item) => item.userEmail === user?.email).length,
    wins: playerData?.wins || 0,
    top3: playerData?.top3 || 0,
    winRate: joinedHistory.filter((item) => item.userEmail === user?.email).length > 0
      ? ((playerData?.wins || 0) / joinedHistory.filter((item) => item.userEmail === user?.email).length * 100).toFixed(1)
      : 0,
    totalEarnings: (playerData?.wins || 0) * 500 + (playerData?.top3 || 0) * 100,
    totalCoinsWon: (playerData?.wins || 0) * 500 + (playerData?.top3 || 0) * 100,
    avgPlacement: joinedHistory.filter((item) => item.userEmail === user?.email).length > 0
      ? (((playerData?.wins || 0) * 1 + (playerData?.top3 || 0) * 3) / joinedHistory.filter((item) => item.userEmail === user?.email).length).toFixed(1)
      : 0,
    kd: ((playerData?.wins || 0) * 3 + (playerData?.top3 || 0) / (joinedHistory.filter((item) => item.userEmail === user?.email).length || 1)).toFixed(2),
    mvp: Math.floor((playerData?.wins || 0) / 2),
  };

  // Welcome Bonus check and claim functions
  useEffect(() => {
    if (user && playerData && !isAdmin && !playerData.welcomeBonusClaimed && !hasPostponedWelcomeBonus) {
      setShowWelcomeBonus(true);
    } else {
      setShowWelcomeBonus(false);
    }
  }, [user, playerData, isAdmin, hasPostponedWelcomeBonus]);

  // Add global click sound listener for buttons
  useEffect(() => {
    const handleClick = (e) => {
      // Find the closest button or an element with role="button"
      const btn = e.target.closest('button, [role="button"]');
      if (btn) {
        playClickSound();
      }
    };
    
    document.body.addEventListener('click', handleClick);
    return () => {
      document.body.removeEventListener('click', handleClick);
    };
  }, []);

  const handleClaimWelcomeBonus = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        coins: increment(20),
        welcomeBonusClaimed: true
      });
      await logCoinTransaction(user.uid, 20, "WELCOME_BONUS", "Welcome signup bonus claimed!", true);
      setShowWelcomeBonus(false);
    } catch (error) {
      console.error("Error claiming welcome bonus:", error);
      alert("Failed to claim welcome bonus. Please try again.");
    }
  };

  useEffect(() => {
    const updateRef = ref(database, "settings/appUpdate");
    const unsubscribe = onValue(updateRef, async (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      setUpdateConfig(data);

      if (typeof window !== "undefined" && window.Capacitor) {
        try {
          const { App: CapApp } = await import("@capacitor/app");
          const info = await CapApp.getInfo();
          const currentVersion = info.version; // e.g. "1.0.0"
          
          if (isVersionOlder(currentVersion, data.latestVersion)) {
            // Check if force update is required
            if (isVersionOlder(currentVersion, data.minVersion)) {
              setIsForceUpdate(true);
            } else {
              setIsForceUpdate(false);
            }
            setShowUpdatePopup(true);
          } else {
            setShowUpdatePopup(false);
          }
        } catch (err) {
          console.error("Failed to check app version:", err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Keep track of whether we pushed a state for the active popup
  const hasPushedStateRef = useRef(false);

  // ================= FCM Registration =================
  useEffect(() => {
    if (!user || !messaging) return;
    
    // Request permission and get token
    const requestPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Replace this VAPID key with the valid one from Firebase Console -> Cloud Messaging -> Web configuration
          const currentToken = await getToken(messaging, { vapidKey: 'BCAjW1ZCBKvhXkLPxe5imNSAptbkHEnrGHHlSW2RUDj33RJj9JnLVgF7SjEHbKUgCObuZ6OicaSE9jMMpYJz944' });
          if (currentToken) {
            // Send token to backend to subscribe to 'all_users' topic
            await secureFetch('/api/register-token', { token: currentToken });
            console.log('FCM Token registered successfully');
          }
        }
      } catch (error) {
        console.error('Error getting notification permission:', error);
      }
    };
    
    requestPermission();

    // Listen for foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received: ', payload);
      // Optional: show a custom toast notification here if you want
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const anyOpen = !!(
      showLogin ||
      showRegister ||
      showWallet ||
      showWithdrawPopup ||
      showCoinHistory ||
      showProfile ||
      showHistory ||
      showPerKillHistory ||
      showContact ||
      showTutorial ||
      showNotifications ||
      showReferral ||
      showLoyal ||
      showBonusWinners ||
      showBlockedUsers ||
      showJoinPopup ||
      showUpcomingGames ||
      showTopupAdminPopup ||
      showWithdrawAdminPopup ||
      showResultPopup ||
      showResultAnalyticsPopup ||
      selectedTournament ||
      selectedPublishTournament ||
      showUpdatePopup
    );

    if (anyOpen && !hasPushedStateRef.current) {
      window.history.pushState({ popupOpen: true }, "");
      hasPushedStateRef.current = true;
    } else if (!anyOpen && hasPushedStateRef.current) {
      window.history.back();
      hasPushedStateRef.current = false;
    }

    // Disable background scrolling when any popup is open
    if (anyOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "";
    };
  }, [
    showLogin,
    showRegister,
    showWallet,
    showWithdrawPopup,
    showCoinHistory,
    showProfile,
    showHistory,
    showPerKillHistory,
    showContact,
    showTutorial,
    showNotifications,
    showReferral,
    showLoyal,
    showBonusWinners,
    showBlockedUsers,
    showJoinPopup,
    showUpcomingGames,
    showTopupAdminPopup,
    showWithdrawAdminPopup,
    showResultPopup,
    selectedTournament,
    selectedPublishTournament,
    showUpdatePopup
  ]);

  useEffect(() => {
    const handlePopState = (event) => {
      // If the back button popped our state, close popups
      hasPushedStateRef.current = false;
      
      // Close all popups
      setShowLogin(false);
      setShowRegister(false);
      setShowWallet(false);
      setShowWithdrawPopup(false);
      setShowCoinHistory(false);
      setShowProfile(false);
      setShowHistory(false);
      setShowPerKillHistory(false);
      setShowContact(false);
      setShowTutorial(false);
      setShowNotifications(false);
      setShowReferral(false);
      setShowLoyal(false);
      setShowBonusWinners(false);
      setShowBlockedUsers(false);
      setShowJoinPopup(false);
      setShowUpcomingGames(false);
      setShowTopupAdminPopup(false);
      setShowWithdrawAdminPopup(false);
      setShowResultPopup(false);
      setShowResultAnalyticsPopup(false);
      setSelectedTournament(null);
      setSelectedPublishTournament(null);
      setShowUpdatePopup(false);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    let handlerPromise = null;
    if (typeof window !== "undefined" && window.Capacitor) {
      const initBackButton = async () => {
        try {
          const { App: CapApp } = await import("@capacitor/app");
          handlerPromise = CapApp.addListener("backButton", (data) => {
            const s = stateRef.current;
            if (!s) return;

            const anyOpen = !!(
              s.showLogin ||
              s.showRegister ||
              s.showWallet ||
              s.showWithdrawPopup ||
              s.showCoinHistory ||
              s.showProfile ||
              s.showHistory ||
              s.showPerKillHistory ||
              s.showContact ||
              s.showTutorial ||
              s.showNotifications ||
              s.showReferral ||
              s.showLoyal ||
              s.showBonusWinners ||
              s.showBlockedUsers ||
              s.showJoinPopup ||
              s.showUpcomingGames ||
              s.showTopupAdminPopup ||
              s.showWithdrawAdminPopup ||
              s.showResultPopup ||
              s.selectedTournament ||
              s.selectedPublishTournament ||
              s.showUpdatePopup
            );

            if (anyOpen) {
              if (s.showUpdatePopup && s.isForceUpdate) {
                CapApp.exitApp();
              } else {
                window.history.back();
              }
            } else if (data.canGoBack) {
              window.history.back();
            } else {
              CapApp.exitApp();
            }
          });
        } catch (err) {
          console.error("Failed to add back button listener:", err);
        }
      };

      initBackButton();
    }

    return () => {
      if (handlerPromise) {
        handlerPromise.then((h) => h.remove());
      }
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    if (typeof window !== "undefined" && window.Capacitor) {
      const registerPush = async () => {
        try {
          const { PushNotifications } = await import("@capacitor/push-notifications");
          let permStatus = await PushNotifications.checkPermissions();
          
          if (permStatus.receive === "prompt") {
            permStatus = await PushNotifications.requestPermissions();
          }

          if (permStatus.receive !== "granted") {
            console.warn("Push notification permission not granted.");
            return;
          }

          // Create high importance channel for Android popups (Heads-Up Notifications)
          if (window.Capacitor && window.Capacitor.getPlatform() === "android") {
            try {
              await PushNotifications.createChannel({
                id: 'fba_alerts',
                name: 'FBA Alerts',
                description: 'High priority notifications',
                importance: 5,
                visibility: 1
              });
            } catch (err) {
              console.warn("Failed to create push channel:", err);
            }
          }

          await PushNotifications.register();

          PushNotifications.addListener("registration", async (token) => {
            console.log("Push registration success, token: " + token.value);
            try {
              const userRef = doc(db, "users", user.uid);
              await updateDoc(userRef, {
                fcmToken: token.value,
              });
            } catch (err) {
              console.error("Failed to save FCM token to Firestore:", err);
            }
          });

          PushNotifications.addListener("registrationError", (error) => {
            console.error("Push registration error: ", error);
          });

          PushNotifications.addListener("pushNotificationReceived", (notification) => {
            console.log("Push received: ", notification);
          });

        } catch (err) {
          console.error("Error setting up push notifications:", err);
        }
      };

      registerPush();
    }
  }, [user]);

  // ================= Handler Functions =================
  const handleJoinTournament = async (tournament, joinData) => {
    const success = await joinTournament(tournament, user, coins, joinData, selectedTournament);
    if (success) {
      playSuccessSound();
      setShowJoinPopup(false);
    } else {
      playErrorSound();
    }
  };

  const handleTopup = async (amount, utr, screenshot) => {
    await addCoins(amount, utr, screenshot);
  };

  const handleWithdraw = async (amount, upi, name, number) => {
    await withdrawCoins(amount, upi, name, number);
  };

  const handleChangeName = async (newName) => {
    await changePlayerName(user?.uid, newName);
  };

  // ================= Handle Give Position =================
  const handleGivePosition = async (player, position, tournament) => {
    try {
      const resultRef = ref(database, "playerResults");
      await push(resultRef, {
        tournamentId: player.tournamentId,
        tournamentTitle: tournament?.tournamentTitle || player.tournamentTitle,
        userId: player.userId,
        playerName: player.ingameName,
        position: position,
        approved: true,
        approvedPosition: position,
        createdAt: new Date().toLocaleString(),
        givenBy: "admin",
        winCoins: 0,
      });

      const notifRef = ref(database, `notifications/${player.userId}`);
      await push(notifRef, {
        title: "🏆 POSITION ASSIGNED",
        message: `You got #${position} position in ${tournament?.tournamentTitle || player.tournamentTitle}!`,
        time: new Date().toLocaleString(),
        seen: false,
      });

      alert(`✅ Position #${position} given to ${player.ingameName} successfully!`);
      return true;
    } catch (error) {
      console.error("Error giving position:", error);
      alert("Failed to give position: " + error.message);
      return false;
    }
  };

  // ================= Result Approval Handlers =================
  const handleApproveResult = async (result) => {
    try {
      await update(ref(database, `playerResults/${result.id}`), {
        approved: true,
        approvedPosition: result.position,
      });
      alert(`✅ Position #${result.position} approved for ${result.playerName}`);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleRejectResult = async (result) => {
    try {
      await remove(ref(database, `playerResults/${result.id}`));
      alert(`❌ Result rejected for ${result.playerName}`);
    } catch (error) {
      alert(error.message);
    }
  };

  const calculatePrize = (position, prizePool, totalPlayers, tournamentType) => {
    const pool = Number(prizePool) || 0;
    const players = Number(totalPlayers) || 10;
    
    if (tournamentType === "SOLO") {
      if (players >= 40) {
        if (position === 1) return Math.floor(pool * 0.12);
        if (position === 2) return Math.floor(pool * 0.10);
        if (position === 3) return Math.floor(pool * 0.08);
        if (position >= 4 && position <= 5) return Math.floor(pool * 0.05);
        if (position >= 6 && position <= 10) return Math.floor(pool * 0.04);
        if (position >= 11 && position <= 15) return Math.floor(pool * 0.035);
        if (position >= 16 && position <= 20) return Math.floor(pool * 0.03);
        return 0;
      }
      else if (players >= 35) {
        if (position === 1) return Math.floor(pool * 0.12);
        if (position === 2) return Math.floor(pool * 0.10);
        if (position === 3) return Math.floor(pool * 0.08);
        if (position >= 4 && position <= 5) return Math.floor(pool * 0.05);
        if (position >= 6 && position <= 10) return Math.floor(pool * 0.04);
        if (position >= 11 && position <= 15) return Math.floor(pool * 0.04);
        if (position === 16) return Math.floor(pool * 0.03);
        return 0;
      }
      else if (players >= 30) {
        if (position === 1) return Math.floor(pool * 0.12);
        if (position === 2) return Math.floor(pool * 0.10);
        if (position === 3) return Math.floor(pool * 0.08);
        if (position >= 4 && position <= 5) return Math.floor(pool * 0.05);
        if (position >= 6 && position <= 10) return Math.floor(pool * 0.04);
        if (position >= 11 && position <= 14) return Math.floor(pool * 0.04);
        return 0;
      }
      else if (players >= 20) {
        if (position === 1) return Math.floor(pool * 0.20);
        if (position === 2) return Math.floor(pool * 0.15);
        if (position === 3) return Math.floor(pool * 0.10);
        if (position >= 4 && position <= 5) return Math.floor(pool * 0.08);
        if (position >= 6 && position <= 10) return Math.floor(pool * 0.04);
        return 0;
      }
      else if (players >= 15) {
        if (position === 1) return Math.floor(pool * 0.20);
        if (position === 2) return Math.floor(pool * 0.15);
        if (position === 3) return Math.floor(pool * 0.12);
        if (position === 4) return Math.floor(pool * 0.10);
        if (position === 5) return Math.floor(pool * 0.09);
        if (position === 6) return Math.floor(pool * 0.08);
        if (position === 7) return Math.floor(pool * 0.07);
        if (position === 8) return Math.floor(pool * 0.06);
        return 0;
      }
      else if (players >= 10) {
        if (position === 1) return Math.floor(pool * 0.30);
        if (position === 2) return Math.floor(pool * 0.25);
        if (position === 3) return Math.floor(pool * 0.20);
        if (position === 4) return Math.floor(pool * 0.15);
        if (position === 5) return Math.floor(pool * 0.10);
        return 0;
      }
      else {
        if (position === 1) return Math.floor(pool * 0.50);
        if (position === 2) return Math.floor(pool * 0.30);
        if (position === 3) return Math.floor(pool * 0.20);
        return 0;
      }
    }
    else if (tournamentType === "DUO") {
      if (players >= 48) {
        if (position === 1) return Math.floor((pool * 0.20) / 2);
        if (position === 2) return Math.floor((pool * 0.15) / 2);
        if (position === 3) return Math.floor((pool * 0.10) / 2);
        if (position >= 4 && position <= 5) return Math.floor((pool * 0.08) / 2);
        if (position >= 6 && position <= 10) return Math.floor((pool * 0.05) / 2);
        return 0;
      }
      else if (players >= 40) {
        if (position === 1) return Math.floor((pool * 0.22) / 2);
        if (position === 2) return Math.floor((pool * 0.16) / 2);
        if (position === 3) return Math.floor((pool * 0.12) / 2);
        if (position >= 4 && position <= 5) return Math.floor((pool * 0.09) / 2);
        if (position >= 6 && position <= 8) return Math.floor((pool * 0.06) / 2);
        return 0;
      }
      else if (players >= 30) {
        if (position === 1) return Math.floor((pool * 0.25) / 2);
        if (position === 2) return Math.floor((pool * 0.18) / 2);
        if (position === 3) return Math.floor((pool * 0.14) / 2);
        if (position >= 4 && position <= 6) return Math.floor((pool * 0.10) / 2);
        return 0;
      }
      else if (players >= 20) {
        if (position === 1) return Math.floor((pool * 0.40) / 2);
        if (position === 2) return Math.floor((pool * 0.30) / 2);
        if (position === 3) return Math.floor((pool * 0.20) / 2);
        if (position === 4) return Math.floor((pool * 0.10) / 2);
        return 0;
      }
      else {
        if (position === 1) return Math.floor((pool * 0.60) / 2);
        if (position === 2) return Math.floor((pool * 0.40) / 2);
        return 0;
      }
    }
    else if (tournamentType === "2V2") {
      return position === 1 ? Math.floor(pool / 2) : 0;
    }
    else if (tournamentType === "SQUAD") {
      if (players >= 48) {
        if (position === 1) return Math.floor((pool * 0.35) / 4);
        if (position === 2) return Math.floor((pool * 0.25) / 4);
        if (position === 3) return Math.floor((pool * 0.18) / 4);
        if (position === 4) return Math.floor((pool * 0.12) / 4);
        if (position === 5) return Math.floor((pool * 0.10) / 4);
        return 0;
      }
      else if (players >= 32) {
        if (position === 1) return Math.floor((pool * 0.40) / 4);
        if (position === 2) return Math.floor((pool * 0.30) / 4);
        if (position === 3) return Math.floor((pool * 0.20) / 4);
        if (position === 4) return Math.floor((pool * 0.10) / 4);
        return 0;
      }
      else if (players >= 24) {
        if (position === 1) return Math.floor((pool * 0.50) / 4);
        if (position === 2) return Math.floor((pool * 0.30) / 4);
        if (position === 3) return Math.floor((pool * 0.20) / 4);
        return 0;
      }
      else if (players >= 16) {
        if (position === 1) return Math.floor((pool * 0.60) / 4);
        if (position === 2) return Math.floor((pool * 0.40) / 4);
        return 0;
      }
      else {
        if (position === 1) return Math.floor((pool * 1.00) / 4);
        return 0;
      }
    }
    else if (tournamentType === "1V1") {
      return position === 1 ? pool : 0;
    }
    else if (tournamentType === "1V2") {
      return position === 1 || position === 2 ? Math.floor(pool / 2) : 0;
    }
    else if (tournamentType === "3V3") {
      return position === 1 ? Math.floor(pool / 3) : 0;
    }
    else if (tournamentType === "4V4") {
      return position === 1 ? Math.floor(pool / 4) : 0;
    }
    
    return 0;
  };

  const handlePublishFinalResults = async (tournament, approvedResults) => {
    if (approvedResults.length === 0) {
      alert("No approved results to publish!");
      return;
    }
    
    const totalPrizePool = Number(tournament.currentPrizePool) || Number(tournament.totalPrizePool) || 0;
    const totalPlayers = Number(tournament.joinedCount) || (joinedPlayers ? joinedPlayers.filter(p => p.tournamentId === tournament.id).length : 0) || 0;
    const tournamentType = tournament.tournamentType;
    
    const entryFee = Number(tournament.entryFee) || 0;
    const distribution = approvedResults.map(player => {
      let winCoins;
      if (tournamentType === "SOLO") {
        winCoins = getPrizeByPosition(totalPrizePool, Number(player.approvedPosition), totalPlayers, tournamentType, entryFee);
      } else {
        winCoins = calculatePrize(Number(player.approvedPosition), totalPrizePool, totalPlayers, tournamentType);
        if ((tournamentType === "DUO" || tournamentType === "SQUAD") && winCoins > 0) {
          winCoins = Math.max(winCoins, entryFee);
        }
      }
      return {
        ...player,
        winCoins
      };
    });
    
    let finalDistribution = distribution.filter(p => p.winCoins > 0);
    
    if (finalDistribution.length === 0) {
      alert("No winners in prize range!");
      return;
    }
    
    // Scale prizes for DUO/SQUAD if total exceeds prize pool due to minimum guarantee
    if (tournamentType === "DUO" || tournamentType === "SQUAD") {
      const minPrize = entryFee;
      let totalSpent = finalDistribution.reduce((sum, p) => sum + p.winCoins, 0);
      
      if (totalSpent > totalPrizePool) {
        let totalExtra = finalDistribution.reduce((sum, p) => sum + Math.max(0, p.winCoins - minPrize), 0);
        let allowedExtra = totalPrizePool - (finalDistribution.length * minPrize);
        
        if (allowedExtra < 0) {
          const equalShare = Math.floor(totalPrizePool / finalDistribution.length);
          let remainder = totalPrizePool % finalDistribution.length;
          finalDistribution.forEach((p, idx) => {
            p.winCoins = equalShare + (idx < remainder ? 1 : 0);
          });
        } else if (totalExtra > 0) {
          const scale = allowedExtra / totalExtra;
          let spent = finalDistribution.length * minPrize;
          
          finalDistribution.forEach(p => {
            const extra = Math.max(0, p.winCoins - minPrize);
            p.winCoins = minPrize + Math.floor(extra * scale);
            spent += Math.floor(extra * scale);
          });
          
          let remainder = totalPrizePool - spent;
          let idx = 0;
          while (remainder > 0 && idx < finalDistribution.length) {
            finalDistribution[idx].winCoins += 1;
            remainder--;
            idx++;
          }
        } else {
          const equalShare = Math.floor(totalPrizePool / finalDistribution.length);
          let remainder = totalPrizePool % finalDistribution.length;
          finalDistribution.forEach((p, idx) => {
            p.winCoins = equalShare + (idx < remainder ? 1 : 0);
          });
        }
      }
    }
    
    let previewMessage = "🏆 PRIZE DISTRIBUTION PREVIEW 🏆\n\n";
    previewMessage += `Tournament: ${tournament.tournamentTitle}\n`;
    previewMessage += `Prize Pool: 🪙 ${totalPrizePool}\n`;
    previewMessage += `Tournament Type: ${tournamentType}\n`;
    previewMessage += `Total Approved: ${approvedResults.length}\n`;
    previewMessage += `Winners: ${finalDistribution.length}\n\n`;
    previewMessage += "━━━━━━━━━━━━━━━━━━━━━━\n\n";
    
    let totalDistributed = 0;
    finalDistribution.forEach((player, index) => {
      const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🎮";
      previewMessage += `${medal} #${player.approvedPosition} ${player.playerName}: 🪙 ${player.winCoins}\n`;
      totalDistributed += player.winCoins;
    });
    
    previewMessage += "\n━━━━━━━━━━━━━━━━━━━━━━\n";
    previewMessage += `💰 Total Distributed: 🪙 ${totalDistributed} / ${totalPrizePool}\n`;
    previewMessage += `📊 Remaining: 🪙 ${totalPrizePool - totalDistributed}\n\n`;
    previewMessage += `Do you want to publish these results?`;
    
    if (!window.confirm(previewMessage)) {
      return;
    }
    
    try {
      for (const player of finalDistribution) {
        try {
          if (!player.userId) {
            console.warn(`Player ${player.playerName} has no userId`);
            continue;
          }
          const userRef = doc(db, "users", player.userId);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const currentCoins = userSnap.data()?.coins || 0;
            const currentWinCoins = userSnap.data()?.winCoins || 0;
            await updateDoc(userRef, {
              coins: currentCoins + player.winCoins,
              winCoins: currentWinCoins + player.winCoins,
              wins: increment(player.approvedPosition === 1 ? 1 : 0),
              top3: increment(player.approvedPosition <= 3 ? 1 : 0),
            });
            
            // Log to coin history
            await logCoinTransaction(
              player.userId,
              player.winCoins,
              "WINNING",
              `Won #${player.approvedPosition} in ${tournament.tournamentTitle}`,
              true
            );
          }
          
          await update(ref(database, `playerResults/${player.id}`), {
            winCoins: player.winCoins,
            prizeDistributed: true,
            distributedAt: new Date().toLocaleString(),
          });
          
          await push(ref(database, `notifications/${player.userId}`), {
            title: "🏆 MATCH REWARD RECEIVED",
            message: `You received 🪙 ${player.winCoins} from ${tournament.tournamentTitle} for #${player.approvedPosition} position!`,
            time: new Date().toLocaleString(),
            seen: false,
          });
        } catch (err) {
          console.error("Error distributing prize to player:", player, err);
        }
      }
      
      await push(ref(database, "matchResults"), {
        tournamentTitle: tournament.tournamentTitle,
        tournamentId: tournament.id,
        tournamentType: tournament.tournamentType,
        map: tournament.selectedMap,
        results: finalDistribution.map(p => ({
          name: p.playerName,
          playerName: p.playerName,
          position: p.approvedPosition,
          uid: p.userId,
          userId: p.userId,
          winCoins: p.winCoins
        })),
        totalPrizePool: totalPrizePool,
        totalDistributed: totalDistributed,
        createdAt: new Date().toLocaleString(),
        completed: true,
      });
      
      await update(ref(database, `liveTournaments/${tournament.id}`), {
        resultPublished: true,
        completed: true,
        prizeDistributed: true,
      });
      
      alert(`🎉 RESULTS PUBLISHED SUCCESSFULLY!\n\nTotal Prize Distributed: 🪙 ${totalDistributed}`);
      setShowResultPopup(false);
    } catch (error) {
      console.error("Publish error:", error);
      alert("Error publishing results: " + error.message);
    }
  };



  // ================= Maintenance Mode Check =================
  const isMaintenanceBypassed = user && maintenanceAllowedUsers && (maintenanceAllowedUsers.includes(user.email) || maintenanceAllowedUsers.includes(user.uid));
  
  if (maintenanceMode && !isAdmin && !isMaintenanceBypassed) {
    return (
      <>
        <MaintenanceMode 
          maintenanceMode={maintenanceMode} 
          maintenanceDuration={maintenanceDuration} 
          maintenanceEndsAt={maintenanceEndsAt} 
          onToggle={isAdmin ? toggleMaintenance : null} 
          onTestLogin={() => setShowLogin(true)}
        />
        {showLogin && <Login onClose={() => setShowLogin(false)} />}
      </>
    );
  }

  // ================= Loading Screen Check =================
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen text-white overflow-x-hidden font-sans relative">
      {/* Dynamic Theme Particles background */}
      <ThemeParticles />

      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-main"></div>
        <div className="absolute inset-0 bg-grid"></div>
        
        {/* Hide heavy animations on mobile to prevent lag */}
        <div className="hidden md:block">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
          <div className="orb orb-4"></div>
          <div className="orb orb-5"></div>
          <div className="orb orb-6"></div>
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          <div className="star star-1"></div>
          <div className="star star-2"></div>
          <div className="star star-3"></div>
          <div className="star star-4"></div>
          <div className="star star-5"></div>
          <div className="star star-6"></div>
          <div className="star star-7"></div>
          <div className="star star-8"></div>
          <div className="star star-9"></div>
          <div className="star star-10"></div>
          <div className="star star-11"></div>
          <div className="star star-12"></div>
          <div className="star star-13"></div>
          <div className="star star-14"></div>
          <div className="star star-15"></div>
          <div className="wave-bg"></div>
        </div>
      </div>

      {/* Navbar */}
      <Navbar
        user={user}
        coins={coins}
        notifications={notifications}
        isAdmin={isAdmin}
        isSuperAdmin={isSuperAdmin}
        isSoundMuted={isSoundMuted}
        toggleMute={toggleMute}
        onLogout={logoutUser}
        onShowTutorial={() => setShowTutorial(true)}
        onShowWallet={() => setShowWallet(true)}
        onShowContact={() => setShowContact(true)}
        onShowHistory={() => setShowHistory(true)}
        onShowPerKillHistory={() => setShowPerKillHistory(true)}
        onShowProfile={() => setShowProfile(true)}
        onShowNotifications={() => setShowNotifications(true)}
        onShowLogin={() => setShowLogin(true)}
        onShowRegister={() => setShowRegister(true)}
        onShowReferral={() => setShowReferral(true)}
        onShowLoyal={() => setShowLoyal(true)}
        onShowBonusWinners={() => setShowBonusWinners(true)}
        onShowBlocked={() => setShowBlockedUsers(true)}
        apkUrl={updateConfig?.updateUrl}
      />

      {/* Hero Section */}
      <Hero />
      <PromoCarousel />
      <ActivePoll user={user} />

      {/* Announcement Banner */}
      <AnnouncementBanner />

      {/* System Mode Switcher */}
      <div className="max-w-7xl mx-auto px-6 mb-8 flex flex-col items-center gap-4">
        <div className="bg-black/60 border border-orange-500/10 rounded-2xl p-1.5 flex flex-wrap sm:flex-nowrap gap-2 w-full max-w-2xl shadow-lg shadow-black/80">
          <button
            onClick={() => setCurrentSystemMode("classic")}
            className={`flex-1 py-3 px-2 sm:px-4 rounded-xl font-black text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 ${
              currentSystemMode === "classic"
                ? "bg-gradient-to-r from-orange-500 to-red-600 text-black shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            🏆 CLASSIC
          </button>
          <button
            onClick={() => setCurrentSystemMode("perkill")}
            className={`flex-1 py-3 px-2 sm:px-4 rounded-xl font-black text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 ${
              currentSystemMode === "perkill"
                ? "bg-gradient-to-r from-orange-500 to-red-600 text-black shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            ⚔️ PER KILL
          </button>
          <button
            onClick={() => setCurrentSystemMode("weekly")}
            className={`flex-1 py-3 px-2 sm:px-4 rounded-xl font-black text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 ${
              currentSystemMode === "weekly"
                ? "bg-gradient-to-r from-orange-500 to-red-600 text-black shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            📅 WEEKLY
          </button>
        </div>

        {/* Per Kill Mode sub-filter (Only shown when Per Kill Mode is active) */}
        {currentSystemMode === "perkill" && (
          <div className="flex bg-black/60 border border-orange-500/10 rounded-2xl p-1.5 gap-2 w-full max-w-xs shadow-lg shadow-black/80">
            {["SOLO", "DUO", "SQUAD"].map(mode => (
              <button
                key={mode}
                onClick={() => setSelectedPerKillMode(mode)}
                className={`flex-1 py-2 rounded-xl font-black text-xs transition-all duration-300 ${
                  selectedPerKillMode === mode 
                    ? "bg-gradient-to-r from-orange-500 to-red-600 text-black shadow-lg" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        )}
      </div>

      {currentSystemMode === "classic" && (
        <>
          {/* Game Modes */}
          <GameModes 
            selectedMode={selectedMode} 
            onModeChange={setSelectedMode} 
            onOtherGamesClick={() => setShowUpcomingGames(true)} 
          />

          {/* Tabs for Match Type (Upcoming / Live) */}
          <div className="max-w-7xl mx-auto px-4 md:px-6 my-4 flex justify-center">
            <div className="bg-black/50 backdrop-blur-md p-1.5 rounded-2xl flex gap-2 w-full max-w-sm border border-white/5">
              <button 
                onClick={() => setActiveMatchTab("UPCOMING")}
                className={`flex-1 py-3 rounded-xl font-bold text-sm md:text-base transition-all duration-300 ${activeMatchTab === "UPCOMING" ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
              >
                UPCOMING
              </button>
              <button 
                onClick={() => setActiveMatchTab("LIVE")}
                className={`flex-1 py-3 rounded-xl font-bold text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-2 ${activeMatchTab === "LIVE" ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/20" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
              >
                {activeMatchTab === "LIVE" && <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>}
                LIVE
              </button>
            </div>
          </div>

          {/* Matches Content Based on Tab */}
          {activeMatchTab === "UPCOMING" ? (
            <UpcomingMatches
              tournaments={liveTournaments}
              selectedMode={selectedMode}
              joinedPlayers={joinedPlayers}
              user={user}
              isAdmin={isAdmin}
              onJoin={(tournament) => {
                setSelectedTournament(tournament);
                setShowJoinPopup(true);
              }}
              joinLoading={joinLoading}
              onCancel={cancelTournament}
              onEditTime={updateTournamentTime}
              onEditSlots={updateTournamentSlots}
              onViewPlayers={() => {}}
            />
          ) : (
            <LiveMatches
              tournaments={liveTournaments}
              joinedPlayers={joinedPlayers}
              user={user}
              isAdmin={isAdmin}
              onPublishRoom={publishRoomDetails}
              onCancelMatch={cancelTournament}
              onPublishResult={(tournament) => {
                setSelectedPublishTournament(tournament);
                setShowResultPopup(true);
              }}
              onGivePosition={handleGivePosition}
              playerResults={playerResults}
            />
          )}
        </>
      )}
      
      {currentSystemMode === "perkill" && (
        <>
          {/* Tabs for Match Type (Upcoming / Live) for Per Kill */}
          <div className="max-w-7xl mx-auto px-4 md:px-6 my-4 flex justify-center">
            <div className="bg-black/50 backdrop-blur-md p-1.5 rounded-2xl flex gap-2 w-full max-w-sm border border-white/5">
              <button 
                onClick={() => setActiveMatchTab("UPCOMING")}
                className={`flex-1 py-3 rounded-xl font-bold text-sm md:text-base transition-all duration-300 ${activeMatchTab === "UPCOMING" ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
              >
                UPCOMING
              </button>
              <button 
                onClick={() => setActiveMatchTab("LIVE")}
                className={`flex-1 py-3 rounded-xl font-bold text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-2 ${activeMatchTab === "LIVE" ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/20" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
              >
                {activeMatchTab === "LIVE" && <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>}
                LIVE
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeMatchTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeMatchTab === "UPCOMING" ? (
                <UpcomingPerKillMatches
                  tournaments={livePerKillTournaments}
                  joinedPlayers={joinedPerKillPlayers}
                  user={user}
                  isAdmin={isAdmin}
                  onJoin={async (...args) => {
                    const success = await joinPerKillTournament(...args);
                    if (success) playSuccessSound();
                    else playErrorSound();
                    return success;
                  }}
                  joinLoading={perKillJoinLoading}
                  selectedMode={selectedPerKillMode}
                  matchResults={perKillMatchResults}
                  onCancel={cancelPerKillTournament}
                  onEditTime={updatePerKillTournamentTime}
                  onEditSlots={updatePerKillTournamentSlots}
                />
              ) : (
                <LivePerKillMatches
                  tournaments={livePerKillTournaments}
                  joinedPlayers={joinedPerKillPlayers}
                  user={user}
                  isAdmin={isAdmin}
                  onPublishRoom={publishPerKillRoomDetails}
                  onCancelMatch={cancelPerKillTournament}
                  onPublishResult={async (...args) => {
                    const success = await publishPerKillResults(...args);
                    if (success) playSuccessSound();
                    else playErrorSound();
                    return success;
                  }}
                  selectedMode={selectedPerKillMode}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}

      {currentSystemMode === "weekly" && (
        <WeeklyDashboard 
          user={user} 
          isAdmin={isAdmin} 
          weeklyTournaments={weeklyTournaments} 
          joinWeeklyTournament={joinWeeklyTournament} 
          updateStatus={updateStatus}
        />
      )}



      {/* Leaderboard and TournamentWinners temporarily disabled to prevent excessive Firestore reads */}
      {/* {!isAdmin && <Leaderboard />} */}
      {/* {!isAdmin && <TournamentWinners />} */}
      
      {/* Admin Sections */}
      {isAdmin && (
        <>
          <AdminAnalytics 
            analytics={analytics} 
            allUsers={allUsers}
            joinedPlayers={joinedPlayers}
            migrateWinnings={migrateWinnings} 
            migrateSingleUserWinnings={migrateSingleUserWinnings} 
            onAddCoins={addManualCoins}
            onGiveLoyalBonus={giveLoyalBonus}
          />

          {/* Admin Weekly Tournaments Dashboard */}
          <div className="max-w-7xl mx-auto px-6 mb-8">
            <AdminWeeklyDashboard 
              weeklyTournaments={weeklyTournaments} 
              createWeeklyTournament={createWeeklyTournament} 
              updateStatus={updateStatus} 
              updateTeamRank={updateTeamRank} 
              cancelWeeklyTournament={cancelWeeklyTournament}
              updateRoomDetails={updateRoomDetails}
              distributeWeeklyRewards={distributeWeeklyRewards}
              generateLobbies={generateLobbies}
              updateLobbyDetails={updateLobbyDetails}
              advancePhase={advancePhase}
              updateTournamentRules={updateTournamentRules}
            />
          </div>

          {/* Result Analytics */}
          {!showResultAnalyticsPopup ? (
            <div className="flex justify-center mb-10 px-6">
              <button
                onClick={() => setShowResultAnalyticsPopup(true)}
                className="w-full max-w-md bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white px-8 py-6 rounded-3xl font-black text-2xl md:text-3xl transition-all duration-300 shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:shadow-[0_0_50px_rgba(239,68,68,0.5)] cyber-neon cyber-btn border border-red-500/50"
              >
                📊 RESULT ANALYTICS
              </button>
            </div>
          ) : (
            <div className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl overflow-y-auto p-4 md:p-8">
              <div className="bg-[#0a0a0a] border border-red-500/30 rounded-3xl p-6 md:p-10 max-w-7xl w-full mx-auto relative shadow-[0_0_100px_rgba(239,68,68,0.15)] mt-10 mb-20 animate-fade-in-up">
                
                <button 
                  onClick={() => setShowResultAnalyticsPopup(false)}
                  className="absolute top-4 right-4 md:top-6 md:right-6 bg-red-500 hover:bg-red-600 text-white w-12 h-12 rounded-2xl font-black text-xl transition-all flex items-center justify-center z-50 shadow-lg shadow-red-500/20"
                >
                  ✕
                </button>

                <h2 className="text-4xl md:text-5xl font-black text-red-400 cyber-neon text-center md:text-left mb-12 pt-8 md:pt-0">
                  📊 RESULT ANALYTICS
                </h2>
                
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="bg-[#111] rounded-3xl p-6 border border-orange-500/10 cyber-card hover:border-orange-500/30 transition-colors">
                    <p className="text-gray-400 font-medium">Total Submitted</p>
                    <h3 className="text-5xl font-black text-orange-500 mt-4">{resultAnalytics.totalSubmitted}</h3>
                  </div>
                  <div className="bg-[#111] rounded-3xl p-6 border border-green-500/10 cyber-card hover:border-green-500/30 transition-colors">
                    <p className="text-gray-400 font-medium">Approved Results</p>
                    <h3 className="text-5xl font-black text-green-400 mt-4">{resultAnalytics.totalApproved}</h3>
                  </div>
                  <div className="bg-[#111] rounded-3xl p-6 border border-yellow-500/10 cyber-card hover:border-yellow-500/30 transition-colors">
                    <p className="text-gray-400 font-medium">Pending Results</p>
                    <h3 className="text-5xl font-black text-yellow-400 mt-4">{resultAnalytics.pendingResults}</h3>
                  </div>
                  <div className="bg-[#111] rounded-3xl p-6 border border-purple-500/10 cyber-card hover:border-purple-500/30 transition-colors">
                    <p className="text-gray-400 font-medium">Prize Distributed</p>
                    <h3 className="text-5xl font-black text-purple-400 mt-4 cyber-prize">🪙 {resultAnalytics.totalPrizeDistributed}</h3>
                  </div>
                </div>

                <div className="mt-12 text-center">
                  <button 
                    onClick={() => setShowResultAnalyticsPopup(false)}
                    className="bg-gray-800 hover:bg-gray-700 text-white px-10 py-3 rounded-2xl font-bold transition-all"
                  >
                    Close Analytics Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Admin Panel Header & Switcher */}
          <div className="max-w-7xl mx-auto px-6 mb-8 mt-12 text-center relative z-20">
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
              {isSuperAdmin ? "SUPER ADMIN DASHBOARD" : "STAFF DASHBOARD"}
            </h1>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {isSuperAdmin && (
                <>
                  <button onClick={() => setShowTopupAdminPopup(true)} className={`px-4 py-3 rounded-2xl font-black text-sm md:text-base cyber-btn transition-all flex-1 min-w-[140px] max-w-[200px] text-center ${showTopupAdminPopup ? "bg-orange-500 text-black" : "bg-black text-white border border-orange-500/20"}`}>🚀 TOPUP REQUESTS </button>
                  <button onClick={() => setShowWithdrawAdminPopup(true)} className={`px-4 py-3 rounded-2xl font-black text-sm md:text-base cyber-btn transition-all flex-1 min-w-[140px] max-w-[200px] text-center ${showWithdrawAdminPopup ? "bg-green-500 text-black" : "bg-black text-white border border-green-500/20"}`}>💸 WITHDRAW REQUESTS </button>
                </>
              )}
              <button onClick={() => setAdminPage("create")} className={`px-4 py-3 rounded-2xl font-black text-sm md:text-base cyber-btn transition-all flex-1 min-w-[140px] max-w-[200px] text-center ${adminPage === "create" ? "bg-blue-500 text-black" : "bg-black text-white border border-blue-500/20"}`}>🎯 CREATE MATCH</button>
              <button onClick={() => setAdminPage("results")} className={`px-4 py-3 rounded-2xl font-black text-sm md:text-base cyber-btn transition-all flex-1 min-w-[140px] max-w-[200px] text-center ${adminPage === "results" ? "bg-purple-500 text-black" : "bg-black text-white border border-purple-500/20"}`}>🏆 RESULT HISTORY</button>
              <button onClick={() => setAdminPage("perkill_create")} className={`px-4 py-3 rounded-2xl font-black text-sm md:text-base cyber-btn transition-all flex-1 min-w-[140px] max-w-[200px] text-center ${adminPage === "perkill_create" ? "bg-orange-600 text-black" : "bg-black text-white border border-orange-600/20"}`}>🔥 PER KILL CREATE</button>
              <button onClick={() => setAdminPage("perkill_results")} className={`px-4 py-3 rounded-2xl font-black text-sm md:text-base cyber-btn transition-all flex-1 min-w-[140px] max-w-[200px] text-center ${adminPage === "perkill_results" ? "bg-red-600 text-black" : "bg-black text-white border border-red-600/20"}`}>💀 PER KILL CONTROL</button>
              <button onClick={() => setAdminPage("users")} className={`px-4 py-3 rounded-2xl font-black text-sm md:text-base cyber-btn transition-all flex-1 min-w-[140px] max-w-[200px] text-center ${adminPage === "users" ? "bg-pink-500 text-black" : "bg-black text-white border border-pink-500/20"}`}>👥 USER CONTROL</button>
              
              {isSuperAdmin && (
                <>
                  <button onClick={() => setAdminPage("coins")} className={`px-4 py-3 rounded-2xl font-black text-sm md:text-base cyber-btn transition-all flex-1 min-w-[140px] max-w-[200px] text-center ${adminPage === "coins" ? "bg-yellow-500 text-black" : "bg-black text-white border border-yellow-500/20"}`}>💰 MANUAL COINS</button>
                  <button onClick={() => setAdminPage("maintenance")} className={`px-4 py-3 rounded-2xl font-black text-sm md:text-base cyber-btn transition-all flex-1 min-w-[140px] max-w-[200px] text-center ${adminPage === "maintenance" ? "bg-red-500 text-black" : "bg-black text-white border border-red-500/20"}`}>🚧 MAINTENANCE</button>
                  <button onClick={() => setAdminPage("announcements")} className={`px-4 py-3 rounded-2xl font-black text-sm md:text-base cyber-btn transition-all flex-1 min-w-[140px] max-w-[200px] text-center ${adminPage === "announcements" ? "bg-cyan-500 text-black" : "bg-black text-white border border-cyan-500/20"}`}>📢 ANNOUNCEMENTS</button>
                  <button onClick={() => setAdminPage("app_update")} className={`px-4 py-3 rounded-2xl font-black text-sm md:text-base cyber-btn transition-all flex-1 min-w-[140px] max-w-[200px] text-center ${adminPage === "app_update" ? "bg-blue-400 text-black" : "bg-black text-white border border-blue-400/20"}`}>📥 APP UPDATE</button>
                  <button onClick={() => setAdminPage("staff")} className={`px-4 py-3 rounded-2xl font-black text-sm md:text-base cyber-btn transition-all flex-1 min-w-[140px] max-w-[200px] text-center ${adminPage === "staff" ? "bg-purple-600 text-white" : "bg-black text-white border border-purple-600/20"}`}>👨‍💼 STAFF MANAGE</button>
                  <button onClick={() => setAdminPage("promos")} className={`px-4 py-3 rounded-2xl font-black text-sm md:text-base cyber-btn transition-all flex-1 min-w-[140px] max-w-[200px] text-center ${adminPage === "promos" ? "bg-orange-500 text-black" : "bg-black text-white border border-orange-500/20"}`}>🖼️ PROMO BANNERS</button>
                  <button onClick={() => setAdminPage("polls")} className={`px-4 py-3 rounded-2xl font-black text-sm md:text-base cyber-btn transition-all flex-1 min-w-[140px] max-w-[200px] text-center ${adminPage === "polls" ? "bg-cyan-500 text-black" : "bg-black text-white border border-cyan-500/20"}`}>📊 MANAGE POLLS</button>
                  <button onClick={() => setShowWelcomeBonus(true)} className={`px-4 py-3 rounded-2xl font-black text-sm md:text-base cyber-btn transition-all flex-1 min-w-[140px] max-w-[200px] text-center bg-black text-white border border-green-400/30 hover:bg-green-500/20`}>🎫 TEST SCRATCH CARD</button>
                </>
              )}
            </div>
          </div>


          {adminPage === "create" && <CreateTournament onCreateTournament={createTournament} />}
          {adminPage === "results" && <MatchResults matchResults={matchResults} isAdmin={isAdmin} joinedPlayers={joinedPlayers} user={user} onDeleteMatchResult={deleteMatchHistory} onDeleteAllMatchResults={() => deleteMatchHistory("ALL")} playerResults={playerResults} />}
          {adminPage === "perkill_create" && <CreatePerKillTournament onCreateTournament={createPerKillTournament} />}
          {adminPage === "perkill_results" && <PerKillMatchResults isAdmin={isAdmin} liveTournaments={livePerKillTournaments} joinedPlayers={joinedPerKillPlayers} matchResults={perKillMatchResults} publishResults={publishPerKillResults} cancelTournament={cancelPerKillTournament} publishRoomDetails={publishPerKillRoomDetails} updateTournamentTime={updatePerKillTournamentTime} onDeleteMatchResult={deletePerKillMatchHistory} onDeleteAllMatchResults={deleteAllPerKillMatchHistory} />}
          {adminPage === "users" && <UserProfileCheck allUsers={allUsers} onSearchUser={searchUser} searchedUser={searchedUser} onBlockUser={blockUser} onAddCoins={addManualCoins} onDeductCoins={deductManualCoins} isSuperAdmin={isSuperAdmin} />}
          
          {isSuperAdmin && (
            <>
              {adminPage === "coins" && <ManualCoins onAddCoins={addManualCoins} />}
              {adminPage === "maintenance" && <MaintenanceMode maintenanceMode={maintenanceMode} maintenanceDuration={maintenanceDuration} maintenanceEndsAt={maintenanceEndsAt} onToggle={toggleMaintenance} allowedUsers={maintenanceAllowedUsers} onUpdateAllowedUsers={updateMaintenanceAllowedUsers} />}
              {adminPage === "announcements" && <AdminAnnouncements />}
              {adminPage === "app_update" && <AppUpdateAdmin />}
              {adminPage === "staff" && <StaffManagement />}
              {adminPage === "promos" && <AdminPromos liveTournaments={liveTournaments} livePerKillTournaments={livePerKillTournaments} />}
              {adminPage === "polls" && <AdminPolls />}
            </>
          )}

        </>
      )}

      {/* Popups */}
      {showUpdatePopup && <AppUpdatePopup updateConfig={updateConfig} isForceUpdate={isForceUpdate} onClose={() => setShowUpdatePopup(false)} />}
      {showWelcomeBonus && <WelcomeScratchCard onClaim={handleClaimWelcomeBonus} onClose={() => setHasPostponedWelcomeBonus(true)} />}
      {showLogin && <LoginPopup onClose={() => setShowLogin(false)} onLogin={loginUser} onForgotPassword={forgotPassword} loginLoading={loginLoading} />}
      {showRegister && <RegisterPopup onClose={() => setShowRegister(false)} onRegister={registerUser} registerLoading={registerLoading} registerBlocked={registerBlocked} />}
      {showWallet && <WalletPopup user={user} coins={coins} winCoins={winCoins} onClose={() => setShowWallet(false)} onTopup={handleTopup} onShowWithdraw={() => { setShowWallet(false); setShowWithdrawPopup(true); }} onShowCoinHistory={() => { setShowWallet(false); setShowCoinHistory(true); }} paymentRequests={paymentRequests} buttonLoading={buttonLoading} transferCoins={transferCoins} verifyRecipient={verifyRecipient} />}
      {showWithdrawPopup && <WithdrawPopup user={user} playerData={playerData} coins={coins} winCoins={winCoins} onClose={() => setShowWithdrawPopup(false)} onWithdraw={handleWithdraw} withdrawRequests={withdrawRequests} withdrawLoading={withdrawLoading} />}
      {showCoinHistory && <CoinHistoryPopup user={user} currentCoins={coins} closePopup={() => setShowCoinHistory(false)} />}
      
      {showTopupAdminPopup && <PaymentRequests paymentRequests={paymentRequests} onApprovePayment={approvePayment} onRejectPayment={rejectPayment} onDeletePayment={deletePaymentRequests} onClose={() => setShowTopupAdminPopup(false)} />}
      {showWithdrawAdminPopup && <WithdrawRequests withdrawRequests={withdrawRequests} onApproveWithdraw={approveWithdraw} onRejectWithdraw={rejectWithdraw} onDeleteWithdraw={deleteWithdrawRequests} onClose={() => setShowWithdrawAdminPopup(false)} />}
      
      {showProfile && <ProfilePopup user={user} playerData={playerData} coins={coins} onClose={() => setShowProfile(false)} onChangeName={handleChangeName} onChangePassword={changePassword} />}

      {/* Referral Popup */}
      {showReferral && <ReferralPopup user={user} onClose={() => setShowReferral(false)} />}
      
      {/* Upcoming Games Popup */}
      {showUpcomingGames && <UpcomingGamesPopup onClose={() => setShowUpcomingGames(false)} />}
      
      {/* Loyal Users Top 10 Popup */}
      {showLoyal && (
        <UserActivityPopup
          allUsers={allUsers}
          joinedPlayers={joinedPlayers}
          onClose={() => setShowLoyal(false)}
          isAdmin={false}
          currentUser={user}
        />
      )}
      
      {/* Top 10 Bonus Winners Popup */}
      {showBonusWinners && (
        <BonusWinnersPopup onClose={() => setShowBonusWinners(false)} isAdmin={isAdmin} />
      )}
      
      {showBlockedUsers && (
        <BlockedUsersPopup onClose={() => setShowBlockedUsers(false)} />
      )}

      {/* Custom Offline Block Popup */}
      {offlineBlockedUser && (
        <OfflineBlockPopup onClose={() => setOfflineBlockedUser(false)} />
      )}
      
      {showHistory && <HistoryPopup user={user} joinedHistory={joinedHistory} playerResults={playerResults} matchResults={matchResults} onClose={() => setShowHistory(false)} onDeleteHistory={() => deleteAllUserMatchHistory(user?.email)} onDeleteMatch={deleteMatchHistory} userStats={userStats} />}
      {showPerKillHistory && <PerKillHistoryPopup user={user} joinedHistory={joinedPerKillPlayers} matchResults={perKillMatchResults} onClose={() => setShowPerKillHistory(false)} onDeleteHistory={deleteAllPerKillMatchHistory} onDeleteMatch={deletePerKillMatchHistory} />}
      {showContact && <ContactPopup onClose={() => setShowContact(false)} />}
      {showTutorial && <TutorialPopup onClose={() => setShowTutorial(false)} />}
      {showNotifications && (
        <NotificationsPopup 
          notifications={notifications} 
          user={user} 
          onClose={() => setShowNotifications(false)} 
          onClearAll={clearAllNotifications} 
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          isSoundMuted={isSoundMuted}
          onToggleMute={toggleMute}
        />
      )}
      {showJoinPopup && selectedTournament && <JoinPopup tournament={selectedTournament} user={user} joinedPlayers={joinedPlayers} onJoin={handleJoinTournament} joinLoading={joinLoading} onClose={() => { setShowJoinPopup(false); setSelectedTournament(null); }} />}

      {/* Result Approval Popup */}
      {showResultPopup && selectedPublishTournament && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 px-4">
          <div className="bg-[#0a0a0f] w-full max-w-5xl rounded-3xl p-6 border border-purple-500/20 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-purple-500/20">
              <h2 className="text-3xl font-black text-purple-400 cyber-neon">🏆 RESULT APPROVAL PANEL</h2>
              <button onClick={() => { setShowResultPopup(false); setSelectedPublishTournament(null); }} className="bg-red-500 text-white px-5 py-2 rounded-2xl font-black">CLOSE</button>
            </div>
            <div className="mb-6 p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20">
              <p className="text-orange-400 font-bold">🎮 Tournament: {selectedPublishTournament.tournamentTitle}</p>
              <p className="text-blue-400">🗺️ Map: {selectedPublishTournament.selectedMap}</p>
              <p className="text-yellow-400">💰 Prize Pool: 🪙 {selectedPublishTournament.currentPrizePool}</p>
            </div>
            
            {/* Pending Requests */}
            <div className="mb-8">
              <h3 className="text-2xl font-black text-orange-400 mb-4">📥 PENDING POSITION REQUESTS</h3>
              <div className="space-y-4">
                {playerResults.filter((result) => result.tournamentId === selectedPublishTournament.id && !result.approved).map((player) => (
                  <div key={player.id} className="bg-black/50 rounded-2xl p-5 border border-orange-500/20">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-orange-400 font-black text-xl">{player.playerName}</p>
                        <p className="text-white mt-2">🏆 Submitted Position: <span className="text-yellow-400 font-bold">#{player.position}</span></p>
                        <p className="text-gray-500 text-sm mt-1">🕒 {player.createdAt}</p>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => handleApproveResult(player)} className="bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded-2xl font-black cyber-btn">✅ APPROVE</button>
                        <button onClick={() => handleRejectResult(player)} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl font-black cyber-btn">❌ REJECT</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {playerResults.filter(r => r.tournamentId === selectedPublishTournament.id && !r.approved).length === 0 && <div className="text-center py-8 bg-black/30 rounded-2xl"><p className="text-gray-400">✨ No pending requests ✨</p></div>}
            </div>
            
            {/* Approved Players */}
            <div className="mb-8">
              <h3 className="text-2xl font-black text-green-400 mb-4">✅ APPROVED PLAYERS</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {playerResults.filter((result) => result.tournamentId === selectedPublishTournament.id && result.approved).sort((a, b) => Number(a.approvedPosition) - Number(b.approvedPosition)).map((player) => (
                  <div key={player.id} className="bg-green-500/10 rounded-2xl p-4 border border-green-500/20 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {Number(player.approvedPosition) === 1 && <span className="text-2xl">🥇</span>}
                        {Number(player.approvedPosition) === 2 && <span className="text-2xl">🥈</span>}
                        {Number(player.approvedPosition) === 3 && <span className="text-2xl">🥉</span>}
                        <p className="text-green-400 font-black text-lg">{player.playerName}</p>
                      </div>
                      <p className="text-white">🏆 Position: <span className="text-yellow-400 font-bold">#{player.approvedPosition}</span></p>
                    </div>
                    <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-full"><span className="text-green-400">✅</span><span className="text-green-400 text-sm font-bold">VERIFIED</span></div>
                  </div>
                ))}
              </div>
              {playerResults.filter(r => r.tournamentId === selectedPublishTournament.id && r.approved).length === 0 && <div className="text-center py-8 bg-black/30 rounded-2xl"><p className="text-gray-400">⚠️ No approved players yet</p></div>}
            </div>
            {/* Final Publish Button */}
            <button onClick={() => handlePublishFinalResults(selectedPublishTournament, playerResults.filter(r => r.tournamentId === selectedPublishTournament.id && r.approved))} disabled={playerResults.filter(r => r.tournamentId === selectedPublishTournament.id && r.approved).length === 0} className={`w-full py-4 rounded-2xl font-black text-xl transition-all duration-300 ${playerResults.filter(r => r.tournamentId === selectedPublishTournament.id && r.approved).length === 0 ? "bg-gray-600 cursor-not-allowed" : "bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white"}`}>
              🏆 FINAL PUBLISH RESULT
            </button>
          </div>
        </div>
      )}
      
      {/* Theme Switcher */}
      <ThemeSwitcher />

      {/* Zoom Control */}
      <ZoomControl />

      {/* Floating Refresh Button for WebViews/APKs */}
      <button
        onClick={() => window.location.reload()}
        className="fixed bottom-6 right-6 z-[999] w-12 h-12 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 hover:border-white/30 shadow-2xl flex items-center justify-center text-xl transition-all duration-300 hover:scale-110 active:scale-95"
        title="Refresh App"
      >
        🔄
      </button>

      {/* Admin Calculator Widget */}
      {isAdmin && (
        <>
          {/* Floating Button */}
          {!showCalculator && (
            <button
              onClick={() => setShowCalculator(true)}
              className="fixed bottom-24 right-6 z-[999] bg-orange-500 hover:bg-orange-600 text-black w-14 h-14 rounded-full font-black text-2xl shadow-[0_0_20px_rgba(249,115,22,0.4)] flex items-center justify-center transition-transform hover:scale-110"
            >
              🧮
            </button>
          )}
          {/* Calculator Widget */}
          {showCalculator && (
            <CalculatorWidget onClose={() => setShowCalculator(false)} />
          )}
        </>
      )}

      {/* Footer */}
      <Footer />

      {/* Background Music - Bottom Right Corner */}

    </div>
  );
}