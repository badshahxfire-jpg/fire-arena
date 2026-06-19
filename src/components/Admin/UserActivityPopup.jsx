import React, { useState, useMemo, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../../firebase";

export default function UserActivityPopup({ allUsers = [], joinedPlayers = [], onClose, onAddCoins, onGiveLoyalBonus, isAdmin = false, currentUser }) {
  const [bonuses, setBonuses] = useState({});

  useEffect(() => {
    const bonusesRef = ref(database, "loyalBonuses");
    const unsubscribe = onValue(bonusesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setBonuses(data);
      } else {
        setBonuses({});
      }
    });
    return () => unsubscribe();
  }, []);
  const [activeTab, setActiveTab] = useState(isAdmin ? "daily" : "loyal"); // "daily" or "loyal"
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Helper to parse localized date strings
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    let time = Date.parse(dateStr);
    if (!isNaN(time)) return new Date(time);

    try {
      const cleaned = dateStr.replace(/,/g, '').trim();
      const parts = cleaned.split(/\s+/);
      if (parts.length >= 1) {
        const dateParts = parts[0].split('/');
        if (dateParts.length === 3) {
          const day = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10) - 1;
          const year = parseInt(dateParts[2], 10);
          
          let hours = 0, minutes = 0, seconds = 0;
          if (parts[1]) {
            const timeParts = parts[1].split(':');
            hours = parseInt(timeParts[0] || '0', 10);
            minutes = parseInt(timeParts[1] || '0', 10);
            seconds = parseInt(timeParts[2] || '0', 10);
          }
          const d = new Date(year, month, day, hours, minutes, seconds);
          if (!isNaN(d.getTime())) return d;
        }
      }
    } catch (e) {
      console.error("Failed to parse date:", dateStr, e);
    }
    return null;
  };

  const getLocalDateString = (dateObj) => {
    if (!dateObj) return "";
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDateLabel = (dateObj) => {
    if (!dateObj) return "";
    return dateObj.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      weekday: "short"
    });
  };

  // Generate last 10 days date objects
  const daysList = useMemo(() => {
    const list = [];
    for (let i = 0; i < 10; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      list.push(d);
    }
    return list;
  }, []);

  // Map user profiles by UID and Email for quick lookup
  const userMap = useMemo(() => {
    const map = {};
    allUsers.forEach((u) => {
      if (u.uid) map[u.uid] = u;
      if (u.email) map[u.email.toLowerCase()] = u;
    });
    return map;
  }, [allUsers]);

  // Group joins by day string (YYYY-MM-DD)
  const joinsByDay = useMemo(() => {
    const groups = {};
    joinedPlayers.forEach((jp) => {
      const dateObj = parseDate(jp.createdAt);
      if (dateObj) {
        const dateStr = getLocalDateString(dateObj);
        if (!groups[dateStr]) {
          groups[dateStr] = [];
        }
        // Enrich user join with user profile information
        const profile = userMap[jp.userId] || userMap[jp.userEmail?.toLowerCase()] || {};
        groups[dateStr].push({
          ...jp,
          profile
        });
      }
    });
    return groups;
  }, [joinedPlayers, userMap]);

  // Compute loyal streak details for the last 10 days (all users)
  const allLoyalUsers = useMemo(() => {
    const daysKeys = daysList.map((d) => getLocalDateString(d));
    
    return allUsers.map((user) => {
      const userJoins = joinedPlayers.filter(
        (jp) => jp.userId === user.uid || (jp.userEmail && jp.userEmail.toLowerCase() === user.email?.toLowerCase())
      );
      
      const activeDays = new Set();
      userJoins.forEach((join) => {
        const d = parseDate(join.createdAt);
        if (d) {
          activeDays.add(getLocalDateString(d));
        }
      });
      
      let streakCount = 0;
      daysKeys.forEach((dayKey) => {
        if (activeDays.has(dayKey)) {
          streakCount++;
        }
      });
      
      return {
        profile: user,
        streakCount,
        totalJoins: userJoins.length
      };
    })
    .filter((u) => u.streakCount > 0)
    .sort((a, b) => b.totalJoins - a.totalJoins || b.streakCount - a.streakCount);
  }, [allUsers, joinedPlayers, daysList]);

  // Top 10 loyal users
  const loyalUsers = useMemo(() => {
    return allLoyalUsers.slice(0, 10);
  }, [allLoyalUsers]);

  // Compute current logged-in user's rank info
  const currentUserRankInfo = useMemo(() => {
    if (!currentUser) return null;
    const index = allLoyalUsers.findIndex(
      (u) => u.profile.uid === currentUser.uid || u.profile.email?.toLowerCase() === currentUser.email?.toLowerCase()
    );
    if (index === -1) {
      // If the user has 0 streak, find their profile to display they are unranked
      const profile = allUsers.find(
        (u) => u.uid === currentUser.uid || u.email?.toLowerCase() === currentUser.email?.toLowerCase()
      ) || { name: currentUser.displayName || "You", uid: currentUser.uid };
      
      return {
        rank: "N/A",
        notRanked: true,
        user: {
          profile,
          streakCount: 0,
          totalJoins: 0
        }
      };
    }
    return {
      rank: index + 1,
      user: allLoyalUsers[index]
    };
  }, [allLoyalUsers, allUsers, currentUser]);

  // Current selected day's joins
  const currentDayJoins = useMemo(() => {
    const selectedDate = daysList[selectedDayIndex];
    if (!selectedDate) return [];
    const dateStr = getLocalDateString(selectedDate);
    return joinsByDay[dateStr] || [];
  }, [selectedDayIndex, daysList, joinsByDay]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0c0c0e] border border-glass-orange rounded-[30px] w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden relative shadow-2xl font-gaming">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/40">
          <div>
            <h3 className="text-2xl font-extrabold text-orange-500 text-glow-orange flex items-center gap-2">
              👥 USER ACTIVITY & PARTICIPATION
            </h3>
            <p className="text-gray-400 text-xs mt-1">
              Track daily tournament joins and active active-streak users for the last 10 days.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-300 font-bold"
          >
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        {isAdmin && (
          <div className="flex bg-[#121216] border-b border-white/5 px-6">
            <button
              onClick={() => setActiveTab("daily")}
              className={`py-4 px-6 font-bold text-sm transition-all duration-300 border-b-2 flex items-center gap-2 ${
                activeTab === "daily"
                  ? "border-orange-500 text-orange-500"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              📅 DAY-BY-DAY ACTIVITY
            </button>
            <button
              onClick={() => setActiveTab("loyal")}
              className={`py-4 px-6 font-bold text-sm transition-all duration-300 border-b-2 flex items-center gap-2 ${
                activeTab === "loyal"
                  ? "border-orange-500 text-orange-500"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              🔥 DAILY LOYAL USERS (TOP 10)
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-hidden p-6 flex flex-col bg-[#08080a]">
          {activeTab === "daily" && isAdmin ? (
            <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
              
              {/* Day selection sidebar */}
              <div className="w-full md:w-[220px] flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto pb-2 md:pb-0 md:pr-2 border-b md:border-b-0 md:border-r border-white/5 no-scrollbar scroll-smooth">
                {daysList.map((day, idx) => {
                  const dateStr = getLocalDateString(day);
                  const joinsCount = (joinsByDay[dateStr] || []).length;
                  const isSelected = selectedDayIndex === idx;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDayIndex(idx)}
                      className={`flex-shrink-0 flex md:flex-row flex-col justify-between items-center md:items-center px-4 py-3 rounded-xl border transition-all duration-300 text-left md:w-full gap-2 ${
                        isSelected
                          ? "bg-orange-500/10 border-orange-500 text-orange-500"
                          : "bg-white/5 border-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      <span className="text-xs md:text-sm font-black whitespace-nowrap">
                        {idx === 0 ? "Today" : idx === 1 ? "Yesterday" : formatDateLabel(day)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        joinsCount > 0 ? "bg-orange-500 text-black" : "bg-white/10 text-gray-400"
                      }`}>
                        {joinsCount} Joins
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Day Joins List */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-bold text-white">
                    Joins for {formatDateLabel(daysList[selectedDayIndex])} ({currentDayJoins.length})
                  </h4>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {currentDayJoins.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm py-12">
                      <span>📭 No tournament joins recorded on this day.</span>
                    </div>
                  ) : (
                    currentDayJoins.map((join, idx) => (
                      <div key={idx} className="bg-[#111115] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row justify-between gap-4 hover:border-orange-500/20 transition-all duration-300">
                        {/* User Details */}
                        <div className="space-y-1">
                          <p className="text-white font-extrabold text-sm flex items-center gap-2">
                            👤 {join.profile?.name || join.ingameName || "Unknown User"} 
                            <span className="text-xs text-gray-400 font-normal">({join.profile?.email || join.userEmail})</span>
                          </p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-400">
                            <p>📞 Phone: <span className="text-gray-300">{join.profile?.mobileNumber || join.mobileNumber || "N/A"}</span></p>
                            <p>💰 Balance: <span className="text-orange-400">🪙 {join.profile?.coins || 0}</span></p>
                            <p>🎮 ID: <span className="text-gray-300">{join.userId || "N/A"}</span></p>
                            <p>🏆 Win Coins: <span className="text-yellow-400">🪙 {join.profile?.winCoins || 0}</span></p>
                          </div>
                        </div>

                        {/* Ingame / Slot Details */}
                        <div className="flex flex-col sm:items-end justify-between text-xs sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                          <p className="text-orange-400 font-bold">{join.tournamentTitle} ({join.tournamentType})</p>
                          <p className="text-gray-300">Name: {join.ingameName} | UID: {join.gameUid} | Lvl: {join.gameLevel}</p>
                          <p className="text-gray-500 text-[10px]">Slot: {join.selectedSlot} | {join.createdAt}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Loyal Daily Active Users list
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="mb-4">
                <h4 className="text-lg font-bold text-white">
                  Streak Analytics (Top 10 - Last 10 Days)
                </h4>
                <p className="text-gray-400 text-xs">
                  Users sorted by the number of active participation days in the last 10 days.
                </p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {loyalUsers.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm py-12">
                    <span>📭 No active users found.</span>
                  </div>
                ) : (
                  loyalUsers.map((user, idx) => (
                    <div key={idx} className="bg-[#111115] border border-white/5 rounded-2xl p-3 sm:p-4 flex flex-row items-center justify-between gap-3 hover:border-orange-500/20 transition-all duration-300">
                      
                      {/* Left: Rank & Profile details */}
                      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                        <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-black flex items-center justify-center text-xs sm:text-sm flex-shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="flex flex-row flex-wrap items-center gap-x-2 sm:gap-x-4 gap-y-0.5 min-w-0">
                          <p className="text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 truncate">
                            👤 {user.profile.name || "No Name"} 
                            {isAdmin && <span className="text-[10px] sm:text-xs text-gray-400 font-normal">({user.profile.email})</span>}
                          </p>
                          <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-400 min-w-0">
                            {isAdmin && <span className="whitespace-nowrap">📞 Phone: <span className="text-gray-300">{user.profile.mobileNumber || "N/A"}</span></span>}
                            <span className="truncate">🎮 ID: <span className="text-gray-300">{user.profile.uid || "N/A"}</span></span>
                          </div>
                        </div>
                      </div>

                      {/* Center: Activity stats */}
                      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                        <div className="text-center bg-[#17171d] px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-white/5 min-w-[70px] sm:min-w-[100px]">
                          <p className="text-gray-400 text-[8px] sm:text-[10px] uppercase font-bold">Days Active</p>
                          <p className="text-xs sm:text-lg font-black text-orange-500">{user.streakCount} / 10</p>
                        </div>
                        <div className="text-center bg-[#17171d] px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-white/5 min-w-[70px] sm:min-w-[100px]">
                          <p className="text-gray-400 text-[8px] sm:text-[10px] uppercase font-bold">Total Joins</p>
                          <p className="text-xs sm:text-lg font-black text-emerald-400">{user.totalJoins}</p>
                        </div>
                      </div>

                      {/* Right: Wallet Balance */}
                      {isAdmin && (
                        <div className="text-right flex flex-row sm:flex-col justify-between sm:justify-start w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5 text-xs">
                          <span className="text-gray-400">Wallet Balance:</span>
                          <div className="flex flex-col sm:items-end">
                            <span className="text-orange-400 font-black">🪙 {user.profile.coins || 0} Deposit</span>
                            <span className="text-yellow-400 font-black">🪙 {user.profile.winCoins || 0} Winnings</span>
                          </div>
                        </div>
                      )}

                      {/* Action: Give Bonus Coins */}
                      {isAdmin && (onAddCoins || onGiveLoyalBonus) && (() => {
                        const userBonus = bonuses[user.profile.uid];
                        let cooldownActive = false;
                        let cooldownDaysLeft = 0;

                        if (userBonus && userBonus.lastUpdatedTime) {
                          const diffTime = Date.now() - userBonus.lastUpdatedTime;
                          const diffDays = diffTime / (1000 * 60 * 60 * 24);
                          if (diffDays < 10) {
                            cooldownActive = true;
                            cooldownDaysLeft = Math.ceil(10 - diffDays);
                          }
                        } else if (userBonus && userBonus.lastUpdated) {
                          const lastDate = Date.parse(userBonus.lastUpdated);
                          if (!isNaN(lastDate)) {
                            const diffTime = Date.now() - lastDate;
                            const diffDays = diffTime / (1000 * 60 * 60 * 24);
                            if (diffDays < 10) {
                              cooldownActive = true;
                              cooldownDaysLeft = Math.ceil(10 - diffDays);
                            }
                          }
                        }

                        return (
                          <div className="flex items-center gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5 w-full sm:w-auto justify-end">
                            <input
                              id={`bonus-input-${user.profile.uid}`}
                              type="number"
                              placeholder="Amount"
                              disabled={cooldownActive}
                              className={`bg-black/50 text-white px-3 py-2 rounded-xl border focus:outline-none w-[80px] text-xs font-bold text-center ${
                                cooldownActive 
                                  ? "border-white/5 opacity-55 cursor-not-allowed" 
                                  : "border-white/10 focus:border-orange-500"
                              }`}
                              min="1"
                            />
                            <button
                              disabled={cooldownActive}
                              onClick={async () => {
                                const inputEl = document.getElementById(`bonus-input-${user.profile.uid}`);
                                const amount = inputEl?.value;
                                if (!amount || Number(amount) <= 0) {
                                  alert("Please enter a valid coin amount");
                                  return;
                                }
                                const confirmed = window.confirm(`Give ${amount} bonus coins to ${user.profile.name || user.profile.email}?`);
                                if (confirmed) {
                                  const success = onGiveLoyalBonus 
                                    ? await onGiveLoyalBonus(user.profile.uid, Number(amount), user.profile.name, user.profile.email)
                                    : await onAddCoins(user.profile.uid, Number(amount));
                                  if (success && inputEl) {
                                    inputEl.value = "";
                                  }
                                }
                              }}
                              className={`font-black px-4 py-2 rounded-xl text-xs transition-all duration-300 whitespace-nowrap shadow-md ${
                                cooldownActive 
                                  ? "bg-gray-700/50 text-gray-500 border border-white/5 cursor-not-allowed" 
                                  : "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-black shadow-orange-500/10 hover:scale-[1.02] active:scale-[0.98]"
                              }`}
                            >
                              {cooldownActive ? `🎁 GIVEN (${cooldownDaysLeft}d)` : "🎁 GIVE BONUS"}
                            </button>
                          </div>
                        );
                      })()}

                    </div>
                  ))
                )}
                
                {/* Current Logged-in User Rank Section */}
                {!isAdmin && currentUserRankInfo && (
                  <div className="mt-4 pt-4 border-t border-dashed border-white/10">
                    <p className="text-gray-400 text-xs mb-2 font-bold uppercase tracking-wider">Your Position</p>
                    <div className="bg-[#17171d] border border-orange-500/20 rounded-2xl p-3 sm:p-4 flex flex-row items-center justify-between gap-3 shadow-lg">
                      
                      {/* Left: Rank & Profile details */}
                      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                        <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-500 text-black font-black flex items-center justify-center text-xs sm:text-sm flex-shrink-0">
                          {currentUserRankInfo.rank}
                        </span>
                        <div className="flex flex-row flex-wrap items-center gap-x-2 sm:gap-x-4 gap-y-0.5 min-w-0">
                          <p className="text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 truncate">
                            👤 {currentUserRankInfo.user.profile.name || "No Name"} 
                            <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded font-bold">YOU</span>
                          </p>
                          <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-400 min-w-0">
                            <span className="truncate">🎮 ID: <span className="text-gray-300">{currentUserRankInfo.user.profile.uid || "N/A"}</span></span>
                          </div>
                        </div>
                      </div>

                      {/* Center: Activity stats */}
                      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                        <div className="text-center bg-black/40 px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-white/5 min-w-[70px] sm:min-w-[100px]">
                          <p className="text-gray-400 text-[8px] sm:text-[10px] uppercase font-bold">Days Active</p>
                          <p className="text-xs sm:text-lg font-black text-orange-500">{currentUserRankInfo.user.streakCount} / 10</p>
                        </div>
                        <div className="text-center bg-black/40 px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-white/5 min-w-[70px] sm:min-w-[100px]">
                          <p className="text-gray-400 text-[8px] sm:text-[10px] uppercase font-bold">Total Joins</p>
                          <p className="text-xs sm:text-lg font-black text-emerald-400">{currentUserRankInfo.user.totalJoins}</p>
                        </div>
                      </div>

                    </div>
                    {currentUserRankInfo.notRanked && (
                      <p className="text-[10px] text-gray-500 mt-1 text-center">
                        💡 Play at least 1 tournament in the last 10 days to enter the leaderboard list!
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
