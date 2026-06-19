import { useState } from "react";
import logo from "../assets/logo.png";

export default function Navbar({ 
  user, 
  coins, 
  notifications, 
  isAdmin, 
  onLogout, 
  onShowTutorial, 
  onShowWallet, 
  onShowContact, 
  onShowHistory, 
  onShowPerKillHistory,
  onShowProfile, 
  onShowNotifications, 
  onShowLogin, 
  onShowRegister,
  onShowReferral,
  onShowLoyal,
  onShowBonusWinners
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-glass/80 backdrop-blur-md border-b border-glass-orange shadow-glass-glow">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row gap-4 md:gap-0 items-center justify-between relative">
        {/* Logo Section */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="FIRE BAADSHAH ARENA"
              className="w-14 h-14 object-contain cyber-float"
            />
            <div>
              <h1 className="text-2xl font-gaming font-extrabold leading-none text-orange-500 text-glow-orange tracking-wide cyber-neon">
                FIRE BAADSHAH
              </h1>
              <p className="text-white text-xs font-gaming font-bold tracking-widest opacity-80">
                ARENA
              </p>
            </div>
          </div>
          
          {/* Hamburger Icon for Mobile */}
          {user && (
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-orange-400 p-2 border border-orange-500/30 rounded-xl hover:bg-orange-500/10 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* User Menu or Auth Buttons */}
        {user ? (
          <>
            {/* Desktop View: All buttons */}
            <div className="hidden md:flex items-center justify-center gap-3 font-gaming text-sm">
              <button onClick={onShowTutorial} className="bg-red-500/10 text-red-400 border border-red-500/20 hover:border-red-500/50 hover:bg-red-500/20 px-4 py-2 rounded-2xl font-bold transition-all">📺 TUTORIAL</button>
              <button onClick={onShowWallet} className="bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/20 px-4 py-2 rounded-2xl font-bold transition-all">🪙 {coins} WALLET</button>
              <button onClick={onShowContact} className="bg-green-500/10 text-green-400 border border-green-500/20 hover:border-green-500/50 hover:bg-green-500/20 px-4 py-2 rounded-2xl font-bold transition-all">CONTACT</button>
              <button onClick={onShowHistory} className="bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-500/20 px-4 py-2 rounded-2xl font-bold transition-all">MATCHES HISTORY</button>
              <button onClick={onShowPerKillHistory} className="bg-red-500/10 text-red-400 border border-red-500/20 hover:border-red-500/50 hover:bg-red-500/20 px-4 py-2 rounded-2xl font-bold transition-all">⚔️ PER KILL HISTORY</button>
              <button onClick={onShowReferral} className="bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/20 px-4 py-2 rounded-2xl font-bold transition-all">🎁 REFER & EARN</button>
              <button onClick={onShowLoyal} className="bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/20 px-4 py-2 rounded-2xl font-bold transition-all">🔥 TOP 10 PLAYERS</button>
              <button onClick={onShowBonusWinners} className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:border-yellow-500/50 hover:bg-yellow-500/20 px-4 py-2 rounded-2xl font-bold transition-all">🎁 BONUS WINNERS</button>
              <button onClick={onShowProfile} className="bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/20 px-4 py-2 rounded-2xl font-bold transition-all">PROFILE</button>
              <button onClick={onShowNotifications} className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:border-yellow-500/50 hover:bg-yellow-500/20 px-4 py-2 rounded-2xl font-bold transition-all flex items-center">
                🔔 <span className="ml-1 text-yellow-400 font-extrabold">{notifications.filter((item) => !item.seen).length}</span>
              </button>
              {isAdmin && <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-4 py-2 rounded-full font-bold">ADMIN</span>}
              <button onClick={onLogout} className="bg-gradient-to-r from-red-600 to-rose-700 text-white hover:from-red-500 hover:to-rose-600 px-5 py-2.5 rounded-2xl font-bold transition-all shadow-md">LOGOUT</button>
            </div>

            {/* Mobile View: Quick Action Buttons */}
            <div className="flex md:hidden flex-col w-full gap-2 font-gaming text-xs">
              {/* Row 1 */}
              <div className="flex w-full gap-2">
                <button onClick={onShowWallet} className="bg-orange-500/10 text-orange-400 border border-orange-500/20 py-2.5 rounded-xl font-bold flex-1 text-center truncate flex items-center justify-center gap-1">
                  🪙 WALLET {coins}
                </button>
                <button onClick={onShowReferral} className="bg-orange-500/10 text-orange-400 border border-orange-500/20 py-2.5 rounded-xl font-bold flex-1 text-center truncate flex items-center justify-center gap-1">
                  🎁 REFER & EARN
                </button>
                <button onClick={onShowNotifications} className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-3 py-2.5 rounded-xl font-bold flex items-center justify-center flex-shrink-0">
                  🔔 <span className="ml-1 text-yellow-400 font-extrabold">{notifications.filter((item) => !item.seen).length}</span>
                </button>
              </div>
              {/* Row 2 */}
              <div className="flex w-full gap-2">
                <button onClick={onShowLoyal} className="bg-orange-500/10 text-orange-400 border border-orange-500/20 py-2.5 rounded-xl font-bold flex-1 text-center truncate flex items-center justify-center gap-1">
                  🔥 TOP 10 PLAYERS
                </button>
                <button onClick={onShowBonusWinners} className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 py-2.5 rounded-xl font-bold flex-1 text-center truncate flex items-center justify-center gap-1">
                  🎁 BONUS WINNERS
                </button>
              </div>
            </div>

            {/* Mobile Dropdown Menu */}
            {isMobileMenuOpen && (
              <div className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-orange-500/30 p-4 flex flex-col gap-3 font-gaming text-sm shadow-2xl z-50">
                <button onClick={() => { onShowTutorial(); setIsMobileMenuOpen(false); }} className="w-full text-left bg-red-500/10 text-red-400 border border-red-500/20 p-3 rounded-xl font-bold">📺 TUTORIAL</button>
                <button onClick={() => { onShowContact(); setIsMobileMenuOpen(false); }} className="w-full text-left bg-green-500/10 text-green-400 border border-green-500/20 p-3 rounded-xl font-bold">CONTACT</button>
                <button onClick={() => { onShowHistory(); setIsMobileMenuOpen(false); }} className="w-full text-left bg-blue-500/10 text-blue-400 border border-blue-500/20 p-3 rounded-xl font-bold">MATCHES HISTORY</button>
                <button onClick={() => { onShowPerKillHistory(); setIsMobileMenuOpen(false); }} className="w-full text-left bg-red-500/10 text-red-400 border border-red-500/20 p-3 rounded-xl font-bold">⚔️ PER KILL HISTORY</button>
                <button onClick={() => { onShowProfile(); setIsMobileMenuOpen(false); }} className="w-full text-left bg-purple-500/10 text-purple-400 border border-purple-500/20 p-3 rounded-xl font-bold">PROFILE</button>
                {isAdmin && <div className="w-full text-center bg-green-500/20 text-green-400 border border-green-500/30 p-3 rounded-xl font-bold">ADMIN</div>}
                <button onClick={() => { onLogout(); setIsMobileMenuOpen(false); }} className="w-full bg-gradient-to-r from-red-600 to-rose-700 text-white p-3 rounded-xl font-bold text-center mt-2">LOGOUT</button>
              </div>
            )}
          </>
        ) : (
          <div className="flex gap-3 md:gap-4 font-gaming">
            <button onClick={onShowLogin} className="border border-orange-500/30 text-orange-400 px-4 py-2 md:px-6 md:py-2.5 rounded-xl md:rounded-2xl hover:bg-orange-500/10 font-semibold text-sm md:text-base transition-all">LOGIN</button>
            <button onClick={onShowRegister} className="bg-gradient-to-r from-orange-500 to-red-600 text-black hover:from-orange-600 hover:to-red-700 px-4 py-2 md:px-6 md:py-2.5 rounded-xl md:rounded-2xl font-bold shadow-md text-sm md:text-base transition-all">REGISTER</button>
          </div>
        )}
      </div>
    </nav>
  );
}