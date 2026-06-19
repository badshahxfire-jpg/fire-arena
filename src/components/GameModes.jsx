import { useState } from "react";
import soloImg from "../assets/solo.png";
import duoImg from "../assets/duo.png";
import squadImg from "../assets/squad.png";
import onevoneImg from "../assets/1v1.png";
import onevtwoImg from "../assets/1v2.png";
import threevthreeImg from "../assets/3v3.png";
import fourvfourImg from "../assets/4v4.png";

const gameModes = [
  { name: "SOLO", image: soloImg, color: "from-orange-500 to-red-500", bgColor: "bg-orange-500/10" },
  { name: "DUO", image: duoImg, color: "from-green-500 to-emerald-500", bgColor: "bg-green-500/10" },
  { name: "SQUAD", image: squadImg, color: "from-blue-500 to-cyan-500", bgColor: "bg-blue-500/10" },
  { name: "1V1", image: onevoneImg, color: "from-purple-500 to-pink-500", bgColor: "bg-purple-500/10" },
  { name: "1V2", image: onevtwoImg, color: "from-yellow-500 to-orange-500", bgColor: "bg-yellow-500/10" },
  { name: "2V2", image: duoImg, color: "from-teal-500 to-blue-500", bgColor: "bg-teal-500/10" },
  { name: "3V3", image: threevthreeImg, color: "from-indigo-500 to-purple-500", bgColor: "bg-indigo-500/10" },
  { name: "4V4", image: fourvfourImg, color: "from-rose-500 to-pink-500", bgColor: "bg-rose-500/10" },
];

export default function GameModes({ selectedMode, onModeChange, onOtherGamesClick }) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedModeData = gameModes.find(m => m.name === selectedMode) || gameModes[0];

  return (
    <section className="max-w-7xl mx-auto px-2 md:px-6 py-6 md:py-10">
      <div className="w-full pb-4">
        <div className="flex flex-wrap gap-2 md:gap-3 justify-center w-full mx-auto px-1 md:px-2">
          {gameModes.map((mode) => (
            <button
              key={mode.name}
              onClick={() => onModeChange(mode.name)}
              className={`group relative px-2 md:px-6 py-2 md:py-4 rounded-xl md:rounded-2xl font-black transition-all duration-300 flex-1 md:flex-none min-w-[75px] md:min-w-[100px] ${
                selectedMode === mode.name
                  ? `bg-gradient-to-r ${mode.color} text-white shadow-lg scale-105`
                  : "bg-black/50 text-gray-300 border border-white/10 hover:scale-105 hover:border-opacity-50"
              }`}
            >
              <div className="flex flex-col items-center gap-1 md:gap-2">
                <img
                  src={mode.image}
                  alt={mode.name}
                  className={`w-6 h-6 md:w-10 md:h-10 object-contain transition-all duration-300 ${
                    selectedMode === mode.name ? "scale-110" : "opacity-70 group-hover:opacity-100"
                  }`}
                />
                <span className="text-[10px] md:text-sm font-bold tracking-wide">{mode.name}</span>
              </div>
              {selectedMode === mode.name && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white rounded-full animate-pulse"></div>
              )}
            </button>
          ))}
          
          {/* OTHER GAMES Button */}
          <button
            onClick={onOtherGamesClick}
            className="group relative px-2 md:px-6 py-2 md:py-4 rounded-xl md:rounded-2xl font-black transition-all duration-300 bg-black/50 text-orange-400 border border-orange-500/30 hover:scale-105 hover:bg-orange-500/10 flex flex-col items-center justify-center gap-1 md:gap-2 flex-1 md:flex-none min-w-[75px] md:min-w-[100px]"
          >
            <span className="text-xl md:text-3xl opacity-70 group-hover:opacity-100 transition-all duration-300 group-hover:animate-bounce">🎮</span>
            <span className="text-[9px] md:text-xs font-bold tracking-wide text-center leading-tight">OTHER<br/>GAMES</span>
          </button>
        </div>
      </div>
    </section>
  );
}