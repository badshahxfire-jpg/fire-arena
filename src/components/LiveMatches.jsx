import { useState, useEffect } from "react";
import { ref, push, update } from "firebase/database";
import { database } from "../firebase";
import { getPrizeDistribution } from "../utils/prizeDistribution";

export default function LiveMatches({ tournaments, joinedPlayers, user, isAdmin, onPublishRoom, onCancelMatch, onPublishResult }) {
  const [roomInputs, setRoomInputs] = useState({});
  const [publishedRooms, setPublishedRooms] = useState({});
  const [showLivePlayers, setShowLivePlayers] = useState(false);
  const [selectedLiveTournament, setSelectedLiveTournament] = useState(null);
  const [playerPositions, setPlayerPositions] = useState({});
  const [teamPositions, setTeamPositions] = useState({}); // NEW: For team positions
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState({});
  const [selectedTeams, setSelectedTeams] = useState({}); // NEW: For team selection

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
    if (!tournament) return 0;
    const totalTeams = Number(tournament.totalTeams) || 48;
    const tournamentType = tournament.tournamentType;
    if (tournamentType === "SOLO") return totalTeams;
    if (tournamentType === "DUO" || tournamentType === "2V2") return Math.floor(totalTeams / 2);
    if (tournamentType === "3V3") return Math.floor(totalTeams / 3);
    if (tournamentType === "SQUAD") return Math.floor(totalTeams / 4);
    return totalTeams;
  };

  const liveTournaments = tournaments.filter((item) => {
    const now = new Date();
    const tournamentTime = new Date(`${item.matchDate}T${item.matchTime}`);
    const diff = (tournamentTime - now) / 1000 / 60;
    if (item.completed === true || item.completed === "true") return false;
    return diff <= 10 && diff > -7200;
  });

  const handlePublishRoom = async (tournamentId, roomId, roomPassword) => {
    if (!roomId || !roomPassword) {
      alert("Please enter both Room ID and Password");
      return;
    }
    await onPublishRoom(tournamentId, roomId, roomPassword);
    setPublishedRooms((prev) => ({ ...prev, [tournamentId]: true }));
  };

  // ================= SOLO MODE FUNCTIONS =================
  const togglePlayerSelection = (playerId) => {
    setSelectedPlayers(prev => ({
      ...prev,
      [playerId]: !prev[playerId]
    }));
  };

  const selectAllPlayers = () => {
    const players = joinedPlayers.filter(p => p.tournamentId === selectedLiveTournament?.id);
    const newSelection = {};
    players.forEach(player => {
      newSelection[player.id] = true;
    });
    setSelectedPlayers(newSelection);
  };

  const clearAllSelections = () => {
    setSelectedPlayers({});
  };

  // Approve selected players (SOLO mode)
  const handleApproveSelectedPlayers = async () => {
    const players = joinedPlayers.filter(p => p.tournamentId === selectedLiveTournament?.id);
    const selectedPlayersList = players.filter(p => selectedPlayers[p.id]);
    
    if (selectedPlayersList.length === 0) {
      alert("Please select at least one player!");
      return;
    }
    
    const missingPositions = selectedPlayersList.filter(p => !playerPositions[p.id]);
    if (missingPositions.length > 0) {
      alert(`Please set positions for: ${missingPositions.map(p => p.ingameName).join(", ")}`);
      return;
    }
    
    setSubmitting(true);
    let successCount = 0;
    let failCount = 0;
    
    try {
      for (const player of selectedPlayersList) {
        const position = playerPositions[player.id];
        try {
          const resultRef = ref(database, "playerResults");
          await push(resultRef, {
            tournamentId: selectedLiveTournament.id,
            tournamentTitle: selectedLiveTournament.tournamentTitle,
            userId: player.userId,
            playerName: player.ingameName,
            position: position,
            approved: true,
            approvedPosition: position,
            createdAt: new Date().toLocaleString(),
            givenBy: "admin",
            winCoins: 0,
          });

          const notifRef = ref(database, `notifications/${player.userId}`);
          await push(notifRef, {
            title: "🏆 POSITION ASSIGNED",
            message: `You got #${position} position in ${selectedLiveTournament.tournamentTitle}!`,
            time: new Date().toLocaleString(),
            seen: false,
          });
          
          successCount++;
        } catch (err) {
          console.error("Error approving player:", player.ingameName, err);
          failCount++;
        }
      }
      
      if (successCount > 0) {
        const approvedPlayerIds = selectedPlayersList.map(p => p.id);
        setPlayerPositions(prev => {
          const newPositions = { ...prev };
          approvedPlayerIds.forEach(id => delete newPositions[id]);
          return newPositions;
        });
        setSelectedPlayers({});
        alert(`✅ Approved ${successCount} player(s) successfully!${failCount > 0 ? `\n❌ Failed: ${failCount}` : ""}`);
      } else {
        alert("❌ Failed to approve players!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ================= TEAM MODE FUNCTIONS (DUO & SQUAD) =================
  const toggleTeamSelection = (teamId) => {
    setSelectedTeams(prev => ({
      ...prev,
      [teamId]: !prev[teamId]
    }));
  };

  const selectAllTeams = () => {
    const teamsMap = new Map();
    joinedPlayers
      .filter(p => p.tournamentId === selectedLiveTournament?.id)
      .forEach(player => {
        const slot = Number(player.selectedSlot);
        if (!teamsMap.has(slot)) {
          teamsMap.set(slot, []);
        }
        teamsMap.get(slot).push(player);
      });
    
    const newSelection = {};
    Array.from(teamsMap.keys()).forEach(slot => {
      newSelection[`team_${slot}`] = true;
    });
    setSelectedTeams(newSelection);
  };

  const clearAllTeamsSelection = () => {
    setSelectedTeams({});
  };

  // Get all team members for a team slot
  const getTeamMembers = (slot) => {
    const members = joinedPlayers.filter(p => p.tournamentId === selectedLiveTournament?.id && Number(p.selectedSlot) === slot);
    const leader = members.find(m => m.isLeader === true || m.isLeader === "true") || members[0];
    const teammates = members.filter(m => m.userId !== leader?.userId);
    return { leader, teammates, all: members };
  };

  // Approve selected teams (DUO/SQUAD mode)
  const handleApproveSelectedTeams = async () => {
    const teamsMap = new Map();
    joinedPlayers
      .filter(p => p.tournamentId === selectedLiveTournament?.id)
      .forEach(player => {
        const slot = Number(player.selectedSlot);
        if (!teamsMap.has(slot)) {
          teamsMap.set(slot, []);
        }
        teamsMap.get(slot).push(player);
      });
    
    const selectedTeamsList = Array.from(teamsMap.keys()).filter(slot => selectedTeams[`team_${slot}`]);
    
    if (selectedTeamsList.length === 0) {
      alert("Please select at least one team!");
      return;
    }
    
    const missingPositions = selectedTeamsList.filter(slot => !teamPositions[slot]);
    if (missingPositions.length > 0) {
      alert(`Please set positions for TEAMS: ${missingPositions.map(s => `#${s}`).join(", ")}`);
      return;
    }
    
    setSubmitting(true);
    let successCount = 0;
    let failCount = 0;
    
    try {
      for (const slot of selectedTeamsList) {
        const position = teamPositions[slot];
        const { all: teamMembers } = getTeamMembers(slot);
        
        for (const player of teamMembers) {
          try {
            const resultRef = ref(database, "playerResults");
            await push(resultRef, {
              tournamentId: selectedLiveTournament.id,
              tournamentTitle: selectedLiveTournament.tournamentTitle,
              userId: player.userId,
              playerName: player.ingameName,
              position: position,
              approved: true,
              approvedPosition: position,
              createdAt: new Date().toLocaleString(),
              givenBy: "admin",
              winCoins: 0,
              teamSlot: slot,
            });

            const notifRef = ref(database, `notifications/${player.userId}`);
            await push(notifRef, {
              title: "🏆 POSITION ASSIGNED",
              message: `Your team got #${position} position in ${selectedLiveTournament.tournamentTitle}!`,
              time: new Date().toLocaleString(),
              seen: false,
            });
          } catch (err) {
            console.error("Error approving team member:", player.ingameName, err);
            failCount++;
          }
        }
        successCount++;
      }
      
      if (successCount > 0) {
        const approvedSlots = selectedTeamsList;
        setTeamPositions(prev => {
          const newPositions = { ...prev };
          approvedSlots.forEach(slot => delete newPositions[slot]);
          return newPositions;
        });
        setSelectedTeams({});
        alert(`✅ Approved ${successCount} team(s) successfully!${failCount > 0 ? `\n❌ Failed players: ${failCount}` : ""}`);
      } else {
        alert("❌ Failed to approve teams!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGivePosition = async (player, position, tournament) => {
    if (!position) {
      alert("Please select a position");
      return;
    }
    
    setSubmitting(true);
    try {
      const resultRef = ref(database, "playerResults");
      await push(resultRef, {
        tournamentId: tournament.id,
        tournamentTitle: tournament.tournamentTitle,
        userId: player.userId,
        playerName: player.ingameName,
        position: position,
        approved: true,
        approvedPosition: position,
        createdAt: new Date().toLocaleString(),
        givenBy: "admin",
        winCoins: 0,
      });

      const notifRef = ref(database, `notifications/${player.userId}`);
      await push(notifRef, {
        title: "🏆 POSITION ASSIGNED",
        message: `You got #${position} position in ${tournament.tournamentTitle}!`,
        time: new Date().toLocaleString(),
        seen: false,
      });

      setPlayerPositions((prev) => ({ ...prev, [player.id]: position }));
      alert(`✅ Position #${position} given to ${player.ingameName} successfully!`);
    } catch (error) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-6 py-20 font-gaming">
      <h2 className="text-4xl md:text-5xl font-extrabold text-red-500 text-glow-red mb-12 tracking-wide animate-pulse cyber-neon">
        ⚡ LIVE MATCHES ⚡
      </h2>

      <div className="relative">
        <button
          onClick={() => {
            document.getElementById("liveSlider")?.scrollBy({ left: -350, behavior: "smooth" });
          }}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-red-500/10 hover:bg-red-500 border border-red-500/30 text-white w-12 h-12 rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 duration-300 transition-all hidden md:flex items-center justify-center"
        >
          ◀
        </button>

        <button
          onClick={() => {
            document.getElementById("liveSlider")?.scrollBy({ left: 350, behavior: "smooth" });
          }}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-red-500/10 hover:bg-red-500 border border-red-500/30 text-white w-12 h-12 rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 duration-300 transition-all hidden md:flex items-center justify-center"
        >
          ▶
        </button>

        <div
          id="liveSlider"
          className="flex gap-4 md:gap-8 overflow-x-auto scroll-smooth pb-4 px-4 md:px-14 custom-scrollbar no-scrollbar"
        >
          {liveTournaments.map((item) => {
            const isJoined = joinedPlayers.find(
              (player) => player.tournamentId === item.id && player.userEmail === user?.email
            );
            const isPublished = publishedRooms[item.id] || (item.roomId && item.roomPassword);
            const totalPlayers = item.joinedCount || 0;
            const prizePool = item.currentPrizePool || 0;
            const entryFee = Number(item.entryFee) || 0;
            const { winnerCount, rewards } = getPrizeDistribution(prizePool, totalPlayers, item.tournamentType, entryFee);
            
            const teamSize = getTeamSizeForType(item.tournamentType);
            const totalSlots = getTotalSlotsForType(item);
            const teamJoinedCount = getTeamJoinedCount(item);

            return (
              <div
                key={item.id}
                className="w-[85vw] sm:w-[280px] md:w-[320px] max-w-[340px] flex-shrink-0 snap-center bg-glass rounded-[20px] sm:rounded-[30px] p-4 sm:p-5 md:p-8 border border-glass-red shadow-glass-red hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group font-gaming cyber-card"
              >
                <div className="flex justify-between mb-5 items-center">
                  <span className="bg-red-500/10 text-red-400 border border-red-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-widest shadow-inner animate-pulse cyber-live">
                    ● LIVE
                  </span>
                  <span className="text-gray-400 text-sm font-semibold bg-white/5 px-3 py-1 rounded-xl">
                    {item.matchTime}
                  </span>
                </div>

                <h3 className="text-2xl md:text-3xl font-extrabold mb-2 tracking-wide text-glow-orange text-orange-500">
                  {item.tournamentTitle}
                </h3>
                
                <p className="text-rose-400 mb-1 font-bold text-sm tracking-widest uppercase">
                  🎮 {item.tournamentType}
                </p>
                <p className="text-blue-400 mb-4 font-bold text-sm bg-blue-500/5 border border-blue-500/10 rounded-xl px-3 py-1.5 w-fit">
                  🗺️ {item.selectedMap}
                </p>

                <div className="space-y-3 text-base mb-4">
                  <div className="flex justify-between">
                    <span>💰 Entry Fee</span>
                    <span className="text-orange-400 font-extrabold">🪙 {item.entryFee}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>{teamSize === 1 ? "👥 Joined Players" : "👥 Joined Teams"}</span>
                    <span className="font-bold">
                      {`${teamJoinedCount}/${totalSlots}`}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>🏆 Prize Pool</span>
                    <span className="text-yellow-400 font-extrabold cyber-prize">🪙 {item.currentPrizePool || 0}</span>
                  </div>
                </div>

                {(item.tournamentType === "DUO" || item.tournamentType === "2V2" || item.tournamentType === "3V3" || item.tournamentType === "SQUAD") && (
                  <div className="mt-3 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="text-blue-400 text-xs text-center font-bold">
                      📌 {(item.tournamentType === "DUO" || item.tournamentType === "2V2") ? "2 Players per Team" : item.tournamentType === "3V3" ? "3 Players per Team" : "4 Players per Team"} | Total {totalSlots} Teams
                    </p>
                  </div>
                )}

                <div className="bg-black/40 rounded-2xl p-4 border border-orange-500/20 mt-3">
                  <div className="text-center text-orange-400 font-bold text-xs mb-2 tracking-wide">
                    🏆 REWARD SYSTEM {winnerCount > 0 && `(${winnerCount} WINNERS)`}
                  </div>
                  
                  {item.tournamentType === "SOLO" && (
                    <div className="max-h-[140px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                      {rewards.map((reward, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-gray-300">{reward.label}</span>
                          <span className="text-yellow-400 font-black">🪙 {reward.coins}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* DUO & 2V2 Mode Rewards */}
                  {(item.tournamentType === "DUO" || item.tournamentType === "2V2") && (
                    <div className="space-y-2">
                      {rewards.slice(0, 4).map((reward, idx) => (
                        <div key={idx} className="bg-gradient-to-r from-orange-500/5 to-red-500/5 rounded-lg p-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{reward.medal || (idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "🏅")}</span>
                              <span className="text-gray-300 font-bold text-xs">{reward.label}</span>
                            </div>
                            <span className="text-yellow-400 font-black text-xs">🪙 {reward.perTeam}</span>
                          </div>
                          <div className="flex justify-between items-center mt-1 pt-1 border-t border-gray-700/50">
                            <span className="text-gray-500 text-[10px]">💰 Per Player:</span>
                            <span className="text-green-400 font-bold text-[10px]">🪙 {reward.perPlayer} Each</span>
                          </div>
                        </div>
                      ))}
                      {rewards.length > 4 && (
                        <div className="text-center text-gray-500 text-xs mt-1">
                          +{rewards.length - 4} more teams
                        </div>
                      )}
                    </div>
                  )}

                  {item.tournamentType === "SQUAD" && (
                    <div className="space-y-2">
                      {rewards.slice(0, 3).map((reward, idx) => (
                        <div key={idx} className="bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-lg p-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{reward.medal || (idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉")}</span>
                              <span className="text-gray-300 font-bold text-xs">{reward.label}</span>
                            </div>
                            <span className="text-yellow-400 font-black text-xs">🪙 {reward.perTeam}</span>
                          </div>
                          <div className="flex justify-between items-center mt-1 pt-1 border-t border-gray-700/50">
                            <span className="text-gray-500 text-[10px]">💰 Per Player:</span>
                            <span className="text-green-400 font-bold text-[10px]">🪙 {reward.perPlayer} Each</span>
                          </div>
                        </div>
                      ))}
                      {rewards.length > 3 && (
                        <div className="text-center text-gray-500 text-xs mt-1">
                          +{rewards.length - 3} more squads
                        </div>
                      )}
                    </div>
                  )}

                  {(item.tournamentType === "1V1" || item.tournamentType === "1V2" || item.tournamentType === "3V3" || item.tournamentType === "4V4") && (
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
                  )}
                </div>

                {isJoined && (
                  <div className="bg-black/40 rounded-2xl p-4 border border-glass-orange mt-4 shadow-inner backdrop-blur-sm">
                    <h3 className="text-md font-bold text-green-400 mb-2 tracking-wide">🔐 ROOM DETAILS</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-[#050508] p-2 rounded-xl">
                        <p className="text-orange-400 text-sm font-semibold">🎮 Room ID:</p>
                        <div className="flex items-center gap-2">
                          <p className="text-white text-sm">{item.roomId || "Waiting..."}</p>
                          {item.roomId && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(item.roomId);
                                alert("Room ID Copied ✅");
                              }}
                              className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded-lg text-xs"
                            >
                              📋 COPY
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center bg-[#050508] p-2 rounded-xl">
                        <p className="text-blue-400 text-sm font-semibold">🔐 Password:</p>
                        <div className="flex items-center gap-2">
                          <p className="text-white text-sm">{item.roomPassword || "Waiting..."}</p>
                          {item.roomPassword && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(item.roomPassword);
                                alert("Password Copied ✅");
                              }}
                              className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-lg text-xs"
                            >
                              📋 COPY
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {isAdmin && (
                  <div className="mt-4 space-y-2">
                    <div className="bg-black/40 rounded-2xl p-3 border border-orange-500/20">
                      <input
                        type="text"
                        placeholder="Room ID"
                        value={roomInputs[item.id]?.roomId || ""}
                        onChange={(e) =>
                          setRoomInputs((prev) => ({
                            ...prev,
                            [item.id]: { ...prev[item.id], roomId: e.target.value },
                          }))
                        }
                        className="w-full bg-[#111] rounded-xl px-3 py-2 outline-none mb-2 text-white text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Room Password"
                        value={roomInputs[item.id]?.roomPassword || ""}
                        onChange={(e) =>
                          setRoomInputs((prev) => ({
                            ...prev,
                            [item.id]: { ...prev[item.id], roomPassword: e.target.value },
                          }))
                        }
                        className="w-full bg-[#111] rounded-xl px-3 py-2 outline-none mb-2 text-white text-sm"
                      />
                      <button
                        onClick={() => handlePublishRoom(item.id, roomInputs[item.id]?.roomId, roomInputs[item.id]?.roomPassword)}
                        disabled={isPublished}
                        className={`w-full py-2 rounded-xl font-bold text-sm transition-all duration-300 ${
                          isPublished
                            ? "bg-green-600 text-white cursor-not-allowed"
                            : "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white"
                        }`}
                      >
                        {isPublished ? "✅ PUBLISHED" : "📢 PUBLISH ROOM DETAILS"}
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedLiveTournament(item);
                        setShowLivePlayers(true);
                        setSelectedPlayers({});
                        setSelectedTeams({});
                        setPlayerPositions({});
                        setTeamPositions({});
                      }}
                      className="w-full py-2 rounded-xl font-bold text-sm bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 transition-all duration-300"
                    >
                      👥 VIEW LIVE {teamSize === 1 ? "PLAYERS" : "TEAMS"} ({teamJoinedCount}/{totalSlots})
                    </button>

                    <button
                      onClick={() => onPublishResult(item)}
                      className="w-full py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white transition-all duration-300"
                    >
                      🏆 PUBLISH RESULT
                    </button>

                    <button
                      onClick={() => onCancelMatch(item)}
                      className="w-full py-2 rounded-xl font-bold text-sm bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all duration-300"
                    >
                      ❌ CANCEL MATCH
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Players Popup - SEPARATE MODES */}
      {showLivePlayers && selectedLiveTournament && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 px-4">
          <div className="bg-[#111] w-full max-w-5xl rounded-[40px] p-6 border border-purple-500/20 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-4xl font-black text-purple-400 cyber-neon">
                👥 LIVE {getTeamSizeForType(selectedLiveTournament.tournamentType) === 1 ? "PLAYERS" : "TEAMS"}
              </h2>
              <button onClick={() => setShowLivePlayers(false)} className="bg-red-500 px-5 py-2 rounded-2xl font-black">
                CLOSE
              </button>
            </div>

            {/* ========== SOLO MODE ========== */}
            {getTeamSizeForType(selectedLiveTournament.tournamentType) === 1 ? (
              <>
                <div className="mb-4 p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                  <p className="text-yellow-400 text-center font-bold text-sm">
                    ✅ Select players, set positions, then click "APPROVE SELECTED"
                  </p>
                </div>

                <div className="mb-4 flex gap-3 justify-end">
                  <button onClick={selectAllPlayers} className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-500/30 transition">
                    ☑️ SELECT ALL
                  </button>
                  <button onClick={clearAllSelections} className="bg-gray-500/20 text-gray-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-500/30 transition">
                    ❌ CLEAR ALL
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {joinedPlayers
                    .filter((player) => player.tournamentId === selectedLiveTournament.id)
                    .map((player) => {
                      const alreadyGivenPosition = playerPositions[player.id];
                      const totalTeams = Number(selectedLiveTournament.totalTeams) || 10;
                      const takenPositions = Object.values(playerPositions).filter(p => p);
                      const isSelected = selectedPlayers[player.id];
                      
                      return (
                        <div className={`bg-black rounded-2xl p-4 border transition-all duration-200 ${isSelected ? 'border-green-500 bg-green-500/10' : 'border-orange-500/10'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <input type="checkbox" checked={isSelected || false} onChange={() => togglePlayerSelection(player.id)} className="w-5 h-5 rounded border-purple-500 bg-black accent-purple-500" />
                              <span className="text-purple-400 text-xs font-bold">SELECT</span>
                            </div>
                            {alreadyGivenPosition && <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">✅ Position #{alreadyGivenPosition}</span>}
                          </div>
                          
                          <p className="text-green-400 text-sm">📱 MOBILE: {player.mobileNumber}</p>
                          <p className="text-orange-400 font-black mt-1 text-base">🎮 {player.ingameName}</p>
                          <p className="text-white text-sm mt-1">🆔 UID: {player.gameUid}</p>
                          <p className="text-blue-400 text-sm">⭐ LEVEL: {player.gameLevel}</p>
                          <p className="text-green-400 text-sm">🎯 SLOT: {player.selectedSlot}</p>
                          
                          <div className="mt-3 pt-2 border-t border-gray-700">
                            <label className="text-purple-400 font-bold block mb-2 text-sm">🏆 SELECT POSITION:</label>
                            <select value={playerPositions[player.id] || ""} onChange={(e) => setPlayerPositions(prev => ({ ...prev, [player.id]: e.target.value }))} disabled={alreadyGivenPosition} className="w-full bg-[#111] rounded-xl px-3 py-2 outline-none border border-purple-500/30 text-white text-sm">
                              <option value="">-- Select Position --</option>
                              {Array.from({ length: totalTeams }).map((_, i) => (
                                <option key={i + 1} value={i + 1} disabled={takenPositions.includes(i + 1) && playerPositions[player.id] !== i + 1}>
                                  #{i + 1} {takenPositions.includes(i + 1) && playerPositions[player.id] !== i + 1 ? "(Taken)" : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className="mt-6">
                  <button onClick={handleApproveSelectedPlayers} disabled={submitting} className={`w-full py-4 rounded-2xl font-black text-lg transition-all duration-300 ${submitting ? "bg-gray-600 cursor-not-allowed" : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/30"}`}>
                    {submitting ? "⏳ APPROVING..." : "✅ APPROVE SELECTED PLAYERS"}
                  </button>
                  <p className="text-gray-500 text-xs text-center mt-2">Select players, set positions, then click approve</p>
                </div>
              </>
            ) : (
              // ========== DUO & SQUAD MODE (TEAM APPROVAL) ==========
              <>
                <div className="mb-4 p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                  <p className="text-purple-400 text-center font-bold text-sm">
                    🎯 Select teams, set ONE position for the entire team, then click "APPROVE SELECTED TEAMS"
                  </p>
                </div>

                <div className="mb-4 flex gap-3 justify-end">
                  <button onClick={selectAllTeams} className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-500/30 transition">
                    ☑️ SELECT ALL TEAMS
                  </button>
                  <button onClick={clearAllTeamsSelection} className="bg-gray-500/20 text-gray-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-500/30 transition">
                    ❌ CLEAR ALL
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(() => {
                    const teamsMap = new Map();
                    joinedPlayers
                      .filter((player) => player.tournamentId === selectedLiveTournament.id)
                      .forEach((player) => {
                        const slot = Number(player.selectedSlot);
                        if (!teamsMap.has(slot)) {
                          teamsMap.set(slot, []);
                        }
                        teamsMap.get(slot).push(player);
                      });
                    
                    const teams = Array.from(teamsMap.entries())
                      .sort((a, b) => Number(a[0]) - Number(b[0]))
                      .map(([slot, members]) => ({ slot, members }));
                    
                    const totalTeams = getTotalSlotsForType(selectedLiveTournament);
                    const takenPositions = Object.values(teamPositions).filter(p => p);
                    const teamSize = getTeamSizeForType(selectedLiveTournament.tournamentType);
                    
                    return teams.map((team) => {
                      const teamId = `team_${team.slot}`;
                      const alreadyGivenPosition = teamPositions[team.slot];
                      const isSelected = selectedTeams[teamId];
                      const leader = team.members.find(m => m.isLeader === true || m.isLeader === "true") || team.members[0];
                      
                      return (
                        <div className={`bg-black rounded-2xl p-4 border transition-all duration-200 ${isSelected ? 'border-green-500 bg-green-500/10' : 'border-purple-500/20'}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <input type="checkbox" checked={isSelected || false} onChange={() => toggleTeamSelection(teamId)} className="w-5 h-5 rounded border-purple-500 bg-black accent-purple-500" />
                              <span className="text-purple-400 text-xs font-bold">SELECT TEAM</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="bg-purple-500/20 text-purple-400 text-xs px-2 py-1 rounded-full">{team.members.length}/{teamSize}P</span>
                              {alreadyGivenPosition && <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">✅ Pos #{alreadyGivenPosition}</span>}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mb-2 pb-1 border-b border-purple-500/30">
                            <h3 className="text-purple-400 font-black text-lg">🏆 TEAM #{team.slot}</h3>
                          </div>
                          
                          {leader?.teamName && <p className="text-yellow-400 font-bold text-sm mb-3">📛 Team Name: {leader.teamName}</p>}
                          
                          {team.members.map((player, idx) => (
                            <div key={player.id} className={`mt-2 p-2 rounded-xl ${(player.isLeader || player.isLeader === "true" || player.isLeader === true) ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-gray-800/30'}`}>
                              <div className="flex items-center gap-2">
                                {(player.isLeader || player.isLeader === "true" || player.isLeader === true) && <span className="text-blue-400 text-xs font-bold">👑 LEADER</span>}
                                <p className="text-orange-400 font-bold text-sm">🎮 {player.ingameName}</p>
                              </div>
                              <p className="text-white text-xs mt-1">🆔 UID: {player.gameUid}</p>
                              <p className="text-blue-400 text-xs">⭐ LEVEL: {player.gameLevel}</p>
                              <p className="text-green-400 text-xs">📱 {player.mobileNumber}</p>
                            </div>
                          ))}
                          
                          <div className="mt-3 pt-2 border-t border-gray-700">
                            <label className="text-purple-400 font-bold block mb-2 text-sm">🏆 SELECT POSITION FOR TEAM:</label>
                            <select value={teamPositions[team.slot] || ""} onChange={(e) => setTeamPositions(prev => ({ ...prev, [team.slot]: e.target.value }))} disabled={alreadyGivenPosition} className="w-full bg-[#111] rounded-xl px-3 py-2 outline-none border border-purple-500/30 text-white text-sm">
                              <option value="">-- Select Position --</option>
                              {Array.from({ length: totalTeams }).map((_, i) => (
                                <option key={i + 1} value={i + 1} disabled={takenPositions.includes(i + 1) && teamPositions[team.slot] !== i + 1}>
                                  #{i + 1} {takenPositions.includes(i + 1) && teamPositions[team.slot] !== i + 1 ? "(Taken)" : ""}
                                </option>
                              ))}
                            </select>
                            <p className="text-gray-500 text-[10px] text-center mt-1">
                              ⚡ One position will apply to ALL team members
                            </p>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                <div className="mt-6">
                  <button onClick={handleApproveSelectedTeams} disabled={submitting} className={`w-full py-4 rounded-2xl font-black text-lg transition-all duration-300 ${submitting ? "bg-gray-600 cursor-not-allowed" : "bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white shadow-lg shadow-purple-500/30"}`}>
                    {submitting ? "⏳ APPROVING..." : "✅ APPROVE SELECTED TEAMS"}
                  </button>
                  <p className="text-gray-500 text-xs text-center mt-2">Select teams, set position, then click approve (entire team gets same position)</p>
                </div>
              </>
            )}

            {/* Summary Section */}
            <div className="mt-6 p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20">
              <h3 className="text-purple-400 font-bold mb-2">📊 SELECTION SUMMARY</h3>
              <div className="flex flex-wrap gap-2">
                {getTeamSizeForType(selectedLiveTournament.tournamentType) === 1 ? (
                  Object.entries(selectedPlayers).map(([playerId, isSel]) => {
                    if (isSel) {
                      const player = joinedPlayers.find(p => p.id === playerId);
                      const pos = playerPositions[playerId];
                      return <span key={playerId} className="bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-xs">{player?.ingameName}: #{pos || "?"}</span>;
                    }
                    return null;
                  })
                ) : (
                  Object.entries(selectedTeams).map(([teamId, isSel]) => {
                    if (isSel) {
                      const teamSlot = teamId.replace('team_', '');
                      const pos = teamPositions[teamSlot];
                      return <span key={teamId} className="bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-xs">TEAM #{teamSlot}: #{pos || "?"}</span>;
                    }
                    return null;
                  })
                )}
              </div>
              {(Object.keys(selectedPlayers).filter(k => selectedPlayers[k]).length === 0 && Object.keys(selectedTeams).filter(k => selectedTeams[k]).length === 0) && (
                <p className="text-gray-400 text-sm">No selections made</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}