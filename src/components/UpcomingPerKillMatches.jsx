import { useState, useMemo } from "react";

export default function UpcomingPerKillMatches({ 
  tournaments, 
  joinedPlayers, 
  user, 
  onJoin,
  joinLoading,
  selectedMode,
  matchResults,
  isAdmin,
  onCancel,
  onEditTime,
  onEditSlots
}) {
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showJoinPopup, setShowJoinPopup] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  // Input fields
  const [ingameName, setIngameName] = useState("");
  const [gameUid, setGameUid] = useState("");
  const [gameLevel, setGameLevel] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  const [showPlayersPopup, setShowPlayersPopup] = useState(false);
  const [selectedViewTournament, setSelectedViewTournament] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);

  const [showRulesPopup, setShowRulesPopup] = useState(false);
  
  const [showCalcPopup, setShowCalcPopup] = useState(false);
  const [selectedCalcTournament, setSelectedCalcTournament] = useState(null);
  const [calcKillsVal, setCalcKillsVal] = useState(0);
  const [calcPlaceVal, setCalcPlaceVal] = useState(0);

  const handleOpenCalc = (tournament) => {
    setSelectedCalcTournament(tournament);
    setCalcKillsVal(0);
    setCalcPlaceVal(0);
    setShowCalcPopup(true);
  };

  const stats = useMemo(() => {
    let totalKills = 0;
    let totalEarnings = 0;
    let completedCount = 0;
    const userMatches = joinedPlayers?.filter(m => m.userId === user?.uid) || [];
    
    userMatches.forEach((match) => {
      if (matchResults && matchResults.length > 0) {
        const result = matchResults.find(r => r.tournamentId === match.tournamentId);
        if (result) {
          completedCount++;
          const playerResult = result.results?.find(r => r.userId === user?.uid);
          if (playerResult) {
            const kills = playerResult.kills || 0;
            const position = playerResult.position || 0;
            const bonus = position === 1 ? result.booyahBonus : position === 2 ? result.secondBonus : position === 3 ? result.thirdBonus : 0;
            totalKills += kills;
            totalEarnings += (kills * result.perKillRate) + bonus;
          }
        }
      }
    });

    return {
      played: userMatches.length,
      kills: totalKills,
      avgKills: completedCount > 0 ? (totalKills / completedCount).toFixed(1) : "0.0",
      earnings: totalEarnings
    };
  }, [joinedPlayers, matchResults, user]);

  const upcomingTournaments = tournaments.filter((item) => {
    const now = new Date();
    const tournamentTime = new Date(`${item.matchDate}T${item.matchTime}`);
    const diff = (tournamentTime - now) / 1000 / 60;
    return diff > 10 && item.tournamentType === selectedMode;
  });

  const handleOpenJoin = (tournament) => {
    if (!user) {
      alert("Please login first to join matches! ❌");
      return;
    }
    setSelectedTournament(tournament);
    setSelectedSlot(null);
    setIngameName("");
    setGameUid("");
    setGameLevel("");
    setMobileNumber("");
    setShowJoinPopup(true);
  };

  const handleConfirmJoin = async () => {
    if (!selectedSlot) {
      alert("Please select a slot number! ❌");
      return;
    }
    if (!ingameName || !gameUid || !gameLevel || !mobileNumber) {
      alert("Please fill in all player details! ❌");
      return;
    }

    const success = await onJoin(user, selectedTournament, {
      ingameName,
      gameUid,
      gameLevel,
      mobileNumber,
      selectedSlot: Number(selectedSlot)
    });

    if (success) {
      setShowJoinPopup(false);
      setSelectedTournament(null);
    }
  };

  const getSlotStatus = (tournamentId, slotNumber) => {
    const playerInSlot = joinedPlayers.find(
      p => p.tournamentId === tournamentId && Number(p.selectedSlot) === Number(slotNumber)
    );
    if (playerInSlot) {
      return { booked: true, ...playerInSlot };
    }
    return { booked: false };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-20 text-white">
      {/* Disclaimer */}
      <h2 className="text-xl md:text-3xl font-extrabold text-green-400 mb-6 border border-green-500/20 bg-green-500/5 p-3 md:p-4 rounded-2xl md:rounded-3xl text-center">
        ⚠️ ROOM ID & PASSWORD WILL BE ISSUED 10 MINUTES BEFORE MATCH START ⚠️
      </h2>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <h2 className="text-4xl md:text-5xl font-black text-orange-500 text-glow-orange tracking-wide cyber-neon">
          ⚔️ PER KILL MATCHES
        </h2>
        <button 
          onClick={() => setShowRulesPopup(true)}
          className="bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:border-orange-500/40 px-4 py-2 rounded-xl text-xs font-black tracking-wider transition-all flex items-center gap-1.5"
        >
          ❓ HOW IT WORKS / RULES
        </button>
      </div>

      {user && (
        <div className="bg-glass rounded-[24px] border border-glass-orange p-5 mb-10 max-w-4xl mx-auto shadow-glass-glow flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-black text-orange-400">⚔️ YOUR PER KILL PERFORMANCE</h3>
            <p className="text-gray-400 text-xs mt-1">Direct career summary for your per-kill tournaments.</p>
          </div>
          <div className="grid grid-cols-4 gap-4 flex-1 max-w-xl">
            <div className="bg-black/40 rounded-xl p-3 text-center border border-white/5">
              <span className="text-gray-500 text-[10px] uppercase font-bold block">Played</span>
              <span className="text-white text-lg font-black">{stats.played}</span>
            </div>
            <div className="bg-black/40 rounded-xl p-3 text-center border border-white/5">
              <span className="text-gray-500 text-[10px] uppercase font-bold block">Kills</span>
              <span className="text-red-400 text-lg font-black">{stats.kills}</span>
            </div>
            <div className="bg-black/40 rounded-xl p-3 text-center border border-white/5">
              <span className="text-gray-500 text-[10px] uppercase font-bold block">Avg Kills</span>
              <span className="text-green-400 text-lg font-black">{stats.avgKills}</span>
            </div>
            <div className="bg-black/40 rounded-xl p-3 text-center border border-white/5">
              <span className="text-gray-500 text-[10px] uppercase font-bold block">Earned</span>
              <span className="text-yellow-400 text-lg font-black">🪙{stats.earnings}</span>
            </div>
          </div>
        </div>
      )}


      {upcomingTournaments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 justify-items-center">
          {upcomingTournaments.map((tournament) => {
            const joinedCount = joinedPlayers.filter(p => p.tournamentId === tournament.id).length;
            const alreadyJoined = joinedPlayers.some(p => p.tournamentId === tournament.id && p.userId === user?.uid);

            return (
              <div 
                key={tournament.id}
                className="w-full max-w-[360px] sm:max-w-none bg-glass rounded-2xl sm:rounded-[24px] p-3.5 sm:p-5 border border-glass-orange shadow-glass-glow hover:shadow-orange-500/10 hover:-translate-y-1 hover:border-orange-500/30 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3 sm:mb-4">
                    <h3 className="text-purple-400 text-base sm:text-lg font-black tracking-wider line-clamp-1 pr-2">
                      {tournament.tournamentTitle}
                    </h3>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-widest flex-shrink-0 mt-0.5">
                      UPCOMING
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <span className="text-orange-400 font-extrabold text-[10px] sm:text-xs bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20">
                      🎮 {tournament.tournamentType}
                    </span>
                    <span className="text-blue-400 font-semibold text-[10px] sm:text-xs bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded">
                      🗺️ {tournament.selectedMap}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-black/40 rounded-lg p-2.5 sm:p-3 mb-4 sm:mb-6 border border-white/5 text-xs sm:text-sm">
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-[9px] sm:text-[10px] uppercase tracking-wider mb-0.5">Match Time</span>
                      <span className="text-rose-400 font-semibold">
                        📅 {new Date(`${tournament.matchDate}T${tournament.matchTime}`).toLocaleString("en-IN", {
                          day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Per Kill Info Box */}
                  <div className="bg-black/30 p-2.5 sm:p-4 rounded-2xl border border-gray-800 space-y-2 text-xs sm:text-sm mb-4 sm:mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-400">💰 Entry Fee</span>
                      <span className="text-orange-400 font-black">🪙 {tournament.entryFee} Coins</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">🏆 Max Prize Pool</span>
                      <span className="text-yellow-400 font-black">
                        🪙 {(Math.max(0, Number(tournament.totalTeams || 48) - 1) * Number(tournament.perKillRate || 0)) + 
                            Number(tournament.booyahBonus || 0) + 
                            Number(tournament.secondBonus || 0) + 
                            Number(tournament.thirdBonus || 0)} Coins
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-gray-800 pt-2.5">
                      <span className="text-gray-400">⚔️ Kill Reward</span>
                      <span className="text-red-400 font-black">🪙 {tournament.perKillRate} per Kill</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">🏆 Booyah</span>
                      <span className="text-yellow-400 font-black">🪙 {tournament.booyahBonus} Bonus</span>
                    </div>
                    {Number(tournament.secondBonus || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">🥈 2nd</span>
                        <span className="text-gray-300 font-black">🪙 {tournament.secondBonus} Bonus</span>
                      </div>
                    )}
                    {Number(tournament.thirdBonus || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">🥉 3rd</span>
                        <span className="text-orange-400 font-black">🪙 {tournament.thirdBonus} Bonus</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray-800 pt-2.5">
                      <span className="text-gray-400">👥 Filled Slots</span>
                      <span className="font-bold text-white">{joinedCount} / {tournament.totalTeams}</span>
                    </div>

                    {joinedCount < 10 && (
                      <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 p-2.5 rounded-xl text-[11px] font-bold text-center mt-2">
                        ⚠️ Underpopulated: Less than 10 players joined. Place bonuses will be heavily scaled down!
                      </div>
                    )}

                    {/* Button to open calculator popup */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenCalc(tournament);
                      }}
                      className="w-full mt-3 py-2 bg-orange-500/10 hover:bg-orange-500/25 text-orange-400 hover:text-orange-300 border border-orange-500/20 hover:border-orange-500/40 rounded-xl text-xs font-black tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5"
                    >
                      🧮 ESTIMATE WINNINGS
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {alreadyJoined ? (
                    <button 
                      disabled 
                      className="w-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 py-3.5 rounded-xl font-bold text-center cursor-not-allowed"
                    >
                      ✓ Already Joined
                    </button>
                  ) : joinedCount >= tournament.totalTeams ? (
                    <button 
                      disabled 
                      className="w-full bg-red-500/10 text-red-500 border border-red-500/20 py-3.5 rounded-xl font-bold text-center cursor-not-allowed"
                    >
                      Match Full
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleOpenJoin(tournament)}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-black font-black py-3.5 rounded-xl hover:scale-[1.02] duration-300 transition-all flex items-center justify-center gap-2"
                    >
                      🎯 JOINE NOW
                    </button>
                  )}

                  <button
                    onClick={() => { setSelectedViewTournament(tournament); setShowPlayersPopup(true); }}
                    className="w-full bg-glass py-2.5 rounded-xl text-xs font-black tracking-wider text-purple-400 hover:text-white border border-purple-500/20 hover:bg-purple-500/10 transition-all"
                  >
                    👥 VIEW SLOTS / PLAYERS
                  </button>

                  {/* Admin Buttons */}
                  {isAdmin && (
                    <div className="pt-2 mt-2 border-t border-gray-800 space-y-2">
                      <button
                        onClick={async () => {
                          if (onCancel) {
                            setLoadingAction(`cancel-${tournament.id}`);
                            await onCancel(tournament);
                            setLoadingAction(null);
                          }
                        }}
                        disabled={loadingAction === `cancel-${tournament.id}`}
                        className={`w-full bg-red-500/10 text-red-500 border border-red-500/20 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${loadingAction === `cancel-${tournament.id}` ? "opacity-50 cursor-wait" : "hover:bg-red-500/20 hover:border-red-500/40 hover:scale-[1.02]"}`}
                      >
                        {loadingAction === `cancel-${tournament.id}` ? "⏳ CANCELLING..." : "❌ CANCEL MATCH"}
                      </button>
                      <button
                        onClick={async () => {
                          const newTime = window.prompt("Enter new time (HH:MM in 24-hour format):", tournament.matchTime);
                          if (newTime && newTime !== tournament.matchTime) {
                            if (window.confirm(`Are you sure you want to change the time to ${newTime}?`)) {
                              if (onEditTime) {
                                setLoadingAction(`time-${tournament.id}`);
                                await onEditTime(tournament.id, newTime);
                                setLoadingAction(null);
                              }
                            }
                          }
                        }}
                        disabled={loadingAction === `time-${tournament.id}`}
                        className={`w-full bg-blue-500/10 text-blue-400 border border-blue-500/20 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${loadingAction === `time-${tournament.id}` ? "opacity-50 cursor-wait" : "hover:bg-blue-500/20 hover:border-blue-500/40 hover:scale-[1.02]"}`}
                      >
                        {loadingAction === `time-${tournament.id}` ? "⏳ UPDATING TIME..." : "⏱️ EDIT MATCH TIME"}
                      </button>
                      <button
                        onClick={async () => {
                          const currentSlots = tournament.totalTeams || 48;
                          const newSlots = window.prompt(`Enter new total slots (currently ${currentSlots}):`, currentSlots);
                          if (newSlots && !isNaN(newSlots) && Number(newSlots) > 0 && Number(newSlots) !== Number(currentSlots)) {
                            if (window.confirm(`Are you sure you want to change total slots to ${newSlots}?`)) {
                              if (typeof onEditSlots === 'function') {
                                setLoadingAction(`slots-${tournament.id}`);
                                await onEditSlots(tournament.id, newSlots);
                                setLoadingAction(null);
                              }
                            }
                          }
                        }}
                        disabled={loadingAction === `slots-${tournament.id}`}
                        className={`w-full bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${loadingAction === `slots-${tournament.id}` ? "opacity-50 cursor-wait" : "hover:bg-fuchsia-500/20 hover:border-fuchsia-500/40 hover:scale-[1.02]"}`}
                      >
                        {loadingAction === `slots-${tournament.id}` ? "⏳ UPDATING SLOTS..." : "⚙️ EDIT MATCH SLOTS"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-black/40 border border-orange-500/10 rounded-3xl text-gray-400">
          No upcoming Per Kill matches at the moment. Check back soon!
        </div>
      )}

      {/* POPUP: SLOT SELECTION & REGISTRATION */}
      {showJoinPopup && selectedTournament && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 px-4 py-6 overflow-y-auto">
          <div className="bg-[#0f0f12] w-full max-w-4xl rounded-3xl p-6 border border-orange-500/20 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800">
              <h3 className="text-2xl font-black text-orange-500">🎯 Match Registration: {selectedTournament.tournamentTitle}</h3>
              <button onClick={() => setShowJoinPopup(false)} className="text-gray-400 hover:text-white text-3xl">&times;</button>
            </div>

            {/* Step 1: Choose Slot */}
            <div className="mb-8">
              <p className="text-sm font-bold text-gray-300 mb-3">1. Select your Slot Number:</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 max-h-[220px] overflow-y-auto p-2 bg-black/40 rounded-2xl border border-gray-800 custom-scrollbar">
                {Array.from({ length: selectedTournament.totalTeams }, (_, i) => i + 1).map(num => {
                  const status = getSlotStatus(selectedTournament.id, num);
                  const isSelected = selectedSlot === num;

                  if (status.booked) {
                    return (
                      <button
                        key={num}
                        disabled
                        className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl py-3 text-xs font-bold cursor-not-allowed opacity-60 flex flex-col items-center justify-center"
                      >
                        <span>#{num}</span>
                        <span className="text-[8px] text-gray-500 line-clamp-1">{status.ingameName}</span>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={num}
                      onClick={() => setSelectedSlot(num)}
                      className={`rounded-xl py-3 text-sm font-black border transition ${
                        isSelected 
                          ? "bg-orange-500 text-black border-orange-500 shadow-lg shadow-orange-500/20" 
                          : "bg-black/60 text-gray-300 border-gray-800 hover:border-orange-500/40"
                      }`}
                    >
                      #{num}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Player Details */}
            <div className="mb-8">
              <p className="text-sm font-bold text-gray-300 mb-4">2. Enter player profile information:</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 font-bold block mb-1">IN-GAME NAME</label>
                  <input
                    type="text"
                    value={ingameName}
                    onChange={(e) => setIngameName(e.target.value)}
                    placeholder="Enter exactly as shown in-game"
                    className="bg-black border border-gray-800 rounded-xl w-full px-4 py-3 text-white outline-none focus:border-orange-500/40 transition"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold block mb-1">GAME UID</label>
                  <input
                    type="text"
                    value={gameUid}
                    onChange={(e) => setGameUid(e.target.value)}
                    placeholder="Enter game UID numbers"
                    className="bg-black border border-gray-800 rounded-xl w-full px-4 py-3 text-white outline-none focus:border-orange-500/40 transition"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold block mb-1">GAME LEVEL</label>
                  <input
                    type="number"
                    value={gameLevel}
                    onChange={(e) => setGameLevel(e.target.value)}
                    placeholder="e.g. 50"
                    className="bg-black border border-gray-800 rounded-xl w-full px-4 py-3 text-white outline-none focus:border-orange-500/40 transition"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold block mb-1">MOBILE NUMBER</label>
                  <input
                    type="text"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="WhatsApp number preferred"
                    className="bg-black border border-gray-800 rounded-xl w-full px-4 py-3 text-white outline-none focus:border-orange-500/40 transition"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 border-t border-gray-800 pt-6">
              <button
                onClick={() => setShowJoinPopup(false)}
                className="w-1/3 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3.5 rounded-xl transition"
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirmJoin}
                disabled={joinLoading}
                className="w-2/3 bg-gradient-to-r from-orange-500 to-red-600 text-black font-black text-lg py-3.5 rounded-xl hover:scale-[1.01] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joinLoading ? "JOINING MATCH..." : `CONFIRM JOIN (🪙 ${selectedTournament.entryFee} Entry Fee)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP: VIEW SLOTS / PLAYERS */}
      {showPlayersPopup && selectedViewTournament && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 px-4">
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
                      <div>
                        <p className="font-bold text-white line-clamp-1">{status.ingameName}</p>
                        <p className="text-[10px] text-gray-400">UID: {status.gameUid}</p>
                        <p className="text-[10px] text-blue-400">Level: {status.gameLevel}</p>
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

      {/* POPUP: HOW PER KILL WORKS */}
      {showRulesPopup && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 px-4">
          <div className="bg-[#0f0f12] w-full max-w-lg rounded-3xl p-6 border border-orange-500/20 shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
              <h3 className="text-2xl font-black text-orange-500">❓ HOW PER KILL MODE WORKS</h3>
              <button onClick={() => setShowRulesPopup(false)} className="text-gray-400 hover:text-white text-3xl">&times;</button>
            </div>
            
            <div className="space-y-4 text-sm text-gray-300">
              <div className="bg-black/40 p-4 rounded-xl border border-gray-800">
                <p className="text-orange-400 font-bold text-base mb-1">1. ⚔️ Per Kill Reward (Constant)</p>
                <p>Every single kill you secure in the match earns you the configured **Per Kill Rate** directly. This rate is constant and does **NOT** scale.</p>
              </div>

              <div className="bg-black/40 p-4 rounded-xl border border-gray-800">
                <p className="text-yellow-400 font-bold text-base mb-1">2. 🏆 Dynamic Place Bonuses (1st, 2nd, 3rd)</p>
                <p>The place bonuses (Booyah, 2nd, and 3rd) scale dynamically based on the percentage of filled player slots in the match.</p>
                <p className="text-xs text-gray-400 font-mono mt-2 bg-black/60 p-2 rounded">
                  Scaled Bonus = Configured Bonus × (Joined Players / Total Slots)
                </p>
                <p className="text-xs text-rose-400 mt-2">
                  ⚠️ This prevents admin losses when a match starts with very few players!
                </p>
              </div>

              <div className="bg-black/40 p-4 rounded-xl border border-gray-800">
                <p className="text-green-400 font-bold text-base mb-1">3. 💰 Earnings Calculation Example</p>
                <p>If you get **4 kills** and win **2nd place** in a match where 24 out of 48 slots are filled (50%):</p>
                <ul className="list-disc pl-5 text-xs mt-1 space-y-1 text-gray-400">
                  <li>Kills Reward: 4 kills × 15 = 🪙60 Coins</li>
                  <li>2nd Place scaled: 🪙30 Bonus × 50% = 🪙15 Coins</li>
                  <li>**Total Earnings = 🪙75 Coins**</li>
                </ul>
              </div>
            </div>

            <button 
              onClick={() => setShowRulesPopup(false)} 
              className="w-full mt-6 py-3 rounded-xl bg-orange-500 text-black font-black hover:scale-[1.01] transition"
            >
              GOT IT!
            </button>
          </div>
        </div>
      )}
      {/* POPUP: LIVE EARNINGS CALCULATOR */}
      {showCalcPopup && selectedCalcTournament && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 px-4">
          <div className="bg-[#0f0f12] w-full max-w-md rounded-3xl p-6 border border-orange-500/20 shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
              <h3 className="text-2xl font-black text-orange-500 flex items-center gap-2">
                <span>🧮</span> Winnings Calculator
              </h3>
              <button 
                onClick={() => { setShowCalcPopup(false); setSelectedCalcTournament(null); }} 
                className="text-gray-400 hover:text-white text-3xl"
              >
                &times;
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-4">
              Estimate potential earnings for match: <span className="text-orange-400 font-bold">{selectedCalcTournament.tournamentTitle}</span>
            </p>

            <div className="space-y-4">
              {/* Info Rates */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-black/40 p-3 rounded-xl border border-white/5">
                <div>
                  <span className="text-gray-500 block">Per Kill Rate</span>
                  <span className="text-red-400 font-bold text-sm">🪙 {selectedCalcTournament.perKillRate} Coins</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Booyah Bonus</span>
                  <span className="text-yellow-400 font-bold text-sm">🪙 {selectedCalcTournament.booyahBonus} Coins</span>
                </div>
              </div>

              {/* Inputs */}
              <div>
                <label className="text-gray-400 text-xs block mb-1.5 font-bold">ESTIMATED KILLS</label>
                <input
                  type="number"
                  min="0"
                  value={calcKillsVal}
                  onChange={(e) => setCalcKillsVal(Math.max(0, Number(e.target.value) || 0))}
                  className="bg-black/80 border border-gray-800 rounded-xl px-4 py-2.5 w-full text-white font-bold text-lg text-center focus:border-orange-500/50 outline-none"
                />
              </div>

              <div>
                <label className="text-gray-400 text-xs block mb-1.5 font-bold">ESTIMATED PLACE</label>
                <select
                  value={calcPlaceVal}
                  onChange={(e) => setCalcPlaceVal(Number(e.target.value))}
                  className="bg-black/80 border border-gray-800 rounded-xl px-4 py-2.5 w-full text-white font-bold text-sm focus:border-orange-500/50 outline-none"
                >
                  <option value="0">None</option>
                  <option value="1">🥇 1st / Booyah</option>
                  {Number(selectedCalcTournament.secondBonus || 0) > 0 && <option value="2">🥈 2nd Place</option>}
                  {Number(selectedCalcTournament.thirdBonus || 0) > 0 && <option value="3">🥉 3rd Place</option>}
                </select>
              </div>

              {(() => {
                const joinedCount = joinedPlayers.filter(p => p.tournamentId === selectedCalcTournament.id).length;
                const totalSlots = Number(selectedCalcTournament.totalTeams) || 48;
                const ratio = totalSlots > 0 ? Math.min(1, joinedCount / totalSlots) : 1;
                const scaledBooyah = Math.floor((Number(selectedCalcTournament.booyahBonus) || 0) * ratio);
                const scaledSecond = Math.floor((Number(selectedCalcTournament.secondBonus) || 0) * ratio);
                const scaledThird = Math.floor((Number(selectedCalcTournament.thirdBonus) || 0) * ratio);

                const placeBonus = calcPlaceVal === 1 ? scaledBooyah : calcPlaceVal === 2 ? scaledSecond : calcPlaceVal === 3 ? scaledThird : 0;
                const calculatedWinnings = (calcKillsVal * selectedCalcTournament.perKillRate) + placeBonus;

                return (
                  <div className="bg-black/60 p-4 rounded-2xl border border-orange-500/20 mt-4 space-y-2">
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span>Joined Slots Ratio:</span>
                      <span className="font-mono">{joinedCount} / {totalSlots} ({Math.round(ratio * 100)}%)</span>
                    </div>
                    {ratio < 1 && calcPlaceVal > 0 && (
                      <div className="flex justify-between items-center text-xs text-rose-405">
                        <span>Place Bonus Scaled:</span>
                        <span>🪙 {placeBonus} (from original {calcPlaceVal === 1 ? selectedCalcTournament.booyahBonus : calcPlaceVal === 2 ? selectedCalcTournament.secondBonus : selectedCalcTournament.thirdBonus})</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center border-t border-gray-800 pt-2 font-bold">
                      <span className="text-gray-300">Estimated Winnings:</span>
                      <span className="text-green-400 text-xl font-black">🪙 {calculatedWinnings} Coins</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <button 
              onClick={() => { setShowCalcPopup(false); setSelectedCalcTournament(null); }} 
              className="w-full mt-6 py-3 rounded-xl bg-orange-500 text-black font-black hover:scale-[1.01] transition"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
