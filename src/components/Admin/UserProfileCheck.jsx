import { useState } from "react";
import UserHistoryPopup from "./UserHistoryPopup";
import CoinHistoryPopup from "../Popups/CoinHistoryPopup";

export default function UserProfileCheck({ onSearchUser, searchedUser, onBlockUser, onAddCoins, onDeductCoins }) {
  const [searchUid, setSearchUid] = useState("");
  const [manualCoins, setManualCoins] = useState("");
  const [localSearchedUser, setLocalSearchedUser] = useState(null);
  const [showHistoryPopup, setShowHistoryPopup] = useState(false);
  const [showCoinHistoryPopup, setShowCoinHistoryPopup] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);

  const handleSearch = async () => {
    if (!searchUid) {
      alert("Enter User UID");
      return;
    }
    const result = await onSearchUser(searchUid);
    setLocalSearchedUser(result);
  };

  const displayUser = searchedUser || localSearchedUser;

  return (
    <section className="max-w-5xl mx-auto px-6 py-10">
      <div className="bg-[#111] rounded-[40px] p-10 border border-purple-500/10 cyber-card">
        <h2 className="text-4xl font-black text-purple-400 mb-8 cyber-neon">👤 USER PROFILE CHECK</h2>

        {/* Search Box */}
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Enter User UID"
            value={searchUid}
            onChange={(e) => setSearchUid(e.target.value)}
            className="flex-1 bg-black rounded-2xl px-5 py-4 outline-none border border-purple-500/20 focus:border-purple-500 text-white"
          />
          <button
            onClick={async () => {
              setLoadingAction("search");
              await handleSearch();
              setLoadingAction(null);
            }}
            disabled={loadingAction === "search"}
            className="bg-purple-500 text-black px-8 py-4 rounded-2xl font-black cyber-btn hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-wait"
          >
            {loadingAction === "search" ? "⏳ SEARCHING..." : "🔍 SEARCH USER"}
          </button>
        </div>

        {/* User Details - Shows User Name */}
        {displayUser && (
          <div className="bg-black rounded-3xl p-6 mt-8 border border-purple-500/20">
            
            {/* User Name - Added Here */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-purple-500/20">
              <span className="text-4xl">👤</span>
              <div>
                <p className="text-gray-400 text-sm">PLAYER NAME</p>
                <p className="text-2xl font-black text-orange-500">{displayUser.name || "Not Set"}</p>
              </div>
            </div>
            
            {/* Email */}
            <p className="text-orange-400 text-lg mb-2">📧 Email: {displayUser.email}</p>
            
            {/* UID */}
            <p className="text-blue-400 mt-2 break-all">🆔 UID: {searchUid}</p>
            
            {/* Coins */}
            <p className="text-green-400 mt-3 text-2xl font-black cyber-prize">🪙 Coins: {displayUser.coins || 0}</p>
            
            {/* Status */}
            <p className={`mt-3 font-bold ${displayUser.blocked ? "text-red-400" : "text-green-400"}`}>
              🚫 Status: {displayUser.blocked ? "BLOCKED" : "ACTIVE"}
            </p>

            {/* Button Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
              <button
                onClick={async () => {
                  setLoadingAction("block");
                  await onBlockUser(searchUid, displayUser.blocked);
                  setLoadingAction(null);
                }}
                disabled={loadingAction === "block"}
                className={`w-full py-3 rounded-2xl font-black cyber-btn transition-all disabled:opacity-50 disabled:cursor-wait ${
                  displayUser.blocked 
                    ? "bg-green-500 hover:bg-green-600 text-black" 
                    : "bg-red-500 hover:bg-red-600 text-white"
                }`}
              >
                {loadingAction === "block" ? "⏳ PROCESSING..." : displayUser.blocked ? "🔓 UNBLOCK USER" : "🔒 BLOCK USER"}
              </button>

              <button
                onClick={() => setShowHistoryPopup(true)}
                className="bg-blue-500 text-white py-3 rounded-2xl font-black cyber-btn hover:bg-blue-600 transition-all"
              >
                📜 VIEW MATCH HISTORY
              </button>

              <button
                onClick={() => setShowCoinHistoryPopup(true)}
                className="bg-yellow-500 text-black py-3 rounded-2xl font-black cyber-btn hover:bg-yellow-600 transition-all"
              >
                🪙 VIEW COIN HISTORY
              </button>
            </div>

            {/* Wallet Control */}
            <div className="bg-[#1a1a2e] rounded-2xl p-5 border border-orange-500/20 mt-6">
              <h3 className="text-2xl font-black text-orange-400 mb-5">💰 WALLET CONTROL</h3>
              <input
                type="number"
                placeholder="Coins Amount"
                value={manualCoins}
                onChange={(e) => setManualCoins(e.target.value)}
                className="w-full bg-black rounded-2xl px-4 py-3 outline-none border border-orange-500/20 mb-4 text-white"
              />
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={async () => {
                    setLoadingAction("deduct");
                    await onDeductCoins(searchUid, manualCoins);
                    setLoadingAction(null);
                  }}
                  disabled={loadingAction === "deduct"}
                  className="bg-red-500 text-white py-4 rounded-2xl font-black cyber-btn hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-wait"
                >
                  {loadingAction === "deduct" ? "⏳ PROCESSING..." : "➖ DEDUCT COINS"}
                </button>
                <button
                  onClick={async () => {
                    setLoadingAction("add");
                    await onAddCoins(searchUid, manualCoins);
                    setLoadingAction(null);
                  }}
                  disabled={loadingAction === "add"}
                  className="bg-green-500 text-black py-4 rounded-2xl font-black cyber-btn hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-wait"
                >
                  {loadingAction === "add" ? "⏳ PROCESSING..." : "➕ ADD COINS"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Match History Popup */}
      {showHistoryPopup && displayUser && (
        <UserHistoryPopup
          userData={displayUser}
          onClose={() => setShowHistoryPopup(false)}
        />
      )}

      {/* Coin History Popup */}
      {showCoinHistoryPopup && displayUser && (
        <CoinHistoryPopup
          user={{ uid: displayUser.uid }}
          closePopup={() => setShowCoinHistoryPopup(false)}
        />
      )}
    </section>
  );
}