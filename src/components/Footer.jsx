import logo from "../assets/logo.png";

export default function Footer() {
  return (
    <footer className="relative bg-black/40 backdrop-blur-md border-t border-orange-500/20 mt-20 py-12 overflow-hidden">
      {/* Animated Shine Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-orange-500/10 to-transparent -translate-x-full animate-shine"></div>
      </div>
      
      {/* Glowing Border Animation */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-borderPulse"></div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center">
          
          {/* Logo with Float Animation */}
          <div className="flex items-center gap-3 mb-6 animate-float-slow">
            <img
              src={logo}
              alt="FIRE BAADSHAH ARENA"
              className="w-12 h-12 object-contain"
            />
            <div>
              <h1 className="text-xl font-gaming font-extrabold leading-none text-orange-500 text-glow-orange tracking-wide">
                FIRE BAADSHAH
              </h1>
              <p className="text-white text-xs font-gaming font-bold tracking-widest opacity-80">
                ARENA
              </p>
            </div>
          </div>

          {/* Main Notice with Pulse Animation */}
          <div className="max-w-3xl mx-auto text-center space-y-4 animate-fade-up">
            <h2 className="text-2xl md:text-3xl font-black text-orange-500 cyber-neon animate-pulse-slow">
              FIRE BAADSHAH ARENA
            </h2>
            <p className="text-gray-300 text-lg md:text-xl font-semibold">
              India's Free Fire Esports Tournament Platform
            </p>
            <p className="text-orange-400 text-base md:text-lg font-bold animate-pulse">
              1 Coin = 1 INR Value Inside Platform
            </p>
            <p className="text-gray-400 text-sm max-w-2xl mx-auto leading-relaxed">
              Coins are virtual esports reward units used for tournaments,
              rankings, rewards, and competitive gameplay inside
              FIRE BAADSHAH ARENA.
            </p>
          </div>

          {/* Platform Notice Box with Glow */}
          <div className="mt-8 max-w-2xl mx-auto group">
            <div className="relative bg-[#111] border border-orange-500/10 rounded-2xl p-6 text-center cyber-card transition-all duration-300 hover:border-orange-500/30 hover:shadow-glow">
              {/* Inner Shine on Hover */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent animate-shine-fast"></div>
              </div>
              
              <h3 className="text-xl font-black text-orange-500 mb-3 animate-glow-text">
                PLATFORM NOTICE
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Coins are virtual tournament reward units used inside
                FIRE BAADSHAH ARENA.
              </p>
              <p className="text-orange-400 mt-3 font-bold animate-pulse">
                1 Coin = 1 INR Value Inside Platform
              </p>
              <p className="text-gray-500 text-xs mt-4">
                FIRE BAADSHAH ARENA is a competitive esports platform
                based on skill matches and tournament gameplay.
              </p>
            </div>
          </div>

          {/* Social Links with Hover Effects */}
          <div className="mt-10 flex gap-6">
            <a
              href="https://t.me/fire_baadshah"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative text-gray-400 hover:text-blue-400 transition-all duration-300 flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-blue-500/10 hover:scale-110"
            >
              <span className="text-xl">📢</span>
              <span className="text-sm">Telegram</span>
              <span className="absolute inset-0 rounded-xl bg-blue-500/0 group-hover:bg-blue-500/10 transition-all duration-300 -z-10"></span>
            </a>
            <a
              href="https://wa.me/918085150673"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative text-gray-400 hover:text-green-400 transition-all duration-300 flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-green-500/10 hover:scale-110"
            >
              <span className="text-xl">💬</span>
              <span className="text-sm">WhatsApp</span>
              <span className="absolute inset-0 rounded-xl bg-green-500/0 group-hover:bg-green-500/10 transition-all duration-300 -z-10"></span>
            </a>
            <a
              href="https://youtube.com/@badshahxfire"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative text-gray-400 hover:text-red-500 transition-all duration-300 flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-red-500/10 hover:scale-110"
            >
              <span className="text-xl">▶️</span>
              <span className="text-sm">YouTube</span>
              <span className="absolute inset-0 rounded-xl bg-red-500/0 group-hover:bg-red-500/10 transition-all duration-300 -z-10"></span>
            </a>
          </div>

          {/* Copyright with Fade Animation */}
          <div className="mt-8 pt-6 border-t border-gray-800 text-center animate-fade-up">
            <p className="text-gray-500 text-xs">
              © {new Date().getFullYear()} FIRE BAADSHAH ARENA. All rights reserved.
            </p>
            <p className="text-gray-600 text-xs mt-1">
              A competitive esports platform for Free Fire enthusiasts
            </p>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes shineFast {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes borderPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        
        @keyframes glowText {
          0%, 100% { text-shadow: 0 0 5px rgba(249, 115, 22, 0.3); }
          50% { text-shadow: 0 0 15px rgba(249, 115, 22, 0.8); }
        }
        
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulseSlow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .animate-shine {
          animation: shine 8s ease-in-out infinite;
        }
        
        .animate-shine-fast {
          animation: shineFast 3s ease-in-out infinite;
        }
        
        .animate-borderPulse {
          animation: borderPulse 3s ease-in-out infinite;
        }
        
        .animate-glow-text {
          animation: glowText 2s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: floatSlow 3s ease-in-out infinite;
        }
        
        .animate-fade-up {
          animation: fadeUp 0.6s ease-out;
        }
        
        .animate-pulse-slow {
          animation: pulseSlow 2s ease-in-out infinite;
        }
        
        .shadow-glow {
          box-shadow: 0 0 20px rgba(249, 115, 22, 0.3);
        }
      `}</style>
    </footer>
  );
}