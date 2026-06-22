import React from "react";

export default function PremiumTournaments({ tournaments, onJoinClick }) {
  // Filter tournaments (this is simplified, use your actual logic)
  const liveTournaments = tournaments?.filter(t => t.status === "ACTIVE" || !t.status) || [];
  const upcomingTournaments = tournaments?.filter(t => t.status === "UPCOMING") || [];

  const getModeColor = (mode) => {
    switch(mode) {
      case "SOLO": return "from-red-600 to-red-900 border-red-500 text-red-500";
      case "DUO": return "from-purple-600 to-purple-900 border-purple-500 text-purple-500";
      case "SQUAD": return "from-orange-600 to-orange-900 border-orange-500 text-orange-500";
      case "4v4": return "from-blue-600 to-blue-900 border-blue-500 text-blue-500";
      default: return "from-gray-600 to-gray-900 border-gray-500 text-gray-500";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Live Tournaments (Takes 2 columns on lg) */}
      <div className="lg:col-span-2 bg-[#0d0d0d] border border-gray-800 rounded-2xl p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            LIVE TOURNAMENTS
          </h3>
          <button className="text-orange-500 text-xs font-bold border border-orange-500/30 px-3 py-1 rounded hover:bg-orange-500/10 transition">
            VIEW ALL
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {liveTournaments.slice(0, 4).map((t, idx) => {
            const colors = getModeColor(t.tournamentType);
            const bgGradient = colors.split(" ")[0] + " " + colors.split(" ")[1];
            const borderColor = colors.split(" ")[2];
            const textColor = colors.split(" ")[3];

            return (
              <div key={t.id || idx} className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition group flex flex-col h-full">
                {/* Image Placeholder */}
                <div className={`h-32 bg-gradient-to-b ${bgGradient} relative flex items-center justify-center`}>
                  {/* Mode Badge */}
                  <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-black bg-opacity-20 backdrop-blur-sm border ${borderColor} text-white`}>
                    {t.tournamentType}
                  </div>
                  {/* Live Badge */}
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold text-green-400 flex items-center gap-1 border border-green-500/30 bg-black/50 backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> LIVE
                  </div>
                  {/* Character Silhouette */}
                  <div className="text-6xl opacity-50 drop-shadow-2xl transform group-hover:scale-110 transition duration-300">
                    🥷
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex flex-col flex-grow">
                  <div className="flex justify-between items-center mb-2 text-xs">
                    <span className="text-gray-400">ENTRY FEE</span>
                    <span className="text-yellow-500 font-bold">🪙 {t.entryFee || 10}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4 text-xs">
                    <span className="text-gray-400">PRIZE POOL</span>
                    <span className="text-yellow-500 font-bold">🪙 {t.totalPrizePool || 500}</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-auto">
                     <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                       <span>PLAYERS</span>
                       <span>{t.joinedCount || 0} / {t.totalTeams || 48}</span>
                     </div>
                     <div className="h-1.5 w-full bg-gray-800 rounded-full mb-4 overflow-hidden">
                       <div 
                         className="h-full bg-orange-500 rounded-full"
                         style={{ width: `${Math.min(((t.joinedCount || 0) / (t.totalTeams || 48)) * 100, 100)}%` }}
                       ></div>
                     </div>

                     <button 
                       onClick={() => onJoinClick(t)}
                       className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-black font-black text-sm py-2 rounded-lg transition"
                     >
                       JOIN NOW
                     </button>
                  </div>
                </div>
              </div>
            );
          })}
          {liveTournaments.length === 0 && (
            <div className="col-span-full text-center py-10 text-gray-500">
              No live tournaments right now.
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Tournaments (Takes 1 column on lg) */}
      <div className="bg-[#0d0d0d] border border-gray-800 rounded-2xl p-4 sm:p-6 flex flex-col h-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-bold text-lg">UPCOMING TOURNAMENTS</h3>
          <button className="text-orange-500 text-xs font-bold border border-orange-500/30 px-3 py-1 rounded hover:bg-orange-500/10 transition">
            VIEW ALL
          </button>
        </div>

        <div className="flex flex-col gap-3 flex-grow">
          {upcomingTournaments.length > 0 ? (
             upcomingTournaments.slice(0, 4).map((t, idx) => {
              const colors = getModeColor(t.tournamentType);
              const borderColor = colors.split(" ")[2];
              const textColor = colors.split(" ")[3];

              return (
                <div key={t.id || idx} className="bg-[#111] border border-gray-800 rounded-xl p-3 flex items-center gap-3 hover:border-gray-600 transition">
                  {/* Mode Icon */}
                  <div className={`w-12 h-12 rounded-lg bg-black border ${borderColor} flex items-center justify-center font-black ${textColor} text-xs`}>
                    {t.tournamentType?.substring(0, 4)}
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1">
                    <p className={`font-bold text-sm ${textColor}`}>{t.tournamentType}</p>
                    <p className="text-xs text-gray-400">ENTRY: <span className="text-yellow-500">🪙 {t.entryFee}</span></p>
                  </div>

                  {/* Starts In & Join */}
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 mb-0.5">STARTS IN</p>
                    <p className="text-white text-xs font-mono mb-2">{t.matchTime || "00:00"}</p>
                    <button 
                      onClick={() => onJoinClick(t)}
                      className="border border-orange-500/50 hover:bg-orange-500/10 text-orange-500 px-4 py-1 rounded text-xs font-bold transition"
                    >
                      JOIN
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
             <div className="text-center py-10 text-gray-500 flex-grow flex items-center justify-center">
              No upcoming tournaments.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
