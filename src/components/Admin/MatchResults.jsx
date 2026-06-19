import { useState, useEffect } from "react";
import { ref, onValue, update, remove, push } from "firebase/database";
import { database, db } from "../../firebase";
import { doc, updateDoc, increment, getDoc } from "firebase/firestore";
import { getPrizeDistribution, calculateFinalDistribution } from "../../utils/prizeDistribution";
import { logCoinTransaction } from "../../utils/coinHistory";

export default function MatchResults({ 
  matchResults, 
  isAdmin, 
  joinedPlayers, 
  user, 
  onDeleteMatchResult, 
  onDeleteAllMatchResults 
}) {
  const [selectedPublishTournament, setSelectedPublishTournament] = useState(null);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [playerResults, setPlayerResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showPlayerPopup, setShowPlayerPopup] = useState(false);
  const [expandedTournaments, setExpandedTournaments] = useState({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const toggleExpand = (id) => {
    setExpandedTournaments(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Real-time fetch player results
  useEffect(() => {
    const resultsRef = ref(database, "playerResults");
    const unsubscribe = onValue(resultsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedData = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        console.log("📊 Player Results:", loadedData.length);
        setPlayerResults(loadedData);
      } else {
        setPlayerResults([]);
      }
    });
    return () => unsubscribe();
  }, [refreshTrigger]);

  // Handle player click to show UID
  const handlePlayerClick = (player, tournamentId) => {
    setSelectedPlayer({ ...player, tournamentId });
    setShowPlayerPopup(true);
  };

  // ========== APPROVE POSITION ==========
  const handleApprove = async (result) => {
    setLoading(true);
    try {
      await update(ref(database, `playerResults/${result.id}`), {
        approved: true,
        approvedPosition: result.position,
      });
      alert(`✅ Position #${result.position} approved for ${result.playerName}`);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ========== REJECT POSITION (from pending) ==========
  const handleReject = async (result) => {
    setLoading(true);
    try {
      await remove(ref(database, `playerResults/${result.id}`));
      alert(`❌ Result rejected for ${result.playerName}`);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ========== REJECT APPROVED PLAYER (new function) ==========
  const handleRejectApproved = async (player) => {
    if (!window.confirm(`Are you sure you want to REJECT ${player.playerName} (Position #${player.approvedPosition})?`)) {
      return;
    }
    
    setLoading(true);
    try {
      console.log("🔍 Rejecting approved player:", player.id, player.playerName);
      
      // Remove from database
      await remove(ref(database, `playerResults/${player.id}`));
      
      // Send notification
      await push(ref(database, `notifications/${player.userId}`), {
        title: "❌ POSITION REJECTED",
        message: `Your position #${player.approvedPosition} has been rejected by admin.`,
        time: new Date().toLocaleString(),
        seen: false,
      });
      
      alert(`❌ Position #${player.approvedPosition} rejected for ${player.playerName}`);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error rejecting approved player:", error);
      alert("Failed to reject: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ========== FINAL PUBLISH ==========
  const handleFinalPublish = async (tournament) => {
    setLoading(true);
    try {
      const approvedResults = playerResults.filter(
        (r) => r.tournamentId === tournament.id && r.approved === true
      );
      
      if (approvedResults.length === 0) {
        alert("No approved results to publish! Please approve positions first.");
        setLoading(false);
        return;
      }
      
      const totalPrizePool = Number(tournament.currentPrizePool) || Number(tournament.totalPrizePool) || 0;
      const totalPlayers = Number(tournament.totalTeams) || Number(tournament.joinedCount) || 0;
      const tournamentType = tournament.tournamentType;
      
      const { rewards, winnerCount } = getPrizeDistribution(totalPrizePool, totalPlayers, tournamentType, Number(tournament.entryFee) || 0);
      const finalDistribution = calculateFinalDistribution(totalPrizePool, approvedResults, tournamentType, totalPlayers, Number(tournament.entryFee) || 0);
      
      // Preview
      let previewMessage = "🏆 PRIZE DISTRIBUTION PREVIEW 🏆\n\n";
      previewMessage += `📊 Tournament: ${tournament.tournamentTitle}\n`;
      previewMessage += `🎮 Type: ${tournamentType}\n`;
      previewMessage += `👥 Total Players: ${totalPlayers}\n`;
      previewMessage += `💰 Prize Pool: 🪙 ${totalPrizePool}\n`;
      previewMessage += `🏆 Winners: Top ${winnerCount}\n\n`;
      previewMessage += "━━━━━━━━━━━━━━━━━━━━━━\n";
      previewMessage += "📋 REWARD STRUCTURE:\n";
      previewMessage += "━━━━━━━━━━━━━━━━━━━━━━\n";
      
      rewards.forEach(reward => {
        if (reward.perPlayer) {
          previewMessage += `${reward.label} (${reward.percent}%): 🪙 ${reward.perPlayer} Player\n`;
        } else {
          previewMessage += `${reward.label} (${reward.percent}%): 🪙 ${reward.coins}\n`;
        }
      });
      
      previewMessage += "\n━━━━━━━━━━━━━━━━━━━━━━\n";
      previewMessage += "✅ ACTUAL WINNERS:\n";
      previewMessage += "━━━━━━━━━━━━━━━━━━━━━━\n";
      
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
        setLoading(false);
        return;
      }
      
      // Distribute prizes
      for (const player of finalDistribution) {
        try {
          const userRef = doc(db, "users", player.userId);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const currentCoins = userSnap.data()?.coins || 0;
            await updateDoc(userRef, {
              coins: currentCoins + player.winCoins,
              wins: increment(player.approvedPosition === 1 ? 1 : 0),
              top3: increment(player.approvedPosition <= 3 ? 1 : 0),
            });
            await logCoinTransaction(player.userId, player.winCoins, "WINNING", `Prize for Match #${tournament.id} (Position #${player.approvedPosition})`, true);
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
          console.error("Error:", err);
        }
      }
      
      // Save match result
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
        rewardStructure: rewards,
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
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error:", error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDistribution = (tournament) => {
    const approvedResults = playerResults.filter(
      (r) => r.tournamentId === tournament.id && r.approved === true
    );
    
    const totalPrizePool = Number(tournament.currentPrizePool) || Number(tournament.totalPrizePool) || 0;
    const totalPlayers = Number(tournament.totalTeams) || Number(tournament.joinedCount) || 0;
    const tournamentType = tournament.tournamentType;
    const { rewards, winnerCount } = getPrizeDistribution(totalPrizePool, totalPlayers, tournamentType, Number(tournament.entryFee) || 0);
    const distribution = calculateFinalDistribution(totalPrizePool, approvedResults, tournamentType, totalPlayers, Number(tournament.entryFee) || 0);
    
    let message = "🏆 COMPLETE REWARD SYSTEM 🏆\n\n";
    message += `Tournament: ${tournament.tournamentTitle}\n`;
    message += `Type: ${tournamentType}\n`;
    message += `Prize Pool: 🪙 ${totalPrizePool}\n`;
    message += `Winners: Top ${winnerCount}\n\n`;
    message += "━━━━━━━━━━━━━━━━━━━━━━\n";
    message += "REWARD STRUCTURE:\n";
    message += "━━━━━━━━━━━━━━━━━━━━━━\n";
    
    rewards.forEach(reward => {
      if (reward.perPlayer) {
        message += `${reward.label} (${reward.percent}%): 🪙 ${reward.perPlayer} Player\n`;
      } else {
        message += `${reward.label} (${reward.percent}%): 🪙 ${reward.coins}\n`;
      }
    });
    
    message += "\n━━━━━━━━━━━━━━━━━━━━━━\n";
    message += "ACTUAL WINNERS:\n";
    message += "━━━━━━━━━━━━━━━━━━━━━━\n";
    
    distribution.forEach((player, idx) => {
      if (player.winCoins > 0) {
        const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${player.approvedPosition}`;
        message += `${medal} ${player.playerName}: 🪙 ${player.winCoins}\n`;
      }
    });
    
    alert(message);
  };

  const getPendingPlayers = () => {
    if (!selectedPublishTournament) return [];
    return playerResults.filter(
      (r) => r.tournamentId === selectedPublishTournament.id && !r.approved
    );
  };

  const getApprovedPlayers = () => {
    if (!selectedPublishTournament) return [];
    return playerResults.filter(
      (r) => r.tournamentId === selectedPublishTournament.id && r.approved === true
    );
  };

  const getRewardPreview = () => {
    if (!selectedPublishTournament) return null;
    const totalPrizePool = Number(selectedPublishTournament.currentPrizePool) || Number(selectedPublishTournament.totalPrizePool) || 0;
    const totalPlayers = Number(selectedPublishTournament.totalTeams) || Number(selectedPublishTournament.joinedCount) || 0;
    const tournamentType = selectedPublishTournament.tournamentType;
    const { rewards } = getPrizeDistribution(totalPrizePool, totalPlayers, tournamentType, Number(selectedPublishTournament.entryFee) || 0);
    
    return (
      <div className="mb-6 p-4 bg-black/30 rounded-2xl">
        <p className="text-orange-400 font-bold text-sm mb-3">🏆 REWARD SYSTEM PREVIEW:</p>
        <div className="space-y-1 text-sm">
          {rewards.slice(0, 7).map((reward, idx) => (
            <div key={idx} className="flex justify-between items-center">
              <span className="text-gray-300">{reward.label}</span>
              <span className="text-yellow-400 font-bold">
                {reward.perPlayer ? (
                  <>🪙 {reward.perPlayer} Player</>
                ) : (
                  <>🪙 {reward.coins}</>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
          <h2 className="text-3xl sm:text-5xl font-black text-purple-400 cyber-neon">🏆 MATCH RESULTS</h2>
          {isAdmin && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => onDeleteMatchResult?.("COMPLETED")} className="bg-green-500 text-black px-3 py-2 rounded-xl font-black text-sm">
                🗑 DELETE COMPLETED
              </button>
              <button onClick={onDeleteAllMatchResults} className="bg-red-500 text-white px-3 py-2 rounded-xl font-black text-sm">
                🗑 DELETE ALL
              </button>
              <button onClick={() => setRefreshTrigger(prev => prev + 1)} className="bg-blue-500 text-white px-3 py-2 rounded-xl font-black text-sm">
                🔄 REFRESH
              </button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-h-[800px] overflow-y-auto pr-3 custom-scrollbar">
          {matchResults?.slice().reverse().map((item) => (
            <div key={item.id} className="bg-[#111] rounded-3xl p-4 sm:p-8 border border-purple-500/10 cyber-card">
              <div className="flex justify-between mb-6">
                <span className="bg-purple-500/20 text-purple-400 px-4 py-2 rounded-full text-sm font-black">COMPLETED</span>
                <span>{item.tournamentType}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black mb-4">{item.tournamentTitle}</h3>
              <p className="text-blue-400 font-bold mb-4">🗺️ {item.map}</p>
              <div className="space-y-3 mt-5">
                {(() => {
                  const sortedWinners = item.results?.slice().sort((a, b) => Number(a.position) - Number(b.position)) || [];
                  const isExpanded = !!expandedTournaments[item.id];
                  const displayedWinners = isExpanded ? sortedWinners : sortedWinners.slice(0, 3);
                  
                  return (
                    <>
                      {displayedWinners.map((player, index) => {
                        const playerUid = player.uid || player.userId || player.id;
                        const coins = player.winCoins || playerResults.find(
                          r => (r.tournamentId === item.id || r.tournamentId === item.tournamentId) && r.userId === playerUid && r.approved
                        )?.winCoins || 0;
                        return (
                          <div 
                            key={index} 
                            onClick={() => handlePlayerClick(player, item.id || item.tournamentId)}
                            className="rounded-2xl px-4 py-3 flex justify-between items-center border bg-black border-purple-500/10 cursor-pointer hover:bg-purple-500/20 transition-all duration-200"
                          >
                            <div>
                              <p className="text-orange-400 font-black text-sm">
                                {Number(player.position) === 1 ? "🥇" : Number(player.position) === 2 ? "🥈" : Number(player.position) === 3 ? "🥉" : "🎮"} #{player.position} {player.name || player.playerName || "Unknown"}
                              </p>
                              <p className="text-gray-400 text-xs mt-1">Won: <span className="text-green-400 font-bold">🪙 {coins}</span></p>
                            </div>
                            <div className="text-gray-500 text-xs">
                              Click for UID
                            </div>
                          </div>
                        );
                      })}
                      
                      {sortedWinners.length > 3 && (
                        <button 
                          onClick={() => toggleExpand(item.id)}
                          className="w-full mt-4 py-2.5 px-4 rounded-xl font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 hover:border-purple-500/30 transition-all duration-200 text-xs flex items-center justify-center gap-2"
                        >
                          {isExpanded ? "🔼 Show Less" : `👁️ View All Winners (${sortedWinners.length})`}
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
              <p className="text-gray-500 mt-4 text-sm">{item.createdAt}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========== RESULT APPROVAL PANEL POPUP ========== */}
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
              <p className="text-yellow-400">💰 Prize Pool: 🪙 {selectedPublishTournament.currentPrizePool || selectedPublishTournament.totalPrizePool}</p>
            </div>

            {getRewardPreview()}

            {/* ========== PENDING REQUESTS ========== */}
            <div className="mb-8">
              <h3 className="text-2xl font-black text-orange-400 mb-4">
                📥 PENDING POSITION REQUESTS ({getPendingPlayers().length})
              </h3>
              <div className="space-y-4">
                {getPendingPlayers().map((player) => (
                  <div key={player.id} className="bg-black/50 rounded-2xl p-5 border border-orange-500/20">
                    <div className="flex justify-between items-center flex-wrap gap-3">
                      <div>
                        <p className="text-orange-400 font-black text-xl">{player.playerName}</p>
                        <p className="text-white mt-2">🏆 Submitted Position: <span className="text-yellow-400 font-bold">#{player.position}</span></p>
                        <p className="text-gray-500 text-sm mt-1">🕒 {player.createdAt}</p>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleApprove(player)} 
                          disabled={loading} 
                          className="bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded-2xl font-black"
                        >
                          ✅ APPROVE
                        </button>
                        <button 
                          onClick={() => handleReject(player)} 
                          disabled={loading} 
                          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl font-black"
                        >
                          ❌ REJECT
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {getPendingPlayers().length === 0 && (
                <div className="text-center py-8 bg-green-500/10 rounded-2xl">
                  <p className="text-green-400 text-lg">✅ All requests have been approved!</p>
                </div>
              )}
            </div>

            {/* ========== APPROVED PLAYERS - WITH INDIVIDUAL REJECT BUTTONS ========== */}
            <div className="mb-8">
              <h3 className="text-2xl font-black text-green-400 mb-4">
                ✅ APPROVED PLAYERS ({getApprovedPlayers().length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getApprovedPlayers()
                  .sort((a, b) => Number(a.approvedPosition) - Number(b.approvedPosition))
                  .map((player) => (
                    <div 
                      key={player.id} 
                      className="bg-green-500/10 rounded-2xl p-4 border border-green-500/20 hover:bg-green-500/20 transition-all duration-200"
                    >
                      {/* Player Info - Clickable for UID */}
                      <div 
                        onClick={() => handlePlayerClick(player)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {Number(player.approvedPosition) === 1 && <span className="text-3xl">🥇</span>}
                          {Number(player.approvedPosition) === 2 && <span className="text-3xl">🥈</span>}
                          {Number(player.approvedPosition) === 3 && <span className="text-3xl">🥉</span>}
                          <p className="text-green-400 font-black text-lg">{player.playerName}</p>
                        </div>
                        <p className="text-white">🏆 Position: <span className="text-yellow-400 font-bold">#{player.approvedPosition}</span></p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-gray-400 text-xs">Click for UID</span>
                          <span className="text-yellow-400 font-bold text-xl">🪙 {player.winCoins}</span>
                        </div>
                      </div>
                      
                      {/* REJECT BUTTON - Individual for each player */}
                      <div className="mt-3 pt-2 border-t border-green-500/20">
                        <button
                          onClick={() => handleRejectApproved(player)}
                          disabled={loading}
                          className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          <span>❌</span> REJECT THIS PLAYER
                        </button>
                        <p className="text-gray-500 text-[10px] text-center mt-1">
                          ⚠️ This will remove the player from approved list
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
              {getApprovedPlayers().length === 0 && (
                <div className="text-center py-8 bg-black/30 rounded-2xl">
                  <p className="text-gray-400">⚠️ No approved players yet</p>
                  <p className="text-gray-500 text-sm mt-2">Go to LIVE MATCHES → VIEW LIVE PLAYERS → Give positions</p>
                </div>
              )}
            </div>

            {/* PREVIEW BUTTON */}
            {getApprovedPlayers().length > 0 && (
              <div className="mb-4">
                <button 
                  onClick={() => handleViewDistribution(selectedPublishTournament)} 
                  className="w-full py-3 rounded-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 text-white mb-3"
                >
                  💰 PREVIEW PRIZE DISTRIBUTION
                </button>
              </div>
            )}

            {/* FINAL PUBLISH BUTTON */}
            <button 
              onClick={() => handleFinalPublish(selectedPublishTournament)} 
              disabled={loading || getApprovedPlayers().length === 0} 
              className={`w-full py-4 rounded-2xl font-black text-xl transition-all duration-300 ${
                loading || getApprovedPlayers().length === 0 
                  ? "bg-gray-600 cursor-not-allowed" 
                  : "bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white"
              }`}
            >
              {loading ? "⏳ PROCESSING..." : "🏆 FINAL PUBLISH RESULT & DISTRIBUTE PRIZES"}
            </button>
          </div>
        </div>
      )}

      {/* Player UID Popup */}
      {showPlayerPopup && selectedPlayer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] px-4">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-6 max-w-md w-full border border-purple-500/30 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-black text-purple-400">👤 PLAYER DETAILS</h3>
              <button 
                onClick={() => setShowPlayerPopup(false)} 
                className="text-gray-400 hover:text-white text-2xl transition"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-black/50 rounded-xl p-4">
                <p className="text-gray-400 text-sm">🎮 PLAYER NAME</p>
                <p className="text-xl font-bold text-orange-500">{selectedPlayer.name || selectedPlayer.playerName || "Unknown"}</p>
              </div>
              
              <div className="bg-black/50 rounded-xl p-4">
                <p className="text-gray-400 text-sm">🏆 POSITION</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {selectedPlayer.position === 1 ? "🥇 1st Place" : 
                   selectedPlayer.position === 2 ? "🥈 2nd Place" : 
                   selectedPlayer.position === 3 ? "🥉 3rd Place" : 
                   `#${selectedPlayer.position} Place`}
                </p>
              </div>
              
              <div className="bg-black/50 rounded-xl p-4">
                <p className="text-gray-400 text-sm">🪙 TOKENS WON</p>
                <p className="text-2xl font-bold text-green-400">
                  🪙 {(() => {
                    const playerUid = selectedPlayer.uid || selectedPlayer.userId || selectedPlayer.id;
                    return selectedPlayer.winCoins || playerResults.find(
                      r => r.tournamentId === selectedPlayer.tournamentId && r.userId === playerUid && r.approved
                    )?.winCoins || 0;
                  })()}
                </p>
              </div>
              
              <div className="bg-black/50 rounded-xl p-4">
                <p className="text-gray-400 text-sm">🔑 USER UID</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-blue-400 font-mono text-sm break-all">
                    {selectedPlayer.uid || selectedPlayer.userId || "N/A"}
                  </p>
                  {(selectedPlayer.uid || selectedPlayer.userId) && (
                    <button
                      onClick={() => {
                        const uidToCopy = selectedPlayer.uid || selectedPlayer.userId;
                        navigator.clipboard.writeText(uidToCopy);
                        alert("✅ UID Copied to Clipboard!");
                      }}
                      className="bg-purple-500/20 text-purple-400 px-3 py-1.5 rounded-lg text-xs hover:bg-purple-500/30 transition flex items-center gap-1"
                    >
                      📋 COPY
                    </button>
                  )}
                </div>
              </div>
              
              <div className="bg-black/50 rounded-xl p-4">
                <p className="text-gray-400 text-sm">🏆 TOURNAMENT</p>
                <p className="text-white font-medium text-sm break-all">
                  {selectedPublishTournament?.tournamentTitle || "N/A"}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowPlayerPopup(false)}
              className="w-full mt-6 py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 transition"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </>
  );
}