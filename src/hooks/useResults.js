import { useState, useEffect } from "react";
import { ref, onValue, push, update, remove, get } from "firebase/database";
import { database } from "../firebase";
import { doc, updateDoc, increment, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getPrizeByPosition } from "../utils/prizeDistribution";

export function useResults() {
  const [playerResults, setPlayerResults] = useState([]);
  const [resultLoading, setResultLoading] = useState(false);
  const [resultAnalytics, setResultAnalytics] = useState({
    totalSubmitted: 0,
    totalApproved: 0,
    totalRejected: 0,
    pendingResults: 0,
    totalPrizeDistributed: 0,
    top1Player: "",
    top2Player: "",
    top3Player: "",
  });

  // Fetch Player Results from Firebase
  useEffect(() => {
    const resultsRef = ref(database, "playerResults");
    
    const unsubscribe = onValue(resultsRef, (snapshot) => {
      const data = snapshot.val();
      
      if (data) {
        const loadedData = Object.keys(data).map((key) => ({ 
          id: key, 
          ...data[key],
          approved: data[key].approved || false,
          approvedPosition: data[key].approvedPosition || null,
          winCoins: data[key].winCoins || 0
        }));
        
        setPlayerResults(loadedData);
        
        // Calculate Analytics
        const approved = loadedData.filter((item) => item.approved === true);
        const pending = loadedData.filter((item) => !item.approved);
        
        const top1 = approved.find((item) => Number(item.approvedPosition) === 1);
        const top2 = approved.find((item) => Number(item.approvedPosition) === 2);
        const top3 = approved.find((item) => Number(item.approvedPosition) === 3);
        
        const totalPrize = approved.reduce((total, item) => total + Number(item.winCoins || 0), 0);
        
        setResultAnalytics({
          totalSubmitted: loadedData.length,
          totalApproved: approved.length,
          totalRejected: 0,
          pendingResults: pending.length,
          totalPrizeDistributed: totalPrize,
          top1Player: top1?.playerName || "",
          top2Player: top2?.playerName || "",
          top3Player: top3?.playerName || "",
        });
      } else {
        setPlayerResults([]);
        setResultAnalytics({
          totalSubmitted: 0,
          totalApproved: 0,
          totalRejected: 0,
          pendingResults: 0,
          totalPrizeDistributed: 0,
          top1Player: "",
          top2Player: "",
          top3Player: "",
        });
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Submit Player Result (by players)
  const submitResult = async (tournamentId, tournamentTitle, userId, playerName, position, screenshot) => {
    if (resultLoading) return false;
    setResultLoading(true);
    
    try {
      if (!position || !screenshot) {
        alert("Please fill all details and upload screenshot");
        return false;
      }

      // Send to Telegram
      const formData = new FormData();
      formData.append("chat_id", "5948674075");
      formData.append("photo", screenshot);
      formData.append("caption", `🏆 RESULT SUBMISSION\n\n👤 Player: ${playerName}\n🎮 Tournament: ${tournamentTitle}\n📍 Position: #${position}`);

      await fetch(`https://dawn-firefly-d1ba.sohrabk502.workers.dev/bot8623121660:AAHxymJn6WWf5wGtASxT0o3xOJE7Lw188OI/sendPhoto`, {
        method: "POST",
        body: formData,
      });

      // Save to Firebase
      const resultRef = ref(database, "playerResults");
      await push(resultRef, {
        tournamentId,
        tournamentTitle,
        userId,
        playerName,
        position: Number(position),
        screenshot: "TELEGRAM",
        createdAt: new Date().toLocaleString(),
        approved: false,
        approvedPosition: null,
        winCoins: 0,
      });

      alert("Result Submitted Successfully 🔥");
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    } finally {
      setResultLoading(false);
    }
  };

  // Approve Result (by Admin)
  const approveResult = async (resultId, position, tournamentId, tournamentTitle, playerId, playerName) => {
    try {
      await update(ref(database, `playerResults/${resultId}`), {
        approved: true,
        approvedPosition: Number(position),
      });
      
      // Send notification to player
      const notifRef = ref(database, `notifications/${playerId}`);
      await push(notifRef, {
        title: "✅ RESULT APPROVED",
        message: `Your position #${position} in ${tournamentTitle} has been approved!`,
        time: new Date().toLocaleString(),
        seen: false,
      });
      
      alert(`Position #${position} approved for ${playerName} 🔥`);
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    }
  };

  // Reject Result (by Admin)
  const rejectResult = async (resultId, playerId, tournamentTitle) => {
    try {
      await remove(ref(database, `playerResults/${resultId}`));
      
      // Send notification to player
      const notifRef = ref(database, `notifications/${playerId}`);
      await push(notifRef, {
        title: "❌ RESULT REJECTED",
        message: `Your result submission for ${tournamentTitle} has been rejected.`,
        time: new Date().toLocaleString(),
        seen: false,
      });
      
      alert("Result Rejected ❌");
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    }
  };

  // Calculate Prize Money based on position and tournament type
  const calculatePrize = (position, tournamentType, prizePool, totalPlayers) => {
    let winCoins = 0;
    const pool = Number(prizePool);
    
    if (tournamentType === "SOLO") {
      let winnerCount = 3;
      if (totalPlayers >= 40) winnerCount = 20;
      else if (totalPlayers >= 35) winnerCount = 16;
      else if (totalPlayers >= 30) winnerCount = 14;
      else if (totalPlayers >= 20) winnerCount = 10;
      else if (totalPlayers >= 15) winnerCount = 8;
      else if (totalPlayers >= 10) winnerCount = 5;
      
      if (position > winnerCount) return 0;
      
      if (winnerCount === 5) {
        if (position === 1) winCoins = Math.floor(pool * 0.30);
        else if (position === 2) winCoins = Math.floor(pool * 0.25);
        else if (position === 3) winCoins = Math.floor(pool * 0.20);
        else if (position === 4) winCoins = Math.floor(pool * 0.15);
        else if (position === 5) winCoins = Math.floor(pool * 0.10);
      } else if (winnerCount === 8) {
        if (position === 1) winCoins = Math.floor(pool * 0.20);
        else if (position === 2) winCoins = Math.floor(pool * 0.15);
        else if (position === 3) winCoins = Math.floor(pool * 0.12);
        else if (position === 4) winCoins = Math.floor(pool * 0.10);
        else if (position === 5) winCoins = Math.floor(pool * 0.09);
        else if (position === 6) winCoins = Math.floor(pool * 0.08);
        else if (position === 7) winCoins = Math.floor(pool * 0.07);
        else if (position === 8) winCoins = Math.floor(pool * 0.06);
      } else if (winnerCount === 10) {
        if (position === 1) winCoins = Math.floor(pool * 0.20);
        else if (position === 2) winCoins = Math.floor(pool * 0.15);
        else if (position === 3) winCoins = Math.floor(pool * 0.10);
        else if (position >= 4 && position <= 5) winCoins = Math.floor(pool * 0.08);
        else if (position >= 6 && position <= 10) winCoins = Math.floor(pool * 0.04);
      } else if (winnerCount === 14) {
        if (position === 1) winCoins = Math.floor(pool * 0.12);
        else if (position === 2) winCoins = Math.floor(pool * 0.10);
        else if (position === 3) winCoins = Math.floor(pool * 0.08);
        else if (position >= 4 && position <= 5) winCoins = Math.floor(pool * 0.05);
        else if (position >= 6 && position <= 10) winCoins = Math.floor(pool * 0.04);
        else if (position >= 11 && position <= 14) winCoins = Math.floor(pool * 0.035);
      } else if (winnerCount === 16) {
        if (position === 1) winCoins = Math.floor(pool * 0.12);
        else if (position === 2) winCoins = Math.floor(pool * 0.10);
        else if (position === 3) winCoins = Math.floor(pool * 0.08);
        else if (position >= 4 && position <= 5) winCoins = Math.floor(pool * 0.05);
        else if (position >= 6 && position <= 10) winCoins = Math.floor(pool * 0.04);
        else if (position >= 11 && position <= 15) winCoins = Math.floor(pool * 0.035);
        else if (position === 16) winCoins = Math.floor(pool * 0.03);
      } else if (winnerCount === 20) {
        if (position === 1) winCoins = Math.floor(pool * 0.12);
        else if (position === 2) winCoins = Math.floor(pool * 0.10);
        else if (position === 3) winCoins = Math.floor(pool * 0.08);
        else if (position >= 4 && position <= 5) winCoins = Math.floor(pool * 0.05);
        else if (position >= 6 && position <= 10) winCoins = Math.floor(pool * 0.04);
        else if (position >= 11 && position <= 15) winCoins = Math.floor(pool * 0.035);
        else if (position >= 16 && position <= 20) winCoins = Math.floor(pool * 0.03);
      }
    } else if (tournamentType === "DUO") {
      if (position === 1) winCoins = Math.floor((pool * 0.40) / 2);
      else if (position === 2) winCoins = Math.floor((pool * 0.30) / 2);
      else if (position === 3) winCoins = Math.floor((pool * 0.20) / 2);
      else if (position === 4) winCoins = Math.floor((pool * 0.10) / 2);
    } else if (tournamentType === "2V2") {
      if (position === 1) winCoins = Math.floor(pool / 2);
    } else if (tournamentType === "SQUAD") {
      if (position === 1) winCoins = Math.floor((pool * 0.50) / 4);
      else if (position === 2) winCoins = Math.floor((pool * 0.30) / 4);
      else if (position === 3) winCoins = Math.floor((pool * 0.20) / 4);
    } else if (tournamentType === "4V4") {
      if (position === 1) winCoins = Math.floor(pool / 4);
    } else if (tournamentType === "3V3") {
      if (position === 1) winCoins = Math.floor(pool / 3);
    } else if (tournamentType === "1V1") {
      if (position === 1) winCoins = pool;
    } else if (tournamentType === "1V2") {
      if (position === 1) winCoins = Math.floor(pool / 2);
    }
    
    return winCoins;
  };

  // Publish Final Results and Distribute Prizes
  const publishFinalResults = async (tournament, approvedPlayers, currentPrizePool) => {
    setResultLoading(true);
    
    try {
      if (!approvedPlayers || approvedPlayers.length === 0) {
        alert("No approved players to publish results!");
        return false;
      }

      const tournamentId = tournament.id;
      const tournamentTitle = tournament.tournamentTitle;
      const tournamentType = tournament.tournamentType;
      const totalPlayers = Number(tournament.joinedCount) || 10;
      const prizePool = Number(currentPrizePool) || 0;
      
      // Get unique winners (one per user)
      const uniqueWinners = [];
      const seenUsers = new Set();
      
      for (const player of approvedPlayers) {
        if (!seenUsers.has(player.userId) && player.approvedPosition) {
          seenUsers.add(player.userId);
          uniqueWinners.push(player);
        }
      }
      
      // Sort by position
      uniqueWinners.sort((a, b) => Number(a.approvedPosition) - Number(b.approvedPosition));
      
      // Calculate and distribute prizes
      for (const player of uniqueWinners) {
        const position = Number(player.approvedPosition);
        let winCoins;
        if (tournamentType === "SOLO") {
          winCoins = getPrizeByPosition(prizePool, position, totalPlayers, tournamentType, Number(tournament.entryFee) || 0);
        } else {
          winCoins = calculatePrize(position, tournamentType, prizePool, totalPlayers);
        }
        
        if (winCoins > 0) {
          // Update user wallet
          const userRef = doc(db, "users", player.userId);
          const userSnap = await getDoc(userRef);
          const currentCoins = userSnap.data()?.coins || 0;
          const currentWins = userSnap.data()?.wins || 0;
          const currentTop3 = userSnap.data()?.top3 || 0;
          const currentWinCoins = userSnap.data()?.winCoins || 0;
          
          await updateDoc(userRef, {
            coins: currentCoins + winCoins,
            winCoins: currentWinCoins + winCoins,
            wins: currentWins + (position === 1 ? 1 : 0),
            top3: currentTop3 + (position <= 3 ? 1 : 0),
          });
          
          // Update player result with win coins
          await update(ref(database, `playerResults/${player.id}`), {
            winCoins: winCoins,
          });
          
          // Send notification
          const notifRef = ref(database, `notifications/${player.userId}`);
          await push(notifRef, {
            title: "🏆 PRIZE DISTRIBUTED",
            message: `Congratulations! You won ${winCoins} coins for #${position} position in ${tournamentTitle}!`,
            time: new Date().toLocaleString(),
            seen: false,
          });
        }
      }
      
      // Save match result
      const matchResultRef = ref(database, "matchResults");
      await push(matchResultRef, {
        tournamentId: tournamentId,
        tournamentTitle: tournamentTitle,
        tournamentType: tournamentType,
        map: tournament.selectedMap,
        results: uniqueWinners.map(p => ({
          userId: p.userId,
          uid: p.userId,
          playerName: p.playerName,
          name: p.playerName,
          position: p.approvedPosition,
          winCoins: tournamentType === "SOLO"
            ? getPrizeByPosition(prizePool, Number(p.approvedPosition), totalPlayers, tournamentType, Number(tournament.entryFee) || 0)
            : calculatePrize(p.approvedPosition, tournamentType, prizePool, totalPlayers),
        })),
        createdAt: new Date().toLocaleString(),
        completed: true,
      });
      
      // Mark tournament as completed
      await update(ref(database, `liveTournaments/${tournamentId}`), {
        resultPublished: true,
        completed: true,
      });
      
      alert("🏆 RESULTS PUBLISHED AND PRIZES DISTRIBUTED SUCCESSFULLY!");
      return true;
    } catch (error) {
      console.error("Error publishing results:", error);
      alert("Error publishing results: " + error.message);
      return false;
    } finally {
      setResultLoading(false);
    }
  };

  // Get results by tournament
  const getResultsByTournament = (tournamentId) => {
    return playerResults.filter(result => result.tournamentId === tournamentId);
  };

  // Get approved results by tournament
  const getApprovedResultsByTournament = (tournamentId) => {
    return playerResults.filter(result => result.tournamentId === tournamentId && result.approved === true);
  };

  // Get pending results by tournament
  const getPendingResultsByTournament = (tournamentId) => {
    return playerResults.filter(result => result.tournamentId === tournamentId && !result.approved);
  };

  return {
    playerResults,
    resultAnalytics,
    resultLoading,
    submitResult,
    approveResult,
    rejectResult,
    publishFinalResults,
    getResultsByTournament,
    getApprovedResultsByTournament,
    getPendingResultsByTournament,
  };
}