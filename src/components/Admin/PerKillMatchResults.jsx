import { useState } from "react";

export default function PerKillMatchResults({ 
  isAdmin,
  liveTournaments,
  joinedPlayers,
  matchResults,
  publishResults,
  cancelTournament,
  publishRoomDetails,
  updateTournamentTime,
  onDeleteMatchResult,
  onDeleteAllMatchResults
}) {
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [playerKills, setPlayerKills] = useState({}); // { [userId]: kills }
  const [playerPositions, setPlayerPositions] = useState({}); // { [userId]: position }
  const [roomId, setRoomId] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [showRoomPopup, setShowRoomPopup] = useState(false);
  const [showTimePopup, setShowTimePopup] = useState(false);
  const [showPlayersPopup, setShowPlayersPopup] = useState(false);
  const [selectedViewTournament, setSelectedViewTournament] = useState(null);
  const [showCompletedPopup, setShowCompletedPopup] = useState(false);

  if (!isAdmin) return null;

  const getSlotStatus = (tournamentId, slotNumber) => {
    const playerInSlot = joinedPlayers.find(
      p => p.tournamentId === tournamentId && Number(p.selectedSlot) === Number(slotNumber)
    );
    if (playerInSlot) {
      return { booked: true, ...playerInSlot };
    }
    return { booked: false };
  };

  // Compute values for popup outside return block to prevent jsx parsing errors
  const tournamentPlayers = selectedTournament ? joinedPlayers.filter(p => p.tournamentId === selectedTournament.id) : [];
  const joinedCount = tournamentPlayers.length;
  const totalSlots = selectedTournament ? (Number(selectedTournament.totalTeams) || 48) : 48;
  const ratio = totalSlots > 0 ? Math.min(1, joinedCount / totalSlots) : 1;

  const scaledBooyahBonus = selectedTournament ? Math.floor((selectedTournament.booyahBonus || 0) * ratio) : 0;
  const scaledSecondBonus = selectedTournament ? Math.floor((selectedTournament.secondBonus || 0) * ratio) : 0;
  const scaledThirdBonus = selectedTournament ? Math.floor((selectedTournament.thirdBonus || 0) * ratio) : 0;

  const handleOpenResults = (tournament) => {
    setSelectedTournament(tournament);
    const tournamentPlayersList = joinedPlayers.filter(p => p.tournamentId === tournament.id);
    const initialKills = {};
    const initialPositions = {};
    tournamentPlayersList.forEach(p => {
      initialKills[p.userId] = 0;
      initialPositions[p.userId] = 0;
    });
    setPlayerKills(initialKills);
    setPlayerPositions(initialPositions);
    setShowResultPopup(true);
  };

  const handleKillChange = (userId, value) => {
    setPlayerKills(prev => ({
      ...prev,
      [userId]: Math.max(0, Number(value) || 0)
    }));
  };

  const handlePositionChange = (userId, position) => {
    setPlayerPositions(prev => ({
      ...prev,
      [userId]: Number(position)
    }));
  };

  const handleSubmitResults = async () => {
    if (!selectedTournament) return;
    const tournamentPlayersList = joinedPlayers.filter(p => p.tournamentId === selectedTournament.id);
    
    const playerResultsList = tournamentPlayersList.map(p => ({
      userId: p.userId,
      name: p.ingameName || p.userEmail,
      ingameName: p.ingameName || p.userEmail,
      kills: playerKills[p.userId] || 0,
      selectedSlot: p.selectedSlot,
      gameUid: p.gameUid,
      position: Number(playerPositions[p.userId] || 0)
    }));

    const success = await publishResults(selectedTournament, playerResultsList);
    if (success) {
      setShowResultPopup(false);
      setSelectedTournament(null);
    }
  };

  const handlePublishRoom = async (tournamentId) => {
    if (!roomId || !roomPassword) {
      alert("Please fill Room ID and Password");
      return;
    }
    const success = await publishRoomDetails(tournamentId, roomId, roomPassword);
    if (success) {
      setShowRoomPopup(false);
      setRoomId("");
      setRoomPassword("");
    }
  };

  const handleUpdateTime = async (tournamentId) => {
    if (!newDateTime) {
      alert("Please enter a valid date and time");
      return;
    }
    await updateTournamentTime(tournamentId, newDateTime);
    setShowTimePopup(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-20 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12 border-b border-orange-500/10 pb-6">
        <div>
          <h2 className="text-4xl sm:text-5xl font-black text-orange-500 cyber-neon">⚔️ PER KILL ADMIN CONTROL</h2>
          <p className="text-gray-400 text-sm mt-2">Manage per-kill matches, publish room details, and distribute rewards.</p>
        </div>
      </div>

      {/* ACTIVE / LIVE TOURNAMENTS */}
      <div className="mb-16">
        <h3 className="text-2xl sm:text-3xl font-black text-orange-400 mb-6 flex items-center gap-2">
          <span>🎮</span> Active / Upcoming Per Kill Matches ({liveTournaments.length})
        </h3>
        {liveTournaments.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {liveTournaments.map(tournament => {
              const playersCount = joinedPlayers.filter(p => p.tournamentId === tournament.id).length;
              return (
                <div key={tournament.id} className="bg-[#111] rounded-2xl p-4 sm:p-6 border border-orange-500/10 cyber-card flex flex-col justify-between">
                  <div>
                    <h4 className="text-lg sm:text-xl font-black text-white mb-1.5 sm:mb-2">{tournament.tournamentTitle}</h4>
                    <div className="grid grid-cols-2 gap-2 sm:gap-4 text-[11px] sm:text-xs bg-black/40 p-2.5 sm:p-3 rounded-xl mb-3 sm:mb-4 text-gray-300">
                      <div>💰 Fee: <span className="text-yellow-400 font-bold">🪙 {tournament.entryFee}</span></div>
                      <div>⚔️ Rate: <span className="text-orange-400 font-bold">🪙 {tournament.perKillRate}/kill</span></div>
                      <div>🥇 1st: <span className="text-green-400 font-bold">🪙 {tournament.booyahBonus}</span></div>
                      <div>🗺️ Map: <span>{tournament.selectedMap}</span></div>
                      {Number(tournament.secondBonus || 0) > 0 && <div>🥈 2nd: <span className="text-gray-300 font-bold">🪙 {tournament.secondBonus}</span></div>}
                      {Number(tournament.thirdBonus || 0) > 0 && <div>🥉 3rd: <span className="text-orange-400 font-bold">🪙 {tournament.thirdBonus}</span></div>}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4 space-y-0.5 sm:space-y-1">
                      <p>📅 Date: {tournament.matchDate}</p>
                      <p>🕒 Time: {tournament.matchTime}</p>
                      <p>👥 Joined: <span className="text-white font-bold">{playersCount}</span> / {tournament.totalTeams}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => handleOpenResults(tournament)}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-black py-2 sm:py-2.5 rounded-xl font-black hover:scale-[1.02] transition duration-200"
                    >
                      🏆 ENTER & PUBLISH RESULTS
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => { 
                          setSelectedTournament(tournament); 
                          setRoomId(tournament.roomId || "");
                          setRoomPassword(tournament.roomPassword || "");
                          setShowRoomPopup(true); 
                        }}
                        className={`py-1.5 sm:py-2 rounded-xl text-xs font-bold transition border ${
                          tournament.roomId && tournament.roomPassword
                            ? "bg-green-600/20 text-green-400 border-green-500/20 hover:bg-green-600/30"
                            : "bg-blue-600/20 text-blue-400 border-blue-500/20 hover:bg-blue-600/30"
                        }`}
                      >
                        {tournament.roomId && tournament.roomPassword ? "✓ PUBLISHED" : "🔑 ROOM DETAILS"}
                      </button>
                      <button
                        onClick={() => { setSelectedTournament(tournament); setShowTimePopup(true); }}
                        className="bg-yellow-600/20 text-yellow-400 border border-yellow-500/20 py-1.5 sm:py-2 rounded-xl text-xs font-bold hover:bg-yellow-600/30 transition"
                      >
                        🕒 UPDATE TIME
                      </button>
                    </div>
                    <button
                      onClick={() => { setSelectedViewTournament(tournament); setShowPlayersPopup(true); }}
                      className="w-full bg-purple-600/20 text-purple-400 border border-purple-500/20 py-2 sm:py-2.5 rounded-xl text-xs font-bold hover:bg-purple-600/30 transition-all duration-300"
                    >
                      👥 VIEW JOINED PLAYERS
                    </button>
                    <button
                      onClick={() => cancelTournament(tournament)}
                      className="w-full bg-red-600/10 text-red-500 border border-red-500/20 py-2 sm:py-2.5 rounded-xl text-xs font-bold hover:bg-red-600/20 transition"
                    >
                      🗑 CANCEL & REFUND ALL
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 bg-black/40 border border-orange-500/10 rounded-3xl text-gray-400">
            No active Per Kill tournaments. Create one from the admin console!
          </div>
        )}
      </div>

      {/* COMPLETED TOURNAMENTS */}
      <div className="flex justify-center mt-10">
        <button
          onClick={() => setShowCompletedPopup(true)}
          className="w-full max-w-md bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-8 py-4 rounded-3xl font-black text-xl sm:text-2xl transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] border border-green-500/50"
        >
          ✅ VIEW COMPLETED RESULTS ({matchResults.length})
        </button>
      </div>

      {showCompletedPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 sm:p-8">
          <div className="bg-[#0a0a0a] border border-green-500/30 rounded-3xl p-6 md:p-10 max-w-7xl w-full mx-auto relative shadow-[0_0_100px_rgba(16,185,129,0.15)] animate-fade-in-up flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setShowCompletedPopup(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-red-500 hover:bg-red-600 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-2xl font-black text-xl transition-all flex items-center justify-center z-50 shadow-lg shadow-red-500/20"
            >
              ✕
            </button>

            <div className="flex justify-between items-center mb-6 flex-wrap gap-4 pt-8 sm:pt-0 pr-12 shrink-0 border-b border-gray-800/50 pb-4">
              <h3 className="text-3xl sm:text-4xl font-black text-green-400 flex items-center gap-3">
                <span>✅</span> Completed Match Results ({matchResults.length})
              </h3>
              {matchResults.length > 0 && isAdmin && (
                <button
                  onClick={() => onDeleteAllMatchResults("ALL")}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all"
                >
                  🗑 DELETE ALL
                </button>
              )}
            </div>

            <div className="overflow-y-auto custom-scrollbar pr-2 sm:pr-4 flex-grow">
              {matchResults.length > 0 ? (
                <div className="space-y-6">
                {matchResults.map(result => (
                  <div key={result.id} className="bg-[#111] rounded-3xl p-6 border border-green-500/10 cyber-card hover:border-green-500/30 transition-colors">
                    <div className="flex justify-between items-start flex-wrap gap-4 border-b border-gray-800 pb-4 mb-4">
                      <div>
                        <h4 className="text-xl font-black text-orange-400">{result.tournamentTitle}</h4>
                        <p className="text-xs text-gray-400 mt-2">📅 Published: {result.createdAt} | Match Time: {result.matchDate} {result.matchTime}</p>
                      </div>

                      <div className="flex flex-wrap gap-3 text-sm bg-black/40 p-3 rounded-2xl border border-green-500/20">
                        <div className="px-3 py-1 bg-[#222] rounded-lg">Rate: <span className="text-orange-400 font-bold ml-1">🪙 {result.perKillRate}</span></div>
                        <div className="px-3 py-1 bg-[#222] rounded-lg">1st (Scaled): <span className="text-yellow-400 font-bold ml-1">🪙 {result.booyahBonus}</span></div>
                        {result.secondBonus > 0 && <div className="px-3 py-1 bg-[#222] rounded-lg">2nd (Scaled): <span className="text-gray-300 font-bold ml-1">🪙 {result.secondBonus}</span></div>}
                        {result.thirdBonus > 0 && <div className="px-3 py-1 bg-[#222] rounded-lg">3rd (Scaled): <span className="text-orange-400 font-bold ml-1">🪙 {result.thirdBonus}</span></div>}
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => onDeleteMatchResult(result.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all sm:ml-auto"
                        >
                          🗑 DELETE
                        </button>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {[...(result.results || [])]
                        .sort((a, b) => {
                          const posA = Number(a.position || 0);
                          const posB = Number(b.position || 0);
                          if (posA > 0 && posB > 0) return posA - posB;
                          if (posA > 0) return -1;
                          if (posB > 0) return 1;
                          
                          const killsA = Number(a.kills || 0);
                          const killsB = Number(b.kills || 0);
                          if (killsB !== killsA) return killsB - killsA;
                          
                          return Number(a.selectedSlot || 0) - Number(b.selectedSlot || 0);
                        })
                        .map((player, idx) => {
                          const pos = Number(player.position || 0);
                          const bonus = pos === 1 ? result.booyahBonus : pos === 2 ? result.secondBonus : pos === 3 ? result.thirdBonus : 0;
                          const totalWin = (player.kills * result.perKillRate) + bonus;
                          return (
                            <div key={idx} className={`p-3 rounded-xl border text-sm flex justify-between items-center ${pos > 0 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-black/40 border-gray-800'}`}>
                              <div>
                                <p className="font-bold flex items-center gap-1.5">
                                  {pos === 1 && <span>🥇</span>}
                                  {pos === 2 && <span>🥈</span>}
                                  {pos === 3 && <span>🥉</span>}
                                  {player.ingameName || player.name}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">Slot {player.selectedSlot} | UID: {player.gameUid || "N/A"}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-orange-400 font-bold text-xs">{player.kills} kills</p>
                                <p className="text-green-400 font-black mt-1">🪙 {totalWin}</p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-black/40 border border-green-500/10 rounded-3xl text-gray-400">
                No completed matches yet.
              </div>
            )}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-800 text-center shrink-0">
              <button 
                onClick={() => setShowCompletedPopup(false)}
                className="bg-gray-800 hover:bg-gray-700 text-white px-10 py-4 rounded-2xl font-bold transition-all text-lg"
              >
                Close Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP: ENTER & PUBLISH RESULTS */}
      {showResultPopup && selectedTournament && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 px-4 py-6 overflow-y-auto">
          <div className="bg-[#0f0f12] w-full max-w-5xl rounded-3xl p-6 border border-orange-500/20 max-h-[90vh] overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800">
                <h3 className="text-2xl font-black text-orange-500">🏆 SUBMIT RESULTS: {selectedTournament.tournamentTitle}</h3>
                <button onClick={() => setShowResultPopup(false)} className="text-gray-400 hover:text-white text-3xl">&times;</button>
              </div>

              <div className="mb-6 p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20 grid grid-cols-4 gap-4 text-center text-xs sm:text-sm">
                <div><p className="text-gray-400">Per Kill Rate</p><p className="font-bold text-orange-400">🪙 {selectedTournament.perKillRate}</p></div>
                <div><p className="text-gray-400">🥇 1st Place (Scaled)</p><p className="font-bold text-yellow-400">🪙 {scaledBooyahBonus}</p></div>
                <div><p className="text-gray-400">🥈 2nd Place (Scaled)</p><p className="font-bold text-gray-300">🪙 {scaledSecondBonus}</p></div>
                <div><p className="text-gray-400">🥉 3rd Place (Scaled)</p><p className="font-bold text-orange-400">🪙 {scaledThirdBonus}</p></div>
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">Players Registered (Type kills and select Position):</p>
                {tournamentPlayers.map(player => {
                  const kills = playerKills[player.userId] || 0;
                  const currentPos = Number(playerPositions[player.userId] || 0);
                  const bonus = currentPos === 1 ? scaledBooyahBonus : currentPos === 2 ? scaledSecondBonus : currentPos === 3 ? scaledThirdBonus : 0;
                  const estimatedEarnings = (kills * selectedTournament.perKillRate) + bonus;

                  return (
                    <div key={player.id} className="bg-black/40 border border-gray-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="font-black text-orange-400 text-lg">{player.ingameName}</p>
                        <p className="text-xs text-gray-400">Slot {player.selectedSlot} | Game UID: {player.gameUid}</p>
                      </div>

                      <div className="flex items-center gap-4 flex-wrap">
                        {/* Kills Input */}
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-400 font-bold">KILLS:</label>
                          <input
                            type="number"
                            value={kills}
                            onChange={(e) => handleKillChange(player.userId, e.target.value)}
                            className="bg-black border border-gray-800 rounded-lg w-16 px-2 py-1 text-center font-bold text-white"
                          />
                        </div>

                        {/* Position Selector Dropdown */}
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-400 font-bold">POSITION:</label>
                          <select
                            value={currentPos}
                            onChange={(e) => handlePositionChange(player.userId, e.target.value)}
                            className="bg-black border border-gray-800 rounded-lg px-2 py-1 text-white text-xs font-bold"
                          >
                            <option value="0">None</option>
                            <option value="1">🥇 1st / Booyah</option>
                            <option value="2">🥈 2nd Place</option>
                            <option value="3">🥉 3rd Place</option>
                          </select>
                        </div>

                        {/* Estimated Earnings */}
                        <div className="text-right min-w-[80px]">
                          <p className="text-gray-500 text-[10px]">Estimated Won</p>
                          <p className="text-green-400 font-bold">🪙 {estimatedEarnings}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowResultPopup(false)}
                className="w-1/3 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3.5 rounded-xl transition"
              >
                CANCEL
              </button>
              <button
                onClick={handleSubmitResults}
                className="w-2/3 bg-gradient-to-r from-orange-500 to-red-600 text-black font-black text-lg py-3.5 rounded-xl hover:scale-[1.01] transition"
              >
                🏆 PUBLISH & DISTRIBUTE REWARDS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP: ROOM DETAILS */}
      {showRoomPopup && selectedTournament && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 px-4">
          <div className="bg-[#0f0f12] w-full max-w-md rounded-3xl p-6 border border-orange-500/20">
            <h3 className="text-2xl font-black text-orange-500 mb-4">🔑 Publish Room Details</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-bold block mb-1">ROOM ID</label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Enter Room ID"
                  className="bg-black border border-gray-800 rounded-xl w-full px-4 py-3 text-white outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-bold block mb-1">ROOM PASSWORD</label>
                <input
                  type="text"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="bg-black border border-gray-800 rounded-xl w-full px-4 py-3 text-white outline-none"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowRoomPopup(false)} className="w-1/2 bg-gray-800 py-3 rounded-xl font-bold">CANCEL</button>
                <button 
                  onClick={() => handlePublishRoom(selectedTournament.id)} 
                  disabled={selectedTournament.roomId === roomId && selectedTournament.roomPassword === roomPassword}
                  className={`w-1/2 py-3 rounded-xl font-bold text-black transition-all ${
                    selectedTournament.roomId === roomId && selectedTournament.roomPassword === roomPassword
                      ? "bg-green-500/50 cursor-not-allowed opacity-60" 
                      : (selectedTournament.roomId && selectedTournament.roomPassword)
                        ? "bg-yellow-500 hover:bg-yellow-600"
                        : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {selectedTournament.roomId === roomId && selectedTournament.roomPassword === roomPassword 
                    ? "PUBLISHED" 
                    : (selectedTournament.roomId && selectedTournament.roomPassword ? "UPDATE" : "PUBLISH")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP: UPDATE TIME */}
      {showTimePopup && selectedTournament && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 px-4">
          <div className="bg-[#0f0f12] w-full max-w-md rounded-3xl p-6 border border-orange-500/20">
            <h3 className="text-2xl font-black text-orange-500 mb-4">🕒 Update Match Time</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-bold block mb-1">NEW DATE & TIME</label>
                <input
                  type="datetime-local"
                  value={newDateTime}
                  onChange={(e) => setNewDateTime(e.target.value)}
                  className="bg-black border border-gray-800 rounded-xl w-full px-4 py-3 text-white outline-none"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowTimePopup(false)} className="w-1/2 bg-gray-800 py-3 rounded-xl font-bold">CANCEL</button>
                <button onClick={() => handleUpdateTime(selectedTournament.id)} className="w-1/2 bg-yellow-500 py-3 rounded-xl font-bold text-black">UPDATE</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP: VIEW SLOTS / PLAYERS */}
      {showPlayersPopup && selectedViewTournament && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 px-4 py-6 overflow-y-auto">
          <div className="bg-[#0f0f12] w-full max-w-4xl rounded-3xl p-6 border border-orange-500/20 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
              <h3 className="text-2xl font-black text-orange-500">👥 MATCH SLOTS & PLAYERS</h3>
              <button onClick={() => setShowPlayersPopup(false)} className="text-gray-400 hover:text-white text-3xl">&times;</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: selectedViewTournament.totalTeams }, (_, i) => i + 1).map(num => {
                const status = getSlotStatus(selectedViewTournament.id, num);
                return (
                  <div 
                    key={num} 
                    className={`p-4 rounded-2xl border text-sm flex flex-col justify-between ${
                      status.booked 
                        ? "bg-orange-500/5 border-orange-500/20" 
                        : "bg-black/40 border-gray-900"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-500 font-bold">SLOT #{num}</span>
                      <span className={`w-2 h-2 rounded-full ${status.booked ? 'bg-orange-500' : 'bg-gray-700'}`}></span>
                    </div>
                    {status.booked ? (
                      <div className="space-y-1">
                        <p className="font-bold text-white line-clamp-1">{status.ingameName}</p>
                        <p className="text-[10px] text-gray-400">UID: {status.gameUid}</p>
                        <p className="text-[10px] text-blue-400">Level: {status.gameLevel}</p>
                        <p className="text-[10px] text-green-400 font-mono">📞 {status.mobileNumber || "N/A"}</p>
                      </div>
                    ) : (
                      <p className="text-gray-600 font-bold">AVAILABLE</p>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowPlayersPopup(false)}
              className="w-full mt-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 font-bold transition"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
