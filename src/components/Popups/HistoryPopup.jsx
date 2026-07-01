import { useMemo } from "react";

export default function HistoryPopup({ 
  user, 
  joinedHistory, 
  playerResults, 
  matchResults,
  onClose, 
  onDeleteHistory, 
  onDeleteMatch,
  userStats 
}) {
  const { matchDetails, actualTotalEarnings } = useMemo(() => {
    const detailsMap = {};
    let totalEarningsSum = 0;
    
    if (!user || !joinedHistory) {
      return { matchDetails: detailsMap, actualTotalEarnings: totalEarningsSum };
    }
    
    joinedHistory.forEach((match) => {
      if (match.userEmail === user?.email) {
        let winCoins = 0;
        let position = null;
        let allWinners = [];
        let totalPrizePool = 0;
        
        // Method 1: Check in playerResults
        if (playerResults && playerResults.length > 0) {
          const result = playerResults.find(
            (r) => r.tournamentId === match.tournamentId && r.userId === user?.uid && r.approved === true
          );
          if (result) {
            winCoins = result.winCoins || 0;
            position = result.approvedPosition;
          }
        }
        
        // Method 2: Check in matchResults
        if (matchResults && matchResults.length > 0) {
          const tournamentResult = matchResults.find(
            (m) => m.tournamentId === match.tournamentId
          );
          if (tournamentResult) {
            totalPrizePool = tournamentResult.totalPrizePool || 0;
            allWinners = (tournamentResult.results || []).map(winner => {
              const displayCoins = winner.winCoins || playerResults?.find(
                r => r.tournamentId === match.tournamentId && r.userId === winner.uid && r.approved
              )?.winCoins || 0;
              return { ...winner, winCoins: displayCoins };
            });
            
            // If not found in playerResults, check here
            if (winCoins === 0 && allWinners.length > 0) {
              const winner = allWinners.find(
                (w) => w.uid === user?.uid
              );
              if (winner) {
                winCoins = winner.winCoins || 0;
                position = winner.position;
              }
            }
          }
        }
        
        totalEarningsSum += winCoins;
        
        detailsMap[match.id] = {
          tournamentTitle: match.tournamentTitle,
          gameUid: match.gameUid,
          ingameName: match.ingameName,
          gameLevel: match.gameLevel,
          selectedSlot: match.selectedSlot,
          createdAt: match.createdAt,
          position: position,
          winCoins: winCoins,
          totalPrizePool: totalPrizePool,
          allWinners: allWinners
        };
      }
    });
    
    return { matchDetails: detailsMap, actualTotalEarnings: totalEarningsSum };
  }, [joinedHistory, playerResults, matchResults, user]);

  const userMatches = joinedHistory?.filter((item) => item.userEmail === user?.email) || [];

  const getPositionDisplay = (position) => {
    if (position === 1) return { emoji: "🥇", text: "WINNER", color: "text-yellow-400" };
    if (position === 2) return { emoji: "🥈", text: "RUNNER UP", color: "text-gray-300" };
    if (position === 3) return { emoji: "🥉", text: "2ND RUNNER UP", color: "text-orange-400" };
    return { emoji: `#${position}`, text: `${position}th PLACE`, color: "text-blue-400" };
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 px-4">
      <div className="bg-[#0a0a0f] w-full max-w-5xl rounded-[40px] p-5 md:p-8 border border-blue-500/20 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 md:mb-8 gap-4 md:gap-0">
          <h2 className="text-2xl md:text-4xl font-black text-blue-400 text-center md:text-left">📜 MATCH HISTORY</h2>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 w-full md:w-auto">
            <button
              onClick={onDeleteHistory}
              className="bg-orange-500 text-black px-4 md:px-5 py-2 rounded-xl md:rounded-2xl font-black text-sm md:text-base hover:bg-orange-600 transition flex-1 md:flex-none text-center"
            >
              🗑 DELETE ALL
            </button>
            <button onClick={onClose} className="bg-red-500 text-white px-4 md:px-5 py-2 rounded-xl md:rounded-2xl font-black text-sm md:text-base hover:bg-red-600 transition flex-1 md:flex-none text-center">
              CLOSE
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-black/50 rounded-2xl p-4 border border-orange-500/20">
            <p className="text-gray-400 text-sm">Matches Played</p>
            <p className="text-3xl font-black text-orange-500">🎮 {userStats?.matchesPlayed || 0}</p>
          </div>
          <div className="bg-black/50 rounded-2xl p-4 border border-yellow-500/20">
            <p className="text-gray-400 text-sm">Total Wins</p>
            <p className="text-3xl font-black text-yellow-400">🏆 {userStats?.wins || 0}</p>
          </div>
          <div className="bg-black/50 rounded-2xl p-4 border border-green-500/20">
            <p className="text-gray-400 text-sm">Win Rate</p>
            <p className="text-3xl font-black text-green-400">🔥 {userStats?.winRate || 0}%</p>
          </div>
          <div className="bg-black/50 rounded-2xl p-4 border border-purple-500/20">
            <p className="text-gray-400 text-sm">Total Earned</p>
            <p className="text-3xl font-black text-purple-400">🪙 {actualTotalEarnings}</p>
          </div>
        </div>

        {/* Match History List */}
        <div className="space-y-6 max-h-[450px] overflow-y-auto pr-2">
          {userMatches.length > 0 ? (
            [...userMatches].reverse().map((item) => {
              const detail = matchDetails[item.id] || {};
              const wonCoins = detail.winCoins || 0;
              const position = detail.position;
              const positionDisplay = getPositionDisplay(position);
              const allWinners = detail.allWinners || [];
              const totalPrizePool = detail.totalPrizePool || 0;

              return (
                <div key={item.id} className="bg-gradient-to-br from-gray-900/50 to-black rounded-2xl border border-blue-500/20 overflow-hidden">
                  
                  {/* Match Header */}
                  <div className="bg-gradient-to-r from-orange-900/30 to-transparent p-4 border-b border-blue-500/20">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <h3 className="text-xl font-black text-orange-500">{detail.tournamentTitle || item.tournamentTitle}</h3>
                      {wonCoins > 0 ? (
                        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold">
                          ✅ Received: 🪙 {wonCoins}
                        </span>
                      ) : (
                        <span className="bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full text-xs">
                          ⏳ No Prize Yet
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs mt-1">📅 {detail.createdAt || item.createdAt}</p>
                  </div>
                  
                  {/* Your Performance */}
                  <div className="p-4 border-b border-gray-800">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">🎯 YOUR PERFORMANCE</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-gray-500 text-xs">UID</p>
                        <p className="text-white font-mono text-sm">{detail.gameUid || item.gameUid}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">IGN</p>
                        <p className="text-white font-bold">{detail.ingameName || item.ingameName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Level</p>
                        <p className="text-blue-400">{detail.gameLevel || item.gameLevel}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Slot</p>
                        <p className="text-orange-400">#{detail.selectedSlot || item.selectedSlot}</p>
                      </div>
                    </div>
                    
                    {/* Position & Prize */}
                    <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-gray-800">
                      <div>
                        <p className="text-gray-500 text-xs">🏆 FINAL POSITION</p>
                        {position ? (
                          <div className="mt-1">
                            <span className={`text-3xl ${positionDisplay.color}`}>{positionDisplay.emoji}</span>
                            <p className={`font-black text-lg ${positionDisplay.color}`}>{positionDisplay.text}</p>
                          </div>
                        ) : (
                          <p className="text-gray-500 mt-1">-</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-gray-500 text-xs">💰 PRIZE RECEIVED</p>
                        {wonCoins > 0 ? (
                          <div className="mt-1">
                            <p className="text-green-400 font-black text-3xl cyber-prize">🪙 {wonCoins}</p>
                            <p className="text-gray-500 text-xs">Coins</p>
                          </div>
                        ) : (
                          <p className="text-gray-500 mt-1">-</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Complete Prize Distribution */}
                  {allWinners.length > 0 && (
                    <div className="p-4 bg-black/30">
                      <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">
                        🏅 COMPLETE PRIZE DISTRIBUTION (Total Prize Pool: 🪙 {totalPrizePool})
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {allWinners
                          .sort((a, b) => Number(a.position) - Number(b.position))
                          .map((winner, idx) => (
                            <div 
                              key={idx} 
                              className={`rounded-xl p-2 text-center ${
                                winner.uid === user?.uid 
                                  ? "bg-orange-500/20 border border-orange-500/30" 
                                  : "bg-gray-800/30"
                              }`}
                            >
                              <div className="flex items-center justify-center gap-1">
                                <span className="text-sm">
                                  {Number(winner.position) === 1 ? "🥇" : 
                                   Number(winner.position) === 2 ? "🥈" : 
                                   Number(winner.position) === 3 ? "🥉" : `#${winner.position}`}
                                </span>
                                <span className={`text-xs font-bold truncate max-w-[60px] ${winner.uid === user?.uid ? "text-orange-400" : "text-gray-300"}`}>
                                  {(winner.name || winner.playerName || "Unknown").substring(0, 10)}
                                </span>
                              </div>
                              <p className="text-yellow-400 font-bold text-sm">🪙 {winner.winCoins || 0}</p>
                              {winner.uid === user?.uid && (
                                <span className="text-[10px] text-green-400">(You)</span>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Delete Button - Only show if match has results (completed) */}
                  {(detail.position !== null || detail.totalPrizePool > 0 || allWinners.length > 0) && (
                    <div className="p-3 bg-red-500/5">
                      <button
                        onClick={() => onDeleteMatch(item.id)}
                        className="w-full bg-red-500/20 text-red-400 px-4 py-2 rounded-xl font-black text-sm hover:bg-red-500/30 transition"
                      >
                        🗑 DELETE COMPLETED MATCH
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 bg-black/30 rounded-2xl">
              <p className="text-gray-400 text-lg">No matches played yet</p>
              <p className="text-gray-500 text-sm mt-2">Join a tournament to see your history!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}