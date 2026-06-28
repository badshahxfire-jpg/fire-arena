import React, { useState } from "react";
import WeeklyRegistrationCard from "./WeeklyRegistrationCard";
import WeeklyLeaderboard from "./WeeklyLeaderboard";

export default function WeeklyDashboard({ user, isAdmin, weeklyTournaments, joinWeeklyTournament, updateStatus }) {
  const [pageView, setPageView] = useState("live"); // live, results
  const [activeTab, setActiveTab] = useState("INFO"); // INFO, LEADERBOARD, REWARDS
  const [selectedTournamentId, setSelectedTournamentId] = useState("");

  const activeTournaments = weeklyTournaments ? weeklyTournaments.filter(t => !(t.status === "COMPLETED" && t.rewardsDistributed)) : [];
  const resultTournaments = weeklyTournaments ? weeklyTournaments.filter(t => t.status === "COMPLETED" && t.rewardsDistributed) : [];
  
  const displayTournaments = pageView === "live" ? activeTournaments : resultTournaments;

  // Get the most recent tournament or the selected one
  let currentTournament = null;
  if (displayTournaments.length > 0) {
     if (selectedTournamentId) {
        currentTournament = displayTournaments.find(t => t.id === selectedTournamentId) || displayTournaments[0];
     } else {
        // Default to Solo (or lowest format order) if available
        const sortedTournaments = [...displayTournaments].sort((a, b) => {
           const order = { "Solo": 1, "Duo": 2, "Squad": 3 };
           return (order[a.format] || 99) - (order[b.format] || 99);
        });
        currentTournament = sortedTournaments[0];
     }
  }

  // Check if user is registered and their status
  let isRegistered = false;
  let isEliminated = false;
  let assignedLobby = null;

  if (currentTournament?.registeredTeams && user) {
    const userTeam = currentTournament.registeredTeams[user.uid];
    if (userTeam) {
      isRegistered = true;
      if (userTeam.status === "ELIMINATED") isEliminated = true;
    } else {
      // Check teammates
      Object.values(currentTournament.registeredTeams).forEach(team => {
        if (team.teammates) {
          team.teammates.forEach(tm => {
            if (tm.userId === user.uid) {
               isRegistered = true;
               if (team.status === "ELIMINATED") isEliminated = true;
            }
          });
        }
      });
    }

    // Find assigned lobby if not eliminated
    if (isRegistered && !isEliminated && currentTournament.lobbies) {
       Object.values(currentTournament.lobbies).forEach(lobby => {
          if (lobby.teams?.includes(user.uid)) {
             assignedLobby = lobby;
          } else {
             // Check if user is a teammate in any of the teams in this lobby
             lobby.teams?.forEach(leaderId => {
                const team = currentTournament.registeredTeams[leaderId];
                if (team && team.teammates) {
                   if (team.teammates.some(tm => tm.userId === user.uid)) {
                      assignedLobby = lobby;
                   }
                }
             });
          }
       });
    }
  }

  // Calculate Dynamic Prize Pool (80% of collection)
  const entryFee = currentTournament?.entryFee || 50;
  let totalRegisteredPlayers = 0;
  
  if (currentTournament?.registeredTeams) {
    Object.values(currentTournament.registeredTeams).forEach(team => {
      totalRegisteredPlayers += 1; // The leader
      if (team.teammates) {
        totalRegisteredPlayers += team.teammates.length;
      }
    });
  }

  const totalCollected = totalRegisteredPlayers * entryFee;
  const dynamicPrizePool = Math.floor(totalCollected * 0.80);
  const maxPrizePool = currentTournament?.prizePool || 10000;
  
  // As requested, always show the fixed Admin Set Prize Pool on the UI for marketing
  const totalPrizePool = maxPrizePool;

  const soloLowest = entryFee + 20;
  const soloMid = (entryFee * 2) + 50;
  const soloRemaining = Math.max(0, totalPrizePool - (soloLowest * 10) - (soloMid * 7));

  const duoLowest = (entryFee * 2) + 40;
  const duoRemaining = Math.max(0, totalPrizePool - duoLowest);

  if (!currentTournament && displayTournaments.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 mb-12">
        <div className="flex gap-4 mb-6 border-b border-white/10 pb-2">
          <button 
            onClick={() => { setPageView("live"); setSelectedTournamentId(""); setActiveTab("INFO"); }}
            className={`px-6 py-2 rounded-t-lg font-black text-lg transition-all ${pageView === "live" ? "text-orange-500 border-b-2 border-orange-500" : "text-gray-500 hover:text-white"}`}
          >
            🔴 LIVE MATCHES
          </button>
          <button 
            onClick={() => { setPageView("results"); setSelectedTournamentId(""); setActiveTab("LEADERBOARD"); }}
            className={`px-6 py-2 rounded-t-lg font-black text-lg transition-all ${pageView === "results" ? "text-orange-500 border-b-2 border-orange-500" : "text-gray-500 hover:text-white"}`}
          >
            🏆 RESULTS
          </button>
        </div>
        <div className="text-center text-white py-16 bg-black/40 border border-orange-500/20 rounded-2xl backdrop-blur-sm">
          <h2 className="text-4xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600 uppercase tracking-wider">Weekly Tournament</h2>
          <p className="text-gray-400 text-lg">
            {pageView === "live" ? "No active weekly tournament right now. Stay tuned!" : "No tournament results available yet."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 mb-12">
      {/* Live / Results Toggle */}
      <div className="flex gap-4 mb-6 border-b border-white/10 pb-2">
        <button 
          onClick={() => { setPageView("live"); setSelectedTournamentId(""); setActiveTab("INFO"); }}
          className={`px-6 py-2 rounded-t-lg font-black text-lg transition-all ${pageView === "live" ? "text-orange-500 border-b-2 border-orange-500" : "text-gray-500 hover:text-white"}`}
        >
          🔴 LIVE MATCHES
        </button>
        <button 
          onClick={() => { setPageView("results"); setSelectedTournamentId(""); setActiveTab("LEADERBOARD"); }}
          className={`px-6 py-2 rounded-t-lg font-black text-lg transition-all ${pageView === "results" ? "text-orange-500 border-b-2 border-orange-500" : "text-gray-500 hover:text-white"}`}
        >
          🏆 RESULTS
        </button>
      </div>

      {/* Tournament Selector Tabs */}
      {displayTournaments && displayTournaments.length > 1 && (
        <div className="mb-6 flex flex-wrap items-center gap-3 bg-black/40 border border-white/5 rounded-2xl p-3">
          {[...displayTournaments].sort((a, b) => {
            const order = { "Solo": 1, "Duo": 2, "Squad": 3 };
            return (order[a.format] || 99) - (order[b.format] || 99);
          }).map(t => {
            const isSelected = currentTournament?.id === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTournamentId(t.id)}
                className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-300 border ${
                  isSelected 
                    ? "bg-gradient-to-r from-orange-500 to-red-600 border-transparent text-white shadow-[0_0_15px_rgba(249,115,22,0.5)] scale-[1.02]" 
                    : "bg-black/60 border-white/10 text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {t.title} ({t.format || "Solo"})
              </button>
            );
          })}
        </div>
      )}

      {/* Header Section */}
      <div className="bg-gradient-to-r from-orange-600/20 to-red-900/20 border border-orange-500/30 rounded-2xl p-6 md:p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -z-10"></div>
        <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600 mb-2 uppercase tracking-tight flex items-center gap-4">
          {currentTournament.title || "Weekly Mega Event"}
          <span className={`text-sm px-3 py-1 rounded-full border align-middle shadow-lg ${
            currentTournament.format === "Squad" ? "bg-purple-600 text-white border-purple-400" :
            currentTournament.format === "Duo" ? "bg-blue-600 text-white border-blue-400" :
            "bg-orange-600 text-white border-orange-400"
          }`}>
            🎮 {currentTournament.format || "Solo"}
          </span>
        </h1>
        <p className="text-gray-300 mb-4 max-w-2xl">
          {currentTournament.description || "Compete all week, earn points, and climb the leaderboard to win massive rewards!"}
        </p>
        
        <div className="flex flex-wrap gap-4 text-sm font-bold">
          <div className="bg-black/50 px-4 py-2 rounded-lg border border-white/5 flex items-center gap-2">
            <span className="text-orange-400">💰 PRIZE POOL:</span> 
            <span className="text-white">{totalPrizePool} Coins</span>
          </div>
          <div className="bg-black/50 px-4 py-2 rounded-lg border border-white/5 flex items-center gap-2">
            <span className="text-orange-400">🎟️ ENTRY:</span> 
            <span className="text-white">{entryFee} Coins</span>
          </div>
          <div className="bg-black/50 px-4 py-2 rounded-lg border border-orange-500/30 text-orange-400 flex items-center gap-2">
            <span>🔴 STATUS:</span> 
            <span className="animate-pulse">{currentTournament.status}</span>
          </div>
        </div>
      </div>

      {/* Eliminated Banner */}
      {isEliminated && (
        <div className="bg-red-900/40 border border-red-500/50 rounded-2xl p-6 mb-6 shadow-[0_0_20px_rgba(239,68,68,0.2)] text-center">
          <h2 className="text-2xl font-black text-red-500 mb-2">❌ ELIMINATED</h2>
          <p className="text-gray-300 text-sm">You have been eliminated from this tournament. Better luck next time!</p>
        </div>
      )}

      {/* Match Details Banner for Registered Users */}
      {isRegistered && !isEliminated && currentTournament.status !== "COMPLETED" && (
        <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/50 rounded-2xl p-6 mb-6 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
          <h2 className="text-2xl font-black text-blue-400 mb-4 flex items-center gap-2">
            <span>🎮</span> MATCH DETAILS {assignedLobby ? `(${assignedLobby.name})` : ""}
          </h2>
          <p className="text-gray-300 text-sm mb-4">Please do not share these details. Keep them safe for your match.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(assignedLobby?.matchDate || currentTournament.matchDate) && (
              <div className="bg-black/50 p-4 rounded-xl border border-blue-500/20">
                <span className="text-gray-400 text-xs block mb-1">📅 MATCH DATE</span>
                <span className="text-white font-bold text-lg">{assignedLobby?.matchDate || currentTournament.matchDate}</span>
              </div>
            )}
            {(assignedLobby?.matchTime || currentTournament.matchTime) && (
              <div className="bg-black/50 p-4 rounded-xl border border-blue-500/20">
                <span className="text-gray-400 text-xs block mb-1">⏰ MATCH TIME</span>
                <span className="text-white font-bold text-lg">{assignedLobby?.matchTime || currentTournament.matchTime}</span>
              </div>
            )}
            <div className="bg-black/50 p-4 rounded-xl border border-blue-500/20 lg:col-span-1">
              <span className="text-gray-400 text-xs block mb-1">ROOM ID</span>
              <span className="text-white font-mono text-xl tracking-wider select-all">
                {assignedLobby?.roomId || currentTournament.roomId || "Waiting for Admin..."}
              </span>
            </div>
            <div className="bg-black/50 p-4 rounded-xl border border-blue-500/20 lg:col-span-1">
              <span className="text-gray-400 text-xs block mb-1">PASSWORD</span>
              <span className="text-white font-mono text-xl tracking-wider select-all">
                {assignedLobby?.roomPassword || currentTournament.roomPassword || "Waiting for Admin..."}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar border-b border-white/10 pb-2">
        {["INFO", "LEADERBOARD", "REWARDS"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
              activeTab === tab 
                ? "bg-orange-500 text-black" 
                : "bg-black/40 text-gray-400 hover:bg-white/5"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {activeTab === "INFO" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <WeeklyRegistrationCard 
              tournament={currentTournament} 
              user={user} 
              onJoin={joinWeeklyTournament} 
            />
            
            <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
              <h3 className="text-xl font-black text-white mb-4 border-b border-white/10 pb-2">Rules & Schedule</h3>
              <ul className="space-y-3 text-gray-400 text-sm">
                {(currentTournament.rules || [
                  `${(!currentTournament.format || currentTournament.format === "Solo") ? "Players" : "Teams"} must register before Wednesday.`,
                  "Qualifier matches happen on Thursday & Friday.",
                  `Top 10 ${(!currentTournament.format || currentTournament.format === "Solo") ? "players" : "teams"} advance to Grand Finals on Sunday.`,
                  "Point system applies based on match standings."
                ]).map((rule, idx) => (
                   <li key={idx} className="flex gap-2">
                     <span className="text-orange-500">📌</span> {rule}
                   </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === "LEADERBOARD" && (
          <WeeklyLeaderboard tournament={currentTournament} />
        )}

        {activeTab === "REWARDS" && (
          <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
             <h3 className="text-xl font-black text-white mb-6 border-b border-white/10 pb-2">Prize Distribution</h3>
             <div className="space-y-4">
                {(!currentTournament.format || currentTournament.format === "Solo") && (
                  <>
                    <div className="flex justify-between items-center bg-gradient-to-r from-yellow-500/20 to-transparent p-4 rounded-xl border border-yellow-500/30">
                      <span className="font-black text-yellow-500 text-lg">🥇 1st Place</span>
                      <span className="font-bold text-white text-lg">{Math.floor(soloRemaining * 0.50)} Coins</span>
                    </div>
                    <div className="flex justify-between items-center bg-gradient-to-r from-gray-400/20 to-transparent p-4 rounded-xl border border-gray-400/30">
                      <span className="font-black text-gray-300 text-lg">🥈 2nd Place</span>
                      <span className="font-bold text-white text-lg">{Math.floor(soloRemaining * 0.30)} Coins</span>
                    </div>
                    <div className="flex justify-between items-center bg-gradient-to-r from-amber-700/20 to-transparent p-4 rounded-xl border border-amber-700/30">
                      <span className="font-black text-amber-600 text-lg">🥉 3rd Place</span>
                      <span className="font-bold text-white text-lg">{Math.floor(soloRemaining * 0.20)} Coins</span>
                    </div>
                    <div className="flex justify-between items-center bg-black/50 p-4 rounded-xl border border-white/5">
                      <span className="font-bold text-gray-400">🏅 4th - 10th Place</span>
                      <span className="font-bold text-gray-300">{soloMid} Coins each</span>
                    </div>
                    <div className="flex justify-between items-center bg-black/50 p-4 rounded-xl border border-white/5">
                      <span className="font-bold text-gray-400">🎖️ 11th - 20th Place</span>
                      <span className="font-bold text-gray-300">{soloLowest} Coins each</span>
                    </div>
                  </>
                )}

                {currentTournament.format === "Duo" && (
                  <>
                    <div className="flex justify-between items-center bg-gradient-to-r from-yellow-500/20 to-transparent p-4 rounded-xl border border-yellow-500/30">
                      <span className="font-black text-yellow-500 text-lg">🥇 1st Place Team</span>
                      <span className="font-bold text-white text-lg">{Math.floor(totalPrizePool * 0.35)} Coins</span>
                    </div>
                    <div className="flex justify-between items-center bg-gradient-to-r from-gray-400/20 to-transparent p-4 rounded-xl border border-gray-400/30">
                      <span className="font-black text-gray-300 text-lg">🥈 2nd Place Team</span>
                      <span className="font-bold text-white text-lg">{Math.floor(totalPrizePool * 0.25)} Coins</span>
                    </div>
                    <div className="flex justify-between items-center bg-gradient-to-r from-amber-700/20 to-transparent p-4 rounded-xl border border-amber-700/30">
                      <span className="font-black text-amber-600 text-lg">🥉 3rd Place Team</span>
                      <span className="font-bold text-white text-lg">{Math.floor(totalPrizePool * 0.15)} Coins</span>
                    </div>
                    <div className="flex justify-between items-center bg-black/50 p-4 rounded-xl border border-white/5">
                      <span className="font-bold text-gray-400">🏅 4th & 5th Place Team</span>
                      <span className="font-bold text-gray-300">{Math.floor(totalPrizePool * 0.10)} Coins each</span>
                    </div>
                    <div className="flex justify-between items-center bg-black/50 p-4 rounded-xl border border-white/5">
                      <span className="font-bold text-gray-400">🏅 6th Place Team</span>
                      <span className="font-bold text-gray-300">{Math.floor(totalPrizePool * 0.05)} Coins</span>
                    </div>
                  </>
                )}

                {currentTournament.format === "Squad" && (
                  <>
                    <div className="flex justify-between items-center bg-gradient-to-r from-yellow-500/20 to-transparent p-4 rounded-xl border border-yellow-500/30">
                      <span className="font-black text-yellow-500 text-lg">🥇 1st Place Team</span>
                      <span className="font-bold text-white text-lg">{Math.floor(totalPrizePool * 0.50)} Coins</span>
                    </div>
                    <div className="flex justify-between items-center bg-gradient-to-r from-gray-400/20 to-transparent p-4 rounded-xl border border-gray-400/30">
                      <span className="font-black text-gray-300 text-lg">🥈 2nd Place Team</span>
                      <span className="font-bold text-white text-lg">{Math.floor(totalPrizePool * 0.30)} Coins</span>
                    </div>
                    <div className="flex justify-between items-center bg-gradient-to-r from-amber-700/20 to-transparent p-4 rounded-xl border border-amber-700/30">
                      <span className="font-black text-amber-600 text-lg">🥉 3rd Place Team</span>
                      <span className="font-bold text-white text-lg">{Math.floor(totalPrizePool * 0.20)} Coins</span>
                    </div>
                  </>
                )}
             </div>
          </div>
        )}
      </div>
      
    </div>
  );
}
