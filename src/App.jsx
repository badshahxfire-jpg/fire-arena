import "./App.css";
import { useState, useEffect, useRef } from "react";
import { ref, update, remove, push, get } from "firebase/database";
import { database, db } from "./firebase";
import { doc, updateDoc, increment, getDoc } from "firebase/firestore";
import { App as CapApp } from "@capacitor/app";

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

// Admin Components
import AdminAnalytics from "./components/Admin/AdminAnalytics";
import PaymentRequests from "./components/Admin/PaymentRequests";
import WithdrawRequests from "./components/Admin/WithdrawRequests";
import CreateTournament from "./components/Admin/CreateTournament";
import MatchResults from "./components/Admin/MatchResults";
import UserProfileCheck from "./components/Admin/UserProfileCheck";
import MaintenanceMode from "./components/Admin/MaintenanceMode";
import CoinHistoryPopup from "./components/Popups/CoinHistoryPopup";
import UpcomingGamesPopup from "./components/Popups/UpcomingGamesPopup";
import ManualCoins from "./components/Admin/ManualCoins";
import AdminMatchResults from "./components/Admin/AdminMatchResults";

// Per Kill System Components & Hook (Isolated)
import { usePerKillTournaments } from "./hooks/usePerKillTournaments";
import CreatePerKillTournament from "./components/Admin/CreatePerKillTournament";
import PerKillMatchResults from "./components/Admin/PerKillMatchResults";
import UpcomingPerKillMatches from "./components/UpcomingPerKillMatches";
import LivePerKillMatches from "./components/LivePerKillMatches";
import AnnouncementBanner from "./components/AnnouncementBanner";
import AdminAnnouncements from "./components/Admin/AdminAnnouncements";
import ThemeSwitcher from "./components/ThemeSwitcher";

const ADMIN_UID = "FAVc9zfAgoYs1d1BDr2EoDwSw0x1";


