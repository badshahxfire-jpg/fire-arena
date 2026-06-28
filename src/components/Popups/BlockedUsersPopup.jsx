import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

export default function BlockedUsersPopup({ onClose }) {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        const q = query(collection(db, "users"), where("blocked", "==", true));
        const querySnapshot = await getDocs(q);
        const usersList = [];
        querySnapshot.forEach((doc) => {
          usersList.push({ id: doc.id, ...doc.data() });
        });
        setBlockedUsers(usersList);
      } catch (error) {
        console.error("Error fetching blocked users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlockedUsers();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0c0c0e] border border-red-500/50 rounded-[30px] w-full max-w-2xl h-[75vh] flex flex-col overflow-hidden relative shadow-2xl font-gaming animate-scale-in">
        
        {/* Header */}
        <div className="p-6 border-b border-red-500/20 flex justify-between items-center bg-black/40">
          <div>
            <h3 className="text-2xl font-extrabold text-red-500 text-glow-red flex items-center gap-2">
              🚫 BLOCKED PLAYERS
            </h3>
            <p className="text-gray-400 text-xs mt-1">
              List of players who have been banned from the arena.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-300 font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden p-6 flex flex-col bg-[#08080a]">
          {/* Warning Banner */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 flex items-center gap-3 animate-pulse-slow">
            <span className="text-2xl">⚠️</span>
            <p className="text-red-400 text-xs sm:text-sm font-bold">
              WARNING: Kisi bhi tarah ka hack, script ya cheating use karne par aapki ID hamesha ke liye BLOCK kar di jayegi! Play fair.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500 mb-4"></div>
                <span>Loading blocked players...</span>
              </div>
            ) : blockedUsers.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm py-12">
                <span>✅ No players are currently blocked.</span>
              </div>
            ) : (
              blockedUsers.map((user, idx) => (
                <div 
                  key={user.id} 
                  className="bg-[#111115] border border-red-500/20 rounded-2xl p-3 sm:p-4 flex flex-row items-center justify-between gap-3 transition-all duration-300"
                >
                  
                  {/* Left: Rank & Profile details */}
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full font-black flex items-center justify-center text-xs sm:text-sm flex-shrink-0 bg-red-500 text-white shadow-lg shadow-red-500/20">
                      🚫
                    </span>
                    <div className="flex flex-col gap-y-0.5 min-w-0">
                      <p className="text-red-400 font-extrabold text-xs sm:text-sm flex items-center gap-2 truncate">
                        👤 {user.username || user.name || "No Name"}
                      </p>
                      <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-400 min-w-0">
                        <span className="truncate">🎮 In-Game Name: <span className="text-gray-300">{user.inGameName || "N/A"}</span></span>
                      </div>
                      {user.blockReason && (
                        <p className="text-[10px] text-red-300 italic truncate mt-0.5">
                          Reason: {user.blockReason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Status */}
                  <div className="text-right flex flex-col items-end flex-shrink-0 bg-red-500/10 px-3 py-1.5 rounded-xl border border-red-500/20 min-w-[80px] sm:min-w-[110px]">
                    <span className="text-red-400 text-[8px] sm:text-[10px] uppercase font-bold">Status</span>
                    <span className="text-xs sm:text-base text-red-500 font-black">BANNED</span>
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
