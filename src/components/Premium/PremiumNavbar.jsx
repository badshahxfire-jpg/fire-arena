import React from "react";

export default function PremiumNavbar({
  user,
  coins,
  unseenCount,
  onLoginClick,
  onRegisterClick,
  onWalletClick,
  onNotificationsClick,
  onProfileClick,
  onToggleUI,
  onToggleSidebar
}) {
  return (
    <nav className="flex justify-between items-center px-4 sm:px-6 py-4 bg-[#0a0a0a] border-b border-gray-800 sticky top-0 z-40">
      {/* Logo & Mobile Menu Toggle */}
      <div className="flex items-center gap-4 sm:gap-10">
        <button 
          onClick={onToggleSidebar}
          className="lg:hidden text-gray-400 hover:text-white text-2xl"
        >
          ☰
        </button>
        
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-tr from-orange-600 to-yellow-500 rounded-lg flex items-center justify-center font-black text-black text-lg sm:text-xl">
            🔥
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-black text-white leading-none">FIRE</h1>
            <h1 className="text-lg font-bold text-orange-500 leading-none">BAADSHAH</h1>
          </div>
        </div>
        
        <div className="hidden lg:flex gap-6 text-sm font-bold text-gray-400 items-center">
          <a href="#" className="text-orange-500 border-b-2 border-orange-500 pb-1">HOME</a>
          <a href="#tournaments" className="hover:text-white transition">TOURNAMENTS</a>
          <a href="#leaderboard" className="hover:text-white transition">LEADERBOARD</a>
          <button 
            onClick={onToggleUI}
            className="text-gray-400 hover:text-white text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-700 transition"
          >
            🔄 Classic UI
          </button>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {user ? (
          <>
            <div 
              onClick={onWalletClick}
              className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/30 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full cursor-pointer hover:border-orange-500/60 transition"
            >
              <span className="text-yellow-500 text-sm sm:text-lg">🪙</span>
              <span className="text-white font-bold text-sm sm:text-base">{coins}</span>
              <button className="bg-orange-500 text-black w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center font-bold text-sm sm:text-lg hover:bg-orange-400 ml-1 sm:ml-2">
                +
              </button>
            </div>
            
            <div 
              onClick={onNotificationsClick}
              className="relative cursor-pointer bg-gray-900 p-2 sm:p-2.5 rounded-full border border-gray-800 hover:border-gray-600 transition"
            >
              <span className="text-lg sm:text-xl">🔔</span>
              {unseenCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full">
                  {unseenCount}
                </span>
              )}
            </div>

            <button 
              onClick={onProfileClick}
              className="hidden sm:block bg-gray-800 hover:bg-gray-700 text-white px-5 py-2.5 rounded-xl font-bold transition text-sm border border-gray-700"
            >
              PROFILE
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={onLoginClick}
              className="hidden sm:block bg-transparent border border-gray-600 hover:border-white text-white px-6 py-2.5 rounded-xl font-bold transition text-sm"
            >
              LOGIN
            </button>
            <button 
              onClick={onRegisterClick}
              className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-black px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-black transition text-xs sm:text-sm shadow-[0_0_15px_rgba(249,115,22,0.4)]"
            >
              SIGN UP
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
