import { useState } from "react";
import { getPrizeDistribution } from "../utils/prizeDistribution";
export default function UpcomingMatches({ 
  tournaments, 
  selectedMode, 
  joinedPlayers, 
  user, 
  isAdmin, 
  onJoin,
  onViewPlayers,
  onCancel,
  joinLoading,
  onEditTime,
  onEditSlots
}) {
  const [showPlayersPopup, setShowPlayersPopup] = useState(false);
  const [selectedViewTournament, setSelectedViewTournament] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);
  const [expandedRulesId, setExpandedRulesId] = useState(null);

  const handleShareMatch = async (match) => {
    const appLink = window.location.origin;
    const shareText = `🎮 Join the match "${match.tournamentTitle}" on FireBaadshah Arena!\n\n🕒 Match Time: ${match.matchDate} at ${match.matchTime}\n💰 Entry Fee: ${match.entryFee} coins\n🏆 Prize Pool: ${match.prizePool} coins\n\nRegister now: ${appLink}`;
    
    try {
      const { Share } = await import("@capacitor/share");
      await Share.share({
        title: "Join Match",
        text: shareText,
        dialogTitle: "Share Match",
      });
    } catch (err) {
      console.error("Share API failed:", err);
      if (navigator.share) {
        try {
          await navigator.share({
            title: "Join Match",
            text: shareText,
          });
          return;
        } catch (navErr) {
          console.error("Navigator Share API failed:", navErr);
        }
      }
      navigator.clipboard.writeText(shareText);
      alert("Match details copied to clipboard!");
    }
  };

  const upcomingTournaments = tournaments
    .filter((item) => {
      const now = new Date();
      const tournamentTime = new Date(`${item.matchDate}T${item.matchTime}`);
      const diff = (tournamentTime - now) / 1000 / 60;
      return (
        diff > 10 &&
        item.tournamentType?.trim().toUpperCase() === selectedMode?.trim().toUpperCase()
      );
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.matchDate}T${a.matchTime}`);
      const dateB = new Date(`${b.matchDate}T${b.matchTime}`);
      return dateA - dateB;
    });

  // Get team size based on tournament type
  const getTeamSizeForType = (tournamentType) => {
    if (tournamentType === "SOLO") return 1;
    if (tournamentType === "DUO" || tournamentType === "2V2") return 2;
    if (tournamentType === "3V3") return 3;
    if (tournamentType === "SQUAD") return 4;
    return 1;
  };

  // Calculate team-based joined count for DUO and SQUAD
  const getTeamJoinedCount = (tournament) => {
    const players = joinedPlayers.filter(player => player.tournamentId === tournament.id);
    const teamSize = getTeamSizeForType(tournament.tournamentType);
    if (teamSize === 1) return players.length;
    return Math.ceil(players.length / teamSize);
  };

  // Get total slots based on tournament type
  const getTotalSlotsForType = (tournament) => {
    const totalTeams = Number(tournament.totalTeams) || 48;
    const tournamentType = tournament.tournamentType;
    if (tournamentType === "SOLO") return totalTeams;
    if (tournamentType === "DUO" || tournamentType === "2V2") return Math.floor(totalTeams / 2);
    if (tournamentType === "3V3") return Math.floor(totalTeams / 3);
    if (tournamentType === "SQUAD") return Math.floor(totalTeams / 4);
    return totalTeams;
  };

  // Get rewards using the same utility function
  const getRewards = (tournament) => {
    const totalPlayers = Number(tournament.totalTeams) || Number(tournament.joinedCount) || 0;
    const entryFee = Number(tournament.entryFee) || 0;
    const tournamentType = tournament.tournamentType;
    
    const totalCollection = entryFee * totalPlayers;
    const adminProfit = Math.floor(totalCollection * 0.10);
    const dynamicPrizePool = totalCollection - adminProfit;

    const prizePool = dynamicPrizePool > 0 ? dynamicPrizePool : (Number(tournament.totalPrizePool) || Number(tournament.currentPrizePool) || 0);
    
    const { rewards, winnerCount } = getPrizeDistribution(prizePool, totalPlayers, tournamentType, entryFee);
    return { rewards, winnerCount };
  };

  // Get slot label for display
  const getSlotLabel = (tournamentType) => {
    if (tournamentType === "SOLO") return "SLOT";
    if (tournamentType === "DUO" || tournamentType === "2V2" || tournamentType === "3V3") return "TEAM";
    if (tournamentType === "SQUAD") return "SQUAD";
    return "SLOT";
  };

  return (
    <>
      <section className="max-w-7xl mx-auto px-6 py-10 md:py-16 font-gaming">
        <div className="text-green-400 text-sm md:text-base font-semibold text-center mb-3 bg-green-500/10 border border-green-500/30 rounded-lg p-3 max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-center gap-2">
          <span>⚠️</span>
          <p>MATCH START HONE KE 10 MINUTE PAHLE ROOM ID AUR PASSWORD DIYA JAYEGA</p>
          <span>⚠️</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-orange-500 text-glow-orange mb-4 tracking-wide cyber-neon text-center">
          🔥 {selectedMode} UPCOMING MATCHES 🔥
        </h2>

        <div className="text-red-400 text-sm md:text-base font-semibold text-center mb-8 bg-red-500/10 border border-red-500/30 rounded-lg p-3 max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-center gap-2">
          <span>⚠️</span>
          <p>
            Dhyan Dein: Agar sabhi slots full hote hain toh Prize yahan dikhaye gaye anusar hi milega! Agar slots full nahi hote, toh kripya match LIVE hone ke baad Live Matches section mein naya Leaderboard check karein.
          </p>
          <span>⚠️</span>
        </div>
        <div className="relative">
          <button
            onClick={() => {
              document.getElementById("upcomingSlider")?.scrollBy({ left: -350, behavior: "smooth" });
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-orange-500/10 hover:bg-orange-500 border border-orange-500/30 hover:text-black text-orange-400 w-12 h-12 rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 duration-300 transition-all hidden md:flex items-center justify-center"
          >
            ◀
          </button>

          <button
            onClick={() => {
              document.getElementById("upcomingSlider")?.scrollBy({ left: 350, behavior: "smooth" });
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-orange-500/10 hover:bg-orange-500 border border-orange-500/30 hover:text-black text-orange-400 w-12 h-12 rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 duration-300 transition-all hidden md:flex items-center justify-center"
          >
            ▶
          </button>

          <div
            id="upcomingSlider"
            className="flex gap-4 md:gap-8 overflow-x-auto scroll-smooth pb-4 px-4 md:px-14 custom-scrollbar no-scrollbar snap-x snap-mandatory"
          >
            {upcomingTournaments.map((item) => {
              const { rewards, winnerCount } = getRewards(item);
              const teamSize = getTeamSizeForType(item.tournamentType);
              const totalSlots = getTotalSlotsForType(item);
              const teamJoinedCount = getTeamJoinedCount(item);
              
              return (
                <div
                  key={item.id}
                  className="w-[75vw] sm:w-[260px] md:w-[320px] max-w-[320px] md:max-w-[340px] flex-shrink-0 snap-center bg-glass rounded-[20px] md:rounded-[24px] p-3 md:p-5 border border-glass-orange shadow-glass-glow hover:shadow-orange-500/10 hover:-translate-y-1 hover:border-orange-500/30 transition-all duration-300 relative overflow-hidden group"
                >
                  {/* Header Row: Title & Upcoming Badge */}
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-purple-400 text-sm md:text-base font-black tracking-wider line-clamp-1 pr-2">
                      {item.tournamentTitle}
                    </h3>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold tracking-widest flex-shrink-0 mt-0.5">
                      UPCOMING
                    </span>
                  </div>

                  {/* Type & Map Row */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-orange-400 font-extrabold text-xs md:text-sm bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20">
                      🎮 {item.tournamentType}
                    </span>
                    <span className="text-blue-400 font-semibold text-[10px] md:text-xs bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded">
                      🗺️ {item.selectedMap}
                    </span>
                  </div>

                  {/* Date & Live Time Row */}
                  <div className="flex items-center justify-between bg-black/40 rounded-lg p-2 mb-4 border border-white/5">
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-[9px] uppercase tracking-wider mb-0.5">Match Time</span>
                      <span className="text-rose-400 font-semibold text-[10px] md:text-xs">
                        📅 {new Date(`${item.matchDate}T${item.matchTime}`).toLocaleString("en-IN", {
                          day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true,
                        })}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-gray-500 text-[9px] uppercase tracking-wider mb-0.5">Room ID Live</span>
                      <span className="text-yellow-400 font-bold text-[10px] md:text-xs text-glow-yellow">
                        ⚡ {
                          new Date(new Date(`${item.matchDate}T${item.matchTime}`).getTime() - 10 * 60 * 1000).toLocaleString("en-IN", {
                            hour: "2-digit", minute: "2-digit", hour12: true,
                          })
                        }
                      </span>
                    </div>
                  </div>

                  {/* Entry Fee, Players, Prize Pool - Team based display */}
                  <div className="space-y-2 text-xs md:text-sm">
                    <div className="flex justify-between">
                      <span>💰 Entry Fee</span>
                      <span className="text-orange-400 font-black">🪙 {item.entryFee}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>{teamSize === 1 ? "👥 Players" : "👥 Teams"}</span>
                      <span className="font-black">
                        {`${teamJoinedCount}/${totalSlots}`}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>🏆 Prize Pool</span>
                      <span className="text-yellow-400 font-black cyber-prize">🪙 {(() => {
                        const fee = Number(item.entryFee) || 0;
                        const players = Number(item.totalTeams) || 0;
                        const col = fee * players;
                        const prof = Math.floor(col * 0.10);
                        const dynPool = col - prof;
                        return dynPool > 0 ? dynPool : (item.totalPrizePool || 0);
                      })()}</span>
                    </div>
                  </div>

                  {/* Team Size Info for DUO/SQUAD */}
                  {(item.tournamentType === "DUO" || item.tournamentType === "2V2" || item.tournamentType === "3V3" || item.tournamentType === "SQUAD") && (
                    <div className="bg-black/30 px-2 py-1 rounded border border-gray-700/50 flex-shrink-0 mt-3">
                      <p className="text-[10px] text-gray-400 font-bold tracking-wider">
                        📌 {(item.tournamentType === "DUO" || item.tournamentType === "2V2") ? "2 Players per Team" : item.tournamentType === "3V3" ? "3 Players per Team" : "4 Players per Squad"} | Total {totalSlots} {(item.tournamentType === "DUO" || item.tournamentType === "2V2" || item.tournamentType === "3V3") ? "Teams" : "Squads"}
                      </p>
                    </div>
                  )}

                  {/* ========== REWARD SYSTEM SECTION - COMPLETE DISPLAY ========== */}
                  
                  {/* SOLO Mode Rewards */}
                  {item.tournamentType === "SOLO" && rewards.length > 0 && (
                    <div className="mt-4 p-2 bg-black/30 rounded-xl">
                      <div className="text-center text-orange-400 font-bold text-[10px] mb-2 uppercase tracking-wider">
                        🏆 TOP {winnerCount} WINNERS
                      </div>
                      <div className="max-h-[140px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                        {rewards.map((reward, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[10px] md:text-xs">
                            <span className="flex items-center gap-1 font-semibold text-gray-300">
                              <span className="text-xs">{reward.medal || (idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "🏅")}</span>
                              {reward.label}
                            </span>
                            <span className="text-yellow-400 font-black">🪙 {reward.coins}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* DUO/2V2 Mode Rewards */}
                  {(item.tournamentType === "DUO" || item.tournamentType === "2V2") && rewards.length > 0 && (
                    <div className="mt-3 p-2 bg-black/30 rounded-lg">
                      <div className="text-center text-orange-400 font-bold text-[10px] mb-2 uppercase tracking-wider">
                        🏆 REWARD SYSTEM (TOP {winnerCount} TEAMS)
                      </div>
                      <div className="space-y-1.5">
                        {rewards.map((reward, idx) => (
                          <div key={idx} className="bg-gradient-to-r from-orange-500/5 to-red-500/5 rounded-md p-1.5">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm">{reward.medal || (idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "🏅")}</span>
                                <span className="text-gray-300 font-bold text-[10px]">{reward.label}</span>
                              </div>
                              <span className="text-yellow-400 font-black text-[10px]">🪙 {reward.perTeam}</span>
                            </div>
                            <div className="flex justify-between items-center mt-0.5 pt-0.5 border-t border-gray-700/50">
                              <span className="text-gray-500 text-[9px]">💰 Per Player:</span>
                              <span className="text-green-400 font-bold text-[9px]">🪙 {reward.perPlayer} Each</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SQUAD Mode Rewards */}
                  {item.tournamentType === "SQUAD" && rewards.length > 0 && (
                    <div className="mt-3 p-2 bg-black/30 rounded-lg">
                      <div className="text-center text-orange-400 font-bold text-[10px] mb-2 uppercase tracking-wider">
                        🏆 REWARD SYSTEM (TOP {winnerCount} SQUADS)
                      </div>
                      <div className="space-y-1.5">
                        {rewards.map((reward, idx) => (
                          <div key={idx} className="bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-md p-1.5">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm">{reward.medal || (idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉")}</span>
                                <span className="text-gray-300 font-bold text-[10px]">{reward.label}</span>
                              </div>
                              <span className="text-yellow-400 font-black text-[10px]">🪙 {reward.perTeam}</span>
                            </div>
                            <div className="flex justify-between items-center mt-0.5 pt-0.5 border-t border-gray-700/50">
                              <span className="text-gray-500 text-[9px]">💰 Per Player:</span>
                              <span className="text-green-400 font-bold text-[9px]">🪙 {reward.perPlayer} Each</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other Modes Rewards */}
                  {(item.tournamentType === "1V1" || item.tournamentType === "1V2" || item.tournamentType === "3V3" || item.tournamentType === "4V4") && rewards.length > 0 && (
                    <div className="mt-4 p-3 bg-black/30 rounded-xl">
                      <div className="text-center text-orange-400 font-bold text-xs mb-3 uppercase tracking-wider">
                        🏆 REWARD SYSTEM
                      </div>
                      <div className="space-y-2">
                        {rewards.map((reward, idx) => (
                          <div key={idx} className="bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-lg p-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{reward.medal || "🏆"}</span>
                                <span className="text-gray-300 font-bold text-xs">{reward.label}</span>
                              </div>
                              <span className="text-yellow-400 font-black text-xs">🪙 {reward.perTeam || reward.coins}</span>
                            </div>
                            {reward.perPlayer && reward.perPlayer !== reward.perTeam && (
                              <div className="flex justify-between items-center mt-1 pt-1 border-t border-gray-700/50">
                                <span className="text-gray-500 text-[10px]">💰 Per Player:</span>
                                <span className="text-green-400 font-bold text-[10px]">🪙 {reward.perPlayer} Each</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Join and Share Buttons */}
                  <div className="flex gap-2 mt-4">
                    {item.tournamentRules && (
                      <button
                        onClick={() => setExpandedRulesId(expandedRulesId === item.id ? null : item.id)}
                        className={`px-3 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 hover:border-yellow-500/40 rounded-[14px] font-bold duration-300 flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] ${expandedRulesId === item.id ? "bg-yellow-500/30" : ""}`}
                        title="Match Rules"
                      >
                        <span className="text-sm">📜</span>
                      </button>
                    )}
                    <button
                      onClick={() => onJoin(item)}
                      disabled={joinLoading}
                      className={`flex-1 py-2.5 md:py-3 rounded-[14px] font-extrabold text-sm md:text-base tracking-wide duration-300
                        bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-black hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-orange-500/10 hover:shadow-orange-500/20
                        ${joinLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {joinLoading ? "JOINING..." : `🚀 JOIN ${item.tournamentType}`}
                    </button>
                    <button
                      onClick={() => handleShareMatch(item)}
                      className="px-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40 rounded-[14px] font-bold duration-300 flex items-center justify-center hover:scale-[1.02] active:scale-[0.98]"
                      title="Share Match"
                    >
                      <span className="text-base">📤</span>
                    </button>
                  </div>

                  {/* Rules Expansion */}
                  {expandedRulesId === item.id && item.tournamentRules && (
                    <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl animate-scale-in">
                      <div className="text-yellow-400 font-bold text-xs mb-1">📜 MATCH RULES:</div>
                      <div className="text-gray-300 text-xs whitespace-pre-wrap leading-relaxed">{item.tournamentRules}</div>
                    </div>
                  )}

                  {/* Admin Buttons */}
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedViewTournament(item);
                          setShowPlayersPopup(true);
                        }}
                        className="w-full mt-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 py-2.5 rounded-[14px] text-xs font-bold duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        👥 VIEW JOINED {teamSize === 1 ? "PLAYERS" : "TEAMS"} ({teamJoinedCount}/{totalSlots})
                      </button>
                      <button
                        onClick={async () => {
                          if (onCancel) {
                            setLoadingAction(`cancel-${item.id}`);
                            await onCancel(item);
                            setLoadingAction(null);
                          }
                        }}
                        disabled={loadingAction === `cancel-${item.id}`}
                        className={`w-full mt-3 bg-red-500/10 text-red-500 border border-red-500/20 py-2.5 rounded-[14px] text-xs font-bold transition-all duration-300 ${loadingAction === `cancel-${item.id}` ? "opacity-50 cursor-wait" : "hover:bg-red-500/20 hover:border-red-500/40 hover:scale-[1.02] active:scale-[0.98]"}`}
                      >
                        {loadingAction === `cancel-${item.id}` ? "⏳ CANCELLING..." : "❌ CANCEL MATCH"}
                      </button>
                      <button
                        onClick={async () => {
                          const newTime = window.prompt("Enter new time (HH:MM in 24-hour format, e.g., 22:30):", item.matchTime);
                          if (newTime && newTime !== item.matchTime) {
                            if (window.confirm(`Are you sure you want to change the time to ${newTime}?`)) {
                              if (onEditTime) {
                                setLoadingAction(`time-${item.id}`);
                                await onEditTime(item.id, newTime);
                                setLoadingAction(null);
                              }
                            }
                          }
                        }}
                        disabled={loadingAction === `time-${item.id}`}
                        className={`w-full mt-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 py-2.5 rounded-[14px] text-xs font-bold transition-all duration-300 ${loadingAction === `time-${item.id}` ? "opacity-50 cursor-wait" : "hover:bg-blue-500/20 hover:border-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"}`}
                      >
                        {loadingAction === `time-${item.id}` ? "⏳ UPDATING TIME..." : "⏱️ EDIT MATCH TIME"}
                      </button>
                      <button
                        onClick={async () => {
                          const currentSlots = item.totalTeams || 48;
                          const newSlots = window.prompt(`Enter new total slots (currently ${currentSlots}):`, currentSlots);
                          if (newSlots && !isNaN(newSlots) && Number(newSlots) > 0 && Number(newSlots) !== Number(currentSlots)) {
                            if (window.confirm(`Are you sure you want to change total slots to ${newSlots}?`)) {
                              if (typeof onEditSlots === 'function') {
                                setLoadingAction(`slots-${item.id}`);
                                await onEditSlots(item.id, newSlots);
                                setLoadingAction(null);
                              }
                            }
                          }
                        }}
                        disabled={loadingAction === `slots-${item.id}`}
                        className={`w-full mt-3 bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 py-2.5 rounded-[14px] text-xs font-bold transition-all duration-300 ${loadingAction === `slots-${item.id}` ? "opacity-50 cursor-wait" : "hover:bg-fuchsia-500/20 hover:border-fuchsia-500/40 hover:scale-[1.02] active:scale-[0.98]"}`}
                      >
                        {loadingAction === `slots-${item.id}` ? "⏳ UPDATING SLOTS..." : "⚙️ EDIT MATCH SLOTS"}
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Joined Players/TEAMS Popup - FIXED for DUO and SQUAD */}
      {showPlayersPopup && selectedViewTournament && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 px-4">
          <div className="bg-[#111] w-full max-w-5xl rounded-[40px] p-6 border border-purple-500/20 max-h-[90vh] overflow-y-auto font-sans">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-4xl font-black text-emerald-400 cyber-neon">
                👥 JOINED {getTeamSizeForType(selectedViewTournament.tournamentType) === 1 ? "PLAYERS" : "TEAMS"}
              </h2>
              <button onClick={() => setShowPlayersPopup(false)} className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-2xl font-black transition-all">
                CLOSE
              </button>
            </div>

            <div className="mb-4 p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
              <p className="text-emerald-400 text-center font-bold">
                Match: {selectedViewTournament.tournamentTitle} ({selectedViewTournament.tournamentType})
              </p>
              <p className="text-gray-400 text-center text-sm mt-1">
                Total {getTeamSizeForType(selectedViewTournament.tournamentType) === 1 ? "Players" : "Teams"}: {getTeamJoinedCount(selectedViewTournament)} / {getTotalSlotsForType(selectedViewTournament)}
              </p>
            </div>

            {(() => {
              const tournamentType = selectedViewTournament.tournamentType;
              const teamSize = getTeamSizeForType(tournamentType);
              const totalSlots = getTotalSlotsForType(selectedViewTournament);
              const slotLabel = getSlotLabel(tournamentType);
              
              // Get all joined players for this tournament
              const tournamentPlayers = joinedPlayers.filter(p => p.tournamentId === selectedViewTournament.id);
              
              // Group players by slot (team)
              const teamsMap = new Map();
              tournamentPlayers.forEach((player) => {
                const slot = Number(player.selectedSlot);
                if (!teamsMap.has(slot)) {
                  teamsMap.set(slot, {
                    slot: slot,
                    teamName: player.teamName || null,
                    members: []
                  });
                }
                teamsMap.get(slot).members.push(player);
              });
              
              // Convert to array and sort by slot
              const teams = Array.from(teamsMap.entries())
                .sort((a, b) => Number(a[0]) - Number(b[0]))
                .map(([slot, data]) => ({ slot: data.slot, teamName: data.teamName, members: data.members }));
              
              if (tournamentType === "SOLO") {
                // SOLO mode - simple slot display
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {teams.map((team) => {
                      const player = team.members[0];
                      return (
                        <div key={team.slot} className="bg-black rounded-2xl p-4 border border-orange-500/20">
                          <div className="flex justify-between items-center mb-3 pb-2 border-b border-orange-500/20">
                            <p className="text-orange-400 font-black text-lg">{slotLabel} {team.slot}</p>
                            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">
                              {team.members.length}/1
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-bold">{player?.ingameName || "Unknown"}</p>
                            <p className="text-gray-400 text-xs">UID: {player?.gameUid || "N/A"}</p>
                            <p className="text-blue-400 text-xs">Level: {player?.gameLevel || "N/A"}</p>
                            <p className="text-green-400 text-xs">Mobile: {player?.mobileNumber || "N/A"}</p>
                            <div className="mt-2 flex gap-2">
                              <button onClick={() => { navigator.clipboard.writeText(player?.ingameName); alert("Name Copied ✅"); }} className="bg-orange-500/10 text-orange-400 text-[10px] px-2 py-1 rounded">Copy Name</button>
                              <button onClick={() => { navigator.clipboard.writeText(player?.gameUid); alert("UID Copied ✅"); }} className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-1 rounded">Copy UID</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              } 
              else if (tournamentType === "DUO" || tournamentType === "2V2") {
                // DUO/2V2 mode - each team shows 2 players (Leader + Teammate)
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {teams.map((team) => {
                      const leader = team.members.find(m => m.isLeader === true || m.isLeader === "true") || team.members[0];
                      
                      // Find teammate in team.members or fall back to leader.teamMembers
                      let teammate = team.members.find(m => (m.isLeader === false || m.isLeader === "false") && m.userId !== leader?.userId);
                      if (!teammate && leader && leader.teamMembers && Array.isArray(leader.teamMembers)) {
                        teammate = leader.teamMembers.find(m => (m.isLeader === false || m.isLeader === "false" || !m.isLeader) && m.userId !== leader.userId);
                      }
                      if (!teammate) {
                        teammate = team.members.find(m => m.userId !== leader?.userId);
                      }
                      
                      const isFull = !!leader && !!teammate;
                      const displayMembersCount = (leader ? 1 : 0) + (teammate ? 1 : 0);
                      
                      return (
                        <div key={team.slot} className={`bg-black rounded-2xl overflow-hidden border ${isFull ? 'border-green-500/40' : 'border-orange-500/30'}`}>
                          {/* Team Header */}
                          <div className={`p-3 ${isFull ? 'bg-green-500/10' : 'bg-orange-500/10'} border-b ${isFull ? 'border-green-500/30' : 'border-orange-500/30'}`}>
                            <div className="flex justify-between items-center">
                              <div>
                                <p className={`font-black text-lg ${isFull ? 'text-green-400' : 'text-orange-400'}`}>
                                  {slotLabel} {team.slot}
                                </p>
                                {team.teamName && (
                                  <p className="text-yellow-400 text-xs font-bold">{team.teamName}</p>
                                )}
                              </div>
                              <div className={`px-3 py-1 rounded-full text-xs font-bold ${isFull ? 'bg-green-500/30 text-green-400' : 'bg-yellow-500/30 text-yellow-400'}`}>
                                {displayMembersCount}/{teamSize}
                              </div>
                            </div>
                          </div>
                          
                          {/* Player 1 - Leader */}
                          <div className="p-3 border-b border-gray-800">
                            <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-orange-400">👑</span>
                                <span className="text-blue-400 text-xs font-bold">TEAM LEADER</span>
                              </div>
                              {leader ? (
                                <div>
                                  <p className="text-white font-bold">{leader.ingameName}</p>
                                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                    <div><span className="text-gray-500">UID:</span> <span className="text-gray-300">{leader.gameUid}</span></div>
                                    <div><span className="text-gray-500">Level:</span> <span className="text-blue-400">{leader.gameLevel}</span></div>
                                    <div className="col-span-2"><span className="text-gray-500">Mobile:</span> <span className="text-green-400">{leader.mobileNumber || "N/A"}</span></div>
                                  </div>
                                  <div className="mt-2 flex gap-2">
                                    <button onClick={() => { navigator.clipboard.writeText(leader.ingameName); alert("Name Copied ✅"); }} className="bg-orange-500/10 text-orange-400 text-[10px] px-2 py-1 rounded">Copy Name</button>
                                    <button onClick={() => { navigator.clipboard.writeText(leader.gameUid); alert("UID Copied ✅"); }} className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-1 rounded">Copy UID</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-gray-500">
                                  <span>⏳</span>
                                  <p className="text-sm">Waiting for leader...</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Player 2 - Teammate */}
                          <div className="p-3">
                            <div className="bg-purple-500/10 rounded-xl p-3 border border-purple-500/20">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-green-400">👤</span>
                                <span className="text-purple-400 text-xs font-bold">TEAMMATE</span>
                              </div>
                              {teammate ? (
                                <div>
                                  <p className="text-white font-bold">{teammate.ingameName}</p>
                                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                    <div><span className="text-gray-500">UID:</span> <span className="text-gray-300">{teammate.gameUid}</span></div>
                                    <div><span className="text-gray-500">Level:</span> <span className="text-blue-400">{teammate.gameLevel}</span></div>
                                    <div className="col-span-2"><span className="text-gray-500">Mobile:</span> <span className="text-green-400">{teammate.mobileNumber || "N/A"}</span></div>
                                  </div>
                                  <div className="mt-2 flex gap-2">
                                    <button onClick={() => { navigator.clipboard.writeText(teammate.ingameName); alert("Name Copied ✅"); }} className="bg-orange-500/10 text-orange-400 text-[10px] px-2 py-1 rounded">Copy Name</button>
                                    <button onClick={() => { navigator.clipboard.writeText(teammate.gameUid); alert("UID Copied ✅"); }} className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-1 rounded">Copy UID</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-gray-500">
                                  <span>⏳</span>
                                  <p className="text-sm">Waiting for teammate...</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              } 
              else if (tournamentType === "SQUAD") {
                // SQUAD mode - each squad shows 4 players (Leader + 3 Members)
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {teams.map((team) => {
                      const leader = team.members.find(m => m.isLeader === true || m.isLeader === "true") || team.members[0];
                      
                      // Get squad members from leader's teamMembers list, or fall back to team.members
                      let squadMembers = [];
                      if (leader && leader.teamMembers && Array.isArray(leader.teamMembers)) {
                        squadMembers = leader.teamMembers.filter(m => (m.isLeader === false || m.isLeader === "false" || !m.isLeader) && m.userId !== leader.userId);
                      } else {
                        squadMembers = team.members.filter(m => (m.isLeader === false || m.isLeader === "false") && m.userId !== leader?.userId);
                      }
                      
                      // Fallback to extra members in team.members if squadMembers is not fully populated
                      if (squadMembers.length < team.members.length - 1) {
                        const extraMembers = team.members.filter(m => m.userId !== leader?.userId && !squadMembers.some(sm => sm.userId === m.userId));
                        squadMembers = [...squadMembers, ...extraMembers];
                      }
                      
                      const isFull = !!leader && squadMembers.length === 3;
                      const displayMembersCount = (leader ? 1 : 0) + squadMembers.length;
                      
                      return (
                        <div key={team.slot} className={`bg-black rounded-2xl overflow-hidden border ${isFull ? 'border-green-500/40' : 'border-orange-500/30'}`}>
                          {/* Squad Header */}
                          <div className={`p-3 ${isFull ? 'bg-green-500/10' : 'bg-orange-500/10'} border-b ${isFull ? 'border-green-500/30' : 'border-orange-500/30'}`}>
                            <div className="flex justify-between items-center">
                              <div>
                                <p className={`font-black text-lg ${isFull ? 'text-green-400' : 'text-orange-400'}`}>
                                  {slotLabel} {team.slot}
                                </p>
                                {team.teamName && (
                                  <p className="text-yellow-400 text-xs font-bold">{team.teamName}</p>
                                )}
                              </div>
                              <div className={`px-3 py-1 rounded-full text-xs font-bold ${isFull ? 'bg-green-500/30 text-green-400' : 'bg-yellow-500/30 text-yellow-400'}`}>
                                {displayMembersCount}/{teamSize}
                              </div>
                            </div>
                          </div>
                          
                          {/* Squad Leader */}
                          <div className="p-3 border-b border-gray-800">
                            <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-orange-400">👑</span>
                                <span className="text-blue-400 text-xs font-bold">SQUAD LEADER</span>
                              </div>
                              {leader ? (
                                <div>
                                  <p className="text-white font-bold">{leader.ingameName}</p>
                                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                    <div><span className="text-gray-500">UID:</span> <span className="text-gray-300">{leader.gameUid}</span></div>
                                    <div><span className="text-gray-500">Level:</span> <span className="text-blue-400">{leader.gameLevel}</span></div>
                                    <div className="col-span-2"><span className="text-gray-500">Mobile:</span> <span className="text-green-400">{leader.mobileNumber || "N/A"}</span></div>
                                  </div>
                                  <div className="mt-2 flex gap-2">
                                    <button onClick={() => { navigator.clipboard.writeText(leader.ingameName); alert("Name Copied ✅"); }} className="bg-orange-500/10 text-orange-400 text-[10px] px-2 py-1 rounded">Copy Name</button>
                                    <button onClick={() => { navigator.clipboard.writeText(leader.gameUid); alert("UID Copied ✅"); }} className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-1 rounded">Copy UID</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-gray-500">
                                  <span>⏳</span>
                                  <p className="text-sm">Waiting for leader...</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Squad Members (3 positions) */}
                          <div className="p-3">
                            <div className="text-xs text-purple-400 mb-2 flex items-center gap-2">
                              <span>👥</span> <span>SQUAD MEMBERS</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {[0, 1, 2].map((idx) => {
                                const member = squadMembers[idx];
                                return (
                                  <div key={idx} className="bg-purple-500/10 rounded-xl p-2 border border-purple-500/20">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-green-400 text-sm">🎮</span>
                                        <span className="text-purple-400 text-[10px] font-bold">MEMBER {idx + 1}</span>
                                      </div>
                                    </div>
                                    {member ? (
                                      <div>
                                        <p className="text-white font-medium text-sm">{member.ingameName}</p>
                                        <div className="flex gap-3 mt-1 text-xs">
                                          <span><span className="text-gray-500">UID:</span> <span className="text-gray-300">{member.gameUid}</span></span>
                                          <span><span className="text-gray-500">Lvl:</span> <span className="text-blue-400">{member.gameLevel}</span></span>
                                        </div>
                                        <div className="mt-2 flex gap-2">
                                          <button onClick={() => { navigator.clipboard.writeText(member.ingameName); alert("Name Copied ✅"); }} className="bg-orange-500/10 text-orange-400 text-[10px] px-2 py-1 rounded">Copy Name</button>
                                          <button onClick={() => { navigator.clipboard.writeText(member.gameUid); alert("UID Copied ✅"); }} className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-1 rounded">Copy UID</button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 text-gray-500 text-xs">
                                        <span>⏳</span>
                                        <p>Empty slot - waiting for member</p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              }
              else {
                // Other modes - default display
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {teams.map((team) => {
                      const player = team.members[0];
                      return (
                        <div key={team.slot} className="bg-black rounded-2xl p-4 border border-orange-500/20">
                          <div className="flex justify-between items-center mb-3 pb-2 border-b border-orange-500/20">
                            <p className="text-orange-400 font-black text-lg">{slotLabel} {team.slot}</p>
                            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">
                              {team.members.length}/1
                            </span>
                          </div>
                          {player ? (
                            <div>
                              <p className="text-white font-bold">{player.ingameName}</p>
                              <p className="text-gray-400 text-xs">UID: {player.gameUid}</p>
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500 text-sm">Available</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              }
            })()}

            {/* Summary Section */}
            <div className="mt-6 p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20">
              <h3 className="text-purple-400 font-bold mb-2">📊 TEAMS SUMMARY</h3>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const tournamentType = selectedViewTournament.tournamentType;
                  const teamSize = getTeamSizeForType(tournamentType);
                  const totalSlots = getTotalSlotsForType(selectedViewTournament);
                  const slotLabel = getSlotLabel(tournamentType);
                  
                  const tournamentPlayers = joinedPlayers.filter(p => p.tournamentId === selectedViewTournament.id);
                  const teamsMap = new Map();
                  tournamentPlayers.forEach((player) => {
                    const slot = Number(player.selectedSlot);
                    if (!teamsMap.has(slot)) {
                      teamsMap.set(slot, []);
                    }
                    teamsMap.get(slot).push(player);
                  });
                  
                  const summary = [];
                  for (let i = 1; i <= totalSlots; i++) {
                    const members = teamsMap.get(i) || [];
                    summary.push({ slot: i, count: members.length, total: teamSize });
                  }
                  
                  return summary.map((item) => (
                    <span key={item.slot} className={`px-3 py-1 rounded-full text-xs ${
                      item.count === item.total 
                        ? "bg-green-500/20 text-green-400" 
                        : item.count > 0
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-gray-700/50 text-gray-400"
                    }`}>
                      {slotLabel} {item.slot}: {item.count}/{item.total}
                    </span>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}