import { useState } from "react";

export default function ManualCoins({ onAddCoins }) {
  const [manualUid, setManualUid] = useState("");
  const [manualCoins, setManualCoins] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddCoins = async () => {
    if (!manualUid || !manualCoins) {
      alert("Please enter both UID and Coins amount");
      return;
    }
    setIsLoading(true);
    await onAddCoins(manualUid, manualCoins);
    setIsLoading(false);
    setManualUid("");
    setManualCoins("");
  };

  return (
    <section className="max-w-5xl mx-auto px-6 py-10">
      <div className="bg-[#111] rounded-[40px] p-10 border border-green-500/10 cyber-card">
        <h2 className="text-4xl font-black text-green-400 mb-8 cyber-neon">➕ MANUAL COINS ADD</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <input
            type="text"
            placeholder="User UID"
            value={manualUid}
            onChange={(e) => setManualUid(e.target.value)}
            className="bg-black rounded-2xl px-5 py-4 outline-none border border-green-500/20 focus:border-green-500"
          />
          <input
            type="number"
            placeholder="Coins Amount"
            value={manualCoins}
            onChange={(e) => setManualCoins(e.target.value)}
            className="bg-black rounded-2xl px-5 py-4 outline-none border border-green-500/20 focus:border-green-500"
          />
        </div>
        <button
          onClick={handleAddCoins}
          disabled={isLoading}
          className={`w-full mt-8 py-4 rounded-2xl font-black text-lg cyber-btn transition-all duration-300 ${
            isLoading 
              ? "bg-green-700 text-gray-300 opacity-50 cursor-wait" 
              : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white hover:scale-[1.02]"
          }`}
        >
          {isLoading ? "⏳ ADDING COINS..." : "💰 ADD COINS"}
        </button>
      </div>
    </section>
  );
}