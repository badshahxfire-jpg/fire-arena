import React from "react";

export default function PremiumStats({ 
  stats, 
  onDeposit, 
  onWithdraw, 
  onProfile, 
  onHistory, 
  onLeaderboard, 
  onNotifications 
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Quick Actions */}
      <div className="bg-[#0d0d0d] border border-gray-800 rounded-2xl p-4 sm:p-6">
        <h3 className="text-white font-bold text-lg mb-6">QUICK ACTIONS</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4">
          <button 
            onClick={onDeposit}
            className="flex flex-col items-center justify-center gap-2 bg-[#111] border border-gray-800 hover:border-orange-500/50 p-3 sm:p-4 rounded-xl transition group"
          >
            <span className="text-orange-500 text-xl sm:text-2xl group-hover:scale-110 transition">📥</span>
            <span className="text-[10px] text-gray-400 group-hover:text-white font-bold text-center">DEPOSIT</span>
          </button>
          
          <button 
            onClick={onWithdraw}
            className="flex flex-col items-center justify-center gap-2 bg-[#111] border border-gray-800 hover:border-orange-500/50 p-3 sm:p-4 rounded-xl transition group"
          >
            <span className="text-orange-500 text-xl sm:text-2xl group-hover:scale-110 transition">📤</span>
            <span className="text-[10px] text-gray-400 group-hover:text-white font-bold text-center">WITHDRAW</span>
          </button>
          
          <button 
            onClick={onProfile}
            className="flex flex-col items-center justify-center gap-2 bg-[#111] border border-gray-800 hover:border-orange-500/50 p-3 sm:p-4 rounded-xl transition group"
          >
            <span className="text-orange-500 text-xl sm:text-2xl group-hover:scale-110 transition">👤</span>
            <span className="text-[10px] text-gray-400 group-hover:text-white font-bold text-center">PROFILE</span>
          </button>
          
          <button 
            onClick={onHistory}
            className="flex flex-col items-center justify-center gap-2 bg-[#111] border border-gray-800 hover:border-orange-500/50 p-3 sm:p-4 rounded-xl transition group"
          >
            <span className="text-orange-500 text-xl sm:text-2xl group-hover:scale-110 transition">📄</span>
            <span className="text-[10px] text-gray-400 group-hover:text-white font-bold text-center">HISTORY</span>
          </button>
          
          <button 
            onClick={onLeaderboard}
            className="flex flex-col items-center justify-center gap-2 bg-[#111] border border-gray-800 hover:border-orange-500/50 p-3 sm:p-4 rounded-xl transition group"
          >
            <span className="text-orange-500 text-xl sm:text-2xl group-hover:scale-110 transition">🏆</span>
            <span className="text-[10px] text-gray-400 group-hover:text-white font-bold text-center">LEADERBOARD</span>
          </button>
          
          <button 
            onClick={onNotifications}
            className="flex flex-col items-center justify-center gap-2 bg-[#111] border border-gray-800 hover:border-orange-500/50 p-3 sm:p-4 rounded-xl transition group"
          >
            <span className="text-orange-500 text-xl sm:text-2xl group-hover:scale-110 transition">🔔</span>
            <span className="text-[10px] text-gray-400 group-hover:text-white font-bold text-center">ALERTS</span>
          </button>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="bg-[#0d0d0d] border border-gray-800 rounded-2xl p-4 sm:p-6">
        <h3 className="text-white font-bold text-lg mb-6">PLATFORM STATS</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 h-full content-start">
          <div className="bg-[#111] border border-gray-800 rounded-xl p-4 flex flex-col items-center text-center justify-center">
            <span className="text-orange-500 text-2xl mb-2">👥</span>
            <p className="text-white font-black text-lg sm:text-xl">{stats?.totalUsers || "12,450+"}</p>
            <p className="text-[10px] text-gray-500 font-bold">TOTAL USERS</p>
          </div>
          
          <div className="bg-[#111] border border-gray-800 rounded-xl p-4 flex flex-col items-center text-center justify-center">
            <span className="text-orange-500 text-2xl mb-2">⚔️</span>
            <p className="text-white font-black text-lg sm:text-xl">{stats?.totalTournaments || "2,340+"}</p>
            <p className="text-[10px] text-gray-500 font-bold">TOTAL MATCHES</p>
          </div>
          
          <div className="bg-[#111] border border-gray-800 rounded-xl p-4 flex flex-col items-center text-center justify-center">
            <span className="text-orange-500 text-2xl mb-2">🏆</span>
            <p className="text-white font-black text-lg sm:text-xl">1,250+</p>
            <p className="text-[10px] text-gray-500 font-bold">TOTAL WINNERS</p>
          </div>
          
          <div className="bg-[#111] border border-gray-800 rounded-xl p-4 flex flex-col items-center text-center justify-center">
            <span className="text-yellow-500 text-2xl mb-2">🪙</span>
            <p className="text-white font-black text-lg sm:text-xl">₹8,50,000+</p>
            <p className="text-[10px] text-gray-500 font-bold">COINS DISTRIBUTED</p>
          </div>
        </div>
      </div>
    </div>
  );
}
