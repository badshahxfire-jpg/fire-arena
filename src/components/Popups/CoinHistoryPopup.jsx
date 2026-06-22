import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, doc } from "firebase/firestore";
import { db } from "../../firebase";

export default function CoinHistoryPopup({ user, closePopup }) {
  const [history, setHistory] = useState([]);
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all"); // "all", "added", "deducted"

  useEffect(() => {
    if (!user) return;

    // 1. Fetch live coins balance for this specific user
    const userRef = doc(db, "users", user.uid);
    const unsubUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setCoins(docSnap.data().coins || 0);
      }
    });

    // 2. Fetch transaction history
    const historyRef = collection(db, "users", user.uid, "coinHistory");
    const q = query(historyRef, orderBy("timestamp", "desc"));
    const unsubHistory = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(docs);
      setLoading(false);
    });

    return () => {
      unsubUser();
      unsubHistory();
    };
  }, [user]);

  // Dynamically calculate running balances from latest to oldest
  let currentRunning = coins;
  const historyWithBalances = history.map((tx) => {
    const isAdd = tx.isAddition !== undefined ? tx.isAddition : [
      "WINNING", "WELCOME_BONUS", "TOPUP", "REFERRAL", "BONUS", 
      "REFUND", "COIN_ADD", "COIN_TRANSFER_RECEIVE", "ADMIN_ADD", 
      "LOYALTY_BONUS", "MATCH_CANCEL", "REFERRAL_BONUS"
    ].includes(tx.type);

    const balanceAfter = currentRunning;
    
    if (isAdd) {
      currentRunning -= tx.amount;
    } else {
      currentRunning += tx.amount;
    }

    return {
      ...tx,
      isAdd,
      balanceAfter
    };
  });

  // Apply active filter
  const filteredHistory = historyWithBalances.filter((tx) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "added") return tx.isAdd;
    if (activeFilter === "deducted") return !tx.isAdd;
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-end sm:items-center animate-fade-in p-4">
      <div className="bg-[#1a1a1a] w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-gray-800 flex flex-col max-h-[85vh] animate-slide-up shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-black/40">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              📜 Coin History
            </h2>
            <p className="text-sm text-gray-400 mt-1">Track all your transactions</p>
          </div>
          <button 
            onClick={closePopup}
            className="w-8 h-8 flex justify-center items-center rounded-full bg-gray-800/50 text-gray-400 hover:text-white hover:bg-red-500/20 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 px-5 py-3 border-b border-gray-800/60 bg-black/20">
          {[
            { id: "all", label: "All 📜" },
            { id: "added", label: "Added 📈" },
            { id: "deducted", label: "Deducted 📉" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                activeFilter === tab.id
                  ? "bg-white text-black shadow-md scale-105"
                  : "bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3 opacity-50">👻</div>
              <p className="text-gray-400">No matching transactions!</p>
            </div>
          ) : (
            filteredHistory.map((tx) => (
              <div 
                key={tx.id} 
                className="bg-black/40 p-4 rounded-2xl border border-gray-800 flex flex-col gap-2 hover:border-gray-700 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md bg-gray-800 ${tx.isAdd ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.type}
                    </span>
                    <p className="text-sm text-gray-300 mt-2 font-medium">{tx.reason || tx.description}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-base font-extrabold ${tx.isAdd ? 'text-green-500' : 'text-red-500'}`}>
                      {tx.isAdd ? '+' : '-'}🪙{tx.amount}
                    </div>
                    {tx.balanceAfter !== undefined && (
                      <div className="text-[11px] text-gray-500 mt-1 font-semibold">
                        Bal: 🪙{tx.balanceAfter}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {tx.dateString || new Date(tx.timestamp?.toDate()).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
