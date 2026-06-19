import { useState } from "react";

export default function LivePerKillMatches({ 
  tournaments, 
  joinedPlayers, 
  user,
  selectedMode
}) {
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

  const liveTournaments = tournaments.filter((item) => {
    const now = new Date();
    const tournamentTime = new Date(`${item.matchDate}T${item.matchTime}`);
    const diff = (tournamentTime - now) / 1000 / 60;
    
    // Live means: match starts in 10 minutes or has already started (within the last 5 days)
    return diff <= 10 && diff > -7200 && item.tournamentType === selectedMode;
  });


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-20 text-white">
      <h2 className="text-4xl md:text-5xl font-black text-orange-500 text-glow-orange mb-10 tracking-wide cyber-neon">
        🎮 LIVE PER KILL MATCHES
      </h2>

      {liveTournaments.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {liveTournaments.map((tournament) => {
            const joinedCount = joinedPlayers.filter(p => p.tournamentId === tournament.id).length;
            const userRegistration = joinedPlayers.find(p => p.tournamentId === tournament.id && p.userId === user?.uid);
            const isJoined = !!userRegistration;
            const totalSlots = Number(tournament.totalTeams) || 48;
            const ratio = totalSlots > 0 ? Math.min(1, joinedCount / totalSlots) : 1;
            const scaledBooyah = Math.floor((Number(tournament.booyahBonus) || 0) * ratio);
            const scaledSecond = Math.floor((Number(tournament.secondBonus) || 0) * ratio);
            const scaledThird = Math.floor((Number(tournament.thirdBonus) || 0) * ratio);

            return (
              <div 
                key={tournament.id}
                className="bg-glass rounded-[24px] p-6 border border-glass-orange shadow-glass-glow hover:shadow-orange-500/10 hover:-translate-y-1 hover:border-orange-500/30 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-purple-400 text-lg font-black tracking-wider line-clamp-1 pr-2">
                      {tournament.tournamentTitle}
                    </h3>
                    <span className="bg-red-500/10 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest flex-shrink-0 animate-pulse">
                      LIVE
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-orange-400 font-extrabold text-xs bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20">
                      🎮 {tournament.tournamentType}
                    </span>
                    <span className="text-blue-400 font-semibold text-xs bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded">
                      🗺️ {tournament.selectedMap}
                    </span>
                  </div>

                  <div className="bg-black/30 p-4 rounded-2xl border border-gray-800 space-y-2.5 text-sm mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-400">⚔️ Kill Reward</span>
                      <span className="text-red-400 font-black">🪙 {tournament.perKillRate} per Kill</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">🏆 Booyah Bonus (Scaled)</span>
                      <span className="text-yellow-400 font-black">🪙 {scaledBooyah} Coins</span>
                    </div>
                    {Number(tournament.secondBonus || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">🥈 2nd Place Bonus (Scaled)</span>
                        <span className="text-gray-300 font-black">🪙 {scaledSecond} Coins</span>
                      </div>
                    )}
                    {Number(tournament.thirdBonus || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">🥉 3rd Place Bonus (Scaled)</span>
                        <span className="text-orange-400 font-black">🪙 {scaledThird} Coins</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray-800 pt-2.5">
                      <span className="text-gray-400">👥 Players Joined</span>
                      <span className="font-bold text-white">{joinedCount} / {tournament.totalTeams}</span>
                    </div>

                    {joinedCount < 10 && (
                      <div className="bg-rose-500/10 text-rose-450 border border-rose-500/20 p-2.5 rounded-xl text-[11px] font-bold text-center mt-2">
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

                  {/* ROOM DETAILS BOX FOR REGISTERED USER */}
                  {isJoined ? (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 mb-4">
                      <p className="text-emerald-400 text-xs font-black tracking-widest uppercase mb-3 text-center">🔑 YOUR ROOM DETAILS 🔑</p>
                      {tournament.roomId && tournament.roomPassword ? (
                        <div className="space-y-3 font-mono">
                          <div className="flex justify-between items-center bg-black/60 px-4 py-2.5 rounded-xl border border-gray-800">
                            <span className="text-xs text-gray-500">ROOM ID</span>
                            <span className="text-white font-black text-sm select-all">{tournament.roomId}</span>
                          </div>
                          <div className="flex justify-between items-center bg-black/60 px-4 py-2.5 rounded-xl border border-gray-800">
                            <span className="text-xs text-gray-500">PASSWORD</span>
                            <span className="text-yellow-400 font-black text-sm select-all">{tournament.roomPassword}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 text-center mt-2">Tap on value to select and copy</p>
                        </div>
                      ) : (
                        <p className="text-sm text-yellow-500 text-center font-bold">
                          ⏳ Waiting for Room details to be published by Admin.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 mb-4 text-center">
                      <p className="text-yellow-500 text-xs font-black tracking-wider uppercase mb-1">🔒 LOCKED</p>
                      <p className="text-xs text-gray-400">Only registered participants can view the room details.</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-500 text-center">
                  Match time: {tournament.matchDate} {tournament.matchTime}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-black/40 border border-orange-500/10 rounded-3xl text-gray-400">
          No live/in-progress Per Kill matches at the moment.
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
                      <div className="flex justify-between items-center text-xs text-rose-450">
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
