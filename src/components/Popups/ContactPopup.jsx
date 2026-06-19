export default function ContactPopup({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 px-4">
      <div className="bg-[#111] w-full max-w-lg rounded-[40px] p-5 md:p-8 border border-green-500/20 text-center cyber-card">
        <h2 className="text-4xl font-black text-green-400 mb-6 cyber-neon">CONTACT SUPPORT</h2>
        
        {/* Predefined FAQs */}
        <div className="text-left mb-6 bg-black/40 p-5 rounded-[24px] border border-white/5 space-y-4 text-sm">
          <p className="text-green-400 font-extrabold text-xs tracking-wider uppercase border-b border-white/5 pb-2">
            📌 QUICK HELP / पूछे जाने वाले सवाल:
          </p>
          
          <div className="space-y-1">
            <p className="text-gray-200 font-bold text-xs flex items-center gap-1.5">
              🕒 Withdrawal Time (पैसे निकालने का समय):
            </p>
            <p className="text-gray-400 text-[11px] leading-relaxed">
              Withdrawal requests are processed within **1 to 12 hours**. Please wait patiently; your winnings will reach your account safely.
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-gray-200 font-bold text-xs flex items-center gap-1.5">
              🪙 Deposit / Top-up Coins (सिक्के जमा करना):
            </p>
            <p className="text-gray-400 text-[11px] leading-relaxed">
              Deposit requests are approved within **5 to 15 minutes** after verifying the screenshot and UTR number.
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-gray-200 font-bold text-xs flex items-center gap-1.5">
              🎮 Room ID & Password (रूम विवरण):
            </p>
            <p className="text-gray-400 text-[11px] leading-relaxed">
              Details will be shown in the app precisely **10 minutes before** the match starts. Ensure your game name is correct in your slot.
            </p>
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-4">
          For other issues not resolved above, feel free to contact us:
        </p>

        <a
          href="https://wa.me/918085150673"
          target="_blank"
          rel="noreferrer"
          className="block bg-green-500 text-black py-4 rounded-2xl font-black text-xl cyber-btn"
        >
          WhatsApp: 8085150673
        </a>
        <button onClick={onClose} className="mt-6 bg-red-500 px-6 py-3 rounded-2xl font-black">
          CLOSE
        </button>
      </div>
    </div>
  );
}