import { useState, useEffect, useRef } from "react";
import { ref, onValue, push, update, remove, get, query, orderByChild, equalTo } from "firebase/database";
import { doc, updateDoc, increment, getDoc } from "firebase/firestore";
import { database, db } from "../firebase";
import { logCoinTransaction } from "../utils/coinHistory";
import { secureFetch } from "../utils/backendApi";

const deductUserCoins = async (userId, amount, tournamentId = "", tournamentTitle = "", isRefund = false, winCoinsRefund = 0) => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const currentCoins = userSnap.data().coins || 0;
    const currentWinCoins = userSnap.data().winCoins || 0;
    
    let newCoins, newWinCoins;
    if (isRefund) {
      newCoins = currentCoins - amount;
      newWinCoins = currentWinCoins + winCoinsRefund;
    } else {
      newCoins = currentCoins - amount;
      newWinCoins = Math.min(currentWinCoins, newCoins);
    }
    
    await updateDoc(userRef, { coins: newCoins, winCoins: newWinCoins });
    
    const displayTitle = tournamentTitle || `#${tournamentId}`;
    if (isRefund) {
      await logCoinTransaction(userId, Math.abs(amount), "MATCH_CANCEL", `Refund for cancelled Match: ${displayTitle}`, true);
    } else {
      await logCoinTransaction(userId, amount, "MATCH_JOIN", `Joined Match: ${displayTitle}`, false);
    }
  }
};

