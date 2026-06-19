import { useMemo } from "react";

export default function PerKillHistoryPopup({ 
  user, 
  joinedHistory, 
  matchResults,
  onClose, 
  onDeleteHistory, 
  onDeleteMatch 
}) {
  const { matchDetails, stats } = useMemo(() => {
    const detailsMap = {};
    let totalKills = 0;
    let totalEarnings = 0;
    let completedMatchesCount = 0;
    
    const userMatches = joinedHistory?.filter(m => m.userId === user?.uid) || [];
    
    userMatches.forEach((match) => {
      let winCoins = 0;
      let position = 0;
      let kills = 0;
      let completed = false;
      let allWinners = [];
      let perKillRate = 0;
      let positionBonus = 0;
      
      // Look for results
      if (matchResults && matchResults.length > 0) {
        const tournamentResult = matchResults.find(
          (m) => m.tournamentId === match.tournamentId
        );
        if (tournamentResult) {
          completed = true;
          completedMatchesCount++;
          perKillRate = tournamentResult.perKillRate || 0;
          allWinners = (tournamentResult.results || []).map(r => ({
            ...r,
            positionBonus: r.position === 1 ? tournamentResult.booyahBonus : r.position === 2 ? tournamentResult.secondBonus : r.position === 3 ? tournamentResult.thirdBonus : 0,
            winCoins: (r.kills * tournamentResult.perKillRate) + (r.position === 1 ? tournamentResult.booyahBonus : r.position === 2 ? tournamentResult.secondBonus : r.position === 3 ? tournamentResult.thirdBonus : 0)
          }));
          
          const playerResult = tournamentResult.results?.find(r => r.userId === user?.uid);
          if (playerResult) {
            kills = playerResult.kills || 0;
            position = playerResult.position || 0;
            positionBonus = position === 1 ? tournamentResult.booyahBonus : position === 2 ? tournamentResult.secondBonus : position === 3 ? tournamentResult.thirdBonus : 0;
            winCoins = (kills * perKillRate) + positionBonus;
            
            totalKills += kills;
            totalEarnings += winCoins;
          }
        }
      }
      
      detailsMap[match.id] = {
        tournamentTitle: match.tournamentTitle,
        gameUid: match.gameUid,
        ingameName: match.ingameName,
        gameLevel: match.gameLevel,
        selectedSlot: match.selectedSlot,
        createdAt: match.createdAt,
        coinsDeducted: match.coinsDeducted || 0,
        completed: completed,
        position: position,
        kills: kills,
        positionBonus: positionBonus,
        winCoins: winCoins,
        perKillRate: perKillRate,
        allWinners: allWinners
      };
    });
    
    const matchesPlayed = userMatches.length;
    const avgKills = completedMatchesCount > 0 ? (totalKills / completedMatchesCount).toFixed(1) : "0.0";
    
    return { 
      matchDetails: detailsMap, 
      stats: {
        matchesPlayed,
        totalKills,
        avgKills,
        totalEarnings
      }
    };
  }, [joinedHistory, matchResults, user]);

  const userMatches = joinedHistory?.filter((item) => item.userId === user?.uid) || [];

  const getPositionDisplay = (position) => {
    if (position === 1) return { emoji: "🥇", text: "1ST PLACE (BOOYAH)", color: "text-yellow-400" };
    if (position === 2) return { emoji: "🥈", text: "2ND PLACE", color: "text-gray-300" };
    if (position === 3) return { emoji: "🥉", text: "3RD PLACE", color: "text-orange-400" };
    return { emoji: "💀", text: "PARTICIPATED", color: "text-red-400" };
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 px-4">
      <div className="bg-[#0a0a0f] w-full max-w-5xl rounded-[40px] p-5 md:p-8 border border-red-500/20 max-h-[90vh] overflow-y-auto custom-scrollbar scroll-smooth">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 md:mb-8 gap-4 md:gap-0">
          <div>
            <h2 className="text-2xl md:text-4xl font-black text-red-500 text-glow-orange tracking-wider cyber-neon">⚔️ PER KILL MATCH HISTORY</h2>
            <p className="text-gray-500 text-xs mt-1 text-center md:text-left">Track your earnings and kills for Per Kill Mode Tournaments.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 w-full md:w-auto">
            <button
              onClick={() => onDeleteHistory(user?.email)}
              className="bg-orange-500 text-black px-4 md:px-5 py-2 rounded-xl md:rounded-2xl font-black text-sm md:text-base hover:bg-orange-600 transition flex-1 md:flex-none text-center"
            >
              🗑 DELETE ALL
            </button>
            <button onClick={onClose} className="bg-red-600 text-white px-4 md:px-5 py-2 rounded-xl md:rounded-2xl font-black text-sm md:text-base hover:bg-red-700 transition flex-1 md:flex-none text-center">
              CLOSE
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-black/50 rounded-2xl p-4 border border-orange-500/20">
            <p className="text-gray-400 text-sm">Matches Played</p>
            <p className="text-3xl font-black text-orange-500">⚔️ {stats.matchesPlayed || 0}</p>
          </div>
          <div className="bg-black/50 rounded-2xl p-4 border border-red-500/20">
            <p className="text-gray-400 text-sm">Total Kills</p>
            <p className="text-3xl font-black text-red-500">💀 {stats.totalKills || 0}</p>
          </div>
          <div className="bg-black/50 rounded-2xl p-4 border border-green-500/20">
            <p className="text-gray-400 text-sm">Avg Kills/Match</p>
            <p className="text-3xl font-black text-green-400">📊 {stats.avgKills}</p>
          </div>
          <div className="bg-black/50 rounded-2xl p-4 border border-yellow-500/20">
            <p className="text-gray-400 text-sm">Total Earned</p>
            <p className="text-3xl font-black text-yellow-400">🪙 {stats.totalEarnings}</p>
          </div>
        </div>

        {/* Match History List */}
        <div className="space-y-6 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar scroll-smooth">
          {userMatches.length > 0 ? (
            [...userMatches].reverse().map((item) => {
              const detail = matchDetails[item.id] || {};
              const wonCoins = detail.winCoins || 0;
              const position = detail.position;
              const positionDisplay = getPositionDisplay(position);
              const allWinners = detail.allWinners || [];
              const perKillRate = detail.perKillRate || 0;
              const kills = detail.kills || 0;
              const positionBonus = detail.positionBonus || 0;

              return (
                <div key={item.id} className="bg-gradient-to-br from-gray-900/50 to-black rounded-2xl border border-red-500/10 overflow-hidden hover:border-red-500/20 transition duration-300">
                  
                  {/* Match Header */}
                  <div className="bg-gradient-to-r from-red-950/20 to-transparent p-4 border-b border-gray-800 flex justify-between items-center flex-wrap gap-4">
                    <div>
                      <h3 className="text-xl font-black text-orange-500">{detail.tournamentTitle || item.tournamentTitle}</h3>
                      <p className="text-gray-400 text-xs mt-1">📅 {detail.createdAt || item.createdAt}</p>
                    </div>
                    <div>
                      {detail.completed ? (
                        <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">
                          ✅ Completed
                        </span>
                      ) : (
                        <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold border border-yellow-500/20">
                          ⏳ Waiting for Results
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Match Performance Details */}
                  <div className="p-4 border-b border-gray-800">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">🎯 MATCH DETAILS</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-gray-500 text-xs">IGN</p>
                        <p className="text-white font-bold">{detail.ingameName || item.ingameName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Game UID</p>
                        <p className="text-white font-mono text-sm">{detail.gameUid || item.gameUid}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Slot Number</p>
                        <p className="text-orange-400 font-bold">#{detail.selectedSlot || item.selectedSlot}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Entry Fee Paid</p>
                        <p className="text-red-400 font-bold">🪙 {detail.coinsDeducted || item.coinsDeducted} Coins</p>
                      </div>
                    </div>
                    
                    {/* Performance Metrics */}
                    {detail.completed && (
                      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-800">
                        <div>
                          <p className="text-gray-500 text-xs">⚔️ KILLS</p>
                          <p className="text-white font-black text-2xl mt-1">{kills} Kills</p>
                          <p className="text-gray-500 text-[10px] mt-0.5">(🪙 {kills * perKillRate} @ 🪙 {perKillRate}/kill)</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">🏆 POSITION</p>
                          <span className={`text-2xl mt-1 block`}>{positionDisplay.emoji}</span>
                          <p className={`font-black text-xs ${positionDisplay.color}`}>{positionDisplay.text}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-500 text-xs">💰 TOTAL EARNED</p>
                          <p className="text-green-400 font-black text-2xl mt-1">🪙 {wonCoins}</p>
                          <p className="text-gray-500 text-[10px] mt-0.5">(Incl. 🪙 {positionBonus} Place Bonus)</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Complete Leaderboard / Results */}
                  {detail.completed && allWinners.length > 0 && (
                    <div className="p-4 bg-black/30">
                      <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">
                        🏅 LEADERBOARD & RESULTS
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {allWinners
                          .sort((a, b) => {
                            if (a.position && b.position) return a.position - b.position;
                            if (a.position) return -1;
                            if (b.position) return 1;
                            return b.kills - a.kills;
                          })
                          .map((winner, idx) => (
                            <div 
                              key={idx} 
                              className={`rounded-xl p-2.5 text-center ${
                                winner.userId === user?.uid 
                                  ? "bg-red-500/10 border border-red-500/20" 
                                  : "bg-gray-800/30 border border-transparent"
                              }`}
                            >
                              <div className="flex items-center justify-center gap-1.5 mb-1">
                                <span className="text-sm">
                                  {winner.position === 1 ? "🥇" : 
                                   winner.position === 2 ? "🥈" : 
                                   winner.position === 3 ? "🥉" : "⚔️"}
                                </span>
                                <span className={`text-xs font-bold truncate max-w-[80px] ${winner.userId === user?.uid ? "text-red-400" : "text-gray-300"}`}>
                                  {winner.ingameName || winner.name}
                                </span>
                              </div>
                              <p className="text-gray-400 text-[10px] mb-0.5">{winner.kills} kills</p>
                              <p className="text-yellow-500 font-black text-xs">🪙 {winner.winCoins}</p>
                              {winner.userId === user?.uid && (
                                <span className="text-[9px] text-red-400 font-bold mt-1 block">(You)</span>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Delete Button */}
                  <div className="p-3 bg-red-500/5">
                    <button
                      onClick={() => onDeleteMatch(item.id)}
                      className="w-full bg-red-500/10 text-red-400 px-4 py-2 rounded-xl font-black text-sm hover:bg-red-500/20 transition"
                    >
                      🗑 DELETE THIS RECORD
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 bg-black/30 rounded-[30px] border border-red-500/5">
              <p className="text-gray-400 text-lg">No Per Kill matches played yet</p>
              <p className="text-gray-500 text-sm mt-2">Register in a Per Kill tournament to see your history!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
