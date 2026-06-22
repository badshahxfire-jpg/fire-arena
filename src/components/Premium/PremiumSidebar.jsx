import React from "react";

export default function PremiumSidebar({
  coins,
  onWalletClick,
  onWithdrawClick,
  onHistoryClick,
  onReferralClick,
  isOpen,
  onClose
}) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#0d0d0d] border-r border-gray-800 p-6 flex flex-col gap-6
        transform transition-transform duration-300 ease-in-out overflow-y-auto
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
        >
          ✕
        </button>

        {/* My Wallet Section */}
        <div className="bg-[#111] border border-gray-800 rounded-2xl overflow-hidden mt-8 lg:mt-0">
          <div className="flex items-center gap-2 text-orange-500 font-bold p-4 border-b border-gray-800">
            <span>💼</span> MY WALLET
          </div>
          
          <div className="p-4 bg-gradient-to-b from-gray-900 to-black">
            <p className="text-gray-400 text-xs mb-1">TOTAL COINS</p>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-2xl font-black text-white">
                <span className="text-yellow-500">🪙</span> {coins}
              </div>
              <button 
                onClick={onWalletClick}
                className="bg-orange-500 hover:bg-orange-600 text-black px-3 py-1.5 rounded-lg text-xs font-bold transition"
              >
                ADD COINS
              </button>
            </div>

            <div className="space-y-1">
              <button onClick={onWalletClick} className="w-full flex items-center gap-3 text-gray-300 hover:text-white hover:bg-white/5 p-3 rounded-xl transition text-sm font-bold">
                <span className="text-orange-500">📥</span> DEPOSIT
              </button>
              <button onClick={onWithdrawClick} className="w-full flex items-center gap-3 text-gray-300 hover:text-white hover:bg-white/5 p-3 rounded-xl transition text-sm font-bold">
                <span className="text-orange-500">📤</span> WITHDRAW
              </button>
              <button onClick={onHistoryClick} className="w-full flex items-center gap-3 text-gray-300 hover:text-white hover:bg-white/5 p-3 rounded-xl transition text-sm font-bold">
                <span className="text-orange-500">📄</span> TRANSACTION HISTORY
              </button>
            </div>
          </div>
        </div>

        {/* Refer & Earn Banner */}
        <div 
          onClick={onReferralClick}
          className="relative bg-gradient-to-br from-orange-900/40 to-black border border-orange-500/30 rounded-2xl p-5 cursor-pointer hover:border-orange-500/60 transition group overflow-hidden"
        >
          {/* Background Glow */}
          <div className="absolute inset-0 bg-orange-500/10 opacity-0 group-hover:opacity-100 transition duration-500"></div>
          
          <h3 className="text-orange-400 font-black text-lg mb-2 relative z-10">REFER & EARN</h3>
          <p className="text-gray-300 text-xs leading-relaxed mb-4 relative z-10">
            Invite your friends and earn exciting rewards!
          </p>
          <button className="bg-gradient-to-r from-orange-500 to-yellow-500 text-black px-4 py-2 rounded-xl text-xs font-black relative z-10 shadow-[0_0_15px_rgba(249,115,22,0.3)] group-hover:shadow-[0_0_20px_rgba(249,115,22,0.6)] transition">
            REFER NOW
          </button>
          
          {/* Treasure Image Placeholder */}
          <div className="absolute -bottom-2 -right-4 text-6xl opacity-80 transform group-hover:scale-110 transition duration-500">
            🎁
          </div>
        </div>

      </aside>
    </>
  );
}
