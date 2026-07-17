import { useState } from "react";
import soloImg from "../assets/solo.png";
import duoImg from "../assets/duo.png";
import squadImg from "../assets/squad.png";
import onevoneImg from "../assets/1v1.png";
import onevtwoImg from "../assets/1v2.png";
import threevthreeImg from "../assets/3v3.png";
import fourvfourImg from "../assets/4v4.png";

const gameModes = [
  { name: "SOLO", image: soloImg, color: "from-orange-500 to-red-500", glow: "shadow-orange-500/50" },
  { name: "DUO", image: duoImg, color: "from-green-500 to-emerald-500", glow: "shadow-green-500/50" },
  { name: "SQUAD", image: squadImg, color: "from-blue-500 to-cyan-500", glow: "shadow-blue-500/50" },
  { name: "1V1", image: onevoneImg, color: "from-purple-500 to-pink-500", glow: "shadow-purple-500/50" },
  { name: "1V2", image: onevtwoImg, color: "from-yellow-500 to-orange-500", glow: "shadow-yellow-500/50" },
  { name: "2V2", image: duoImg, color: "from-teal-500 to-blue-500", glow: "shadow-teal-500/50" },
  { name: "3V3", image: threevthreeImg, color: "from-indigo-500 to-purple-500", glow: "shadow-indigo-500/50" },
  { name: "4V4", image: fourvfourImg, color: "from-rose-500 to-pink-500", glow: "shadow-rose-500/50" },
];

export default function GameModes({ selectedMode, onModeChange, onOtherGamesClick }) {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 relative z-10">
      
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-32 bg-orange-500/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="w-full relative">
        <div className="flex flex-wrap gap-3 md:gap-4 justify-center w-full mx-auto">
          {gameModes.map((mode) => {
            const isSelected = selectedMode === mode.name;
            return (
              <button
                key={mode.name}
                onClick={() => onModeChange(mode.name)}
                className={`group relative px-3 md:px-6 py-3 md:py-5 rounded-2xl md:rounded-3xl font-black transition-all duration-500 flex-1 md:flex-none min-w-[80px] md:min-w-[120px] overflow-hidden ${
                  isSelected
                    ? `bg-gradient-to-br ${mode.color} text-white shadow-[0_0_20px_rgba(0,0,0,0)] shadow-lg ${mode.glow} scale-105 md:scale-110 z-10 border border-white/20`
                    : "bg-glass border border-white/5 text-gray-400 hover:text-white hover:border-white/20 hover:scale-105 hover:bg-white/5"
                }`}
              >
                {/* Inner Glow effect when selected */}
                {isSelected && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-50"></div>
                )}
                
                <div className="relative flex flex-col items-center gap-2 md:gap-3 z-10">
                  <img
                    src={mode.image}
                    alt={mode.name}
                    className={`w-8 h-8 md:w-12 md:h-12 object-contain transition-all duration-500 ${
                      isSelected 
                        ? "scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                        : "opacity-60 group-hover:opacity-100 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                    }`}
                  />
                  <span className={`text-[11px] md:text-sm font-bold tracking-widest ${isSelected ? 'text-white' : ''}`}>
                    {mode.name}
                  </span>
                </div>

                {/* Animated bottom indicator */}
                {isSelected && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-white/50"></div>
                )}
              </button>
            );
          })}
          
          {/* OTHER GAMES Button */}
          <button
            onClick={onOtherGamesClick}
            className="group relative px-3 md:px-6 py-3 md:py-5 rounded-2xl md:rounded-3xl font-black transition-all duration-500 bg-glass border border-orange-500/20 text-orange-400 hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-orange-300 hover:scale-105 flex flex-col items-center justify-center gap-2 md:gap-3 flex-1 md:flex-none min-w-[80px] md:min-w-[120px] overflow-hidden shadow-glass-glow"
          >
            <span className="text-2xl md:text-4xl opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:-translate-y-1">🎮</span>
            <span className="text-[10px] md:text-xs font-bold tracking-widest text-center leading-tight">OTHER<br/>GAMES</span>
            
            {/* Hover Sweep Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
          </button>
        </div>
      </div>
    </section>
  );
}