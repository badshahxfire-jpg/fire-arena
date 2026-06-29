import { useState } from "react";

export default function WithdrawPopup({ user, playerData, coins, winCoins, onClose, onWithdraw, withdrawLoading, withdrawRequests }) {
  const details = playerData?.withdrawalDetails || {};
  const isLocked = details.locked;

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawUpi, setWithdrawUpi] = useState(details.upi || "");
  const [withdrawName, setWithdrawName] = useState(details.name || "");
  const [withdrawNumber, setWithdrawNumber] = useState(details.number || "");

  const handleWithdraw = () => {
    const now = new Date();
    const hours = now.getHours();
    
    if (hours < 10 || hours >= 22) {
      alert("⚠️ Withdrawal requests are only allowed between 10:00 AM and 10:00 PM (सुबह 10:00 बजे से रात 10:00 बजे तक) ❌");
      return;
    }
    onWithdraw(withdrawAmount, withdrawUpi, withdrawName, withdrawNumber);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex justify-center items-center p-4">
      <div className="bg-glass-heavy w-full max-w-2xl rounded-[30px] p-6 border border-glass-red shadow-glass-red max-h-[90vh] overflow-y-auto animate-scale-in font-gaming cyber-card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-extrabold text-red-500 text-glow-red cyber-neon">💸 WITHDRAW</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl duration-200">✕</button>
        </div>

        <div className="bg-emerald-900/20 rounded-2xl p-4 text-center border border-emerald-500/20 mb-4">
          <p className="text-emerald-400 text-sm font-bold">AVAILABLE WINNINGS</p>
          <h3 className="text-3xl font-extrabold text-emerald-500 mt-1">🪙 {winCoins || 0}</h3>
          <p className="text-gray-400 text-[10px] uppercase mt-2">Only winning coins can be withdrawn</p>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center mb-6">
          <p className="text-red-400 text-xs font-bold uppercase">⚠️ WITHDRAWAL TIME LIMIT / समय सीमा ⚠️</p>
          <p className="text-gray-300 text-xs mt-1">Requests are allowed only from **10:00 AM to 10:00 PM** (सुबह 10:00 से रात 10:00 बजे तक)</p>
        </div>

        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Enter Account Holder Name"
            value={withdrawName}
            readOnly={isLocked}
            onChange={(e) => setWithdrawName(e.target.value)}
            className={`w-full bg-[#050508]/80 text-white rounded-2xl px-4 py-4 border border-white/10 focus:border-red-500/50 outline-none transition-all duration-300 font-sans text-sm ${isLocked ? "opacity-70 cursor-not-allowed" : ""}`}
          />
          {isLocked && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>}
        </div>

        <div className="relative mb-4">
          <input
            type="number"
            placeholder="Enter Mobile Number"
            value={withdrawNumber}
            readOnly={isLocked}
            onChange={(e) => setWithdrawNumber(e.target.value)}
            className={`w-full bg-[#050508]/80 text-white rounded-2xl px-4 py-4 border border-white/10 focus:border-red-500/50 outline-none transition-all duration-300 font-sans text-sm ${isLocked ? "opacity-70 cursor-not-allowed" : ""}`}
          />
          {isLocked && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>}
        </div>

        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Enter UPI ID"
            value={withdrawUpi}
            readOnly={isLocked}
            onChange={(e) => setWithdrawUpi(e.target.value)}
            className={`w-full bg-[#050508]/80 text-white rounded-2xl px-4 py-4 border border-white/10 focus:border-red-500/50 outline-none transition-all duration-300 font-sans text-sm ${isLocked ? "opacity-70 cursor-not-allowed" : ""}`}
          />
          {isLocked && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>}
        </div>
        
        {isLocked && (
          <p className="text-gray-500 text-[10px] text-center mb-4">⚠️ Contact Admin to change your locked withdrawal details.</p>
        )}

        <div className="flex justify-between items-center mb-2 px-1">
          <p className="text-gray-400 text-xs">Min: 30 Coins</p>
          <p className="text-gray-400 text-xs">Max: 500 Coins/24hr</p>
        </div>
        <input
          type="number"
          placeholder="Enter Coins (Min 30)"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
          className="w-full bg-[#050508]/80 text-white rounded-2xl px-4 py-4 border border-white/10 focus:border-red-500/50 outline-none mb-4 transition-all duration-300 font-sans text-sm"
        />

        <button
          onClick={handleWithdraw}
          className="w-full bg-gradient-to-r from-red-600 to-rose-700 text-white hover:from-red-500 hover:to-rose-600 py-3.5 rounded-2xl font-bold tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-red-900/20 cyber-btn"
        >
          {withdrawLoading ? "PROCESSING..." : "SUBMIT WITHDRAW"}
        </button>

        {/* Withdraw History */}
        <h4 className="text-xl font-black mt-8 mb-4">WITHDRAW HISTORY</h4>
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {withdrawRequests?.filter((item) => item.userId === user?.uid).reverse().map((item) => (
            <div key={item.id} className="bg-black rounded-2xl p-4">
              <p className="text-orange-400 font-black">🪙 {item.amount} Coins</p>
              <p className={`font-black mt-2 ${
                item.status === "PENDING" ? "text-yellow-400"
                : item.status === "COMPLETED" ? "text-green-400"
                : "text-red-400"
              }`}>
                {item.status === "PENDING" ? "⏳ WITHDRAW PENDING"
                : item.status === "COMPLETED" ? "✅ WITHDRAW COMPLETED"
                : "❌ WITHDRAW REJECTED"}
              </p>
              <p className="text-gray-500 text-sm mt-2">🕒 {item.requestTime}</p>
              {item.completedTime && item.status === "COMPLETED" && <p className="text-green-400 text-sm mt-1">✅ COMPLETED: {item.completedTime}</p>}
              {item.status === "REJECTED" && item.reason && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mt-3">
                  <p className="text-red-400 text-xs font-bold uppercase mb-1">REASON FOR REJECTION:</p>
                  <p className="text-red-200 text-sm">{item.reason}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}