export function useTournaments(user) {
  const [liveTournaments, setLiveTournaments] = useState([]);
  const [joinedPlayers, setJoinedPlayers] = useState([]);
  const [joinedHistory, setJoinedHistory] = useState([]);
  const [matchResults, setMatchResults] = useState([]);
  const [joinLoading, setJoinLoading] = useState(false);
  const isProcessingRef = useRef(false);

  // Fetch Live Tournaments
  useEffect(() => {
    if (!user) return;
    const liveRef = ref(database, "liveTournaments");
    onValue(liveRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedData = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        const filteredData = loadedData.filter(item => item.completed !== true && item.completed !== "true");
        // Sort by matchTime (ascending - nearest match first)
        const sortedData = filteredData.sort((a, b) => new Date(a.matchTime) - new Date(b.matchTime));
        setLiveTournaments(sortedData);
      } else {
        setLiveTournaments([]);
      }
    });
  }, [user]);

  // Fetch Joined Players
  useEffect(() => {
    if (!user) return;
    const joinedRef = ref(database, "joinedPlayers");
    onValue(joinedRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedData = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        setJoinedPlayers(loadedData);
        setJoinedHistory(loadedData);
      } else {
        setJoinedPlayers([]);
        setJoinedHistory([]);
      }
    });
  }, [user]);

  // Fetch Match Results
  useEffect(() => {
    if (!user) return;
    const resultRef = ref(database, "matchResults");
    onValue(resultRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedData = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        setMatchResults(loadedData);
      } else {
        setMatchResults([]);
      }
    });
  }, [user]);

  // Check if user is already in any team for this tournament
  const isUserAlreadyInTeam = async (tournamentId, userId) => {
    const joinedRef = query(ref(database, "joinedPlayers"), orderByChild("tournamentId"), equalTo(tournamentId));
    const snapshot = await get(joinedRef);
    const data = snapshot.val();
    if (data) {
      for (const key in data) {
        const player = data[key];
        if (player.tournamentId === tournamentId) {
          // Check if user is leader
          if (player.userId === userId) return true;
          // Check if user is in teamMembers
          if (player.teamMembers && Array.isArray(player.teamMembers)) {
            if (player.teamMembers.some(member => member.userId === userId)) return true;
          }
        }
      }
    }
    return false;
  };

  // Check teammate coins before joining
  const checkTeammateCoins = async (teammateUserId, requiredCoins, teammateName) => {
    try {
      const userRef = doc(db, "users", teammateUserId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        return { hasEnough: false, currentCoins: 0, error: `Teammate ${teammateName} (${teammateUserId}) not found in system!` };
      }
      
      const coins = userSnap.data()?.coins || 0;
      if (coins < requiredCoins) {
        return { hasEnough: false, currentCoins: coins, error: `Teammate ${teammateName} has insufficient coins! Needs ${requiredCoins}, has ${coins}.` };
      }
      
      return { hasEnough: true, currentCoins: coins, error: null };
    } catch (error) {
      return { hasEnough: false, currentCoins: 0, error: `Error checking teammate ${teammateName}: ${error.message}` };
    }
  };

  // ================= REFERRAL CHECK ON TOURNAMENT JOIN =================
  const checkReferralOnTournamentJoin = async (userId) => {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;
      
      const userData = userSnap.data();
      const referredBy = userData.referredBy;
      
      if (!referredBy) return;
      
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
      
      const newTournamentsCount = (referralRecord.newUserTournamentsJoined || 0) + 1;
      
      await update(ref(database, `referrals/${referralId}`), {
        newUserTournamentsJoined: newTournamentsCount
      });
      
      const minTournamentsJoined = 3;
      if (newTournamentsCount >= minTournamentsJoined && referralRecord.status === "pending") {
        const referrerBonus = 20;
        const referrerId = referralRecord.referrerId;
        
        await updateDoc(doc(db, "users", referrerId), {
          coins: increment(referrerBonus),
          "referralStats.completedReferrals": increment(1),
          "referralStats.pendingReferrals": increment(-1),
          "referralStats.totalEarned": increment(referrerBonus)
        });
        
        await logCoinTransaction(referrerId, referrerBonus, "REFERRAL_BONUS", `Referral completed by user joining 3 matches`, true);
        
        await update(ref(database, `referrals/${referralId}`), {
          status: "completed",
          completedBy: "tournaments",
          referrerBonus: referrerBonus,
          completedAt: new Date().toLocaleString()
        });
        
        await push(ref(database, `notifications/${referrerId}`), {
          title: "💰 REFERRAL BONUS EARNED!",
          message: `Your referral ${referralRecord.newUserName} joined ${newTournamentsCount} tournaments! You got ${referrerBonus} bonus coins!`,
          time: new Date().toLocaleString(),
          seen: false,
        });
        
        console.log(`Referral completed via tournaments: ${referralId}`);
      }
      
    } catch (error) {
      console.error("Error checking referral on tournament join:", error);
    }
  };

  // Join Tournament
  const joinTournament = async (tournament, user, coins, joinData, selectedTournament) => {
    if (joinLoading) return;
    setJoinLoading(true);
    
    try {
      if (!user) {
        alert("Login Required");
        return false;
      }

      const tournamentType = tournament.tournamentType || "SOLO";
      const entryFee = Number(tournament.entryFee);
      const teamMembers = joinData.teamMembers || [];

      // Fetch latest joined players from database to prevent race conditions
      const playersSnapshot = await get(query(ref(database, "joinedPlayers"), orderByChild("tournamentId"), equalTo(tournament.id)));
      const playersVal = playersSnapshot.val() || {};
      const latestJoinedPlayers = Object.keys(playersVal).map(key => ({ id: key, ...playersVal[key] }));
      
      // ================= SOLO MODE =================
      if (tournamentType === "SOLO" || tournamentType === "1V1") {
        if (!joinData.mobileNumber || !joinData.gameUid || !joinData.ingameName || !joinData.gameLevel || !joinData.selectedSlot) {
          alert("Fill All Details");
          setJoinLoading(false);
          return false;
        }

        if (Number(joinData.gameLevel) < 45) {
          alert("Minimum Level 45 Required ❌");
          setJoinLoading(false);
          return false;
        }

        const slotBooked = latestJoinedPlayers.some(
          (player) => player.tournamentId === tournament.id && Number(player.selectedSlot) === Number(joinData.selectedSlot)
        );
        if (slotBooked) {
          alert("This slot is already booked! Please select another one ❌");
          setJoinLoading(false);
          return false;
        }

        const alreadyJoined = latestJoinedPlayers.find(
          (player) => player.tournamentId === tournament.id && player.userEmail === user.email
        );

        if (alreadyJoined) {
          alert("You Already Joined This Tournament ❌");
          setJoinLoading(false);
          return false;
        }

        if (Number(coins) < entryFee) {
          alert("Insufficient Coins ❌");
          setJoinLoading(false);
          return false;
        }

        const res = await secureFetch("/api/join-tournament", {
          tournamentId: tournament.id,
          tournamentTitle: tournament.tournamentTitle,
          entryFee: entryFee,
          selectedSlot: joinData.selectedSlot,
          totalSlots: tournament.totalTeams
        });
        const winCoinsDeducted = res?.deductions?.[user.uid]?.winCoinsDeducted || 0;
        const bookedSlot = res?.bookedSlot || joinData.selectedSlot;

        await push(ref(database, "joinedPlayers"), {
          tournamentId: tournament.id,
          tournamentTitle: tournament.tournamentTitle,
          tournamentType: tournamentType,
          userEmail: user.email,
          userId: user.uid,
          mobileNumber: joinData.mobileNumber,
          gameUid: joinData.gameUid,
          ingameName: joinData.ingameName,
          gameLevel: joinData.gameLevel,
          selectedSlot: bookedSlot,
          createdAt: new Date().toLocaleString(),
          entryFeeDeducted: true,
          coinsDeducted: entryFee,
          winCoinsDeducted: winCoinsDeducted
        });

        const joinedCount = joinedPlayers.filter(player => player.tournamentId === tournament.id).length + 1;
        
        let multiplier = 1;
        if (tournament.tournamentType === "DUO" || tournament.tournamentType === "2V2") multiplier = 2;
        else if (tournament.tournamentType === "SQUAD" || tournament.tournamentType === "4V4") multiplier = 4;
        else if (tournament.tournamentType === "3V3") multiplier = 3;
        else if (tournament.tournamentType === "1V2") multiplier = 2;

        const realPlayerCount = joinedCount * multiplier;
        const totalCollection = entryFee * realPlayerCount;
        const adminProfit = Math.floor(totalCollection * 0.10);
        const currentPrizePool = Math.floor(totalCollection - adminProfit);

        await update(ref(database, `liveTournaments/${tournament.id}`), {
          joinedCount,
          realPlayerCount,
          currentPrizePool,
          currentAdminProfit: adminProfit,
        });

        await checkReferralOnTournamentJoin(user.uid);

        alert("Tournament Joined Successfully 🔥");
        return true;
      }
      
      // ================= DUO, 2V2, 3V3 & SQUAD MODE (FIXED) =================
      else if (tournamentType === "DUO" || tournamentType === "2V2" || tournamentType === "3V3" || tournamentType === "SQUAD") {
        
        const teamSize = (tournamentType === "DUO" || tournamentType === "2V2") ? 2 : tournamentType === "3V3" ? 3 : 4;
        
        if (!teamMembers || teamMembers.length !== teamSize) {
          alert(`❌ Team must have ${teamSize} members!`);
          setJoinLoading(false);
          return false;
        }
        
        if (!joinData.mobileNumber || !joinData.gameUid || !joinData.ingameName || !joinData.gameLevel || !joinData.selectedSlot) {
          alert("Please fill all your details!");
          setJoinLoading(false);
          return false;
        }
        
        if (Number(joinData.gameLevel) < 45) {
          alert("Minimum Level 45 Required for Leader ❌");
          setJoinLoading(false);
          return false;
        }
        
        if (!joinData.teamName) {
          alert("Please enter a team name!");
          setJoinLoading(false);
          return false;
        }

        const slotBooked = latestJoinedPlayers.some(
          (player) => player.tournamentId === tournament.id && Number(player.selectedSlot) === Number(joinData.selectedSlot)
        );
        if (slotBooked) {
          alert("This slot is already booked! Please select another one ❌");
          setJoinLoading(false);
          return false;
        }
        
        const alreadyJoined = await isUserAlreadyInTeam(tournament.id, user.uid);
        if (alreadyJoined) {
          alert("You or your teammate already joined this tournament ❌");
          setJoinLoading(false);
          return false;
        }
        
        if (Number(coins) < entryFee) {
          alert(`❌ You (Leader) need ${entryFee} coins to join!`);
          setJoinLoading(false);
          return false;
        }
        
        for (let i = 0; i < teamMembers.length; i++) {
          const member = teamMembers[i];
          if (!member.isLeader) {
            const teammateAlreadyJoined = await isUserAlreadyInTeam(tournament.id, member.userId);
            if (teammateAlreadyJoined) {
              alert(`❌ Teammate ${member.ingameName} already joined this tournament!`);
              setJoinLoading(false);
              return false;
            }
            
            const coinCheck = await checkTeammateCoins(member.userId, entryFee, member.ingameName);
            if (!coinCheck.hasEnough) {
              alert(`❌ ${coinCheck.error}`);
              setJoinLoading(false);
              return false;
            }
          }
        }
        
        for (let i = 0; i < teamMembers.length; i++) {
          const member = teamMembers[i];
          if (!member.isLeader) {
            if (!member.gameUid || !member.ingameName || !member.gameLevel) {
              alert(`❌ Please fill all details for Teammate ${i}`);
              setJoinLoading(false);
              return false;
            }
            if (Number(member.gameLevel) < 45) {
              alert(`❌ Teammate ${member.ingameName} must have minimum Level 45!`);
              setJoinLoading(false);
              return false;
            }
          }
        }
        
        // Deduct coins from all team members securely via backend transaction
        const res = await secureFetch("/api/join-tournament", {
          tournamentId: tournament.id,
          tournamentTitle: tournament.tournamentTitle,
          entryFee: entryFee,
          teamMembers: teamMembers,
          selectedSlot: joinData.selectedSlot,
          totalSlots: tournament.totalTeams
        });
        
        // ========== FIX: Save ALL team members in joinedPlayers ==========
        const allTeamMembers = [...teamMembers];
        const bookedSlot = res?.bookedSlot || joinData.selectedSlot;
        const teamSlot = bookedSlot;
        const teamName = joinData.teamName;
        
        // Save EACH team member as a separate record in joinedPlayers
        for (let i = 0; i < allTeamMembers.length; i++) {
          const member = allTeamMembers[i];
          const winCoinsDeducted = res?.deductions?.[member.userId]?.winCoinsDeducted || 0;
          
          const memberJoinRecord = {
            tournamentId: tournament.id,
            tournamentTitle: tournament.tournamentTitle,
            tournamentType: tournamentType,
            userEmail: member.isLeader ? user.email : member.userEmail,
            userId: member.userId,
            mobileNumber: member.isLeader ? joinData.mobileNumber : member.mobileNumber,
            gameUid: member.gameUid,
            ingameName: member.ingameName,
            gameLevel: member.gameLevel,
            selectedSlot: teamSlot,
            teamName: teamName,
            teamSlot: teamSlot,
            isLeader: member.isLeader,
            teamMembers: allTeamMembers,
            joinedAt: new Date().toLocaleString(),
            entryFeeDeducted: true,
            entryFee: entryFee,
            coinsDeducted: entryFee,
            winCoinsDeducted: winCoinsDeducted
          };
          
          await push(ref(database, "joinedPlayers"), memberJoinRecord);
        }
        
        // Send notification to all team members
        for (const member of allTeamMembers) {
          await push(ref(database, `notifications/${member.userId}`), {
            title: "🎮 TEAM JOINED",
            message: `You have joined ${tournament.tournamentTitle} as part of team "${teamName}"! Entry fee ${entryFee} coins deducted.`,
            time: new Date().toLocaleString(),
            seen: false,
          });
        }
        
        // Update Prize Pool (count as 1 team/squad)
        const existingTeamCount = joinedPlayers.filter(player => player.tournamentId === tournament.id && player.selectedSlot === teamSlot).length;
        const isNewTeam = existingTeamCount === 0;
        const joinedCount = joinedPlayers.filter(player => player.tournamentId === tournament.id).length / teamSize + (isNewTeam ? 1 : 0);
        
        let multiplier = 1;
        if (tournamentType === "DUO" || tournamentType === "2V2") multiplier = 2;
        else if (tournamentType === "SQUAD" || tournamentType === "4V4") multiplier = 4;
        else if (tournamentType === "3V3") multiplier = 3;
        else if (tournamentType === "1V2") multiplier = 2;
        
        const realPlayerCount = joinedCount * multiplier;
        const totalCollection = entryFee * realPlayerCount;
        const adminProfit = Math.floor(totalCollection * 0.10);
        const currentPrizePool = Math.floor(totalCollection - adminProfit);
        
        await update(ref(database, `liveTournaments/${tournament.id}`), {
          joinedCount,
          realPlayerCount,
          currentPrizePool,
          currentAdminProfit: adminProfit,
        });
        
        // Check referral bonus for all team members
        await checkReferralOnTournamentJoin(user.uid);
        for (let i = 0; i < teamMembers.length; i++) {
          const member = teamMembers[i];
          if (!member.isLeader) {
            await checkReferralOnTournamentJoin(member.userId);
          }
        }
        
        const deductionDetails = allTeamMembers.map(member => ({
          name: member.isLeader ? `${member.ingameName} (Leader)` : member.ingameName,
          amount: entryFee
        }));

        let deductionMessage = `✅ Team "${teamName}" successfully joined!\n\n`;
        deductionMessage += `💰 Entry fee: ${entryFee} coins deducted from each team member.\n`;
        deductionMessage += `👥 Total deducted: ${entryFee * teamSize} coins\n\n`;
        deductionMessage += `📋 Deductions:\n`;
        for (const det of deductionDetails) {
          deductionMessage += `   • ${det.name}: 🪙 ${det.amount}\n`;
        }
        alert(deductionMessage);
        return true;
      }
      
      else {
        alert("Invalid tournament type");
        return false;
      }
      
    } catch (error) {
      console.error("Join error:", error);
      alert("Failed to join tournament: " + error.message);
      return false;
    } finally {
      setJoinLoading(false);
    }
  };

  // Publish Room Details
  const publishRoomDetails = async (tournamentId, roomId, roomPassword) => {
    try {
      await update(ref(database, `liveTournaments/${tournamentId}`), {
        roomId: roomId || "",
        roomPassword: roomPassword || "",
      });

      const joinedUsers = joinedPlayers.filter(player => player.tournamentId === tournamentId);
      
      for (const player of joinedUsers) {
        await push(ref(database, `notifications/${player.userId}`), {
          title: "ROOM DETAILS AVAILABLE 🔥",
          message: `Room ID: ${roomId} | Password: ${roomPassword}`,
          time: new Date().toLocaleString(),
          seen: false,
        });
        
        if (player.teamMembers && Array.isArray(player.teamMembers)) {
          for (const member of player.teamMembers) {
            if (member.userId !== player.userId) {
              await push(ref(database, `notifications/${member.userId}`), {
                title: "ROOM DETAILS AVAILABLE 🔥",
                message: `Room ID: ${roomId} | Password: ${roomPassword}`,
                time: new Date().toLocaleString(),
                seen: false,
              });
            }
          }
        }
      }
      
      alert("Room Details Published & Notifications Sent 🔥");
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    }
  };

  const updateTournamentTime = async (tournamentId, newDateTime) => {
    try {
      await update(ref(database, `liveTournaments/${tournamentId}`), {
        matchTime: newDateTime
      });

      // Find the tournament details
      const tournament = liveTournaments.find(t => t.id === tournamentId);
      const title = tournament ? tournament.tournamentTitle : `#${tournamentId}`;

      // Notify all joined players
      const joinedUsers = joinedPlayers.filter(player => player.tournamentId === tournamentId);
      for (const player of joinedUsers) {
        await push(ref(database, `notifications/${player.userId}`), {
          title: "⏰ MATCH TIME UPDATED",
          message: `The match time for "${title}" has been updated to: ${newDateTime}.`,
          time: new Date().toLocaleString(),
          seen: false,
        });

        if (player.teamMembers && Array.isArray(player.teamMembers)) {
          for (const member of player.teamMembers) {
            if (member.userId !== player.userId) {
              await push(ref(database, `notifications/${member.userId}`), {
                title: "⏰ MATCH TIME UPDATED",
                message: `The match time for "${title}" has been updated to: ${newDateTime}.`,
                time: new Date().toLocaleString(),
                seen: false,
              });
            }
          }
        }
      }

      alert("Match time updated & notifications sent! ⏰");
      return true;
    } catch (error) {
      console.error("Error updating match time:", error);
      alert("Failed to update match time: " + error.message);
      return false;
    }
  };

  const updateTournamentSlots = async (tournamentId, newSlots) => {
    try {
      const tournamentRef = ref(database, `liveTournaments/${tournamentId}`);
      const snapshot = await get(tournamentRef);
      const tournament = snapshot.val();
      
      if (!tournament) throw new Error("Tournament not found");

      const fee = Number(tournament.entryFee || 0);
      const players = Number(newSlots);
      const totalCollection = fee * players;
      const adminProfit = Math.floor(totalCollection * 0.10);
      const totalPrizePool = totalCollection - adminProfit;

      await update(tournamentRef, {
        totalTeams: players,
        adminProfit: adminProfit,
        totalPrizePool: totalPrizePool
      });
      alert("Match slots & Prize Pool updated successfully!");
      return true;
    } catch (error) {
      console.error("Error updating match slots:", error);
      alert("Failed to update match slots: " + error.message);
      return false;
    }
  };

  // Cancel Tournament (Refund All)
  const cancelTournament = async (tournament) => {
    if (isProcessingRef.current) return false;
    
    if (!window.confirm("Cancel this tournament? All players will be refunded.")) return;
    
    isProcessingRef.current = true;
    try {
      const tournamentPlayers = joinedPlayers.filter(player => player.tournamentId === tournament.id);
      
      for (const player of tournamentPlayers) {
        const winCoinsRefund = Number(player.winCoinsDeducted || 0);
        await deductUserCoins(player.userId, -Number(tournament.entryFee || 0), tournament.id, tournament.tournamentTitle, true, winCoinsRefund);
        
        await push(ref(database, `notifications/${player.userId}`), {
          title: "❌ MATCH CANCELLED",
          message: `${tournament.tournamentTitle} was cancelled. Your ${tournament.entryFee} coins refunded successfully.`,
          time: new Date().toLocaleString(),
          seen: false,
        });
      }
      
      // Delete registrations
      const joinedRef = ref(database, "joinedPlayers");
      const snapshot = await get(joinedRef);
      const data = snapshot.val();
      if (data) {
        for (let key of Object.keys(data)) {
          if (data[key].tournamentId === tournament.id) {
            console.log(`[DEBUG] cancelTournament removing joinedPlayers/${key}`);
            console.trace();
            await remove(ref(database, `joinedPlayers/${key}`));
          }
        }
      }
      
      await remove(ref(database, `liveTournaments/${tournament.id}`));
      await remove(ref(database, `slotLocks/${tournament.id}`));
      alert("Tournament Cancelled 🔥");
      isProcessingRef.current = false;
      return true;
    } catch (error) {
      alert(error.message);
      isProcessingRef.current = false;
      return false;
    }
  };

  // Delete Match History
  const deleteMatchHistory = async (matchId) => {
    try {
      console.log(`[DEBUG] deleteMatchHistory called for matchId: ${matchId}`);
      console.trace();
      await remove(ref(database, `joinedPlayers/${matchId}`));
      alert("Match History Deleted ✅");
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    }
  };

  // Delete All User Match History
  const deleteAllUserMatchHistory = async (userEmail) => {
    if (!window.confirm("Delete all COMPLETED match history? (Live matches will not be deleted)")) return;
    
    try {
      const liveTournamentIds = liveTournaments.map(t => t.id);
      const userMatches = joinedHistory.filter(item => item.userEmail === userEmail && !liveTournamentIds.includes(item.tournamentId));
      for (const match of userMatches) {
        console.log(`[DEBUG] deleteAllUserMatchHistory removing joinedPlayers/${match.id}`);
        console.trace();
        await remove(ref(database, `joinedPlayers/${match.id}`));
      }
      alert("Completed Match History Deleted ✅");
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    }
  };

  return {
    liveTournaments,
    joinedPlayers,
    joinedHistory,
    matchResults,
    joinLoading,
    joinTournament,
    publishRoomDetails,
    updateTournamentTime,
    updateTournamentSlots,
    cancelTournament,
    deleteMatchHistory,
    deleteAllUserMatchHistory,
  };
}