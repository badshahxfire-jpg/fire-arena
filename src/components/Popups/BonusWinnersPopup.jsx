import { useState, useEffect } from "react";
import { ref, onValue, remove } from "firebase/database";
import { database } from "../../firebase";

export default function BonusWinnersPopup({ onClose, isAdmin }) {
  const [bonusWinners, setBonusWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bonusesRef = ref(database, "loyalBonuses");
    const unsubscribe = onValue(bonusesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map((key) => ({
          id: key,
          ...data[key]
        }));
        
        // Sort by totalBonus descending and take top 10
        const sorted = list
          .sort((a, b) => Number(b.totalBonus || 0) - Number(a.totalBonus || 0))
          .slice(0, 10);
          
        setBonusWinners(sorted);
      } else {
        setBonusWinners([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0c0c0e] border border-glass-orange rounded-[30px] w-full max-w-2xl h-[75vh] flex flex-col overflow-hidden relative shadow-2xl font-gaming animate-scale-in">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/40">
          <div>
            <h3 className="text-2xl font-extrabold text-orange-500 text-glow-orange flex items-center gap-2">
              🎁 TOP 10 BONUS WINNERS
            </h3>
            <p className="text-gray-400 text-xs mt-1">
              Top 10 players who received daily active streak bonuses from the admin.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && bonusWinners.length > 0 && (
              <button
                onClick={async () => {
                  if (window.confirm("Are you sure you want to clear the entire Bonus Winners list? Do this before announcing new winners!")) {
                    try {
                      await remove(ref(database, "loyalBonuses"));
                      alert("Bonus Winners list cleared! ✅");
                    } catch (error) {
                      console.error(error);
                      alert("Error clearing list.");
                    }
                  }
                }}
                className="bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white px-3 py-1.5 rounded-xl border border-red-500/30 font-bold text-xs transition-all duration-300"
              >
                🗑️ CLEAR LIST
              </button>
            )}
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-300 font-bold text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden p-6 flex flex-col bg-[#08080a]">
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mb-4"></div>
                <span>Loading winners...</span>
              </div>
            ) : bonusWinners.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm py-12">
                <span>📭 No bonus records found.</span>
              </div>
            ) : (
              bonusWinners.map((winner, idx) => (
                <div 
                  key={winner.id} 
                  className={`bg-[#111115] border border-white/5 rounded-2xl p-3 sm:p-4 flex flex-row items-center justify-between gap-3 transition-all duration-300 ${
                    idx === 0 
                      ? "border-yellow-500/20 bg-gradient-to-r from-yellow-500/5 to-transparent" 
                      : idx === 1 
                      ? "border-gray-400/20 bg-gradient-to-r from-gray-400/5 to-transparent"
                      : idx === 2
                      ? "border-orange-500/20 bg-gradient-to-r from-orange-500/5 to-transparent"
                      : ""
                  }`}
                >
                  
                  {/* Left: Rank & Profile details */}
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full font-black flex items-center justify-center text-xs sm:text-sm flex-shrink-0 ${
                      idx === 0 
                        ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/20" 
                        : idx === 1 
                        ? "bg-gray-400 text-black shadow-lg shadow-gray-400/20"
                        : idx === 2
                        ? "bg-orange-500 text-black shadow-lg shadow-orange-500/20"
                        : "bg-white/5 border border-white/10 text-gray-300"
                    }`}>
                      {idx === 0 ? "👑" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                    </span>
                    <div className="flex flex-row flex-wrap items-center gap-x-2 sm:gap-x-4 gap-y-0.5 min-w-0">
                      <p className="text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 truncate">
                        👤 {winner.name || "No Name"}
                      </p>
                      <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-400 min-w-0">
                        <span className="truncate">🎮 ID: <span className="text-gray-300">{winner.userId || "N/A"}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Total Bonus Wins */}
                  <div className="text-right flex flex-col items-end flex-shrink-0 bg-orange-500/10 px-3 py-1.5 rounded-xl border border-orange-500/20 min-w-[80px] sm:min-w-[110px]">
                    <span className="text-gray-400 text-[8px] sm:text-[10px] uppercase font-bold">Total Bonus</span>
                    <span className="text-xs sm:text-base text-yellow-400 font-black">🪙 {winner.totalBonus}</span>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
