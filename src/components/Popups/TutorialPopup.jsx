export default function TutorialPopup({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 px-4">
      <div className="bg-glass-heavy border border-glass-orange rounded-[30px] p-6 w-full max-w-md text-center shadow-glass-glow animate-scale-in font-gaming cyber-card">
        <h2 className="text-3xl font-extrabold text-orange-500 text-glow-orange mb-6 tracking-wide cyber-neon">
          🔥 FIRE BAADSHAH TUTORIAL 🔥
        </h2>
        <p className="text-gray-300 mb-6 leading-relaxed font-sans text-sm">
          TOURNAMENT JOIN KARNE AUR COINS ADD KARNE KA FULL TUTORIAL DEKHO.
        </p>

        <div className="flex flex-col gap-4 text-sm font-bold">
          <a
            href="https://youtube.com/@badshahxfire?si=2W6NAS_gV7e-6rFJ"
            target="_blank"
            rel="noreferrer"
            className="bg-red-500/10 text-red-400 border border-red-500/20 hover:border-red-500/50 hover:bg-red-500/20 py-3.5 rounded-2xl duration-300 transition-all hover:scale-[1.02] active:scale-[0.98] text-center cyber-btn"
          >
            ▶️ SUBSCRIBE CHANNEL🔴
          </a>

          <a
            href="https://youtu.be/Wsm-tRdDK7Q"
            target="_blank"
            rel="noreferrer"
            className="bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/20 py-3.5 rounded-2xl duration-300 transition-all hover:scale-[1.02] active:scale-[0.98] text-center cyber-btn"
          >
            🚀 HOW TO ADD COINS
          </a>

          <a
            href="https://youtu.be/Nq2VIf_VOns"
            target="_blank"
            rel="noreferrer"
            className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:border-yellow-500/50 hover:bg-yellow-500/20 py-3.5 rounded-2xl duration-300 transition-all hover:scale-[1.02] active:scale-[0.98] text-center cyber-btn"
          >
            HOW TO JOIN TOURNAMENT & POSITION
          </a>

          <a
            href="https://youtu.be/mqKouEZIsdY"
            target="_blank"
            rel="noreferrer"
            className="bg-green-500/10 text-green-400 border border-green-500/20 hover:border-green-500/50 hover:bg-green-500/20 py-3.5 rounded-2xl duration-300 transition-all hover:scale-[1.02] active:scale-[0.98] text-center cyber-btn"
          >
            💵 HOW TO WITHDRAW
          </a>

          <button
            onClick={onClose}
            className="bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white py-3.5 rounded-2xl duration-300 transition-all hover:scale-[1.02] active:scale-[0.98] mt-2"
          >
            ❌ CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}