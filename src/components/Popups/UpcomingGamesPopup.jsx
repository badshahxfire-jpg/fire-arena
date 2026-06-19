import React from 'react';

export default function UpcomingGamesPopup({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center animate-fade-in p-4">
      <div className="bg-[#1a1a1a] w-full max-w-2xl rounded-3xl border border-orange-500/30 flex flex-col max-h-[85vh] animate-scale-in shadow-2xl overflow-hidden cyber-card">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-black/40 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent"></div>
          <div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400 uppercase tracking-widest relative z-10">
              UPCOMING GAMES
            </h2>
            <p className="text-sm text-orange-400/80 mt-1 relative z-10 font-bold">New tournaments coming soon!</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex justify-center items-center rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-red-500/20 transition-all duration-300 relative z-10 border border-white/10 hover:border-red-500/50"
          >
            ✕
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#050508]/80">
          
          {/* Game 1 */}
          <div className="bg-black/60 p-6 rounded-2xl border border-blue-500/20 flex flex-col md:flex-row items-center gap-6 hover:border-blue-500/50 transition-colors group">
            <div className="w-24 h-24 rounded-2xl bg-blue-500/10 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform">
              🏃
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">Subway Surfers</h3>
              <p className="text-gray-400 text-sm">Get ready for an endless running tournament! Set the highest score and win big prizes.</p>
              <div className="mt-4 inline-block bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/30">
                COMING NEXT
              </div>
            </div>
          </div>

          {/* Game 2 */}
          <div className="bg-black/60 p-6 rounded-2xl border border-green-500/20 flex flex-col md:flex-row items-center gap-6 hover:border-green-500/50 transition-colors group">
            <div className="w-24 h-24 rounded-2xl bg-green-500/10 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform">
              🧮
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors">Math Quiz</h3>
              <p className="text-gray-400 text-sm">Test your brain speed! Answer simple math questions quickly to rank up on the leaderboard.</p>
              <div className="mt-4 inline-block bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-500/30">
                COMING SOON
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
