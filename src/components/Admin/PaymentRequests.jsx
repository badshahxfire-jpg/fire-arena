import { useState } from "react";

export default function PaymentRequests({ paymentRequests, onApprovePayment, onRejectPayment, onDeletePayment, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loadingAction, setLoadingAction] = useState(null);

  const filteredRequests = paymentRequests
    ?.slice()
    .reverse()
    .filter((item) => {
      const matchSearch =
        item.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.requestId?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-[#1a1a1a] w-full max-w-5xl rounded-3xl border border-gray-800 flex flex-col max-h-[90vh] shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-black/40">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-orange-400 cyber-neon flex items-center gap-2">PAYMENT REQUESTS</h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex justify-center items-center rounded-full bg-gray-800/50 text-gray-400 hover:text-white hover:bg-red-500/20 transition-colors text-xl">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar">
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => onDeletePayment("COMPLETED")}
              className="bg-green-500 text-black px-3 py-2 rounded-xl font-black text-sm cyber-btn"
            >
              🗑 DELETE COMPLETED
            </button>
            <button
              onClick={() => onDeletePayment("REJECTED")}
              className="bg-red-500 text-white px-3 py-2 rounded-xl font-black text-sm cyber-btn"
            >
              🗑 DELETE REJECTED
            </button>
            <button
              onClick={() => onDeletePayment("ALL")}
              className="bg-orange-500 text-black px-3 py-2 rounded-xl font-black text-sm cyber-btn"
            >
              🗑 DELETE ALL
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <input
              type="text"
              placeholder="Search ID / Email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black rounded-2xl px-5 py-4 outline-none"
            />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-black rounded-2xl px-5 py-4 outline-none"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-black rounded-2xl px-5 py-4 outline-none"
            />
          </div>

          <div className="space-y-6">
            {filteredRequests?.map((item) => (
              <div key={item.id} className="bg-black p-6 rounded-3xl">
                <p className="text-orange-400">ID: {item.requestId}</p>
                <p>Email: {item.email}</p>
                <p>Amount: 🪙 {item.amount}</p>
                <p>UTR: {item.utr}</p>
                <p className="text-blue-400 break-all">UID: {item.userUid}</p>
                {item.screenshot && (
                  <a
                    href={item.screenshot}
                    target="_blank"
                    rel="noreferrer"
                    className="text-orange-400 block break-all mt-4"
                  >
                    📸 VIEW PAYMENT SCREENSHOT
                  </a>
                )}
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
                      await onApprovePayment(item);
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
                    {loadingAction === `approve-${item.id}` ? "⏳ APPROVING..." : item.status === "COMPLETED" ? "✅ COMPLETED" : item.status === "REJECTED" ? "🚫 DISABLED" : "APPROVE"}
                  </button>

                  <button
                    disabled={item.status === "COMPLETED" || item.status === "REJECTED" || loadingAction === `reject-${item.id}`}
                    onClick={async () => {
                      setLoadingAction(`reject-${item.id}`);
                      await onRejectPayment(item);
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