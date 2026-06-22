import React from "react";

export default function PremiumHero({ stats }) {
  return (
    <div className="relative w-full rounded-3xl overflow-hidden mb-8 border border-orange-500/20 shadow-[0_0_50px_rgba(249,115,22,0.1)]">
      {/* Background Banner Image Placeholder */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-[#1a0a00] to-[#2a1000]">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent"></div>
        {/* You can add an actual image tag here later */}
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-8 md:p-12 min-h-[400px]">
        {/* Left Content */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left mb-10 md:mb-0 max-w-xl">
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-500 mb-2 leading-none">
            FIRE
          </h2>
          <h2 className="text-5xl sm:text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-orange-500 to-red-600 drop-shadow-[0_0_20px_rgba(249,115,22,0.5)] mb-4 leading-none">
            BAADSHAH
          </h2>
          <h3 className="text-xl sm:text-2xl font-bold tracking-[0.3em] text-gray-300 mb-6">ARENA</h3>
          <p className="text-orange-400 font-bold text-sm sm:text-base tracking-widest mb-10">
            INDIA'S ULTIMATE FREE FIRE TOURNAMENT PLATFORM
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white px-8 py-3 sm:py-4 rounded-xl font-black text-sm sm:text-base transition shadow-[0_0_20px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2">
              JOIN TOURNAMENT <span>→</span>
            </button>
            <button className="bg-black/50 border border-gray-600 hover:border-white text-white px-8 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base transition flex items-center justify-center gap-2 backdrop-blur-sm">
              DOWNLOAD APP <span>📥</span>
            </button>
          </div>
        </div>

        {/* Right Stats */}
        <div className="flex flex-col gap-4 w-full md:w-auto">
          {/* Stat 1 */}
          <div className="bg-black/40 border border-orange-500/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 hover:border-orange-500/50 transition">
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 text-2xl border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
              🏆
            </div>
            <div>
              <p className="text-gray-400 text-xs font-bold mb-1">LIVE PRIZE POOL</p>
              <p className="text-white font-black text-xl">🪙 50,000+</p>
            </div>
          </div>
          
          {/* Stat 2 */}
          <div className="bg-black/40 border border-orange-500/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 hover:border-orange-500/50 transition">
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 text-2xl border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
              👥
            </div>
            <div>
              <p className="text-gray-400 text-xs font-bold mb-1">ACTIVE PLAYERS</p>
              <p className="text-white font-black text-xl">{stats?.totalUsers || "12,450+"}</p>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="bg-black/40 border border-orange-500/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 hover:border-orange-500/50 transition">
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 text-2xl border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
              ⚡
            </div>
            <div>
              <p className="text-gray-400 text-xs font-bold mb-1">INSTANT REWARDS</p>
              <p className="text-white font-black text-xl">100% SECURE</p>
            </div>
          </div>
        </div>

        {/* Character Silhouette Placeholder (Optional) */}
        <div className="hidden lg:block absolute bottom-0 right-1/3 text-[300px] opacity-20 pointer-events-none transform translate-y-1/4">
          🥷
        </div>
      </div>
    </div>
  );
}
