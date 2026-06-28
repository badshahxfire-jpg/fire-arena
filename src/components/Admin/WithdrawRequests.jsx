import { useState } from "react";

export default function WithdrawRequests({ withdrawRequests, onApproveWithdraw, onRejectWithdraw, onDeleteWithdraw, onClose }) {
  const [searchWithdraw, setSearchWithdraw] = useState("");
  const [withdrawFromDate, setWithdrawFromDate] = useState("");
  const [withdrawToDate, setWithdrawToDate] = useState("");
  const [loadingAction, setLoadingAction] = useState(null);

  const filteredRequests = withdrawRequests
    ?.slice()
    .reverse()
    .filter((item) => {
      const matchSearch =
        item.email?.toLowerCase().includes(searchWithdraw.toLowerCase()) ||
        item.requestId?.toLowerCase().includes(searchWithdraw.toLowerCase());
      return matchSearch;
    });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-[#1a1a1a] w-full max-w-5xl rounded-3xl border border-gray-800 flex flex-col max-h-[90vh] shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-black/40">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-green-400 cyber-neon flex items-center gap-2">WITHDRAW REQUESTS</h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex justify-center items-center rounded-full bg-gray-800/50 text-gray-400 hover:text-white hover:bg-red-500/20 transition-colors text-xl">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar">
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => onDeleteWithdraw("COMPLETED")}
              className="bg-green-500 text-black px-3 py-2 rounded-xl font-black text-sm cyber-btn"
            >
              🗑 DELETE COMPLETED
            </button>
            <button
              onClick={() => onDeleteWithdraw("REJECTED")}
              className="bg-red-500 text-white px-3 py-2 rounded-xl font-black text-sm cyber-btn"
            >
              🗑 DELETE REJECTED
            </button>
            <button
              onClick={() => onDeleteWithdraw("ALL")}
              className="bg-orange-500 text-black px-3 py-2 rounded-xl font-black text-sm cyber-btn"
            >
              🗑 DELETE ALL
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <input
              type="text"
              placeholder="Search ID / Email"
              value={searchWithdraw}
              onChange={(e) => setSearchWithdraw(e.target.value)}
              className="bg-black rounded-2xl px-5 py-4 outline-none"
            />
            <input
              type="date"
              value={withdrawFromDate}
              onChange={(e) => setWithdrawFromDate(e.target.value)}
              className="bg-black rounded-2xl px-5 py-4 outline-none"
            />
            <input
              type="date"
              value={withdrawToDate}
              onChange={(e) => setWithdrawToDate(e.target.value)}
              className="bg-black rounded-2xl px-5 py-4 outline-none"
            />
          </div>

          <div className="space-y-6">
            {filteredRequests?.map((item) => (
              <div key={item.id} className="bg-black p-6 rounded-3xl">
                <p className="text-green-400">ID: {item.requestId}</p>
                <p>Email: {item.email}</p>
                <p>Amount: 🪙 {item.amount}</p>
                <p>Account Holder: <span className="text-white font-bold">{item.name || "N/A"}</span></p>
                <p>Mobile Number: <span className="text-white font-bold">{item.number || "N/A"}</span></p>
                <p>UPI ID: <span className="text-blue-400 font-bold">{item.upi || "N/A"}</span></p>
                <p className="text-blue-400 break-all">UID: {item.userUid}</p>
                <p className="text-blue-400">Date: {item.createdAt}</p>
                <p className={`font-bold mt-2 ${
                  item.status === "PENDING" ? "text-yellow-400" :
                  item.status === "COMPLETED" ? "text-green-400" : "text-red-400"
                }`}>
                  Status: {item.status}
                </p>

                <div className="flex gap-3 mt-4">
                  <button
                    disabled={item.status === "COMPLETED" || item.status === "REJECTED" || loadingAction === `approve-${item.id}`}
                    onClick={async () => {
                      setLoadingAction(`approve-${item.id}`);
                      await onApproveWithdraw(item);
                      setLoadingAction(null);
                    }}
                    className={`px-6 py-3 rounded-2xl font-black cyber-btn ${
                      item.status === "COMPLETED"
                        ? "bg-green-700 text-white"
                        : item.status === "REJECTED"
                        ? "bg-gray-500 text-white cursor-not-allowed"
                        : "bg-green-500 text-black hover:scale-105"
                    } ${loadingAction === `approve-${item.id}` ? "opacity-50 cursor-wait" : ""}`}
                  >
                    {loadingAction === `approve-${item.id}` ? "⏳ COMPLETING..." : item.status === "COMPLETED" ? "✅ COMPLETED" : item.status === "REJECTED" ? "🚫 DISABLED" : "MARK COMPLETE"}
                  </button>

                  <button
                    disabled={item.status === "COMPLETED" || item.status === "REJECTED" || loadingAction === `reject-${item.id}`}
                    onClick={async () => {
                      const reason = window.prompt("Enter reason for rejection:");
                      if (reason === null) return; // User cancelled the prompt

                      setLoadingAction(`reject-${item.id}`);
                      await onRejectWithdraw(item, reason);
                      setLoadingAction(null);
                    }}
                    className={`px-6 py-3 rounded-2xl font-black cyber-btn ${
                      item.status === "REJECTED"
                        ? "bg-red-700 text-white"
                        : item.status === "COMPLETED"
                        ? "bg-gray-500 text-white cursor-not-allowed"
                        : "bg-red-500 text-white hover:scale-105"
                    } ${loadingAction === `reject-${item.id}` ? "opacity-50 cursor-wait" : ""}`}
                  >
                    {loadingAction === `reject-${item.id}` ? "⏳ REJECTING..." : item.status === "REJECTED" ? "❌ REJECTED" : item.status === "COMPLETED" ? "🚫 DISABLED" : "REJECT"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}