import React, { useState } from 'react';
import UserActivityPopup from './UserActivityPopup';

export default function AdminAnalytics({ 
  analytics, 
  allUsers = [], 
  joinedPlayers = [], 
  migrateWinnings, 
  migrateSingleUserWinnings,
  onAddCoins,
  onGiveLoyalBonus
}) {
  const [singleUserId, setSingleUserId] = useState('');
  const [migrateAmount, setMigrateAmount] = useState('');
  const [showActivityPopup, setShowActivityPopup] = useState(false);

  return (
    <section className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <h2 className="text-5xl font-black text-orange-500 cyber-neon">📊 ADMIN ANALYTICS</h2>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex flex-col sm:flex-row items-center gap-2 bg-[#111] p-2 rounded-2xl border border-blue-500/30">
            <input
              type="text"
              placeholder="Enter User ID"
              value={singleUserId}
              onChange={(e) => setSingleUserId(e.target.value)}
              className="bg-black/50 text-white px-4 py-2 rounded-xl border border-gray-600 focus:outline-none focus:border-blue-500 min-w-[150px] max-w-[180px] text-sm"
            />
            <input
              type="number"
              placeholder="Amount (🪙)"
              value={migrateAmount}
              onChange={(e) => setMigrateAmount(e.target.value)}
              className="bg-black/50 text-white px-4 py-2 rounded-xl border border-gray-600 focus:outline-none focus:border-blue-500 min-w-[100px] max-w-[120px] text-sm"
            />
            <button
              onClick={() => {
                migrateSingleUserWinnings(singleUserId, migrateAmount);
                setSingleUserId('');
                setMigrateAmount('');
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-black transition-all duration-300 shadow-md shadow-blue-500/20 whitespace-nowrap text-sm"
            >
              🔄 MIGRATE SINGLE
            </button>
          </div>
          <button
            onClick={migrateWinnings}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black transition-all duration-300 shadow-md shadow-emerald-500/20 cyber-btn"
          >
            🔄 MIGRATE ALL OLD USERS
          </button>
        </div>
      </div>
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-[#111] rounded-3xl p-6 border border-orange-500/10 cyber-card flex flex-col justify-between">
          <div>
            <p className="text-gray-400">Total Users</p>
            <h3 className="text-5xl font-black text-orange-500 mt-4">👥 {analytics.totalUsers}</h3>
          </div>
          <button
            onClick={() => setShowActivityPopup(true)}
            className="mt-4 w-full bg-orange-500/10 hover:bg-orange-500 border border-orange-500/20 hover:text-black py-2.5 rounded-xl text-xs font-bold transition-all duration-300"
          >
            📊 VIEW ACTIVITY (10 DAYS)
          </button>
        </div>
        <div className="bg-[#111] rounded-3xl p-6 border border-green-500/10 cyber-card">
          <p className="text-gray-400">Total Tournaments</p>
          <h3 className="text-5xl font-black text-green-400 mt-4">🎮 {analytics.totalTournaments}</h3>
        </div>
        <div className="bg-[#111] rounded-3xl p-6 border border-blue-500/10 cyber-card">
          <p className="text-gray-400">Total Deposits</p>
          <h3 className="text-5xl font-black text-blue-400 mt-4 cyber-prize">🪙 {analytics.totalDeposits}</h3>
        </div>
        <div className="bg-[#111] rounded-3xl p-6 border border-red-500/10 cyber-card">
          <p className="text-gray-400">Total Withdrawals</p>
          <h3 className="text-5xl font-black text-red-400 mt-4">💸 {analytics.totalWithdrawals}</h3>
        </div>
        <div className="bg-[#111] rounded-3xl p-6 border border-yellow-500/10 cyber-card">
          <p className="text-gray-400">Live Matches</p>
          <h3 className="text-5xl font-black text-yellow-400 mt-4">🔥 {analytics.liveMatches}</h3>
        </div>
        <div className="bg-[#111] rounded-3xl p-6 border border-cyan-500/10 cyber-card">
          <p className="text-gray-400">Pending Topups</p>
          <h3 className="text-5xl font-black text-cyan-400 mt-4">⏳ {analytics.pendingTopups}</h3>
        </div>
        <div className="bg-[#111] rounded-3xl p-6 border border-pink-500/10 cyber-card">
          <p className="text-gray-400">Pending Withdraws</p>
          <h3 className="text-5xl font-black text-pink-400 mt-4">🏦 {analytics.pendingWithdraws}</h3>
        </div>
        <div className="bg-[#111] rounded-3xl p-6 border border-purple-500/10 cyber-card">
          <p className="text-gray-400">Admin Revenue</p>
          <h3 className="text-5xl font-black text-purple-400 mt-4 cyber-prize">💰 {analytics.adminRevenue}</h3>
        </div>
      </div>

      {showActivityPopup && (
        <UserActivityPopup
          allUsers={allUsers}
          joinedPlayers={joinedPlayers}
          onClose={() => setShowActivityPopup(false)}
          onAddCoins={onAddCoins}
          onGiveLoyalBonus={onGiveLoyalBonus}
          isAdmin={true}
        />
      )}
    </section>
  );
}