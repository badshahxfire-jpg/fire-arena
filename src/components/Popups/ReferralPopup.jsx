import React, { useState, useEffect } from "react";
import { useReferral } from "../../hooks/useReferral";

export default function ReferralPopup({ user, onClose }) {
  const {
    referralCode,
    referralStats,
    referralHistory,
    referralConditions,
    loading,
    getUserReferralStats,
    shareReferralCode,
    copyToClipboard
  } = useReferral(user);

  const [activeTab, setActiveTab] = useState("stats"); // stats, history, howto
  const [refreshing, setRefreshing] = useState(false);

  // Refresh data
  const refreshData = async () => {
    setRefreshing(true);
    await getUserReferralStats(user?.uid);
    setRefreshing(false);
  };

  useEffect(() => {
    if (user?.uid) {
      getUserReferralStats(user.uid);
    }
  }, [user]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateString;
    }
  };

  // Get status badge color
  const getStatusBadge = (status, completedBy) => {
    if (status === "completed") {
      return (
        <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <span>✅</span> Completed via {completedBy === "topup" ? "Topup" : "Tournaments"}
        </span>
      );
    } else if (status === "pending") {
      return (
        <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <span>⏳</span> Pending
        </span>
      );
    } else {
      return (
        <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <span>❌</span> Expired
        </span>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 px-4">
      <div className="bg-[#111] w-full max-w-2xl rounded-[40px] p-5 md:p-8 border border-orange-500/20 max-h-[90vh] overflow-y-auto cyber-card">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4 md:gap-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">💰</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-black text-orange-500 cyber-neon text-center md:text-left">
              REFER & EARN
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="bg-red-500 hover:bg-red-600 text-white px-4 md:px-5 py-2 rounded-xl md:rounded-2xl font-black transition-all w-full md:w-auto text-center text-sm md:text-base"
          >
            CLOSE
          </button>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
          >
            <span>{refreshing ? "⏳" : "🔄"}</span>
            Refresh
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading referral data...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* Your Referral Code Card */}
            <div className="mb-6 p-5 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-2xl border border-orange-500/20">
              <p className="text-gray-400 text-sm mb-2 text-center">YOUR REFERRAL CODE</p>
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="bg-black rounded-xl px-6 py-3 border border-orange-500/30 flex-1 text-center">
                  <code className="text-2xl md:text-3xl font-black text-orange-400 tracking-wider">
                    {referralCode || "LOADING..."}
                  </code>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(referralCode)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
                  >
                    <span>📋</span> COPY
                  </button>
                  <button
                    onClick={shareReferralCode}
                    className="bg-green-600 hover:bg-green-500 text-white px-5 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
                  >
                    <span>📤</span> SHARE
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-black rounded-xl p-3 text-center border border-purple-500/20">
                <p className="text-gray-400 text-xs">Total Referrals</p>
                <p className="text-2xl font-black text-purple-400">{referralStats.totalReferrals || 0}</p>
              </div>
              <div className="bg-black rounded-xl p-3 text-center border border-green-500/20">
                <p className="text-gray-400 text-xs">Completed</p>
                <p className="text-2xl font-black text-green-400">{referralStats.completedReferrals || 0}</p>
              </div>
              <div className="bg-black rounded-xl p-3 text-center border border-yellow-500/20">
                <p className="text-gray-400 text-xs">Pending</p>
                <p className="text-2xl font-black text-yellow-400">{referralStats.pendingReferrals || 0}</p>
              </div>
              <div className="bg-black rounded-xl p-3 text-center border border-orange-500/20">
                <p className="text-gray-400 text-xs">Total Earned</p>
                <p className="text-2xl font-black text-orange-400">🪙 {referralStats.totalEarned || 0}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-5 border-b border-gray-800 pb-2">
              <button
                onClick={() => setActiveTab("stats")}
                className={`px-4 py-2 rounded-xl font-bold transition-all ${
                  activeTab === "stats" 
                    ? "bg-orange-500/20 text-orange-400 border-b-2 border-orange-500" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                📊 Stats
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2 rounded-xl font-bold transition-all ${
                  activeTab === "history" 
                    ? "bg-orange-500/20 text-orange-400 border-b-2 border-orange-500" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                📜 History
              </button>
              <button
                onClick={() => setActiveTab("howto")}
                className={`px-4 py-2 rounded-xl font-bold transition-all ${
                  activeTab === "howto" 
                    ? "bg-orange-500/20 text-orange-400 border-b-2 border-orange-500" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                ℹ️ How it Works
              </button>
            </div>

            {/* Tab Content: Stats */}
            {activeTab === "stats" && (
              <div className="space-y-4">
                <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
                  <h3 className="text-purple-400 font-bold mb-3 flex items-center gap-2">
                    <span>🎯</span> REFERRAL CONDITIONS
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">New User Bonus:</span>
                      <span className="text-green-400 font-bold">🪙 {referralConditions.newUserBonusAmount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Referrer Bonus:</span>
                      <span className="text-yellow-400 font-bold">🪙 {referralConditions.referrerBonusAmount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Min Tournaments:</span>
                      <span className="text-orange-400 font-bold">{referralConditions.minTournamentsJoined}+</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                  <h3 className="text-green-400 font-bold mb-3 flex items-center gap-2">
                    <span>📈</span> YOUR PERFORMANCE
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Conversion Rate:</span>
                      <span className="text-white font-bold">
                        {referralStats.totalReferrals > 0 
                          ? Math.round((referralStats.completedReferrals / referralStats.totalReferrals) * 100) 
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${referralStats.totalReferrals > 0 
                            ? (referralStats.completedReferrals / referralStats.totalReferrals) * 100 
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-gray-400">Next milestone:</span>
                      <span className="text-yellow-400 font-bold">
                        {5 - (referralStats.completedReferrals % 5)} more referrals for next bonus!
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content: History */}
            {activeTab === "history" && (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {referralHistory.length === 0 ? (
                  <div className="text-center py-12 bg-black/30 rounded-2xl">
                    <p className="text-gray-500">No referrals yet</p>
                    <p className="text-gray-600 text-sm mt-2">Share your code to get started!</p>
                  </div>
                ) : (
                  referralHistory.map((ref) => (
                    <div key={ref.id} className="bg-black rounded-xl p-4 border border-gray-800 hover:border-orange-500/30 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-green-400 text-lg">👤</span>
                            <p className="text-white font-bold">{ref.newUserName || ref.newUserEmail}</p>
                          </div>
                          <p className="text-gray-500 text-xs flex items-center gap-2 flex-wrap">
                            <span>📅 Joined: {formatDate(ref.createdAt)}</span>
                            {ref.completedAt && (
                              <span>✅ Completed: {formatDate(ref.completedAt)}</span>
                            )}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(ref.status, ref.completedBy)}
                          {ref.status === "completed" && (
                            <p className="text-green-400 text-sm font-bold flex items-center gap-1">
                              <span>💰</span> +🪙 {ref.referrerBonus}
                            </p>
                          )}
                          {ref.status === "pending" && (
                            <div className="text-right">
                              <p className="text-yellow-400 font-bold text-xs bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20">
                                🎮 Played: {ref.newUserTournamentsJoined || 0} / {referralConditions.minTournamentsJoined}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab Content: How it Works */}
            {activeTab === "howto" && (
              <div className="space-y-4">
                <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                  <h3 className="text-blue-400 font-bold mb-3 flex items-center gap-2">
                    <span>📖</span> HOW TO REFER
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-bold">1</div>
                      <p className="text-gray-300">Copy your unique referral code from above</p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-bold">2</div>
                      <p className="text-gray-300">Share it with friends via WhatsApp, Telegram, or Social Media</p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-bold">3</div>
                      <p className="text-gray-300">Friend registers using your code → gets 🪙{referralConditions.newUserBonusAmount} instantly</p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-bold">4</div>
                      <p className="text-gray-300">You get 🪙{referralConditions.referrerBonusAmount} when your friend plays {referralConditions.minTournamentsJoined} matches.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/20">
                  <h3 className="text-yellow-400 font-bold mb-3 flex items-center gap-2">
                    <span>💡</span> TIPS TO EARN MORE
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center gap-2">
                      <span>📱</span> Share on WhatsApp status daily
                    </li>
                    <li className="flex items-center gap-2">
                      <span>👥</span> Join gaming communities on Telegram
                    </li>
                    <li className="flex items-center gap-2">
                      <span>🎮</span> Tell your in-game friends
                    </li>
                    <li className="flex items-center gap-2">
                      <span>🏆</span> Share your winnings screenshot as proof
                    </li>
                  </ul>
                </div>

                <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                  <h3 className="text-green-400 font-bold mb-2 flex items-center gap-2">
                    <span>⚡</span> REFERRAL RULES
                  </h3>
                  <ul className="space-y-1 text-xs text-gray-400">
                    <li>✅ No limit on number of referrals</li>
                    <li>✅ Cannot refer yourself (self-referral banned)</li>
                    <li>✅ Each friend can use referral code only once</li>
                    <li>✅ Bonus credited automatically when conditions met</li>
                    <li>✅ Referral never expires (pending stays until condition met)</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-800 text-center">
              <p className="text-gray-500 text-xs">
                Invite friends, earn coins, and dominate the leaderboard! 🚀
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}