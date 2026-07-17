import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PlayerListPopup({ tournament, joinedPlayers = [], onClose }) {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    if (!tournament) return;

    let allPlayers = [];
    
    // Check joinedPlayers
    if (joinedPlayers && Array.isArray(joinedPlayers)) {
      const matchPlayers = joinedPlayers.filter(p => p.tournamentId === tournament.id);
      matchPlayers.forEach(teamData => {
        // Add leader
        allPlayers.push({
          name: teamData.inGameName || teamData.ingameName || teamData.playerName || "Unknown",
          isLeader: true,
        });

        // Add teammates
        if (teamData.teammates && Array.isArray(teamData.teammates)) {
          teamData.teammates.forEach((tm) => {
            allPlayers.push({
              name: tm.inGameName || tm.ingameName || tm.playerName || "Unknown",
              isLeader: false,
            });
          });
        }
      });
    }

    setPlayers(allPlayers);
  }, [tournament, joinedPlayers]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#0a0a0f] border border-orange-500/30 rounded-[24px] shadow-[0_0_50px_rgba(249,115,22,0.1)] p-6 w-full max-w-md relative z-10 max-h-[80vh] flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-orange-400 uppercase tracking-wider flex items-center gap-2">
              <span>👥</span> Registered Players
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
            {players.length === 0 ? (
              <div className="text-center py-10 text-gray-500 font-medium">
                No players registered yet. Be the first! 🏆
              </div>
            ) : (
              players.map((player, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-3 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <span className="font-bold text-gray-200">{player.name}</span>
                  </div>
                  {player.isLeader && (
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-black tracking-wider">
                      LEADER
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/10 text-center">
            <p className="text-xs text-gray-500 font-medium">
              Only In-Game Names are shown for privacy.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
