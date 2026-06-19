import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";

export default function CoinHistoryPopup({ user, closePopup }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const historyRef = collection(db, "users", user.uid, "coinHistory");
    const q = query(historyRef, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

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

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3 opacity-50">👻</div>
              <p className="text-gray-400">No transactions yet!</p>
            </div>
          ) : (
            history.map((tx) => (
              <div 
                key={tx.id} 
                className="bg-black/40 p-4 rounded-2xl border border-gray-800 flex flex-col gap-2 hover:border-gray-700 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md bg-gray-800 ${tx.isAddition ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.type}
                    </span>
                    <p className="text-sm text-gray-300 mt-2 font-medium">{tx.reason}</p>
                  </div>
                  <div className={`text-lg font-bold flex items-center gap-1 ${tx.isAddition ? 'text-green-500' : 'text-red-500'}`}>
                    {tx.isAddition ? '+' : '-'}🪙{tx.amount}
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
