import { useState, useEffect } from "react";
import { ref, get } from "firebase/database";
import { database } from "../../firebase";

export default function UserHistoryPopup({ userData, onClose }) {
  const [userHistory, setUserHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    matchesPlayed: 0,
    totalWins: 0,
    totalEarned: 0,
  });

  useEffect(() => {
    const fetchUserHistory = async () => {
      if (!userData?.uid) return;
      
      setLoading(true);
      try {
        // Fetch joined history
        const joinedRef = ref(database, "joinedPlayers");
        const joinedSnap = await get(joinedRef);
        const joinedData = joinedSnap.val();
        
        const userMatches = [];
        if (joinedData) {
          Object.values(joinedData).forEach((match) => {
            if (match.userId === userData.uid || match.userEmail === userData.email) {
              userMatches.push({ id: Object.keys(joinedData).find(key => joinedData[key] === match), ...match });
            }
          });
        }
        
        // Fetch match results
        const resultsRef = ref(database, "matchResults");
        const resultsSnap = await get(resultsRef);
        const resultsData = resultsSnap.val();

        // Fetch playerResults
        const playerResultsRef = ref(database, "playerResults");
        const playerResultsSnap = await get(playerResultsRef);
        const playerResultsData = playerResultsSnap.val();
        const playerResultsList = playerResultsData 
          ? Object.keys(playerResultsData).map(k => ({ id: k, ...playerResultsData[k] }))
          : [];
        
        let totalWins = 0;
        let totalEarned = 0;
        
        const matchesWithDetails = await Promise.all(userMatches.map(async (match) => {
          let winCoins = 0;
          let position = null;
          let allWinners = [];
          let totalPrizePool = 0;
          
          // Check in matchResults
          if (resultsData) {
            const tournamentResult = Object.values(resultsData).find(
              (m) => m.tournamentId === match.tournamentId
            );
            if (tournamentResult) {
              totalPrizePool = tournamentResult.totalPrizePool || 0;
              allWinners = (tournamentResult.results || []).map(w => {
                const winnerUid = w.uid || w.userId || w.id;
                const coins = w.winCoins || playerResultsList.find(
                  r => (r.tournamentId === match.tournamentId || r.tournamentId === tournamentResult.id) && r.userId === winnerUid && r.approved
                )?.winCoins || 0;
                return { ...w, winCoins: coins };
              });
              const winner = allWinners.find((w) => w.uid === userData.uid);
              if (winner) {
                winCoins = winner.winCoins;
                position = winner.position;
                if (position === 1) totalWins++;
                totalEarned += winCoins;
              }
            }
          }
          
          return {
            ...match,
            winCoins,
            position,
            allWinners,
            totalPrizePool
          };
        }));
        
        setUserHistory(matchesWithDetails.reverse());
        setUserStats({
          matchesPlayed: userMatches.length,
          totalWins: totalWins,
          totalEarned: totalEarned
        });
      } catch (error) {
        console.error("Error fetching user history:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserHistory();
  }, [userData]);

  const getPositionBadge = (position) => {
    if (position === 1) return <span className="text-yellow-400">🥇 1st</span>;
    if (position === 2) return <span className="text-gray-300">🥈 2nd</span>;
    if (position === 3) return <span className="text-orange-400">🥉 3rd</span>;
    return <span className="text-blue-400">#{position}</span>;
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 px-4">
      <div className="bg-[#0a0a0f] w-full max-w-5xl rounded-[40px] p-5 md:p-8 border border-purple-500/20 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
           
            
          </div>
          <button onClick={onClose} className="bg-red-500 text-white px-5 py-2 rounded-2xl font-black hover:bg-red-600 transition">
            CLOSE
          </button>
        </div>

<div>
  <h2 className="text-3xl md:text-4xl font-black text-purple-400 cyber-neon">📜 USER MATCH HISTORY</h2>
  <p className="text-gray-400 mt-1">
    👤 <span className="text-orange-400 font-bold">{userData?.name || "Unknown"}</span> 
    <span className="text-gray-500 ml-2">|</span> 
    🆔 {userData?.uid?.substring(0, 8)}...
    <span className="text-gray-500 ml-2">|</span>
    📧 {userData?.email}
  </p>
</div>
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-orange-900/20 to-black rounded-2xl p-4 border border-orange-500/20 text-center">
            <p className="text-gray-400 text-sm">Matches Played</p>
            <p className="text-3xl font-black text-orange-500">🎮 {userStats.matchesPlayed}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-900/20 to-black rounded-2xl p-4 border border-yellow-500/20 text-center">
            <p className="text-gray-400 text-sm">Total Wins</p>
            <p className="text-3xl font-black text-yellow-400">🏆 {userStats.totalWins}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-900/20 to-black rounded-2xl p-4 border border-purple-500/20 text-center">
            <p className="text-gray-400 text-sm">Total Earned</p>
            <p className="text-3xl font-black text-purple-400">🪙 {userStats.totalEarned}</p>
          </div>
        </div>

        {/* History List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading history...</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
            {userHistory.length > 0 ? (
              userHistory.map((match, idx) => (
                <div key={idx} className="bg-black/40 rounded-2xl p-4 border border-purple-500/20">
                  <div className="flex justify-between items-start flex-wrap gap-2 mb-3">
                    <h3 className="text-lg font-black text-orange-500">{match.tournamentTitle}</h3>
                    {match.winCoins > 0 ? (
                      <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold">
                        Won: 🪙 {match.winCoins}
                      </span>
                    ) : (
                      <span className="bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full text-xs">No Prize</span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-gray-500 text-xs">UID</p>
                      <p className="text-white font-mono text-xs">{match.gameUid}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">IGN</p>
                      <p className="text-white">{match.ingameName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Level</p>
                      <p className="text-blue-400">{match.gameLevel}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Slot</p>
                      <p className="text-orange-400">#{match.selectedSlot}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Position</p>
                      <p className="font-bold">{getPositionBadge(match.position)}</p>
                    </div>
                  </div>
                  
                  {match.allWinners?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-800">
                      <p className="text-gray-400 text-xs mb-2">🏆 Tournament Winners:</p>
                      <div className="flex flex-wrap gap-2">
                        {match.allWinners.slice(0, 5).map((winner, i) => (
                          <div key={i} className={`text-xs px-2 py-1 rounded-full ${winner.uid === userData?.uid ? "bg-orange-500/20 text-orange-400" : "bg-gray-800 text-gray-300"}`}>
                            {winner.position === 1 ? "🥇" : winner.position === 2 ? "🥈" : winner.position === 3 ? "🥉" : `#${winner.position}`} {winner.name || winner.playerName || "Unknown"} 🪙{winner.winCoins}
                          </div>
                        ))}
                        {match.allWinners.length > 5 && (
                          <span className="text-xs text-gray-500">+{match.allWinners.length - 5} more</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-gray-500 text-xs mt-3">📅 {match.createdAt}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-16 bg-black/30 rounded-2xl">
                <p className="text-gray-400">No match history found for this user</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}