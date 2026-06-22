import { useState, useEffect, useMemo } from "react";
import { ref, onValue } from "firebase/database";
import { collection, onSnapshot } from "firebase/firestore";
import { database, db } from "../firebase";

export default function TournamentWinners() {
  const [matchResults, setMatchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [userNames, setUserNames] = useState({});
  const [playerResults, setPlayerResults] = useState([]);

  // Subscribe to Firestore users collection for real-time name resolution
  useEffect(() => {
    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const namesMap = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        namesMap[doc.id] = data.name || data.email?.split('@')[0] || "Player";
      });
      setUserNames(namesMap);
    }, (error) => {
      console.error("Error subscribing to users for winners:", error);
    });
    return () => unsubscribe();
  }, []);

  // Fetch playerResults from database
  useEffect(() => {
    const resultsRef = ref(database, "playerResults");
    const unsubscribe = onValue(resultsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedData = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        setPlayerResults(loadedData);
      } else {
        setPlayerResults([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch matchResults from database
  useEffect(() => {
    const matchResultsRef = ref(database, "matchResults");
    
    const unsubscribe = onValue(matchResultsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const tournaments = Object.keys(data).map((key) => ({
          id: key,
          ...data[key]
        }));
        setMatchResults(tournaments);
      } else {
        setMatchResults([]);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Enrich completed tournaments via useMemo
  const completedTournaments = useMemo(() => {
    const parseDate = (dateStr) => {
      if (!dateStr) return 0;
      try {
        // Explicitly parse DD/MM/YYYY format to avoid US/UK format bugs
        const cleaned = dateStr.replace(/,/g, '').trim();
        const parts = cleaned.split(/\s+/);
        if (parts.length >= 1) {
          const dateParts = parts[0].split('/');
          if (dateParts.length === 3) {
            const day = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10) - 1; // 0-indexed month
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
        // Fallback if the format is different
        let fallbackTime = Date.parse(dateStr);
        if (!isNaN(fallbackTime)) return fallbackTime;
      } catch (e) {
        console.error("Failed to parse date:", dateStr, e);
      }
      return 0;
    };

    const sorted = [...matchResults].sort((a, b) => {
      const timeA = parseDate(a.createdAt);
      const timeB = parseDate(b.createdAt);
      if (timeA !== timeB) {
        return timeB - timeA; // Descending (newest first)
      }
      return (b.id || "").localeCompare(a.id || "");
    });
    
    // Enrich winners with names and winCoins
    return sorted.map(tournament => {
      const enrichedTournament = { ...tournament };
      if (enrichedTournament.results) {
        enrichedTournament.results = enrichedTournament.results.map(winner => {
          const winnerUid = winner.uid || winner.userId || winner.id;
          const name = winner.name || winner.playerName || userNames[winnerUid] || winnerUid?.substring(0, 8) || "Unknown";
          const coins = winner.winCoins || playerResults.find(
            r => r.tournamentId === enrichedTournament.id && r.userId === winnerUid && r.approved
          )?.winCoins || playerResults.find(
            r => r.tournamentId === enrichedTournament.tournamentId && r.userId === winnerUid && r.approved
          )?.winCoins || 0;
          return {
            ...winner,
            uid: winnerUid,
            name: name,
            winCoins: coins
          };
        });
      }
      return enrichedTournament;
    });
  }, [matchResults, userNames, playerResults]);


  const getMedal = (position) => {
    if (position === 1) return "🥇";
    if (position === 2) return "🥈";
    if (position === 3) return "🥉";
    return `#${position}`;
  };

  const getMedalColor = (position) => {
    if (position === 1) return "text-yellow-400";
    if (position === 2) return "text-gray-300";
    if (position === 3) return "text-orange-400";
    return "text-blue-400";
  };

  const getWinnerName = (winner) => {
    const explicitName = winner.name || winner.playerName;
    if (explicitName && explicitName !== "Unknown" && explicitName !== "undefined") {
      return explicitName;
    }
    const winnerUid = winner.uid || winner.userId || winner.id;
    if (winnerUid) {
      if (userNames[winnerUid]) {
        return userNames[winnerUid];
      }
      return winnerUid.substring(0, 10) + "...";
    }
    return "Anonymous Player";
  };

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="text-gray-400 mt-3">Loading winners...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-6 py-10">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-black text-yellow-400 mb-2 cyber-neon">🏆 TOURNAMENT WINNERS</h2>
        <p className="text-gray-400 text-sm">Recent tournament champions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {completedTournaments.slice(0, 6).map((tournament) => {
          const top3Winners = tournament.results
            ?.filter(w => w.position <= 3)
            .sort((a, b) => a.position - b.position) || [];
          
          return (
            <div 
              key={tournament.id} 
              className="bg-gradient-to-br from-gray-900/80 to-black rounded-2xl p-5 border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300 cursor-pointer"
              onClick={() => {
                setSelectedTournament(tournament);
                setShowDetails(true);
              }}
            >
              {/* Tournament Header */}
              <div className="border-b border-gray-700 pb-3 mb-4">
                <h3 className="text-lg font-bold text-orange-400 truncate">{tournament.tournamentTitle || "Unknown Tournament"}</h3>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-purple-400">🎮 {tournament.tournamentType || "Unknown"}</span>
                  <span className="text-xs text-gray-500">📅 {tournament.createdAt || "Unknown date"}</span>
                </div>
              </div>

              {/* Prize Pool */}
              <div className="text-center mb-4">
                <span className="text-yellow-400 text-sm">💰 Prize Pool</span>
                <p className="text-2xl font-bold text-green-400">🪙 {tournament.totalPrizePool || 0}</p>
              </div>

              {/* Top 3 Winners */}
              <div className="space-y-3">
                <p className="text-gray-400 text-xs text-center">🏆 TOP 3 WINNERS</p>
                
                {/* 1st Place */}
                {top3Winners[0] && (
                  <div className="flex justify-between items-center bg-yellow-500/10 rounded-xl p-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🥇</span>
                      <div>
                        <p className="text-white font-bold text-sm truncate max-w-[120px]">
                          {getWinnerName(top3Winners[0])}
                        </p>
                        <p className="text-gray-500 text-xs">1st Place</p>
                      </div>
                    </div>
                    <span className="text-green-400 font-bold text-lg">🪙 {top3Winners[0].winCoins || 0}</span>
                  </div>
                )}

                {/* 2nd Place */}
                {top3Winners[1] && (
                  <div className="flex justify-between items-center bg-gray-500/10 rounded-xl p-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🥈</span>
                      <div>
                        <p className="text-white font-bold text-sm truncate max-w-[120px]">
                          {getWinnerName(top3Winners[1])}
                        </p>
                        <p className="text-gray-500 text-xs">2nd Place</p>
                      </div>
                    </div>
                    <span className="text-green-400 font-bold text-lg">🪙 {top3Winners[1].winCoins || 0}</span>
                  </div>
                )}

                {/* 3rd Place */}
                {top3Winners[2] && (
                  <div className="flex justify-between items-center bg-orange-500/10 rounded-xl p-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🥉</span>
                      <div>
                        <p className="text-white font-bold text-sm truncate max-w-[120px]">
                          {getWinnerName(top3Winners[2])}
                        </p>
                        <p className="text-gray-500 text-xs">3rd Place</p>
                      </div>
                    </div>
                    <span className="text-green-400 font-bold text-lg">🪙 {top3Winners[2].winCoins || 0}</span>
                  </div>
                )}
              </div>

              {/* View Details Link */}
              <div className="mt-4 text-center">
                <span className="text-yellow-500/60 text-xs hover:text-yellow-400 transition">
                  👆 Click to view all winners
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {completedTournaments.length === 0 && (
        <div className="text-center py-16 bg-black/30 rounded-2xl">
          <p className="text-gray-400 text-lg">No completed tournaments yet</p>
          <p className="text-gray-500 text-sm mt-2">Winners will appear here after tournaments are completed</p>
        </div>
      )}

      {/* Winner Details Popup */}
      {showDetails && selectedTournament && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 px-4">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-yellow-500/20">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-yellow-500/20">
              <div>
                <h2 className="text-2xl font-black text-orange-400">{selectedTournament.tournamentTitle || "Unknown Tournament"}</h2>
                <div className="flex gap-3 mt-1">
                  <span className="text-purple-400 text-sm">🎮 {selectedTournament.tournamentType || "Unknown"}</span>
                  <span className="text-blue-400 text-sm">🗺️ {selectedTournament.map || "Unknown"}</span>
                </div>
                <p className="text-gray-500 text-xs mt-1">📅 {selectedTournament.createdAt || "Unknown date"}</p>
              </div>
              <button 
                onClick={() => setShowDetails(false)} 
                className="bg-red-500 text-white px-4 py-2 rounded-xl font-black hover:bg-red-600 transition"
              >
                ✕ CLOSE
              </button>
            </div>

            {/* Prize Info */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-yellow-500/10 rounded-xl">
              <div className="text-center">
                <p className="text-gray-400 text-sm">Total Prize Pool</p>
                <p className="text-2xl font-bold text-yellow-400">🪙 {selectedTournament.totalPrizePool || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">Total Winners</p>
                <p className="text-2xl font-bold text-green-400">👥 {selectedTournament.results?.length || 0}</p>
              </div>
            </div>

            {/* All Winners Table */}
            <h3 className="text-xl font-black text-green-400 mb-4">🏆 ALL WINNERS</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {selectedTournament.results?.sort((a, b) => a.position - b.position).map((winner, idx) => (
                <div key={idx} className={`flex justify-between items-center p-3 rounded-xl ${
                  winner.position === 1 ? "bg-yellow-500/20 border border-yellow-500/30" :
                  winner.position === 2 ? "bg-gray-500/20 border border-gray-500/30" :
                  winner.position === 3 ? "bg-orange-500/20 border border-orange-500/30" :
                  "bg-black/40 border border-gray-800"
                }`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={`text-xl ${getMedalColor(winner.position)}`}>
                      {getMedal(winner.position)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium truncate">{getWinnerName(winner)}</p>
                      <p className="text-gray-500 text-xs truncate">UID: {winner.uid?.substring(0, 10)}...</p>
                    </div>
                  </div>
                  <span className="text-green-400 font-bold text-lg ml-2">🪙 {winner.winCoins || 0}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowDetails(false)}
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