export default function FireBaadshahArena() {
  // ================= UI State =================
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showWithdrawPopup, setShowWithdrawPopup] = useState(false);
  const [showCoinHistory, setShowCoinHistory] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPerKillHistory, setShowPerKillHistory] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [showLoyal, setShowLoyal] = useState(false);
  const [showBonusWinners, setShowBonusWinners] = useState(false);
  const [showJoinPopup, setShowJoinPopup] = useState(false);
  const [showUpcomingGames, setShowUpcomingGames] = useState(false);
  const [selectedMode, setSelectedMode] = useState("SOLO");
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [adminPage, setAdminPage] = useState("users");
  const [showTopupAdminPopup, setShowTopupAdminPopup] = useState(false);
  const [showWithdrawAdminPopup, setShowWithdrawAdminPopup] = useState(false);
  
  // Result Popup States
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [selectedPublishTournament, setSelectedPublishTournament] = useState(null);
  const [currentSystemMode, setCurrentSystemMode] = useState("classic"); // "classic" or "perkill"
  const [selectedPerKillMode, setSelectedPerKillMode] = useState("SOLO");

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
    selectedPublishTournament
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.Capacitor) {
      const handlerPromise = CapApp.addListener("backButton", (data) => {
        const s = stateRef.current;
        if (!s) return;

        // Close popups one by one if they are open
        if (s.showLogin) { setShowLogin(false); return; }
        if (s.showRegister) { setShowRegister(false); return; }
        if (s.showWallet) { setShowWallet(false); return; }
        if (s.showWithdrawPopup) { setShowWithdrawPopup(false); return; }
        if (s.showCoinHistory) { setShowCoinHistory(false); return; }
        if (s.showProfile) { setShowProfile(false); return; }
        if (s.showHistory) { setShowHistory(false); return; }
        if (s.showPerKillHistory) { setShowPerKillHistory(false); return; }
        if (s.showContact) { setShowContact(false); return; }
        if (s.showTutorial) { setShowTutorial(false); return; }
        if (s.showNotifications) { setShowNotifications(false); return; }
        if (s.showReferral) { setShowReferral(false); return; }
        if (s.showLoyal) { setShowLoyal(false); return; }
        if (s.showBonusWinners) { setShowBonusWinners(false); return; }
        if (s.showJoinPopup) { setShowJoinPopup(false); return; }
        if (s.showUpcomingGames) { setShowUpcomingGames(false); return; }
        if (s.showTopupAdminPopup) { setShowTopupAdminPopup(false); return; }
        if (s.showWithdrawAdminPopup) { setShowWithdrawAdminPopup(false); return; }
        if (s.showResultPopup) { setShowResultPopup(false); return; }
        if (s.selectedTournament) { setSelectedTournament(null); return; }
        if (s.selectedPublishTournament) { setSelectedPublishTournament(null); return; }

        // If no modal/popup is open, try to navigate back or close
        if (data.canGoBack) {
          window.history.back();
        } else {
          CapApp.exitApp();
        }
      });

      return () => {
        handlerPromise.then((h) => h.remove());
      };
    }
  }, []);


  // ================= Custom Hooks =================
  const {
    user,
    isAdmin,
    loginUser,
    registerUser,
    logoutUser,
    forgotPassword,
    changePlayerName,
    loginLoading,
    registerLoading,
    registerBlocked,  // Add this for device registration block
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
  } = usePerKillTournaments();

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
  } = useTournaments();


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
  } = useWallet(user);

  const {
    notifications,
    unseenCount,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    isSoundMuted,
    toggleMute,
  } = useNotifications(user);

  const {
    analytics,
    allUsers,
    maintenanceMode,
    maintenanceDuration,
    maintenanceEndsAt,
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

  // ================= Handler Functions =================
  const handleJoinTournament = async (tournament, joinData) => {
    const success = await joinTournament(tournament, user, coins, joinData, selectedTournament);
    if (success) {
      setShowJoinPopup(false);
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
      if (position === 1) return Math.floor((pool * 0.40) / 2);
      if (position === 2) return Math.floor((pool * 0.30) / 2);
      if (position === 3) return Math.floor((pool * 0.20) / 2);
      if (position === 4) return Math.floor((pool * 0.10) / 2);
      return 0;
    }
    else if (tournamentType === "2V2") {
      return position === 1 ? Math.floor(pool / 2) : 0;
    }
    else if (tournamentType === "SQUAD") {
      if (position === 1) return Math.floor((pool * 0.50) / 4);
      if (position === 2) return Math.floor((pool * 0.30) / 4);
      if (position === 3) return Math.floor((pool * 0.20) / 4);
      return 0;
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
        if (tournamentType === "DUO" && winCoins > 0) {
          winCoins = Math.max(winCoins, entryFee + 5);
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
    
    // Scale prizes for DUO if total exceeds prize pool
    if (tournamentType === "DUO") {
      const minPrize = entryFee + 5;
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
  if (maintenanceMode && !isAdmin) {
    return <MaintenanceMode maintenanceMode={maintenanceMode} maintenanceDuration={maintenanceDuration} maintenanceEndsAt={maintenanceEndsAt} onToggle={isAdmin ? toggleMaintenance : null} />;
  }

  return (
    <div className="min-h-screen text-white overflow-x-hidden font-sans relative">
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
      />

      {/* Hero Section */}
      {/* Announcement Banner */}
      <AnnouncementBanner />

      <Hero />

      {/* System Mode Switcher */}
      <div className="max-w-7xl mx-auto px-6 mb-8 flex flex-col items-center gap-4">
        <div className="bg-black/60 border border-orange-500/10 rounded-2xl p-1.5 flex gap-2 w-full max-w-md shadow-lg shadow-black/80">
          <button
            onClick={() => setCurrentSystemMode("classic")}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              currentSystemMode === "classic"
                ? "bg-gradient-to-r from-orange-500 to-red-600 text-black shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            🏆 CLASSIC MATCHES
          </button>
          <button
            onClick={() => setCurrentSystemMode("perkill")}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              currentSystemMode === "perkill"
                ? "bg-gradient-to-r from-orange-500 to-red-600 text-black shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            ⚔️ PER KILL MODE
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

      {currentSystemMode === "classic" ? (
        <>
          {/* Game Modes */}
          <GameModes 
            selectedMode={selectedMode} 
            onModeChange={setSelectedMode} 
            onOtherGamesClick={() => setShowUpcomingGames(true)} 
          />

          {/* Upcoming Matches */}
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

          {/* Live Matches */}
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
        </>
      ) : (
        <>
          {/* Upcoming Per Kill Matches */}
          <UpcomingPerKillMatches
            tournaments={livePerKillTournaments}
            joinedPlayers={joinedPerKillPlayers}
            user={user}
            isAdmin={isAdmin}
            onJoin={joinPerKillTournament}
            joinLoading={perKillJoinLoading}
            selectedMode={selectedPerKillMode}
            matchResults={perKillMatchResults}
            onCancel={cancelPerKillTournament}
            onEditTime={updatePerKillTournamentTime}
            onEditSlots={updatePerKillTournamentSlots}
          />

          {/* Live Per Kill Matches */}
          <LivePerKillMatches
            tournaments={livePerKillTournaments}
            joinedPlayers={joinedPerKillPlayers}
            user={user}
            selectedMode={selectedPerKillMode}
          />
        </>
      )}



      {!isAdmin && <Leaderboard />}
      {!isAdmin && <TournamentWinners />}
      
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

          {/* Result Analytics */}
          <section className="max-w-7xl mx-auto px-6 py-10">
            <h2 className="text-5xl font-black text-red-400 mb-10 cyber-neon">📊 RESULT ANALYTICS</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-[#111] rounded-3xl p-6 border border-orange-500/10 cyber-card">
                <p className="text-gray-400">Total Submitted</p>
                <h3 className="text-4xl font-black text-orange-500 mt-4">{resultAnalytics.totalSubmitted}</h3>
              </div>
              <div className="bg-[#111] rounded-3xl p-6 border border-green-500/10 cyber-card">
                <p className="text-gray-400">Approved Results</p>
                <h3 className="text-4xl font-black text-green-400 mt-4">{resultAnalytics.totalApproved}</h3>
              </div>
              <div className="bg-[#111] rounded-3xl p-6 border border-yellow-500/10 cyber-card">
                <p className="text-gray-400">Pending Results</p>
                <h3 className="text-4xl font-black text-yellow-400 mt-4">{resultAnalytics.pendingResults}</h3>
              </div>
              <div className="bg-[#111] rounded-3xl p-6 border border-purple-500/10 cyber-card">
                <p className="text-gray-400">Prize Distributed</p>
                <h3 className="text-4xl font-black text-purple-400 mt-4 cyber-prize">🪙 {resultAnalytics.totalPrizeDistributed}</h3>
              </div>
            </div>
          </section>
          
          {/* Admin Tabs */}
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <button onClick={() => setShowTopupAdminPopup(true)} className={`px-4 py-3 rounded-2xl font-black text-sm md:text-base cyber-btn transition-all flex-1 min-w-[140px] max-w-[200px] text-center ${showTopupAdminPopup ? "bg-orange-500 text-black" : "bg-black text-white border border-orange-500/20"}`}>📥 TOPUP REQUESTS </button>
              <button onClick={() => setShowWithdrawAdminPopup(true)} className={`px-4 py-3 rounded-2xl font-black text-sm md:text-base cyber-btn transition-all flex-1 min-w-[140px] max-w-[200px] text-center ${showWithdrawAdminPopup ? "bg-green-500 text-black" : "bg-black text-white border border-green-500/20"}`}>📤 WITHDRAW REQUESTS </button>
              <button onClick={() => setAdminPage("create")} className={`px-4 py-3 rounded-2xl font-black text-sm md:text-base cyber-btn transition-all flex-1 min-w-[140px] max-w-[200px] text-center ${adminPage === "create" ? "bg-blue-500 text-black" : "bg-black text-white border border-blue-500/20"}`}>🎮 CREATE MATCH</button>
              <button onClick={() => setAdminPage("results")} className={`px-4 py-3 rounded-2xl font-black text-sm md:text-base cyber-btn transition-all flex-1 min-w-[140px] max-w-[200px] text-center ${adminPage === "results" ? "bg-purple-500 text-black" : "bg-black text-white border border-purple-500/20"}`}>🏆 RESULT HISTORY</button>
              <button onClick={() => setAdminPage("perkill_create")} className={`px-4 py-3 rounded-2xl font-black text-sm md:text-base cyber-btn transition-all flex-1 min-w-[140px] max-w-[200px] text-center ${adminPage === "perkill_create" ? "bg-orange-600 text-black" : "bg-black text-white border border-orange-600/20"}`}>⚔️ PER KILL CREATE</button>
              <button onClick={() => setAdminPage("perkill_results")} className={`px-4 py-3 rounded-2xl font-black text-sm md:text-base cyber-btn transition-all flex-1 min-w-[140px] max-w-[200px] text-center ${adminPage === "perkill_results" ? "bg-red-600 text-black" : "bg-black text-white border border-red-600/20"}`}>🎯 PER KILL CONTROL</button>
              <button onClick={() => setAdminPage("users")} className={`px-4 py-3 rounded-2xl font-black text-sm md:text-base cyber-btn transition-all flex-1 min-w-[140px] max-w-[200px] text-center ${adminPage === "users" ? "bg-pink-500 text-black" : "bg-black text-white border border-pink-500/20"}`}>👤 USER CONTROL</button>
              <button onClick={() => setAdminPage("coins")} className={`px-4 py-3 rounded-2xl font-black text-sm md:text-base cyber-btn transition-all flex-1 min-w-[140px] max-w-[200px] text-center ${adminPage === "coins" ? "bg-yellow-500 text-black" : "bg-black text-white border border-yellow-500/20"}`}>🪙 MANUAL COINS</button>
              <button onClick={() => setAdminPage("maintenance")} className={`px-4 py-3 rounded-2xl font-black text-sm md:text-base cyber-btn transition-all flex-1 min-w-[140px] max-w-[200px] text-center ${adminPage === "maintenance" ? "bg-red-500 text-black" : "bg-black text-white border border-red-500/20"}`}>🚧 MAINTENANCE</button>
              <button onClick={() => setAdminPage("announcements")} className={`px-4 py-3 rounded-2xl font-black text-sm md:text-base cyber-btn transition-all flex-1 min-w-[140px] max-w-[200px] text-center ${adminPage === "announcements" ? "bg-cyan-500 text-black" : "bg-black text-white border border-cyan-500/20"}`}>📢 ANNOUNCEMENTS</button>
            </div>
          </div>


          {adminPage === "create" && <CreateTournament onCreateTournament={createTournament} />}
          {adminPage === "results" && <MatchResults matchResults={matchResults} isAdmin={isAdmin} joinedPlayers={joinedPlayers} user={user} onDeleteMatchResult={deleteMatchHistory} onDeleteAllMatchResults={() => deleteMatchHistory("ALL")} playerResults={playerResults} />}
          {adminPage === "perkill_create" && <CreatePerKillTournament onCreateTournament={createPerKillTournament} />}
          {adminPage === "perkill_results" && <PerKillMatchResults isAdmin={isAdmin} liveTournaments={livePerKillTournaments} joinedPlayers={joinedPerKillPlayers} matchResults={perKillMatchResults} publishResults={publishPerKillResults} cancelTournament={cancelPerKillTournament} publishRoomDetails={publishPerKillRoomDetails} updateTournamentTime={updatePerKillTournamentTime} onDeleteMatchResult={deletePerKillMatchHistory} onDeleteAllMatchResults={deleteAllPerKillMatchHistory} />}
          {adminPage === "users" && <UserProfileCheck onSearchUser={searchUser} searchedUser={searchedUser} onBlockUser={blockUser} onAddCoins={addManualCoins} onDeductCoins={deductManualCoins} />}
          {adminPage === "coins" && <ManualCoins onAddCoins={addManualCoins} />}
          {adminPage === "maintenance" && <MaintenanceMode maintenanceMode={maintenanceMode} maintenanceDuration={maintenanceDuration} maintenanceEndsAt={maintenanceEndsAt} onToggle={toggleMaintenance} />}
          {adminPage === "announcements" && <AdminAnnouncements />}

        </>
      )}

      {/* Popups */}
      {showLogin && <LoginPopup onClose={() => setShowLogin(false)} onLogin={loginUser} onForgotPassword={forgotPassword} loginLoading={loginLoading} />}
      {showRegister && <RegisterPopup onClose={() => setShowRegister(false)} onRegister={registerUser} registerLoading={registerLoading} registerBlocked={registerBlocked} />}
      {showWallet && <WalletPopup user={user} coins={coins} winCoins={winCoins} onClose={() => setShowWallet(false)} onTopup={handleTopup} onShowWithdraw={() => { setShowWallet(false); setShowWithdrawPopup(true); }} onShowCoinHistory={() => { setShowWallet(false); setShowCoinHistory(true); }} paymentRequests={paymentRequests} buttonLoading={buttonLoading} transferCoins={transferCoins} verifyRecipient={verifyRecipient} />}
      {showWithdrawPopup && <WithdrawPopup user={user} coins={coins} winCoins={winCoins} onClose={() => setShowWithdrawPopup(false)} onWithdraw={handleWithdraw} withdrawRequests={withdrawRequests} withdrawLoading={withdrawLoading} />}
      {showCoinHistory && <CoinHistoryPopup user={user} closePopup={() => setShowCoinHistory(false)} />}
      
      {showTopupAdminPopup && <PaymentRequests paymentRequests={paymentRequests} onApprovePayment={approvePayment} onRejectPayment={rejectPayment} onDeletePayment={deletePaymentRequests} onClose={() => setShowTopupAdminPopup(false)} />}
      {showWithdrawAdminPopup && <WithdrawRequests withdrawRequests={withdrawRequests} onApproveWithdraw={approveWithdraw} onRejectWithdraw={rejectWithdraw} onDeleteWithdraw={deleteWithdrawRequests} onClose={() => setShowWithdrawAdminPopup(false)} />}
      
      {showProfile && <ProfilePopup user={user} playerData={playerData} coins={coins} onClose={() => setShowProfile(false)} onChangeName={handleChangeName} />}

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
        <BonusWinnersPopup onClose={() => setShowBonusWinners(false)} />
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
      {showJoinPopup && selectedTournament && <JoinPopup tournament={selectedTournament} user={user} joinedPlayers={joinedPlayers} onJoin={handleJoinTournament} joinLoading={joinLoading} onClose={() => setShowJoinPopup(false)} />}

      {/* Result Approval Popup */}
      {showResultPopup && selectedPublishTournament && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 px-4">
          <div className="bg-[#0a0a0f] w-full max-w-5xl rounded-3xl p-6 border border-purple-500/20 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-purple-500/20">
              <h2 className="text-3xl font-black text-purple-400 cyber-neon">🏆 RESULT APPROVAL PANEL</h2>
              <button onClick={() => setShowResultPopup(false)} className="bg-red-500 text-white px-5 py-2 rounded-2xl font-black">CLOSE</button>
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

      {/* Footer */}
      <Footer />

      {/* Background Music - Bottom Right Corner */}

    </div>
  );
}