import { useState, useRef, useEffect } from "react";
import logo from "../assets/logo.png";

export default function Navbar({ 
  user, 
  coins, 
  notifications, 
  isAdmin, 
  isSuperAdmin,
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
  onShowBonusWinners,
  onShowBlocked,
  isSoundMuted,
  toggleMute,
  apkUrl
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((item) => !item.seen).length;

  return (
    <nav className="sticky top-0 z-50 bg-glass/80 backdrop-blur-md border-b border-glass-orange shadow-glass-glow">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between relative">
        
        {/* Left: Logo Section */}
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="cyber-float flex-shrink-0">
            <img
              src={logo}
              alt="FIRE BAADSHAH ARENA"
              className="w-12 h-12 md:w-14 md:h-14 object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-gaming font-extrabold leading-none text-orange-500 text-glow-orange tracking-wide cyber-neon">
              FIRE BAADSHAH
            </h1>
            <p className="text-white text-[10px] md:text-xs font-gaming font-bold tracking-widest opacity-80 mt-0.5">
              ARENA
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-4 font-gaming">
          {user ? (
            <>
              {/* Wallet Button */}
              <button 
                onClick={onShowWallet} 
                className="hidden md:flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 border border-orange-500/30 hover:border-orange-500 hover:bg-orange-500/30 px-4 py-2 rounded-xl font-bold transition-all shadow-md"
              >
                🪙 <span>{coins}</span>
              </button>
              
              {/* Wallet (Mobile) */}
              <button 
                onClick={onShowWallet} 
                className="md:hidden flex items-center gap-1 bg-orange-500/10 text-orange-400 border border-orange-500/30 px-3 py-1.5 rounded-lg font-bold text-sm"
              >
                🪙 {coins}
              </button>

              {/* Notifications */}
              <button 
                onClick={onShowNotifications} 
                className="relative bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 hover:border-yellow-500 hover:bg-yellow-500/20 p-2 md:px-4 md:py-2 rounded-xl transition-all flex items-center justify-center"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Menu Container */}
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:border-purple-500 hover:bg-purple-500/20 p-2 md:px-4 md:py-2 rounded-xl transition-all flex items-center gap-2"
                >
                  <span className="hidden md:block font-bold">MENU</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-glass-heavy border border-orange-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50">
                    <div className="p-3 border-b border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-transparent">
                      <p className="text-white font-bold truncate text-sm">👤 {user.email || 'Player'}</p>
                      {isAdmin && (
                        <p className={`text-xs mt-1 font-bold ${isSuperAdmin ? "text-green-400" : "text-purple-400"}`}>
                          {isSuperAdmin ? "⭐ SUPER ADMIN" : "🛡️ STAFF"}
                        </p>
                      )}
                    </div>
                    
                    <div className="p-2 flex flex-col gap-1 max-h-[60vh] overflow-y-auto no-scrollbar">
                      {!window.Capacitor && apkUrl && (
                        <a href={apkUrl} target="_blank" rel="noopener noreferrer" className="w-full text-left p-2.5 rounded-xl text-sm font-bold bg-blue-500/20 text-blue-300 hover:bg-blue-500/40 transition-colors flex items-center gap-2">
                          📲 Download App
                        </a>
                      )}
                      <button onClick={() => { onShowProfile(); setIsMenuOpen(false); }} className="w-full text-left p-2.5 rounded-xl text-sm font-bold text-gray-300 hover:bg-white/10 transition-colors">
                        👤 My Profile
                      </button>
                      <button onClick={() => { onShowHistory(); setIsMenuOpen(false); }} className="w-full text-left p-2.5 rounded-xl text-sm font-bold text-gray-300 hover:bg-white/10 transition-colors">
                        🏆 Matches History
                      </button>
                      <button onClick={() => { onShowPerKillHistory(); setIsMenuOpen(false); }} className="w-full text-left p-2.5 rounded-xl text-sm font-bold text-gray-300 hover:bg-white/10 transition-colors">
                        ⚔️ Per Kill History
                      </button>
                      <button onClick={() => { onShowReferral(); setIsMenuOpen(false); }} className="w-full text-left p-2.5 rounded-xl text-sm font-bold text-orange-400 hover:bg-orange-500/20 transition-colors">
                        🎁 Refer & Earn
                      </button>
                      <button onClick={() => { onShowLoyal(); setIsMenuOpen(false); }} className="w-full text-left p-2.5 rounded-xl text-sm font-bold text-yellow-400 hover:bg-yellow-500/20 transition-colors">
                        🔥 Top 10 Players
                      </button>
                      <button onClick={() => { onShowBonusWinners(); setIsMenuOpen(false); }} className="w-full text-left p-2.5 rounded-xl text-sm font-bold text-yellow-400 hover:bg-yellow-500/20 transition-colors">
                        🎁 Bonus Winners
                      </button>
                      
                      <div className="h-px bg-white/10 my-1"></div>
                      
                      <button onClick={() => { onShowTutorial(); setIsMenuOpen(false); }} className="w-full text-left p-2.5 rounded-xl text-sm font-bold text-gray-300 hover:bg-white/10 transition-colors">
                        📺 Video Tutorial
                      </button>
                      <button onClick={() => { onShowContact(); setIsMenuOpen(false); }} className="w-full text-left p-2.5 rounded-xl text-sm font-bold text-gray-300 hover:bg-white/10 transition-colors">
                        🎧 Contact Support
                      </button>
                      <button onClick={() => { toggleMute(); setIsMenuOpen(false); }} className="w-full text-left p-2.5 rounded-xl text-sm font-bold text-gray-300 hover:bg-white/10 transition-colors flex justify-between">
                        <span>{isSoundMuted ? "🔇 Sounds Muted" : "🔊 Sounds On"}</span>
                      </button>

                      {isAdmin && (
                        <>
                          <div className="h-px bg-white/10 my-1"></div>
                          <button onClick={() => { onShowBlocked(); setIsMenuOpen(false); }} className="w-full text-left p-2.5 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/20 transition-colors">
                            🚫 Blocked Players
                          </button>
                        </>
                      )}
                    </div>
                    
                    <div className="p-2 border-t border-orange-500/20">
                      <button onClick={() => { onLogout(); setIsMenuOpen(false); }} className="w-full bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white p-2.5 rounded-xl font-bold text-sm transition-all text-center">
                        LOGOUT
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {!window.Capacitor && apkUrl && (
                <a href={apkUrl} target="_blank" rel="noopener noreferrer" className="hidden md:flex bg-gradient-to-r from-blue-500 to-indigo-600 text-white border border-blue-500/30 hover:from-blue-400 hover:to-indigo-500 px-4 py-2 rounded-xl font-bold transition-all items-center gap-1 shadow-md text-sm">
                  📲 DOWNLOAD APP
                </a>
              )}
              <button onClick={onShowLogin} className="border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 px-4 py-2 rounded-xl font-bold text-sm transition-all">
                LOGIN
              </button>
              <button onClick={onShowRegister} className="bg-gradient-to-r from-orange-500 to-red-600 text-black hover:from-orange-600 hover:to-red-700 px-4 py-2 rounded-xl font-bold shadow-md text-sm transition-all">
                REGISTER
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}