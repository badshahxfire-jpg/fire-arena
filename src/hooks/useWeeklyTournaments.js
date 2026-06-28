import { useState, useEffect } from "react";
import { ref, onValue, push, update, remove, get } from "firebase/database";
import { database, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { logCoinTransaction } from "../utils/coinHistory";
export function useWeeklyTournaments() {
  const [weeklyTournaments, setWeeklyTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all weekly tournaments
  useEffect(() => {
    const weeklyRef = ref(database, "weeklyTournaments");
    const unsubscribe = onValue(weeklyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formattedData = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setWeeklyTournaments(formattedData.reverse()); // Newest first
      } else {
        setWeeklyTournaments([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Admin: Create Weekly Tournament
  const createWeeklyTournament = async (tournamentData) => {
    try {
      const weeklyRef = ref(database, "weeklyTournaments");
      await push(weeklyRef, {
        ...tournamentData,
        createdAt: new Date().toISOString(),
        status: "REGISTRATION", // REGISTRATION, QUALIFIER, FINALS, COMPLETED
        registeredTeams: {},
        leaderboard: {}
      });
      return true;
    } catch (error) {
      console.error("Error creating weekly tournament:", error);
      return false;
    }
  };

  // User: Join Weekly Tournament
  const joinWeeklyTournament = async (tournamentId, user, teamDetails) => {
    try {
      const t = weeklyTournaments.find(x => x.id === tournamentId);
      if (!t) {
        alert("Tournament not found!");
        return false;
      }
      const entryFee = Number(t.entryFee) || 0;

      // 1. Check Leader Coins
      const leaderRef = doc(db, "users", user.uid);
      const leaderSnap = await getDoc(leaderRef);
      if (!leaderSnap.exists()) return false;
      const leaderCoins = leaderSnap.data().coins || 0;
      
      if (leaderCoins < entryFee) {
        alert(`You do not have enough coins! Need ${entryFee}, but you have ${leaderCoins}.`);
        return false;
      }

      // 2. Check Teammates Coins
      const teammateDocs = [];
      if (teamDetails.teammates && teamDetails.teammates.length > 0) {
        for (let i = 0; i < teamDetails.teammates.length; i++) {
          const tm = teamDetails.teammates[i];
          const tmRef = doc(db, "users", tm.websiteUid);
          const tmSnap = await getDoc(tmRef);
          
          if (!tmSnap.exists()) {
            alert(`Teammate ${i+1} (${tm.inGameName}) account not found!`);
            return false;
          }
          const tmCoins = tmSnap.data().coins || 0;
          if (tmCoins < entryFee) {
            alert(`Teammate ${i+1} (${tm.inGameName}) does not have enough coins! Needs ${entryFee}, has ${tmCoins}.`);
            return false;
          }
          teammateDocs.push({ ref: tmRef, coins: tmCoins, uid: tm.websiteUid, name: tm.inGameName });
        }
      }

      // 3. Deduct Coins from Leader
      await updateDoc(leaderRef, { coins: leaderCoins - entryFee });
      await logCoinTransaction(user.uid, -entryFee, "JOIN_WEEKLY", `Joined Weekly Tournament: ${t.title}`, false);

      // 4. Deduct Coins from Teammates
      for (const tm of teammateDocs) {
        await updateDoc(tm.ref, { coins: tm.coins - entryFee });
        await logCoinTransaction(tm.uid, -entryFee, "JOIN_WEEKLY", `Joined Weekly Tournament (Teammate): ${t.title}`, false);
      }

      // 5. Save to Realtime Database
      const tournamentRef = ref(database, `weeklyTournaments/${tournamentId}/registeredTeams/${user.uid}`);
      await update(tournamentRef, {
        ...teamDetails,
        userId: user.uid,
        userName: user.displayName || user.email,
        joinedAt: new Date().toISOString(),
        points: 0,
        kills: 0,
        matchesPlayed: 0
      });
      return true;
    } catch (error) {
      console.error("Error joining weekly tournament:", error);
      alert("Something went wrong while joining!");
      return false;
    }
  };

  // Admin: Update Team Rank
  const updateTeamRank = async (tournamentId, userId, rank) => {
    try {
      const teamRef = ref(database, `weeklyTournaments/${tournamentId}/registeredTeams/${userId}`);
      await update(teamRef, { rank: rank });
      return true;
    } catch (error) {
      console.error("Error updating rank:", error);
      return false;
    }
  };

  // Admin: Change Status
  const updateStatus = async (tournamentId, newStatus) => {
    try {
      const tournamentRef = ref(database, `weeklyTournaments/${tournamentId}`);
      await update(tournamentRef, { status: newStatus });
      return true;
    } catch (error) {
      console.error("Error updating status:", error);
      return false;
    }
  };

  // Admin: Cancel (Delete) Tournament
  const cancelWeeklyTournament = async (tournamentId) => {
    try {
      const tournamentRef = ref(database, `weeklyTournaments/${tournamentId}`);
      await remove(tournamentRef);
      return true;
    } catch (error) {
      console.error("Error cancelling tournament:", error);
      return false;
    }
  };

  // Admin: Update Overall Room Details
  const updateRoomDetails = async (tournamentId, roomId, roomPassword, matchDate, matchTime) => {
    try {
      const tournamentRef = ref(database, `weeklyTournaments/${tournamentId}`);
      await update(tournamentRef, { roomId, roomPassword, matchDate, matchTime });
      return true;
    } catch (error) {
      console.error("Error updating room details:", error);
      return false;
    }
  };

  // Admin: Distribute Rewards
  const distributeWeeklyRewards = async (tournament) => {
    try {
      if (!tournament || !tournament.registeredTeams || tournament.rewardsDistributed) return false;

      const teamsArray = Object.values(tournament.registeredTeams);
      teamsArray.sort((a, b) => {
        if (!a.rank) return 1;
        if (!b.rank) return -1;
        return a.rank - b.rank;
      });

      const maxPrizePool = tournament.prizePool || 10000;
      const entryFee = tournament.entryFee || 50;
      const format = tournament.format || "Solo";

      let totalRegisteredPlayers = 0;
      Object.values(tournament.registeredTeams).forEach(team => {
        totalRegisteredPlayers += 1;
        if (team.teammates) totalRegisteredPlayers += team.teammates.length;
      });

      const totalCollected = totalRegisteredPlayers * entryFee;
      const adminCut = format === "Solo" ? 0.90 : 0.80;
      const dynamicPrizePool = Math.floor(totalCollected * adminCut);
      const totalPrizePool = totalRegisteredPlayers > 0 ? dynamicPrizePool : maxPrizePool;

      let prizes = [];
      if (format === "Squad") {
        prizes = [
          Math.floor(totalPrizePool * 0.50), // 1st
          Math.floor(totalPrizePool * 0.30), // 2nd
          Math.floor(totalPrizePool * 0.20)  // 3rd
        ];
      } else if (format === "Duo") {
        prizes = [
          Math.floor(totalPrizePool * 0.35), // 1st (35%)
          Math.floor(totalPrizePool * 0.25), // 2nd (25%)
          Math.floor(totalPrizePool * 0.15), // 3rd (15%)
          Math.floor(totalPrizePool * 0.10), // 4th (10%)
          Math.floor(totalPrizePool * 0.10), // 5th (10%)
          Math.floor(totalPrizePool * 0.05)  // 6th (5%)
        ];
      } else { // Solo - 90% Prize Pool, Custom Proportions
        const soloProportions = [
          300, 220, 180, 150, 130, 120, 110, 105, 100, 100, 
          75, 75, 70, 70, 65, 65, 60, 55, 50, 20
        ];
        const sumProportions = 2120; // Sum of the above array
        prizes = soloProportions.map(p => Math.floor(totalPrizePool * (p / sumProportions)));
      }

      for (let i = 0; i < prizes.length && i < teamsArray.length; i++) {
        const team = teamsArray[i];
        // Ensure team has a rank to win
        if (!team.rank) continue; 

        const totalPrize = prizes[i];
        
        let usersToReward = [];
        if (format === "Solo") {
          usersToReward.push(team.userId);
        } else {
          // Duo or Squad
          usersToReward.push(team.userId); // Leader
          if (team.teammates && team.teammates.length > 0) {
            team.teammates.forEach(tm => {
              if (tm.websiteUid) usersToReward.push(tm.websiteUid);
              else if (tm.userId) usersToReward.push(tm.userId); // Fallback just in case
            });
          }
        }

        const prizePerPlayer = Math.floor(totalPrize / usersToReward.length);

        for (const uid of usersToReward) {
          const userDocRef = doc(db, "users", uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const currentCoins = userSnap.data().coins || 0;
            await updateDoc(userDocRef, {
              coins: currentCoins + prizePerPlayer
            });
            await logCoinTransaction(
              uid, 
              prizePerPlayer, 
              "WINNING", 
              `Weekly Tournament ${tournament.title} - Rank ${i + 1}`, 
              true
            );
          }
        }
      }

      // Mark as distributed
      const tournamentRef = ref(database, `weeklyTournaments/${tournament.id}`);
      await update(tournamentRef, { rewardsDistributed: true });
      return true;
    } catch (error) {
      console.error("Error distributing rewards:", error);
      return false;
    }
  };

  // Admin: Generate Lobbies Auto-Assign
  const generateLobbies = async (tournamentId, maxPerLobby = 48) => {
    try {
      const t = weeklyTournaments.find(x => x.id === tournamentId);
      if (!t || !t.registeredTeams) return false;

      // Filter active teams
      const activeTeams = Object.values(t.registeredTeams).filter(team => !team.status || team.status === "ACTIVE");
      
      const numLobbies = Math.ceil(activeTeams.length / maxPerLobby);
      const lobbies = {};
      
      // Shuffle for randomness
      const shuffled = activeTeams.sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < numLobbies; i++) {
        const lobbyTeams = shuffled.slice(i * maxPerLobby, (i + 1) * maxPerLobby).map(team => team.userId);
        lobbies[`lobby_${i+1}`] = {
          id: `lobby_${i+1}`,
          name: `Lobby ${String.fromCharCode(65 + i)}`, // Lobby A, Lobby B
          roomId: "",
          roomPassword: "",
          matchDate: "",
          matchTime: "",
          teams: lobbyTeams
        };
      }

      const tournamentRef = ref(database, `weeklyTournaments/${tournamentId}`);
      await update(tournamentRef, { lobbies });
      return true;
    } catch (err) {
      console.error("Error generating lobbies:", err);
      return false;
    }
  };

  // Admin: Update Lobby Details (Credentials & Schedule)
  const updateLobbyDetails = async (tournamentId, lobbyId, roomId, roomPassword, matchDate, matchTime) => {
    try {
      const lobbyRef = ref(database, `weeklyTournaments/${tournamentId}/lobbies/${lobbyId}`);
      await update(lobbyRef, { roomId, roomPassword, matchDate, matchTime });
      return true;
    } catch (err) {
      console.error("Error updating lobby details:", err);
      return false;
    }
  };

  // Admin: Advance Phase / Approve Matches
  const advancePhase = async (tournamentId, nextPhase, qualifiedTeamIds) => {
    try {
      const t = weeklyTournaments.find(x => x.id === tournamentId);
      if (!t || !t.registeredTeams) return false;

      const updates = {};
      
      // Update each team's status and reset points for the next round
      Object.values(t.registeredTeams).forEach(team => {
        if (!team.status || team.status === "ACTIVE") {
          if (qualifiedTeamIds.includes(team.userId)) {
            // They qualify
            updates[`weeklyTournaments/${tournamentId}/registeredTeams/${team.userId}/rank`] = null;
            updates[`weeklyTournaments/${tournamentId}/registeredTeams/${team.userId}/kills`] = 0;
          } else {
            // They are eliminated
            updates[`weeklyTournaments/${tournamentId}/registeredTeams/${team.userId}/status`] = "ELIMINATED";
          }
        }
      });

      // Clear old lobbies
      updates[`weeklyTournaments/${tournamentId}/lobbies`] = null;
      // Update overall phase status
      updates[`weeklyTournaments/${tournamentId}/status`] = nextPhase;

      await update(ref(database), updates);
      return true;
    } catch (err) {
      console.error("Error advancing phase:", err);
      return false;
    }
  };

  // Admin: Update Rules
  const updateTournamentRules = async (tournamentId, rulesArray) => {
    try {
      const tournamentRef = ref(database, `weeklyTournaments/${tournamentId}`);
      await update(tournamentRef, { rules: rulesArray });
      return true;
    } catch (error) {
      console.error("Error updating rules:", error);
      return false;
    }
  };

  return {
    weeklyTournaments,
    loading,
    createWeeklyTournament,
    joinWeeklyTournament,
    updateStatus,
    cancelWeeklyTournament,
    updateRoomDetails,
    distributeWeeklyRewards,
    generateLobbies,
    updateLobbyDetails,
    advancePhase,
    updateTournamentRules,
    updateTeamRank
  };
}
