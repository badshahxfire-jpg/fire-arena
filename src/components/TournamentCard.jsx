export default function TournamentCard({ 
  tournament, 
  onJoin, 
  onViewPlayers, 
  onCancel, 
  joinLoading, 
  isAdmin,
  user,
  joinedPlayers 
}) {
  const isJoined = joinedPlayers.find(
    (player) => player.tournamentId === tournament.id && player.userEmail === user?.email
  );

  // Calculate prize distribution for SOLO mode
  const getPrizeDistribution = () => {
    if (tournament.tournamentType !== "SOLO") return null;
    
    const totalPool = Number(tournament.totalPrizePool || 0);
    return (
      <div className="space-y-2 mt-4">
        <div className="flex justify-between"><span>🥇 Top 1</span><span className="text-yellow-400">🪙 {Math.floor(totalPool * 0.12)}</span></div>
        <div className="flex justify-between"><span>🥈 Top 2</span><span className="text-gray-300">🪙 {Math.floor(totalPool * 0.10)}</span></div>
        <div className="flex justify-between"><span>🥉 Top 3</span><span className="text-orange-400">🪙 {Math.floor(totalPool * 0.08)}</span></div>
        <div className="flex justify-between"><span>🏅 Top 4-5</span><span className="text-green-400">🪙 {Math.floor(totalPool * 0.05)}</span></div>
        <div className="flex justify-between"><span>🔥 Top 6-10</span><span className="text-blue-400">🪙 {Math.floor(totalPool * 0.04)}</span></div>
      </div>
    );
  };

  return (
    <div className="w-[85vw] sm:w-[280px] md:w-[320px] max-w-[340px] flex-shrink-0 snap-center bg-glass rounded-[24px] p-4 md:p-5 border border-glass-orange shadow-glass-glow hover:shadow-orange-500/10 hover:-translate-y-1 hover:border-orange-500/30 transition-all duration-300 relative overflow-hidden group cyber-card">
      {/* Tournament Title */}
      <p className="text-purple-400 text-xs md:text-sm font-bold tracking-wider mb-2">
        {tournament.tournamentTitle}
      </p>

      {/* Live Start Time */}
      <p className="text-yellow-400 text-[10px] md:text-xs font-bold mb-3 bg-yellow-500/5 border border-yellow-500/10 rounded-lg px-2 py-1 w-fit text-glow-yellow">
        ⚡ LIVE: {
          new Date(new Date(`${tournament.matchDate}T${tournament.matchTime}`).getTime() - 10 * 60 * 1000)
          .toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
        }
      </p>

      <div className="flex items-center justify-between mb-3">
        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-full text-[10px] md:text-xs font-bold tracking-widest shadow-inner">
          UPCOMING
        </span>
        <span className="text-rose-500 font-semibold flex items-center gap-1 text-[10px] md:text-xs bg-rose-500/5 border border-rose-500/10 rounded-lg px-2 py-1">
          📅 {new Date(`${tournament.matchDate}T${tournament.matchTime}`).toLocaleString("en-IN", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit", hour12: true,
          })}
        </span>
      </div>

      <p className="text-orange-400 font-extrabold text-glow-orange text-base md:text-lg mb-1">
        🎮 {tournament.tournamentType}
      </p>
      <p className="text-blue-400 font-semibold flex items-center gap-1.5 text-[10px] md:text-xs bg-blue-500/5 border border-blue-500/10 rounded-lg px-2 py-1 w-fit mb-3">
        🗺️ {tournament.selectedMap}
      </p>

      {/* Info Section */}
      <div className="space-y-2 text-xs md:text-sm">
        <div className="flex justify-between">
          <span>💰 Entry Fee</span>
          <span className="text-orange-400 font-black">🪙 {tournament.entryFee}</span>
        </div>
        <div className="flex justify-between">
          <span>👥 Players</span>
          <span className="font-black">{tournament.joinedCount || 0}/{tournament.totalTeams}</span>
        </div>
        <div className="flex justify-between">
          <span>🏆 Prize Pool</span>
          <span className="text-yellow-400 font-black cyber-prize">🪙 {tournament.currentPrizePool || 0}</span>
        </div>
      </div>

      {/* Prize Distribution */}
      {getPrizeDistribution()}

      {/* Join Button */}
      <button
        onClick={() => onJoin(tournament)}
        disabled={joinLoading}
        className={`w-full mt-4 py-2.5 md:py-3 rounded-[14px] font-extrabold text-sm md:text-base tracking-wide duration-300 cyber-btn ${
          joinLoading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {joinLoading ? "JOINING..." : "🚀 JOIN TOURNAMENT"}
      </button>

      {/* Admin Buttons */}
      {isAdmin && (
        <>
          <button
            onClick={() => onViewPlayers(tournament)}
            className="w-full mt-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 py-2.5 rounded-[14px] text-xs font-bold duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            👥 VIEW JOINED PLAYERS ({joinedPlayers.filter(p => p.tournamentId === tournament.id).length})
          </button>
          <button
            onClick={() => onCancel(tournament)}
            className="w-full mt-3 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 py-2.5 rounded-[14px] text-xs font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            ❌ CANCEL MATCH
          </button>
        </>
      )}
    </div>
  );
}