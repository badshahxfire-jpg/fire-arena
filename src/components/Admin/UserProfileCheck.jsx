import { useState, useMemo, useEffect } from "react";
import UserHistoryPopup from "./UserHistoryPopup";
import CoinHistoryPopup from "../Popups/CoinHistoryPopup";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { secureFetch } from "../../utils/backendApi";

export default function UserProfileCheck({ allUsers = [], onSearchUser, searchedUser, onBlockUser, onAddCoins, onDeductCoins, isSuperAdmin }) {
  const [searchUid, setSearchUid] = useState("");
  const [manualCoins, setManualCoins] = useState("");
  const [localSearchedUser, setLocalSearchedUser] = useState(null);
  const [showHistoryPopup, setShowHistoryPopup] = useState(false);
  const [showCoinHistoryPopup, setShowCoinHistoryPopup] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);
  const [showWithdrawalDetails, setShowWithdrawalDetails] = useState(false);
  const [adminNewPassword, setAdminNewPassword] = useState("");

  const handleAdminResetPassword = async () => {
    if (!displayUser || !displayUser.uid) return;
    if (!adminNewPassword || adminNewPassword.trim().length < 6) {
      alert("Please enter a new password of at least 6 characters!");
      return;
    }

    setLoadingAction("resetPassword");
    try {
      const res = await secureFetch("/api/admin/reset-user-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUid: displayUser.uid,
          newPassword: adminNewPassword.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      alert(`✅ Password updated successfully for user ${displayUser.email || displayUser.name || displayUser.uid}!\n\nNew Password: ${adminNewPassword.trim()}`);
      setAdminNewPassword("");
    } catch (err) {
      console.error("Error resetting password:", err);
      alert("❌ Error updating password: " + err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleToggleUidLock = async () => {
    if (!displayUser) return;
    setLoadingAction("toggleUidLock");
    try {
      await updateDoc(doc(db, "users", displayUser.uid), {
        gameUidLocked: !displayUser.gameUidLocked
      });
      alert(`Game UID successfully ${!displayUser.gameUidLocked ? "locked" : "unlocked"}!`);
    } catch (err) {
      alert("Failed to toggle UID lock: " + err.message);
    }
    setLoadingAction(null);
  };

  const handleTogglePhoneLock = async () => {
    if (!displayUser) return;
    setLoadingAction("togglePhoneLock");
    try {
      await updateDoc(doc(db, "users", displayUser.uid), {
        mobileNumberLocked: !displayUser.mobileNumberLocked
      });
      alert(`Mobile Number successfully ${!displayUser.mobileNumberLocked ? "locked" : "unlocked"}!`);
    } catch (err) {
      alert("Failed to toggle Mobile Number lock: " + err.message);
    }
    setLoadingAction(null);
  };

  const handleToggleIngameLock = async () => {
    if (!displayUser) return;
    setLoadingAction("toggleIngameLock");
    try {
      await updateDoc(doc(db, "users", displayUser.uid), {
        ingameNameLocked: !displayUser.ingameNameLocked
      });
      alert(`In-game Name successfully ${!displayUser.ingameNameLocked ? "locked" : "unlocked"}!`);
    } catch (err) {
      alert("Failed to toggle In-game Name lock: " + err.message);
    }
    setLoadingAction(null);
  };

  const handleToggleNameChangeLock = async () => {
    if (!displayUser) return;
    setLoadingAction("toggleNameChangeLock");
    try {
      await updateDoc(doc(db, "users", displayUser.uid), {
        nameChanged: !displayUser.nameChanged
      });
      alert(`Player Name successfully ${!displayUser.nameChanged ? "locked" : "unlocked"}!`);
    } catch (err) {
      alert("Failed to toggle Player Name lock: " + err.message);
    }
    setLoadingAction(null);
  };

  const handleToggleWithdrawalLock = async () => {
    if (!displayUser) return;
    setLoadingAction("toggleWithdrawalLock");
    try {
      const isLocked = displayUser.withdrawalDetails?.locked;
      await updateDoc(doc(db, "users", displayUser.uid), {
        "withdrawalDetails.locked": !isLocked
      });
      alert(`Withdrawal Details successfully ${!isLocked ? "locked" : "unlocked"}!`);
    } catch (err) {
      alert("Failed to toggle Withdrawal Details lock: " + err.message);
    }
    setLoadingAction(null);
  };

  // Users table state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "active", "blocked"
  const [ageFilter, setAgeFilter] = useState("all"); // "all", "new", "old"
  const [sortBy, setSortBy] = useState("coins_desc"); // "coins_desc", "coins_asc", "name_asc", "name_desc", "registered_desc", "registered_asc"
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Helper to parse createdAt date strings or Firestore Timestamp objects
  const parseCreatedAt = (createdAt) => {
    if (!createdAt) return 0;
    if (typeof createdAt === "object" && createdAt !== null) {
      if (typeof createdAt.toDate === "function") {
        return createdAt.toDate().getTime();
      }
      if (createdAt.seconds !== undefined) {
        return createdAt.seconds * 1000;
      }
      return 0;
    }

    const dateStr = String(createdAt);
    let time = Date.parse(dateStr);
    if (!isNaN(time)) return time;
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
          if (!isNaN(d.getTime())) return d.getTime();
        }
      }
    } catch (e) {}
    return 0;
  };

  // Helper to format createdAt dates safely for React rendering
  const formatCreatedAt = (createdAt) => {
    if (!createdAt) return "";
    if (typeof createdAt === "object" && createdAt !== null) {
      if (typeof createdAt.toDate === "function") {
        return createdAt.toDate().toLocaleString();
      }
      if (createdAt.seconds !== undefined) {
        return new Date(createdAt.seconds * 1000).toLocaleString();
      }
      return "[Timestamp]";
    }
    return String(createdAt);
  };

  const isNewUser = (user) => {
    if (!user.createdAt) return false;
    const time = parseCreatedAt(user.createdAt);
    if (time > 0) {
      const diffMs = Date.now() - time;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays <= 7; // Consider new if registered in last 7 days
    }
    return false;
  };

  const isTodayUser = (user) => {
    if (!user.createdAt) return false;
    const time = parseCreatedAt(user.createdAt);
    if (time > 0) {
      const userDate = new Date(time);
      const today = new Date();
      return (
        userDate.getDate() === today.getDate() &&
        userDate.getMonth() === today.getMonth() &&
        userDate.getFullYear() === today.getFullYear()
      );
    }
    return false;
  };

  const handleSearch = async () => {
    if (!searchUid) {
      alert("Enter User UID");
      return;
    }
    const result = await onSearchUser(searchUid);
    setLocalSearchedUser(result);
  };

  const displayUser = useMemo(() => {
    const currentUid = searchUid || (searchedUser?.uid) || (localSearchedUser?.uid);
    if (!currentUid) return null;
    return allUsers.find(u => u.uid === currentUid) || searchedUser || localSearchedUser;
  }, [searchUid, searchedUser, localSearchedUser, allUsers]);

  // Filter and Sort Users
  const filteredAndSortedUsers = useMemo(() => {
    let result = [...allUsers];

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (u) =>
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.uid && u.uid.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter === "active") {
      result = result.filter((u) => !u.blocked);
    } else if (statusFilter === "blocked") {
      result = result.filter((u) => u.blocked);
    }

    // Age filter
    if (ageFilter === "today") {
      result = result.filter((u) => isTodayUser(u));
    } else if (ageFilter === "new") {
      result = result.filter((u) => isNewUser(u));
    } else if (ageFilter === "old") {
      result = result.filter((u) => !isNewUser(u));
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "coins_desc") {
        return (b.coins || 0) - (a.coins || 0);
      } else if (sortBy === "coins_asc") {
        return (a.coins || 0) - (b.coins || 0);
      } else if (sortBy === "name_asc") {
        return (a.name || "").localeCompare(b.name || "");
      } else if (sortBy === "name_desc") {
        return (b.name || "").localeCompare(a.name || "");
      } else if (sortBy === "registered_desc") {
        return parseCreatedAt(b.createdAt) - parseCreatedAt(a.createdAt);
      } else if (sortBy === "registered_asc") {
        return parseCreatedAt(a.createdAt) - parseCreatedAt(b.createdAt);
      }
      return 0;
    });

    return result;
  }, [allUsers, searchTerm, statusFilter, ageFilter, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedUsers, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, ageFilter, sortBy]);

  const handleSelectUser = (user) => {
    setSearchUid(user.uid);
    setLocalSearchedUser(user);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: User Profile Check & Control */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-[#111] rounded-[30px] p-6 sm:p-8 border border-purple-500/10 cyber-card h-full flex flex-col justify-between">
            <div>
              <h2 className="text-3xl font-black text-purple-400 mb-6 cyber-neon">👤 USER CONTROL PANEL</h2>

              {/* Search Box */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <input
                  type="text"
                  placeholder="Enter User UID"
                  value={searchUid}
                  onChange={(e) => setSearchUid(e.target.value)}
                  className="flex-1 bg-black rounded-xl px-4 py-3 outline-none border border-purple-500/20 focus:border-purple-500 text-white text-sm"
                />
                <button
                  onClick={async () => {
                    setLoadingAction("search");
                    await handleSearch();
                    setLoadingAction(null);
                  }}
                  disabled={loadingAction === "search"}
                  className="bg-purple-500 text-black px-6 py-3 rounded-xl font-black text-sm cyber-btn hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-wait whitespace-nowrap text-center"
                >
                  {loadingAction === "search" ? "⏳ SEARCHING..." : "🔍 SEARCH"}
                </button>
              </div>

              {/* User Details - Shows User Name */}
              {displayUser ? (
                <div className="bg-black rounded-2xl p-5 border border-purple-500/20">
                  
                  {/* User Name */}
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-purple-500/20">
                    <span className="text-3xl">👤</span>
                    <div>
                      <p className="text-gray-400 text-xs">PLAYER NAME</p>
                      <p className="text-xl font-black text-orange-500">{displayUser.name || "Not Set"}</p>
                    </div>
                  </div>
                  
                  {/* Email & UID */}
                  <div className="space-y-1 text-xs">
                    <p className="text-orange-400 font-medium break-all">📧 Email: {displayUser.email}</p>
                    <p className="text-blue-400 break-all font-mono">🆔 UID: {displayUser.uid}</p>
                  </div>
                  
                  {/* Coins & Status */}
                  <div className="flex flex-col mt-4 bg-[#111] p-3 rounded-xl border border-purple-500/10">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-800">
                      <div>
                        <p className="text-gray-400 text-[10px]">TOTAL BALANCE</p>
                        <p className="text-green-400 text-xl font-black cyber-prize">🪙 {displayUser.coins || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] text-right">STATUS</p>
                        <p className={`font-black text-sm text-right ${displayUser.blocked ? "text-red-400" : "text-green-400"}`}>
                          {displayUser.blocked ? "🚫 BLOCKED" : "✅ ACTIVE"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-black p-2 rounded-lg text-center border border-gray-800">
                        <p className="text-gray-500 text-[9px] uppercase font-bold">Winnings</p>
                        <p className="text-emerald-400 text-sm font-black mt-1">🪙 {displayUser.winCoins || 0}</p>
                      </div>
                      <div className="bg-black p-2 rounded-lg text-center border border-gray-800">
                        <p className="text-gray-500 text-[9px] uppercase font-bold">Deposit & Bonus</p>
                        <p className="text-blue-400 text-sm font-black mt-1">🪙 {Math.max(0, (displayUser.coins || 0) - (displayUser.winCoins || 0))}</p>
                      </div>
                    </div>
                  </div>

                  {/* Game UID & Lock Status */}
                  <div className="flex items-center justify-between mt-3 p-3 bg-black rounded-xl border border-purple-500/10 text-xs">
                    <div>
                      <p className="text-gray-400 text-[10px]">GAME UID</p>
                      <p className="text-purple-400 font-bold font-mono">{displayUser.gameUid || "Not Set"}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-[10px] text-right">UID LOCK</p>
                      <p className={`font-black ${displayUser.gameUidLocked ? "text-red-400" : "text-green-400"}`}>
                        {displayUser.gameUidLocked ? "🔒 LOCKED" : "🔓 UNLOCKED"}
                      </p>
                    </div>
                  </div>

                  {/* Mobile Number & Lock Status */}
                  <div className="flex items-center justify-between mt-2 p-3 bg-black rounded-xl border border-purple-500/10 text-xs">
                    <div>
                      <p className="text-gray-400 text-[10px]">MOBILE NUMBER</p>
                      <p className="text-orange-400 font-bold">{displayUser.mobileNumber || "Not Set"}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-[10px] text-right">PHONE LOCK</p>
                      <p className={`font-black ${displayUser.mobileNumberLocked ? "text-red-400" : "text-green-400"}`}>
                        {displayUser.mobileNumberLocked ? "🔒 LOCKED" : "🔓 UNLOCKED"}
                      </p>
                    </div>
                  </div>

                  {/* In-game Name & Lock Status */}
                  <div className="flex items-center justify-between mt-2 p-3 bg-black rounded-xl border border-purple-500/10 text-xs">
                    <div>
                      <p className="text-gray-400 text-[10px]">IN-GAME NAME</p>
                      <p className="text-orange-400 font-bold">{displayUser.ingameName || "Not Set"}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-[10px] text-right">INGAME LOCK</p>
                      <p className={`font-black ${displayUser.ingameNameLocked ? "text-red-400" : "text-green-400"}`}>
                        {displayUser.ingameNameLocked ? "🔒 LOCKED" : "🔓 UNLOCKED"}
                      </p>
                    </div>
                  </div>

                  {/* Player Name Change Lock Status */}
                  <div className="flex items-center justify-between mt-2 p-3 bg-black rounded-xl border border-purple-500/10 text-xs">
                    <div>
                      <p className="text-gray-400 text-[10px]">PLAYER NAME CHANGE</p>
                      <p className="text-orange-400 font-bold">{displayUser.name || "Not Set"}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-[10px] text-right">NAME CHANGE LOCK</p>
                      <p className={`font-black ${displayUser.nameChanged ? "text-red-400" : "text-green-400"}`}>
                        {displayUser.nameChanged ? "🔒 LOCKED (Changed)" : "🔓 UNLOCKED"}
                      </p>
                    </div>
                  </div>

                  {/* Block Reason Display */}
                  {displayUser.blocked && displayUser.blockReason && (
                    <div className="mt-2 p-3 bg-red-500/10 rounded-xl border border-red-500/30 text-xs">
                      <p className="text-red-400 font-bold mb-1">🚫 BLOCK REASON</p>
                      <p className="text-red-300">{displayUser.blockReason}</p>
                    </div>
                  )}

                  {/* Button Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-5">
                    <button
                      onClick={async () => {
                        let reason = "";
                        if (!displayUser.blocked) {
                          reason = window.prompt("Enter the reason for blocking this user:");
                          if (reason === null) return; // Admin cancelled the prompt
                        }
                        setLoadingAction("block");
                        await onBlockUser(displayUser.uid, displayUser.blocked, reason);
                        setLoadingAction(null);
                      }}
                      disabled={loadingAction === "block"}
                      className={`w-full py-2.5 rounded-xl font-black text-xs transition-all disabled:opacity-50 disabled:cursor-wait ${
                        displayUser.blocked 
                          ? "bg-green-500 hover:bg-green-600 text-black" 
                          : "bg-red-500 hover:bg-red-600 text-white"
                      }`}
                    >
                      {loadingAction === "block" ? "⏳ ..." : displayUser.blocked ? "🔓 UNBLOCK" : "🔒 BLOCK"}
                    </button>

                    <button
                      onClick={() => setShowHistoryPopup(true)}
                      className="bg-blue-500 text-white py-2.5 rounded-xl font-black text-xs hover:bg-blue-600 transition-all"
                    >
                      📜 MATCHES
                    </button>

                    <button
                      onClick={() => setShowCoinHistoryPopup(true)}
                      className="bg-yellow-500 text-black py-2.5 rounded-xl font-black text-xs hover:bg-yellow-600 transition-all"
                    >
                      🪙 COINS
                    </button>

                    <button
                      onClick={async () => {
                        const body = window.prompt("Enter the message you want to send to this user:");
                        if (!body) return;
                        const title = "Admin Message";
                        
                        try {
                          const res = await secureFetch("/api/send-personal-notification", {
                            targetUserId: displayUser.uid,
                            title,
                            body
                          });
                          if (res.success) {
                            alert("Message sent successfully! 🚀");
                          } else {
                            alert("Failed to send message.");
                          }
                        } catch (err) {
                          alert("Error sending message: " + err.message);
                        }
                      }}
                      className="bg-purple-500 text-white py-2.5 rounded-xl font-black text-xs hover:bg-purple-600 transition-all"
                    >
                      💬 MESSAGE
                    </button>
                  </div>

                  {/* Unlock UID Button */}
                  <button
                    onClick={handleToggleUidLock}
                    disabled={loadingAction === "toggleUidLock" || !displayUser.gameUid}
                    className={`w-full py-2.5 rounded-xl font-black text-xs transition-all mt-2 disabled:opacity-50 ${
                      displayUser.gameUidLocked 
                        ? "bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30" 
                        : "bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                    }`}
                  >
                    {loadingAction === "toggleUidLock" 
                      ? "⏳ WORKING..." 
                      : !displayUser.gameUid
                        ? "❌ NO GAME UID REGISTERED"
                        : displayUser.gameUidLocked 
                          ? "🔓 UNLOCK GAME UID" 
                          : "🔒 LOCK GAME UID"}
                  </button>

                  {/* Unlock Mobile Number Button */}
                  <button
                    onClick={handleTogglePhoneLock}
                    disabled={loadingAction === "togglePhoneLock" || !displayUser.mobileNumber}
                    className={`w-full py-2.5 rounded-xl font-black text-xs transition-all mt-2 disabled:opacity-50 ${
                      displayUser.mobileNumberLocked 
                        ? "bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30" 
                        : "bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                    }`}
                  >
                    {loadingAction === "togglePhoneLock" 
                      ? "⏳ WORKING..." 
                      : !displayUser.mobileNumber
                        ? "❌ NO MOBILE NO REGISTERED"
                        : displayUser.mobileNumberLocked 
                          ? "🔓 UNLOCK MOBILE NO" 
                          : "🔒 LOCK MOBILE NO"}
                  </button>

                  {/* Unlock In-game Name Button */}
                  <button
                    onClick={handleToggleIngameLock}
                    disabled={loadingAction === "toggleIngameLock" || !displayUser.ingameName}
                    className={`w-full py-2.5 rounded-xl font-black text-xs transition-all mt-2 disabled:opacity-50 ${
                      displayUser.ingameNameLocked 
                        ? "bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30" 
                        : "bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                    }`}
                  >
                    {loadingAction === "toggleIngameLock" 
                      ? "⏳ WORKING..." 
                      : !displayUser.ingameName
                        ? "❌ NO IN-GAME NAME REGISTERED"
                        : displayUser.ingameNameLocked 
                          ? "🔓 UNLOCK IN-GAME NAME" 
                          : "🔒 LOCK IN-GAME NAME"}
                  </button>

                  {/* Unlock Player Name Button */}
                  <button
                    onClick={handleToggleNameChangeLock}
                    disabled={loadingAction === "toggleNameChangeLock"}
                    className={`w-full py-2.5 rounded-xl font-black text-xs transition-all mt-2 disabled:opacity-50 ${
                      displayUser.nameChanged 
                        ? "bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30" 
                        : "bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                    }`}
                  >
                    {loadingAction === "toggleNameChangeLock" 
                      ? "⏳ WORKING..." 
                      : displayUser.nameChanged 
                        ? "🔓 UNLOCK PLAYER NAME" 
                        : "🔒 LOCK PLAYER NAME"}
                  </button>

                  {/* Unlock Withdrawal Details Button */}
                  <button onClick={() => setShowWithdrawalDetails(!showWithdrawalDetails)} className="w-full bg-[#111] border border-blue-500/20 text-white py-3 rounded-xl font-black text-sm hover:bg-blue-500/10 transition-all flex items-center justify-between px-4">
                    <span>🏦 WITHDRAWAL DETAILS</span>
                    <span className="text-blue-400">{showWithdrawalDetails ? "▲" : "▼"}</span>
                  </button>
                  
                  <button
                    onClick={handleToggleWithdrawalLock}
                    disabled={loadingAction === "toggleWithdrawalLock"}
                    className={`w-full ${displayUser.withdrawalDetails?.locked ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"} text-white py-3 rounded-xl font-black text-sm mt-3 transition-all disabled:opacity-50 disabled:cursor-wait flex justify-center items-center gap-2`}
                  >
                    {loadingAction === "toggleWithdrawalLock" ? "⌛ ..." : 
                      displayUser.withdrawalDetails?.locked 
                        ? "🔓 UNLOCK WITHDRAWAL DETAILS" 
                        : "🔒 LOCK WITHDRAWAL DETAILS"}
                  </button>                  {showWithdrawalDetails && (
                    <div className="bg-[#111] border border-blue-500/20 rounded-xl p-4 mt-2 space-y-3">
                      <div>
                        <p className="text-gray-500 text-[10px] font-bold uppercase mb-1">Account Holder Name</p>
                        <p className="text-white text-sm font-medium bg-black px-3 py-2 rounded-lg border border-gray-800">
                          {displayUser.withdrawalDetails?.accountName || "Not Provided"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-[10px] font-bold uppercase mb-1">Mobile Number</p>
                        <p className="text-white text-sm font-medium bg-black px-3 py-2 rounded-lg border border-gray-800">
                          {displayUser.withdrawalDetails?.mobileNumber || "Not Provided"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-[10px] font-bold uppercase mb-1">UPI ID</p>
                        <p className="text-white text-sm font-medium bg-black px-3 py-2 rounded-lg border border-gray-800 break-all">
                          {displayUser.withdrawalDetails?.upiId || "Not Provided"}
                        </p>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-800 mt-2">
                        <span className="text-gray-400 text-xs">Status:</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${displayUser.withdrawalDetails?.locked ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                          {displayUser.withdrawalDetails?.locked ? "LOCKED" : "UNLOCKED"}
                        </span>
                      </div>
                    </div>
                  )}

                  {isSuperAdmin && (
                    <>
                      {/* Wallet Control */}
                      <div className="bg-[#1a1a2e] rounded-xl p-4 border border-orange-500/20 mt-4">
                        <h3 className="text-lg font-black text-orange-400 mb-3">💰 WALLET CONTROL</h3>
                        <input
                          type="number"
                          placeholder="Coins Amount"
                          value={manualCoins}
                          onChange={(e) => setManualCoins(e.target.value)}
                          className="w-full bg-black rounded-xl px-3 py-2 outline-none border border-orange-500/20 mb-3 text-white text-sm"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={async () => {
                              setLoadingAction("deduct");
                              await onDeductCoins(displayUser.uid, manualCoins);
                              setManualCoins("");
                              setLoadingAction(null);
                            }}
                            disabled={loadingAction === "deduct"}
                            className="bg-red-500 text-white py-2.5 rounded-xl font-black text-xs hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-wait"
                          >
                            {loadingAction === "deduct" ? "⌛ ..." : "➖ DEDUCT"}
                          </button>
                          
                          <button
                            onClick={async () => {
                              setLoadingAction("add");
                              await onAddCoins(displayUser.uid, manualCoins);
                              setManualCoins("");
                              setLoadingAction(null);
                            }}
                            disabled={loadingAction === "add"}
                            className="bg-green-500 text-white py-2.5 rounded-xl font-black text-xs hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-wait"
                          >
                            {loadingAction === "add" ? "⌛ ..." : "➕ ADD COINS"}
                          </button>
                        </div>
                      </div>

                      {/* Password Reset Control */}
                      <div className="bg-[#1a1a2e] rounded-xl p-4 border border-purple-500/20 mt-4">
                        <h3 className="text-lg font-black text-purple-400 mb-3">🔑 CHANGE USER PASSWORD</h3>
                        <input
                          type="text"
                          placeholder="Enter New Password (min 6 chars)"
                          value={adminNewPassword}
                          onChange={(e) => setAdminNewPassword(e.target.value)}
                          className="w-full bg-black rounded-xl px-3 py-2 outline-none border border-purple-500/20 mb-3 text-white text-sm font-sans"
                        />
                        <button
                          onClick={handleAdminResetPassword}
                          disabled={loadingAction === "resetPassword"}
                          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2.5 rounded-xl font-black text-xs hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-wait shadow-lg shadow-purple-900/30"
                        >
                          {loadingAction === "resetPassword" ? "⌛ UPDATING PASSWORD..." : "🔑 SET NEW PASSWORD NOW"}
                        </button>
                      </div>

                      {/* Admin Actions */}
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <button
                          onClick={async () => {
                            setLoadingAction("block");
                            await onBlockUser(displayUser.uid, !displayUser.blocked);
                            setLoadingAction(null);
                          }}
                          disabled={loadingAction === "block"}
                          className={`py-3 rounded-xl font-black text-xs transition-all disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2 ${displayUser.blocked ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
                        >
                          {loadingAction === "block" ? "⌛ ..." : displayUser.blocked ? "✅ UNBLOCK USER" : "🚫 BLOCK USER"}
                        </button>
                        
                        <button
                          onClick={handleToggleNameChangeLock}
                          disabled={loadingAction === "toggleNameChangeLock"}
                          className={`py-3 rounded-xl font-black text-xs transition-all disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2 ${displayUser.nameChanged ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-orange-500 hover:bg-orange-600 text-white"}`}
                        >
                          {loadingAction === "toggleNameChangeLock" ? "⌛ ..." : displayUser.nameChanged ? "🔓 UNLOCK NAME" : "🔒 LOCK NAME"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 bg-black/40 rounded-2xl border border-purple-500/10 text-center h-[300px]">
                  <span className="text-5xl mb-3 opacity-50">👥</span>
                  <p className="text-gray-400 text-sm">Select a user from the table or search by UID to view details & control wallet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: All Users Table */}
        <div className="lg:col-span-7">
          <div className="bg-[#111] rounded-[30px] p-6 md:p-8 border border-purple-500/10 cyber-card">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="text-2xl font-black text-pink-400 cyber-neon">👥 ALL REGISTERED USERS ({allUsers.length})</h3>
              
              {/* Sort Selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-black text-white text-xs px-3 py-2 rounded-xl border border-purple-500/20 focus:outline-none focus:border-purple-500"
              >
                <option value="coins_desc">🪙 Coins: High to Low</option>
                <option value="coins_asc">🪙 Coins: Low to High</option>
                <option value="name_asc">🔤 Name: A-Z</option>
                <option value="name_desc">🔤 Name: Z-A</option>
                <option value="registered_desc">📅 Created: Newest First</option>
                <option value="registered_asc">📅 Created: Oldest First</option>
              </select>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col gap-4 mb-6">
              <input
                type="text"
                placeholder="Search by name, email or UID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black rounded-xl px-4 py-2.5 outline-none border border-purple-500/20 focus:border-purple-500 text-white text-sm"
              />
              
              <div className="flex flex-wrap gap-4 items-center">
                {/* Status Tabs */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-bold">Status:</span>
                  <div className="flex bg-black rounded-xl p-1 border border-purple-500/20">
                    {["all", "active", "blocked"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setStatusFilter(tab)}
                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all capitalize ${
                          statusFilter === tab
                            ? "bg-purple-500 text-black"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age Tabs */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-bold">Created:</span>
                  <div className="flex bg-black rounded-xl p-1 border border-purple-500/20">
                    {[
                      { value: "all", label: "All" },
                      { value: "today", label: "Today" },
                      { value: "new", label: "New (≤7d)" },
                      { value: "old", label: "Old (>7d)" }
                    ].map((tab) => (
                      <button
                        key={tab.value}
                        onClick={() => setAgeFilter(tab.value)}
                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                          ageFilter === tab.value
                            ? "bg-pink-500 text-black"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop View (Table) */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-purple-500/10">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/80 text-gray-400 text-xs font-bold border-b border-purple-500/10">
                    <th className="p-4">User</th>
                    <th className="p-4">Coins</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/5">
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map((user) => {
                      const isSelected = displayUser?.uid === user.uid;
                      return (
                        <tr 
                          key={user.uid} 
                          onClick={() => handleSelectUser(user)}
                          className={`group text-sm hover:bg-purple-500/5 transition-all cursor-pointer ${
                            isSelected ? "bg-purple-500/10" : ""
                          }`}
                        >
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-white group-hover:text-purple-400 transition-colors">
                                {user.name || "No Name"}
                              </span>
                              <span className="text-[10px] text-gray-500 break-all">{user.email}</span>
                              {user.createdAt && (
                                <span className="text-[9px] text-purple-400/60 mt-0.5 font-mono">📅 {formatCreatedAt(user.createdAt)}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 font-bold text-yellow-400">🪙 {user.coins || 0}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              user.blocked 
                                ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                                : "bg-green-500/20 text-green-400 border border-green-500/30"
                            }`}>
                              {user.blocked ? "BLOCKED" : "ACTIVE"}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button className="text-xs bg-purple-500/15 hover:bg-purple-500 text-purple-400 hover:text-black font-bold px-3 py-1.5 rounded-lg transition-all border border-purple-500/20">
                              Manage
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center p-8 text-gray-500 text-sm">
                        No users found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View (Cards) */}
            <div className="block md:hidden space-y-3">
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => {
                  const isSelected = displayUser?.uid === user.uid;
                  return (
                    <div
                      key={user.uid}
                      onClick={() => handleSelectUser(user)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                        isSelected
                          ? "bg-purple-500/10 border-purple-500/50"
                          : "bg-black/40 border-purple-500/10 hover:border-purple-500/30"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-white text-sm truncate">
                            {user.name || "No Name"}
                          </span>
                          <span className="text-[11px] text-gray-500 truncate">{user.email}</span>
                          {user.createdAt && (
                            <span className="text-[9px] text-purple-400/60 mt-1 font-mono">📅 {formatCreatedAt(user.createdAt)}</span>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black shrink-0 ${
                          user.blocked 
                            ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                            : "bg-green-500/20 text-green-400 border border-green-500/30"
                        }`}>
                          {user.blocked ? "BLOCKED" : "ACTIVE"}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t border-purple-500/5">
                        <span className="font-bold text-yellow-400 text-xs">🪙 {user.coins || 0}</span>
                        <button className="text-[10px] bg-purple-500/15 hover:bg-purple-500 text-purple-400 hover:text-black font-bold px-3 py-1 rounded-lg transition-all border border-purple-500/20">
                          Manage
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center p-6 bg-black/40 rounded-2xl border border-purple-500/10 text-gray-500 text-xs">
                  No users found matching your filters.
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <span className="text-xs text-gray-400">
                  Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedUsers.length)} of {filteredAndSortedUsers.length}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-black rounded-lg border border-purple-500/20 text-xs hover:border-purple-500 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all"
                  >
                    ◀ Prev
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-black rounded-lg border border-purple-500/20 text-xs hover:border-purple-500 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all"
                  >
                    Next ▶
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

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