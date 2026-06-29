import React, { useState, useEffect } from 'react';
import UserActivityPopup from './UserActivityPopup';
import { db } from '../../firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';

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
  const [showMigrationPopup, setShowMigrationPopup] = useState(false);
  const [showDashboardPopup, setShowDashboardPopup] = useState(false);

  useEffect(() => {
    if (showActivityPopup || showMigrationPopup || showDashboardPopup) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showActivityPopup, showMigrationPopup, showDashboardPopup]);

  return (
    <>
      {!showDashboardPopup ? (
        <div className="flex justify-center my-10 px-6">
          <button
            onClick={() => setShowDashboardPopup(true)}
            className="w-full max-w-md bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white px-8 py-6 rounded-3xl font-black text-2xl md:text-3xl transition-all duration-300 shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:shadow-[0_0_50px_rgba(249,115,22,0.5)] cyber-neon cyber-btn border border-orange-500/50"
          >
            📊 ADMIN ANALYTICS
          </button>
        </div>
      ) : (
        <div className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl overflow-y-auto p-4 md:p-8">
          <div className="bg-[#0a0a0a] border border-orange-500/30 rounded-3xl p-6 md:p-10 max-w-7xl w-full mx-auto relative shadow-[0_0_100px_rgba(249,115,22,0.15)] mt-10 mb-20 animate-fade-in-up">
            
            <button 
              onClick={() => setShowDashboardPopup(false)}
              className="absolute top-4 right-4 md:top-6 md:right-6 bg-red-500 hover:bg-red-600 text-white w-12 h-12 rounded-2xl font-black text-xl transition-all flex items-center justify-center z-50 shadow-lg shadow-red-500/20"
            >
              ✕
            </button>

            <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 pt-8 md:pt-0">
              <h2 className="text-4xl md:text-5xl font-black text-orange-500 cyber-neon text-center md:text-left">
                📊 ADMIN ANALYTICS
              </h2>
              <button
                onClick={() => setShowMigrationPopup(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black transition-all duration-300 shadow-md shadow-blue-500/20 cyber-btn w-full md:w-auto"
              >
                🛠️ MIGRATION TOOLS
              </button>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-[#111] rounded-3xl p-6 border border-orange-500/10 cyber-card flex flex-col justify-between hover:border-orange-500/30 transition-colors">
                <div>
                  <p className="text-gray-400 font-medium">Total Users</p>
                  <h3 className="text-5xl font-black text-orange-500 mt-4">👥 {analytics.totalUsers}</h3>
                </div>
                <button
                  onClick={() => setShowActivityPopup(true)}
                  className="mt-6 w-full bg-orange-500/10 hover:bg-orange-500 border border-orange-500/20 hover:text-black py-3 rounded-xl text-xs font-bold transition-all duration-300"
                >
                  📊 VIEW ACTIVITY (10 DAYS)
                </button>
              </div>
              
              <div className="bg-[#111] rounded-3xl p-6 border border-green-500/10 cyber-card hover:border-green-500/30 transition-colors">
                <p className="text-gray-400 font-medium">Total Tournaments</p>
                <h3 className="text-5xl font-black text-green-400 mt-4">🎮 {analytics.totalTournaments}</h3>
              </div>
              
              <div className="bg-[#111] rounded-3xl p-6 border border-blue-500/10 cyber-card hover:border-blue-500/30 transition-colors">
                <p className="text-gray-400 font-medium">Total Deposits</p>
                <h3 className="text-5xl font-black text-blue-400 mt-4 cyber-prize">🪙 {analytics.totalDeposits}</h3>
              </div>
              
              <div className="bg-[#111] rounded-3xl p-6 border border-red-500/10 cyber-card hover:border-red-500/30 transition-colors">
                <p className="text-gray-400 font-medium">Total Withdrawals</p>
                <h3 className="text-5xl font-black text-red-400 mt-4">💸 {analytics.totalWithdrawals}</h3>
              </div>
              
              <div className="bg-[#111] rounded-3xl p-6 border border-yellow-500/10 cyber-card hover:border-yellow-500/30 transition-colors">
                <p className="text-gray-400 font-medium">Live Matches</p>
                <h3 className="text-5xl font-black text-yellow-400 mt-4">🔥 {analytics.liveMatches}</h3>
              </div>
              
              <div className="bg-[#111] rounded-3xl p-6 border border-cyan-500/10 cyber-card hover:border-cyan-500/30 transition-colors">
                <p className="text-gray-400 font-medium">Pending Topups</p>
                <h3 className="text-5xl font-black text-cyan-400 mt-4">⏳ {analytics.pendingTopups}</h3>
              </div>
              
              <div className="bg-[#111] rounded-3xl p-6 border border-pink-500/10 cyber-card hover:border-pink-500/30 transition-colors">
                <p className="text-gray-400 font-medium">Pending Withdraws</p>
                <h3 className="text-5xl font-black text-pink-400 mt-4">🏦 {analytics.pendingWithdraws}</h3>
              </div>
              
              <div className="bg-[#111] rounded-3xl p-6 border border-purple-500/10 cyber-card hover:border-purple-500/30 transition-colors">
                <p className="text-gray-400 font-medium">Admin Revenue</p>
                <h3 className="text-5xl font-black text-purple-400 mt-4 cyber-prize">💰 {analytics.adminRevenue}</h3>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <button 
                onClick={() => setShowDashboardPopup(false)}
                className="bg-gray-800 hover:bg-gray-700 text-white px-10 py-3 rounded-2xl font-bold transition-all"
              >
                Close Analytics Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

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

      {showMigrationPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-blue-500/30 rounded-3xl p-8 max-w-lg w-full relative shadow-2xl shadow-blue-500/20">
            <button 
              onClick={() => setShowMigrationPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
            
            <h3 className="text-2xl font-black text-blue-400 mb-6 text-center">🛠️ DATA MIGRATION TOOLS</h3>
            
            <div className="space-y-6">
              <div className="bg-black/50 p-6 rounded-2xl border border-gray-800">
                <h4 className="text-yellow-400 font-bold mb-4">Fix Welcome Bonus (3 Users)</h4>
                <p className="text-gray-400 text-xs mb-4">Click to automatically add 20 coins and disable the scratch card for the 3 users who registered today.</p>
                <button
                  onClick={async () => {
                    if(!window.confirm("Add 20 coins to the 3 specific users?")) return;
                    try {
                      const emails = ["chotu757677@gmail.com", "singhsarita6539@gmail.com", "pprashantsingh976@gmail.com"];
                      let count = 0;
                      for (const u of allUsers) {
                        if (emails.includes(u.email)) {
                          const userRef = doc(db, "users", u.uid);
                          await updateDoc(userRef, {
                            coins: increment(20),
                            welcomeBonusClaimed: true
                          });
                          
                          const historyRef = collection(db, "coinHistory");
                          await addDoc(historyRef, {
                            uid: u.uid,
                            amount: 20,
                            type: "deposit",
                            description: "Welcome Bonus (Admin Fixed)",
                            date: new Date().toLocaleDateString("en-GB"),
                            timestamp: new Date().toLocaleString()
                          });
                          count++;
                        }
                      }
                      alert(`Successfully fixed welcome bonus for ${count} users!`);
                    } catch (error) {
                      console.error(error);
                      alert("Error: " + error.message);
                    }
                  }}
                  className="bg-green-600 hover:bg-green-500 text-white px-4 py-3 rounded-xl font-black transition-all duration-300 w-full"
                >
                  ✨ FIX 3 RECENT USERS
                </button>
              </div>

              <div className="bg-black/50 p-6 rounded-2xl border border-gray-800">
                <h4 className="text-yellow-400 font-bold mb-4">Migrate Single User</h4>
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder="Enter User ID"
                    value={singleUserId}
                    onChange={(e) => setSingleUserId(e.target.value)}
                    className="bg-black text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-blue-500 w-full"
                  />
                  <input
                    type="number"
                    placeholder="Amount (🪙)"
                    value={migrateAmount}
                    onChange={(e) => setMigrateAmount(e.target.value)}
                    className="bg-black text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-blue-500 w-full"
                  />
                  <button
                    onClick={() => {
                      migrateSingleUserWinnings(singleUserId, migrateAmount);
                      setSingleUserId('');
                      setMigrateAmount('');
                      setShowMigrationPopup(false);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-black transition-all duration-300 w-full mt-2"
                  >
                    🔄 MIGRATE SINGLE USER
                  </button>
                </div>
              </div>

              <div className="bg-black/50 p-6 rounded-2xl border border-gray-800">
                <h4 className="text-emerald-400 font-bold mb-4">Bulk Migration</h4>
                <p className="text-gray-400 text-xs mb-4">Use this to migrate winnings for all legacy users automatically. This may take a few moments depending on the number of users.</p>
                <button
                  onClick={() => {
                    migrateWinnings();
                    setShowMigrationPopup(false);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-xl font-black transition-all duration-300 w-full"
                >
                  🔄 MIGRATE ALL OLD USERS
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => setShowMigrationPopup(false)}
              className="mt-6 w-full py-3 rounded-xl font-bold bg-gray-800 text-white hover:bg-gray-700 transition"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </>
  );
}