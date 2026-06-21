import { useState, useEffect } from "react";
import { ref, onValue, push, update, remove, get } from "firebase/database";
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
      newCoins = currentCoins + amount;
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

export function usePerKillTournaments() {
  const [liveTournaments, setLiveTournaments] = useState([]);
  const [joinedPlayers, setJoinedPlayers] = useState([]);
  const [matchResults, setMatchResults] = useState([]);
  const [joinLoading, setJoinLoading] = useState(false);

  // Fetch Live Tournaments
  useEffect(() => {
    const liveRef = ref(database, "perKillTournaments");
    const unsubscribe = onValue(liveRef, (snapshot) => {
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
    return () => unsubscribe();
  }, []);

  // Fetch Joined Players
  useEffect(() => {
    const joinedRef = ref(database, "joinedPerKillPlayers");
    const unsubscribe = onValue(joinedRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedData = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        setJoinedPlayers(loadedData);
      } else {
        setJoinedPlayers([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch Match Results
  useEffect(() => {
    const resultsRef = ref(database, "perKillResults");
    const unsubscribe = onValue(resultsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedData = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        setMatchResults(loadedData);
      } else {
        setMatchResults([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Create Tournament
  const createPerKillTournament = async (tournamentData) => {
    try {
      const tournamentsRef = ref(database, "perKillTournaments");
      const newTournamentRef = push(tournamentsRef);
      await update(newTournamentRef, {
        id: newTournamentRef.key,
        ...tournamentData,
        completed: false,
        createdAt: new Date().toLocaleString(),
      });
      alert("Per Kill Tournament Created Successfully! 🚀");
      return true;
    } catch (error) {
      console.error(error);
      alert("Error creating tournament: " + error.message);
      return false;
    }
  };

  // Join Tournament
  const joinTournament = async (user, tournament, joinData) => {
    if (!user) {
      alert("Please login to join tournaments ❌");
      return false;
    }

    setJoinLoading(true);
    try {
      const entryFee = Number(tournament.entryFee) || 0;

      // Check user coins
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        alert("User profile not found ❌");
        setJoinLoading(false);
        return false;
      }

      const coins = userSnap.data().coins || 0;

      // Fetch latest joined players from database to prevent race conditions
      const playersSnapshot = await get(ref(database, "joinedPerKillPlayers"));
      const playersVal = playersSnapshot.val() || {};
      const latestJoinedPlayers = Object.keys(playersVal).map(key => ({ id: key, ...playersVal[key] }));

      // Verify slot is free using latest database snapshot
      const alreadyBooked = latestJoinedPlayers.some(
        (player) => player.tournamentId === tournament.id && Number(player.selectedSlot) === Number(joinData.selectedSlot)
      );

      if (alreadyBooked) {
        alert("This slot is already booked! Please select another one ❌");
        setJoinLoading(false);
        return false;
      }

      const alreadyJoined = latestJoinedPlayers.some(
        (player) => player.tournamentId === tournament.id && (player.userId === user.uid || player.userEmail === user.email)
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

      // Deduct coins securely via backend transaction
      const res = await secureFetch("/api/join-tournament", {
        tournamentId: tournament.id,
        entryFee: entryFee
      });
      const winCoinsDeducted = res?.deductions?.[user.uid]?.winCoinsDeducted || 0;

      // Register player
      await push(ref(database, "joinedPerKillPlayers"), {
        tournamentId: tournament.id,
        tournamentTitle: tournament.tournamentTitle,
        userEmail: user.email,
        userId: user.uid,
        mobileNumber: joinData.mobileNumber,
        gameUid: joinData.gameUid,
        ingameName: joinData.ingameName,
        gameLevel: joinData.gameLevel,
        selectedSlot: joinData.selectedSlot,
        createdAt: new Date().toLocaleString(),
        entryFeeDeducted: true,
        coinsDeducted: entryFee,
        winCoinsDeducted: winCoinsDeducted
      });

      // Send Join Notification
      await push(ref(database, `notifications/${user.uid}`), {
        title: "⚔️ MATCH JOINED",
        message: `You have joined the Per Kill match "${tournament.tournamentTitle}"! Entry fee ${entryFee} coins deducted.`,
        time: new Date().toLocaleString(),
        seen: false,
      });

      alert("Successfully Joined Tournament! 🎉");
      setJoinLoading(false);
      return true;
    } catch (error) {
      console.error(error);
      alert("Error joining tournament: " + error.message);
      setJoinLoading(false);
      return false;
    }
  };

  // Cancel Tournament (Refund all and delete)
  const cancelTournament = async (tournament) => {
    if (!window.confirm(`Are you sure you want to cancel and refund all players of Match: ${tournament.tournamentTitle}?`)) return;
    try {
      const tournamentPlayers = joinedPlayers.filter(player => player.tournamentId === tournament.id);
      
      // Refund each player and send notification
      for (let player of tournamentPlayers) {
        if (player.entryFeeDeducted && player.coinsDeducted > 0) {
          const winCoinsRefund = Number(player.winCoinsDeducted || 0);
          await deductUserCoins(player.userId, player.coinsDeducted, tournament.id, tournament.tournamentTitle, true, winCoinsRefund);
          
          await push(ref(database, `notifications/${player.userId}`), {
            title: "❌ MATCH CANCELLED",
            message: `Per Kill match "${tournament.tournamentTitle}" was cancelled. Your ${player.coinsDeducted} coins refunded successfully.`,
            time: new Date().toLocaleString(),
            seen: false,
          });
        }
      }

      // Delete registrations
      const joinedRef = ref(database, "joinedPerKillPlayers");
      const snapshot = await get(joinedRef);
      const data = snapshot.val();
      if (data) {
        for (let key of Object.keys(data)) {
          if (data[key].tournamentId === tournament.id) {
            await remove(ref(database, `joinedPerKillPlayers/${key}`));
          }
        }
      }

      // Delete tournament
      await remove(ref(database, `perKillTournaments/${tournament.id}`));
      alert("Match cancelled and refunds processed successfully!");
    } catch (error) {
      console.error(error);
      alert("Error cancelling match: " + error.message);
    }
  };

  // Publish Room Details
  const publishRoomDetails = async (tournamentId, roomId, roomPassword) => {
    try {
      await update(ref(database, `perKillTournaments/${tournamentId}`), {
        roomId,
        roomPassword
      });

      // Send notifications to all joined players
      const joinedUsers = joinedPlayers.filter(player => player.tournamentId === tournamentId);
      for (const player of joinedUsers) {
        await push(ref(database, `notifications/${player.userId}`), {
          title: "ROOM DETAILS AVAILABLE 🔥",
          message: `Room ID: ${roomId} | Password: ${roomPassword}`,
          time: new Date().toLocaleString(),
          seen: false,
        });
      }

      alert("Room Details Published & Notifications Sent 🔥");
      return true;
    } catch (error) {
      console.error(error);
      alert("Error publishing room details: " + error.message);
      return false;
    }
  };

  // Update Tournament Time
  const updateTournamentTime = async (tournamentId, newDateTime) => {
    try {
      await update(ref(database, `perKillTournaments/${tournamentId}`), {
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
          message: `The match time for "${title}" (Per Kill) has been updated to: ${newDateTime}.`,
          time: new Date().toLocaleString(),
          seen: false,
        });
      }

      alert("Match time updated & notifications sent! ⏰");
      return true;
    } catch (error) {
      console.error(error);
      alert("Error updating match time: " + error.message);
      return false;
    }
  };

  const updateTournamentSlots = async (tournamentId, newSlots) => {
    try {
      await update(ref(database, `perKillTournaments/${tournamentId}`), {
        totalTeams: Number(newSlots)
      });
      alert("Match slots updated successfully!");
      return true;
    } catch (error) {
      console.error("Error updating match slots:", error);
      alert("Failed to update match slots: " + error.message);
      return false;
    }
  };

  // Publish Per Kill Results & Distribute Coins
  const publishResults = async (tournament, playerResultsList) => {
    if (!window.confirm("Are you sure you want to approve and publish these results? This will distribute coins to players.")) return false;

    try {
      const perKillRate = Number(tournament.perKillRate) || 0;
      const originalBooyahBonus = Number(tournament.booyahBonus) || 0;
      const originalSecondBonus = Number(tournament.secondBonus) || 0;
      const originalThirdBonus = Number(tournament.thirdBonus) || 0;

      // Calculate dynamic Bonuses based on actual joined players count vs total slots
      const joinedCount = playerResultsList.length;
      const totalSlots = Number(tournament.totalTeams) || 48;
      const ratio = totalSlots > 0 ? Math.min(1, joinedCount / totalSlots) : 1;
      
      const booyahBonus = Math.floor(originalBooyahBonus * ratio);
      const secondBonus = Math.floor(originalSecondBonus * ratio);
      const thirdBonus = Math.floor(originalThirdBonus * ratio);

      // Process each player's earnings
      for (let record of playerResultsList) {
        const kills = Number(record.kills || 0);
        const position = Number(record.position || 0);
        
        let positionBonus = 0;
        let bonusLabel = "";
        if (position === 1) {
          positionBonus = booyahBonus;
          bonusLabel = ` + 1st Place Bonus of 🪙 ${booyahBonus}`;
        } else if (position === 2) {
          positionBonus = secondBonus;
          bonusLabel = ` + 2nd Place Bonus of 🪙 ${secondBonus}`;
        } else if (position === 3) {
          positionBonus = thirdBonus;
          bonusLabel = ` + 3rd Place Bonus of 🪙 ${thirdBonus}`;
        }

        const totalEarnings = (kills * perKillRate) + positionBonus;

        if (totalEarnings > 0) {
          const userRef = doc(db, "users", record.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const currentCoins = userSnap.data().coins || 0;
            const currentWinCoins = userSnap.data().winCoins || 0;
            
            // Add earnings directly to Deposit & Winnings balance
            await updateDoc(userRef, {
              coins: currentCoins + totalEarnings,
              winCoins: currentWinCoins + totalEarnings
            });

            // Log Transaction
            await logCoinTransaction(
              record.userId, 
              totalEarnings, 
              "PER_KILL_WINNINGS", 
              `Earned from Per Kill Match #${tournament.id} (${kills} kills${bonusLabel})`, 
              true
            );

            // Push Notification
            await push(ref(database, `notifications/${record.userId}`), {
              title: "🏆 PER KILL REWARD RECEIVED",
              message: `You received 🪙 ${totalEarnings} from ${tournament.tournamentTitle} (${kills} kills${bonusLabel})!`,
              time: new Date().toLocaleString(),
              seen: false,
            });
          }
        }
      }

      // Save complete results to perKillResults
      const resultsRef = ref(database, "perKillResults");
      const newResultRef = push(resultsRef);
      await update(newResultRef, {
        id: newResultRef.key,
        tournamentId: tournament.id,
        tournamentTitle: tournament.tournamentTitle,
        matchDate: tournament.matchDate,
        matchTime: tournament.matchTime,
        perKillRate: perKillRate,
        originalBooyahBonus: originalBooyahBonus,
        booyahBonus: booyahBonus,
        originalSecondBonus: originalSecondBonus,
        secondBonus: secondBonus,
        originalThirdBonus: originalThirdBonus,
        thirdBonus: thirdBonus,
        results: playerResultsList,
        createdAt: new Date().toLocaleString()
      });

      // Mark tournament as completed
      await update(ref(database, `perKillTournaments/${tournament.id}`), {
        completed: true
      });

      alert(`Results Published! Distributed rewards with scaled bonuses (Booyah: 🪙 ${booyahBonus}, 2nd: 🪙 ${secondBonus}, 3rd: 🪙 ${thirdBonus}) 🏆`);
      return true;
    } catch (error) {
      console.error(error);
      alert("Error publishing results: " + error.message);
      return false;
    }
  };



  const deletePerKillMatchHistory = async (matchId) => {
    try {
      await remove(ref(database, `joinedPerKillPlayers/${matchId}`));
      alert("Match History Deleted ✅");
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    }
  };

  const deleteAllPerKillMatchHistory = async (userEmail) => {
    if (!window.confirm("Delete all per kill match history?")) return;
    try {
      const userMatches = joinedPlayers.filter(item => item.userEmail === userEmail);
      for (const match of userMatches) {
        await remove(ref(database, `joinedPerKillPlayers/${match.id}`));
      }
      alert("All Match History Deleted ✅");
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    }
  };

  return {
    liveTournaments,
    joinedPlayers,
    matchResults,
    joinLoading,
    createPerKillTournament,
    joinTournament,
    cancelTournament,
    publishRoomDetails,
    updateTournamentTime,
    updateTournamentSlots,
    publishResults,
    deletePerKillMatchHistory,
    deleteAllPerKillMatchHistory
  };
}
