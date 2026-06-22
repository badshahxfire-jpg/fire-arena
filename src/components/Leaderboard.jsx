import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { ref, onValue as onDatabaseValue } from "firebase/database";
import { db, database } from "../firebase";

export default function Leaderboard() {
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [showDetailsPopup, setShowDetailsPopup] = useState(false);

  const [users, setUsers] = useState({});
  const [matchResults, setMatchResults] = useState([]);
  const [perKillResults, setPerKillResults] = useState([]);
  const [leaderboardTab, setLeaderboardTab] = useState("classic"); // "classic" or "perkill"

  // Subscribe to Firestore users collection for real-time updates
  useEffect(() => {
    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const usersData = {};
      snapshot.forEach((doc) => {
        usersData[doc.id] = { id: doc.id, ...doc.data() };
      });
      setUsers(usersData);
    }, (error) => {
      console.error("Error subscribing to users for leaderboard:", error);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to Realtime Database matchResults
  useEffect(() => {
    const matchResultsRef = ref(database, "matchResults");
    const unsubscribeMatches = onDatabaseValue(matchResultsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedMatches = Object.keys(data).map((key) => ({
          id: key,
          ...data[key]
        }));
        setMatchResults(loadedMatches);
      } else {
        setMatchResults([]);
      }
    });
    return () => unsubscribeMatches();
  }, []);

  // Subscribe to Realtime Database perKillResults
  useEffect(() => {
    const perKillRef = ref(database, "perKillResults");
    const unsubscribePerKill = onDatabaseValue(perKillRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedMatches = Object.keys(data).map((key) => ({
          id: key,
          ...data[key]
        }));
        setPerKillResults(loadedMatches);
      } else {
        setPerKillResults([]);
      }
    });
    return () => unsubscribePerKill();
  }, []);

  // Combine and sort whenever users or matchResults change
  const leaderboard = useMemo(() => {
    if (Object.keys(users).length === 0) return [];

    // Create a map of UID -> { totalWinnings, tournamentsWon }
    const matchWinningsMap = new Map();
    for (const match of matchResults) {
      if (match.results) {
        for (const winner of match.results) {
          const uid = winner.uid || winner.userId;
          if (!uid) continue;

          if (!matchWinningsMap.has(uid)) {
            matchWinningsMap.set(uid, { totalWinnings: 0, tournamentsWon: [] });
          }

          const entry = matchWinningsMap.get(uid);
          const coinsReward = Number(winner.winCoins) || 0;
          entry.totalWinnings += coinsReward;
          entry.tournamentsWon.push({
            tournamentTitle: match.tournamentTitle,
            position: winner.position,
            winCoins: coinsReward,
            date: match.createdAt
          });
        }
      }
    }

    const leaderboardData = [];

    for (const [uid, userData] of Object.entries(users)) {
      if (uid === "FAVc9zfAgoYs1d1BDr2EoDwSw0x1") continue; // Exclude Admin

      const stats = matchWinningsMap.get(uid) || { totalWinnings: 0, tournamentsWon: [] };
      
      // Filter out players with absolutely no stats to improve UI performance if user base grows
      if (
        !userData.wins && 
        !userData.top3 && 
        !userData.coins && 
        stats.totalWinnings === 0
      ) {
        continue;
      }

      leaderboardData.push({
        id: uid,
        name: userData.name || "Unknown Player",
        email: userData.email || "",
        wins: userData.wins || 0,
        top3: userData.top3 || 0,
        coins: userData.coins || 0,
        totalWinnings: stats.totalWinnings,
        tournamentsWon: stats.tournamentsWon
      });
    }

    // Sort by total winnings (highest first), then by wins, then by top 3
    return leaderboardData.sort((a, b) => {
      if (b.totalWinnings !== a.totalWinnings) {
        return b.totalWinnings - a.totalWinnings;
      }
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      return b.top3 - a.top3;
    });
  }, [users, matchResults]);

  // Combine and sort whenever users or perKillResults change
  const perKillLeaderboard = useMemo(() => {
    if (Object.keys(users).length === 0) return [];

    // Create a map of UID -> { totalWinnings, totalKills, matchesPlayed, tournamentsWon }
    const statsMap = new Map();
    for (const match of perKillResults) {
      if (match.results) {
        for (const player of match.results) {
          const uid = player.userId || player.uid;
          if (!uid) continue;

          if (!statsMap.has(uid)) {
            statsMap.set(uid, { totalWinnings: 0, totalKills: 0, matchesPlayed: 0, tournamentsWon: [] });
          }

          const entry = statsMap.get(uid);
          const kills = Number(player.kills) || 0;
          const pos = Number(player.position) || 0;
          const bonus = pos === 1 ? (match.booyahBonus || 0) : pos === 2 ? (match.secondBonus || 0) : pos === 3 ? (match.thirdBonus || 0) : 0;
          const winnings = (kills * (match.perKillRate || 0)) + bonus;

          entry.totalWinnings += winnings;
          entry.totalKills += kills;
          entry.matchesPlayed += 1;
          entry.tournamentsWon.push({
            tournamentTitle: match.tournamentTitle,
            kills: kills,
            position: pos,
            winCoins: winnings,
            date: match.createdAt
          });
        }
      }
    }

    const leaderboardData = [];
    for (const [uid, userData] of Object.entries(users)) {
      if (uid === "FAVc9zfAgoYs1d1BDr2EoDwSw0x1") continue; // Exclude Admin

      const stats = statsMap.get(uid) || { totalWinnings: 0, totalKills: 0, matchesPlayed: 0, tournamentsWon: [] };
      if (stats.totalWinnings === 0 && stats.totalKills === 0) continue;

      leaderboardData.push({
        id: uid,
        name: userData.name || "Unknown Player",
        email: userData.email || "",
        totalWinnings: stats.totalWinnings,
        totalKills: stats.totalKills,
        matchesPlayed: stats.matchesPlayed,
        tournamentsWon: stats.tournamentsWon
      });
    }

    // Sort by total winnings (highest first), then by total kills descending
    return leaderboardData.sort((a, b) => {
      if (b.totalWinnings !== a.totalWinnings) {
        return b.totalWinnings - a.totalWinnings;
      }
      return b.totalKills - a.totalKills;
    });
  }, [users, perKillResults]);

  const loading = Object.keys(users).length === 0;

  const handleWinnerClick = (winner) => {
    setSelectedWinner(winner);
    setShowDetailsPopup(true);
  };

  const getPositionBadge = (position) => {
    if (position === 1) return "🥇";
    if (position === 2) return "🥈";
    if (position === 3) return "🥉";
    return `#${position}`;
  };

  const getPositionColor = (position) => {
    if (position === 1) return "text-yellow-400";
    if (position === 2) return "text-gray-300";
    if (position === 3) return "text-orange-400";
    return "text-blue-400";
  };

  const activeLeaderboard = leaderboardTab === "classic" ? leaderboard : perKillLeaderboard;
  const top6Players = activeLeaderboard.slice(0, 6);

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading leaderboard...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <div className="text-center mb-6">
        <h2 className="text-5xl font-black text-yellow-400 mb-4 cyber-neon">🏆 TOP 6 WINNERS</h2>
        <p className="text-gray-400">Click on any player to view their complete tournament history</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex justify-center gap-4 mb-12 max-w-sm mx-auto bg-black/60 border border-yellow-500/10 rounded-2xl p-1.5 shadow-lg shadow-black/80">
        <button
          onClick={() => setLeaderboardTab("classic")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${
            leaderboardTab === "classic"
              ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-black shadow-lg"
              : "text-gray-400 hover:text-white"
          }`}
        >
          🏆 CLASSIC MODE
        </button>
        <button
          onClick={() => setLeaderboardTab("perkill")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${
            leaderboardTab === "perkill"
              ? "bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-lg"
              : "text-gray-400 hover:text-white"
          }`}
        >
          ⚔️ PER KILL MODE
        </button>
      </div>

      {top6Players.length === 0 ? (
        <div className="text-center py-20 bg-black/30 rounded-2xl">
          <p className="text-gray-400 text-lg">No players found</p>
          <p className="text-gray-500 text-sm mt-2">Players will appear here after joining tournaments</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {top6Players.map((player, index) => (
            <div
              key={player.id}
              onClick={() => handleWinnerClick(player)}
              className={`cursor-pointer rounded-2xl p-6 border transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                index === 0
                  ? "bg-gradient-to-br from-yellow-900/30 to-black border-yellow-500/30"
                  : index === 1
                  ? "bg-gradient-to-br from-gray-700/30 to-black border-gray-500/30"
                  : index === 2
                  ? "bg-gradient-to-br from-orange-900/30 to-black border-orange-500/30"
                  : "bg-gradient-to-br from-purple-900/20 to-black border-purple-500/20"
              }`}
            >
              {/* Rank */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-4xl">
                    {index === 0 ? "👑" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                  </span>
                  <span className="text-2xl font-black text-white">Rank {index + 1}</span>
                </div>
                <span className="text-3xl">
                  {index === 0 ? "🏆" : index === 1 ? "⭐" : index === 2 ? "✨" : "🎮"}
                </span>
              </div>

              {/* Player Name */}
              <h3 className="text-2xl font-black text-orange-400 mb-2 truncate">
                {player.name || "Unknown Player"}
              </h3>
              
              {/* Player Email */}
              <p className="text-gray-500 text-xs mb-3 truncate">
                {player.email || "No email"}
              </p>

              {/* Stats */}
              <div className="space-y-3 mt-4">
                {leaderboardTab === "classic" ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 flex items-center gap-2">
                        <span>🏆</span> Total Wins
                      </span>
                      <span className="text-yellow-400 font-black text-xl">{player.wins || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 flex items-center gap-2">
                        <span>🔥</span> Top 3 Finishes
                      </span>
                      <span className="text-green-400 font-black text-xl">{player.top3 || 0}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 flex items-center gap-2">
                        <span>⚔️</span> Matches Played
                      </span>
                      <span className="text-blue-400 font-black text-xl">{player.matchesPlayed || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 flex items-center gap-2">
                        <span>💀</span> Total Kills
                      </span>
                      <span className="text-red-400 font-black text-xl">{player.totalKills || 0}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 flex items-center gap-2">
                    <span>🪙</span> Total Winnings
                  </span>
                  <span className="text-purple-400 font-black text-xl cyber-prize">
                    🪙 {player.totalWinnings || 0}
                  </span>
                </div>
              </div>

              {/* Click Hint */}
              <div className="mt-4 pt-3 border-t border-gray-700 text-center">
                <span className="text-gray-500 text-xs">👆 Click to view tournament history</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Winner Details Popup */}
      {showDetailsPopup && selectedWinner && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 px-4">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-yellow-500/20">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-yellow-500/20">
              <div>
                <h2 className="text-3xl font-black text-yellow-400">🏆 {selectedWinner.name || "Unknown Player"}</h2>
                <p className="text-gray-400 text-sm mt-1">📧 {selectedWinner.email || "No email"}</p>
                <p className="text-gray-500 text-xs mt-1">🆔 UID: {selectedWinner.id?.substring(0, 12)}...</p>
              </div>
              <button 
                onClick={() => setShowDetailsPopup(false)} 
                className="bg-red-500 text-white px-4 py-2 rounded-xl font-black hover:bg-red-600 transition"
              >
                ✕ CLOSE
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {leaderboardTab === "classic" ? (
                <>
                  <div className="bg-black/50 rounded-xl p-3 text-center border border-white/5">
                    <p className="text-gray-400 text-xs">Total Wins</p>
                    <p className="text-2xl font-bold text-yellow-400">🏆 {selectedWinner.wins || 0}</p>
                  </div>
                  <div className="bg-black/50 rounded-xl p-3 text-center border border-white/5">
                    <p className="text-gray-400 text-xs">Top 3 Finishes</p>
                    <p className="text-2xl font-bold text-green-400">🔥 {selectedWinner.top3 || 0}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-black/50 rounded-xl p-3 text-center border border-white/5">
                    <p className="text-gray-400 text-xs">Matches Played</p>
                    <p className="text-2xl font-bold text-blue-400">⚔️ {selectedWinner.matchesPlayed || 0}</p>
                  </div>
                  <div className="bg-black/50 rounded-xl p-3 text-center border border-white/5">
                    <p className="text-gray-400 text-xs">Total Kills</p>
                    <p className="text-2xl font-bold text-red-500">💀 {selectedWinner.totalKills || 0}</p>
                  </div>
                </>
              )}
              <div className="bg-black/50 rounded-xl p-3 text-center border border-white/5">
                <p className="text-gray-400 text-xs">Total Earnings</p>
                <p className="text-2xl font-bold text-purple-400">🪙 {selectedWinner.totalWinnings || 0}</p>
              </div>
            </div>

            {/* Tournament History */}
            <h3 className="text-xl font-black text-orange-400 mb-4">📜 TOURNAMENT HISTORY</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {selectedWinner.tournamentsWon?.length > 0 ? (
                selectedWinner.tournamentsWon.map((tournament, idx) => (
                  <div key={idx} className="bg-black/30 rounded-xl p-4 border border-gray-700 hover:border-yellow-500/30 transition">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div>
                        <p className="text-orange-400 font-bold text-lg">{tournament.tournamentTitle}</p>
                        {leaderboardTab === "classic" ? (
                          <p className={`text-sm font-bold ${getPositionColor(tournament.position)} mt-1 flex items-center gap-1`}>
                            Rank: <span>{getPositionBadge(tournament.position)}</span>
                          </p>
                        ) : (
                          <div className="flex items-center gap-4 mt-1 text-sm">
                            <span className="text-red-400 font-bold">💀 {tournament.kills} Kills</span>
                            {tournament.position > 0 && (
                              <span className={`font-bold ${getPositionColor(tournament.position)} flex items-center gap-1`}>
                                Rank: {getPositionBadge(tournament.position)}
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-gray-500 text-xs mt-1">📅 {tournament.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold text-lg">🪙 {tournament.winCoins}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-black/30 rounded-xl">
                  <p className="text-gray-400">No tournament history found</p>
                  <p className="text-gray-500 text-sm mt-2">This player hasn't won any tournaments yet</p>
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowDetailsPopup(false)}
              className="w-full mt-6 py-3 rounded-xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 text-white hover:from-yellow-500 hover:to-orange-500 transition"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </section>
  );
}