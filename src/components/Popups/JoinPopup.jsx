import { useState } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";

export default function JoinPopup({ tournament, user, joinedPlayers, onJoin, joinLoading, onClose }) {
  const [joinData, setJoinData] = useState({
    mobileNumber: "",
    gameUid: "",
    ingameName: "",
    gameLevel: "",
    teamName: "",
    selectedSlot: null,
    // Team members for DUO/SQUAD
    teammate1: {
      userId: "",
      gameUid: "",
      ingameName: "",
      gameLevel: "",
      mobileNumber: "",
      coins: 0,
      isValid: false,
      userData: null,
      isManuallyEdited: false
    },
    teammate2: {
      userId: "",
      gameUid: "",
      ingameName: "",
      gameLevel: "",
      mobileNumber: "",
      coins: 0,
      isValid: false,
      userData: null,
      isManuallyEdited: false
    },
    teammate3: {
      userId: "",
      gameUid: "",
      ingameName: "",
      gameLevel: "",
      mobileNumber: "",
      coins: 0,
      isValid: false,
      userData: null,
      isManuallyEdited: false
    },
  });

  const [verifying, setVerifying] = useState({});
  const tournamentType = tournament?.tournamentType || "SOLO";
  const isSoloOr1v1 = tournamentType === "SOLO" || tournamentType === "1V1";
  
  // Team size and total slots based on tournament type
  const getTeamSize = () => {
    if (isSoloOr1v1) return 1;
    if (tournamentType === "DUO" || tournamentType === "2V2") return 2;
    if (tournamentType === "3V3") return 3;
    if (tournamentType === "SQUAD") return 4;
    return 1;
  };

  const getTotalSlots = () => {
    const totalTeams = Number(tournament?.totalTeams) || 48;
    if (isSoloOr1v1) return totalTeams;
    if (tournamentType === "DUO" || tournamentType === "2V2") return Math.floor(totalTeams / 2);
    if (tournamentType === "3V3") return Math.floor(totalTeams / 3);
    if (tournamentType === "SQUAD") return Math.floor(totalTeams / 4);
    return totalTeams;
  };

  const teamSize = getTeamSize();
  const totalSlots = getTotalSlots();
  const entryFee = Number(tournament?.entryFee) || 0;
  
  // Check if slot is already booked
  const isSlotBooked = (slot) => {
    return joinedPlayers.some(
      (player) => player.tournamentId === tournament?.id && Number(player.selectedSlot) === slot
    );
  };

  // Check if user already joined
  const isAlreadyJoined = joinedPlayers.some(
    (player) => player.tournamentId === tournament?.id && player.userEmail === user?.email
  );

  // Get booked team info for a slot
  const getBookedTeam = (slot) => {
    return joinedPlayers.find(
      (player) => player.tournamentId === tournament?.id && Number(player.selectedSlot) === slot
    );
  };

  // Check if User ID is duplicate (website user id)
  const isUserIdDuplicate = (userId, currentField) => {
    if (!userId) return false;
    
    // Check against current user (leader)
    if (user?.uid === userId) {
      alert("❌ You cannot add yourself as a teammate!");
      return true;
    }
    
    // Check against other teammates
    const fields = ["teammate1", "teammate2", "teammate3"];
    for (const field of fields) {
      if (field !== currentField && joinData[field]?.userId === userId && joinData[field]?.isValid) {
        alert(`❌ User ID "${userId}" is already added as ${field === "teammate1" ? "Teammate 1" : field === "teammate2" ? "Teammate 2" : "Teammate 3"}! Each player must have a unique User ID.`);
        return true;
      }
    }
    
    return false;
  };

  // Verify user by Website User ID from Firebase
  const verifyUser = async (field, userId) => {
    if (!userId || userId.trim() === "") {
      setJoinData(prev => ({
        ...prev,
        [field]: {
          ...prev[field],
          isValid: false,
          userData: null,
          gameUid: "",
          ingameName: "",
          gameLevel: "",
          mobileNumber: "",
          coins: 0,
          isManuallyEdited: false
        }
      }));
      return;
    }

    // Check for duplicate User ID
    if (isUserIdDuplicate(userId, field)) {
      setJoinData(prev => ({
        ...prev,
        [field]: {
          ...prev[field],
          isValid: false,
          userData: null,
        }
      }));
      return;
    }

    setVerifying(prev => ({ ...prev, [field]: true }));
    
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const userCoins = userData.coins || 0;
        
        setJoinData(prev => ({
          ...prev,
          [field]: {
            ...prev[field],
            userId: userId,
            isValid: true,
            userData: userData,
            gameUid: userData.gameUid || userData.uid || "",
            ingameName: userData.ingameName || userData.displayName || userData.name || "",
            gameLevel: userData.gameLevel || userData.level || "",
            mobileNumber: userData.mobileNumber || userData.phone || "",
            coins: userCoins,
            isManuallyEdited: false
          }
        }));
        
        const hasEnoughCoins = userCoins >= entryFee;
        alert(`✅ User "${userData.ingameName || userData.displayName || userId}" verified successfully!\n\n💰 Wallet Balance: 🪙 ${userCoins}\n${!hasEnoughCoins ? `⚠️ Warning: Needs ${entryFee} coins to join!` : `✅ Has sufficient coins (${entryFee} required)`}`);
        
      } else {
        setJoinData(prev => ({
          ...prev,
          [field]: {
            ...prev[field],
            isValid: false,
            userData: null,
            isManuallyEdited: false
          }
        }));
        alert(`❌ User ID "${userId}" not found! Please enter a valid website User ID.`);
      }
    } catch (error) {
      console.error("Error verifying user:", error);
      setJoinData(prev => ({
        ...prev,
        [field]: {
          ...prev[field],
          isValid: false,
          userData: null,
        }
      }));
      alert("Error verifying user: " + error.message);
    } finally {
      setVerifying(prev => ({ ...prev, [field]: false }));
    }
  };

  // Handle teammate ID change
  const handleTeammateIdChange = (field, value) => {
    setJoinData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        userId: value,
        isValid: false,
        userData: null,
        coins: 0,
        isManuallyEdited: false
      }
    }));
  };

  // Handle teammate details change (manual edit)
  const handleTeammateDetailChange = (field, subField, value) => {
    setJoinData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [subField]: value,
        isManuallyEdited: true
      }
    }));
  };

  // Validate form based on tournament type
  const isValidForm = () => {
    if (!joinData.mobileNumber || !joinData.gameUid || !joinData.ingameName || !joinData.gameLevel) {
      alert("Please fill all your details!");
      return false;
    }
    if (!joinData.selectedSlot) {
      alert("Please select a slot!");
      return false;
    }
    
    if ((tournamentType === "DUO" || tournamentType === "SQUAD") && !joinData.teamName) {
      alert("Please enter a team name!");
      return false;
    }
    
    if (tournamentType === "DUO" || tournamentType === "2V2") {
      if (!joinData.teammate1.userId || !joinData.teammate1.isValid) {
        alert("Please enter and verify a valid User ID for Teammate 1!");
        return false;
      }
      if (!joinData.teammate1.gameUid || !joinData.teammate1.ingameName || !joinData.teammate1.gameLevel) {
        alert("Please fill all details for Teammate 1!");
        return false;
      }
      if (joinData.teammate1.coins < entryFee) {
        alert(`❌ Teammate "${joinData.teammate1.ingameName}" has insufficient coins!\n   Needs: 🪙 ${entryFee}\n   Has: 🪙 ${joinData.teammate1.coins}`);
        return false;
      }
    }
    
    if (tournamentType === "3V3") {
      if (!joinData.teammate1.userId || !joinData.teammate1.isValid) {
        alert("Please enter and verify a valid User ID for Teammate 1!");
        return false;
      }
      if (!joinData.teammate1.gameUid || !joinData.teammate1.ingameName || !joinData.teammate1.gameLevel) {
        alert("Please fill all details for Teammate 1!");
        return false;
      }
      if (joinData.teammate1.coins < entryFee) {
        alert(`❌ Teammate "${joinData.teammate1.ingameName}" has insufficient coins!\n   Needs: 🪙 ${entryFee}\n   Has: 🪙 ${joinData.teammate1.coins}`);
        return false;
      }
      
      if (!joinData.teammate2.userId || !joinData.teammate2.isValid) {
        alert("Please enter and verify a valid User ID for Teammate 2!");
        return false;
      }
      if (!joinData.teammate2.gameUid || !joinData.teammate2.ingameName || !joinData.teammate2.gameLevel) {
        alert("Please fill all details for Teammate 2!");
        return false;
      }
      if (joinData.teammate2.coins < entryFee) {
        alert(`❌ Teammate "${joinData.teammate2.ingameName}" has insufficient coins!\n   Needs: 🪙 ${entryFee}\n   Has: 🪙 ${joinData.teammate2.coins}`);
        return false;
      }
    }
    
    if (tournamentType === "SQUAD") {
      if (!joinData.teammate1.userId || !joinData.teammate1.isValid) {
        alert("Please enter and verify a valid User ID for Teammate 1!");
        return false;
      }
      if (!joinData.teammate1.gameUid || !joinData.teammate1.ingameName || !joinData.teammate1.gameLevel) {
        alert("Please fill all details for Teammate 1!");
        return false;
      }
      if (joinData.teammate1.coins < entryFee) {
        alert(`❌ Teammate "${joinData.teammate1.ingameName}" has insufficient coins!\n   Needs: 🪙 ${entryFee}\n   Has: 🪙 ${joinData.teammate1.coins}`);
        return false;
      }
      
      if (!joinData.teammate2.userId || !joinData.teammate2.isValid) {
        alert("Please enter and verify a valid User ID for Teammate 2!");
        return false;
      }
      if (!joinData.teammate2.gameUid || !joinData.teammate2.ingameName || !joinData.teammate2.gameLevel) {
        alert("Please fill all details for Teammate 2!");
        return false;
      }
      if (joinData.teammate2.coins < entryFee) {
        alert(`❌ Teammate "${joinData.teammate2.ingameName}" has insufficient coins!\n   Needs: 🪙 ${entryFee}\n   Has: 🪙 ${joinData.teammate2.coins}`);
        return false;
      }
      
      if (!joinData.teammate3.userId || !joinData.teammate3.isValid) {
        alert("Please enter and verify a valid User ID for Teammate 3!");
        return false;
      }
      if (!joinData.teammate3.gameUid || !joinData.teammate3.ingameName || !joinData.teammate3.gameLevel) {
        alert("Please fill all details for Teammate 3!");
        return false;
      }
      if (joinData.teammate3.coins < entryFee) {
        alert(`❌ Teammate "${joinData.teammate3.ingameName}" has insufficient coins!\n   Needs: 🪙 ${entryFee}\n   Has: 🪙 ${joinData.teammate3.coins}`);
        return false;
      }
    }
    
    return true;
  };

  const handleJoin = () => {
    if (!isValidForm()) return;
    
    // Prepare team members data
    let teamMembers = [];
    
    if (isSoloOr1v1) {
      teamMembers = [{
        userId: user?.uid,
        userEmail: user?.email,
        mobileNumber: joinData.mobileNumber,
        gameUid: joinData.gameUid,
        ingameName: joinData.ingameName,
        gameLevel: joinData.gameLevel,
        isLeader: true,
      }];
    } 
    else if (tournamentType === "DUO" || tournamentType === "2V2") {
      teamMembers = [
        {
          userId: user?.uid,
          userEmail: user?.email,
          mobileNumber: joinData.mobileNumber,
          gameUid: joinData.gameUid,
          ingameName: joinData.ingameName,
          gameLevel: joinData.gameLevel,
          isLeader: true,
        },
        {
          userId: joinData.teammate1.userId,
          userEmail: joinData.teammate1.userData?.email,
          mobileNumber: joinData.teammate1.mobileNumber,
          gameUid: joinData.teammate1.gameUid,
          ingameName: joinData.teammate1.ingameName,
          gameLevel: joinData.teammate1.gameLevel,
          isLeader: false,
        }
      ];
    }
    else if (tournamentType === "3V3") {
      teamMembers = [
        {
          userId: user?.uid,
          userEmail: user?.email,
          mobileNumber: joinData.mobileNumber,
          gameUid: joinData.gameUid,
          ingameName: joinData.ingameName,
          gameLevel: joinData.gameLevel,
          isLeader: true,
        },
        {
          userId: joinData.teammate1.userId,
          userEmail: joinData.teammate1.userData?.email,
          mobileNumber: joinData.teammate1.mobileNumber,
          gameUid: joinData.teammate1.gameUid,
          ingameName: joinData.teammate1.ingameName,
          gameLevel: joinData.teammate1.gameLevel,
          isLeader: false,
        },
        {
          userId: joinData.teammate2.userId,
          userEmail: joinData.teammate2.userData?.email,
          mobileNumber: joinData.teammate2.mobileNumber,
          gameUid: joinData.teammate2.gameUid,
          ingameName: joinData.teammate2.ingameName,
          gameLevel: joinData.teammate2.gameLevel,
          isLeader: false,
        }
      ];
    }
    else if (tournamentType === "SQUAD") {
      teamMembers = [
        {
          userId: user?.uid,
          userEmail: user?.email,
          mobileNumber: joinData.mobileNumber,
          gameUid: joinData.gameUid,
          ingameName: joinData.ingameName,
          gameLevel: joinData.gameLevel,
          isLeader: true,
        },
        {
          userId: joinData.teammate1.userId,
          userEmail: joinData.teammate1.userData?.email,
          mobileNumber: joinData.teammate1.mobileNumber,
          gameUid: joinData.teammate1.gameUid,
          ingameName: joinData.teammate1.ingameName,
          gameLevel: joinData.teammate1.gameLevel,
          isLeader: false,
        },
        {
          userId: joinData.teammate2.userId,
          userEmail: joinData.teammate2.userData?.email,
          mobileNumber: joinData.teammate2.mobileNumber,
          gameUid: joinData.teammate2.gameUid,
          ingameName: joinData.teammate2.ingameName,
          gameLevel: joinData.teammate2.gameLevel,
          isLeader: false,
        },
        {
          userId: joinData.teammate3.userId,
          userEmail: joinData.teammate3.userData?.email,
          mobileNumber: joinData.teammate3.mobileNumber,
          gameUid: joinData.teammate3.gameUid,
          ingameName: joinData.teammate3.ingameName,
          gameLevel: joinData.teammate3.gameLevel,
          isLeader: false,
        }
      ];
    }
    
    // 🔍 DEBUG LOG
    console.log("🔍 JoinPopup - Sending teamMembers:", teamMembers);
    console.log("🔍 JoinPopup - teamMembers count:", teamMembers.length);
    teamMembers.forEach((m, i) => {
      console.log(`   Member ${i+1}:`, { userId: m.userId, ingameName: m.ingameName, isLeader: m.isLeader });
    });
    
    onJoin(tournament, { ...joinData, teamMembers });
  };

  // Render teammate details form
  const renderTeammateDetails = (field, label, colorClass) => {
    const teammate = joinData[field];
    const isVerified = teammate.isValid;
    const hasEnoughCoins = teammate.coins >= entryFee;
    
    return (
      <div className={`mb-6 p-4 ${colorClass} rounded-2xl border`}>
        <h4 className={`text-xl font-black ${colorClass.replace('/10', '').replace('bg-', 'text-')} mb-4`}>
          👤 {label}
        </h4>
        
        {/* Website User ID Field */}
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Website User ID* (e.g., abc123xyz)"
            value={teammate.userId}
            onChange={(e) => handleTeammateIdChange(field, e.target.value)}
            className="flex-1 bg-black border border-orange-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500"
          />
          <button
            onClick={() => verifyUser(field, teammate.userId)}
            disabled={verifying[field] || !teammate.userId}
            className={`px-5 py-3 rounded-xl font-bold transition-all ${
              verifying[field] 
                ? "bg-gray-600 cursor-not-allowed" 
                : isVerified 
                ? "bg-green-600 text-white"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            }`}
          >
            {verifying[field] ? "⏳" : isVerified ? "✅ VERIFIED" : "🔍 VERIFY"}
          </button>
        </div>
        
        {/* Status Message */}
        {teammate.userId && !isVerified && !verifying[field] && (
          <p className="text-red-400 text-xs mb-3">⚠️ Please click VERIFY button to validate this Website User ID</p>
        )}
        
        {/* Verified Badge with Wallet Info */}
        {isVerified && (
          <div className={`mb-3 p-2 rounded-lg border ${hasEnoughCoins ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'}`}>
            <p className="text-green-400 text-xs flex items-center gap-1">
              <span>✅</span> Website User ID verified!
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-gray-400 text-xs">💰 Wallet Balance:</span>
              <span className={`font-bold text-sm ${hasEnoughCoins ? 'text-green-400' : 'text-red-400'}`}>
                🪙 {teammate.coins}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-gray-400 text-xs">🎯 Entry Fee Required:</span>
              <span className="text-yellow-400 text-xs font-bold">🪙 {entryFee}</span>
            </div>
            {!hasEnoughCoins && (
              <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                <span>⚠️</span> Insufficient coins! Needs {entryFee} coins to join.
              </p>
            )}
            {hasEnoughCoins && (
              <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                <span>✅</span> Has sufficient coins. Can join!
              </p>
            )}
            <p className="text-gray-500 text-[10px] mt-2">
              You can edit the details below if needed.
            </p>
          </div>
        )}
        
        {/* Teammate Game Details (editable after verification) */}
        <div className="space-y-3 mt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Teammate's Free Fire UID*"
              value={teammate.gameUid}
              onChange={(e) => handleTeammateDetailChange(field, "gameUid", e.target.value)}
              className="bg-black border border-orange-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500"
              disabled={!isVerified}
            />
            <input
              type="text"
              placeholder="Teammate's Ingame Name*"
              value={teammate.ingameName}
              onChange={(e) => handleTeammateDetailChange(field, "ingameName", e.target.value)}
              className="bg-black border border-orange-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500"
              disabled={!isVerified}
            />
            <input
              type="number"
              placeholder="Teammate's Game Level*"
              value={teammate.gameLevel}
              onChange={(e) => handleTeammateDetailChange(field, "gameLevel", e.target.value)}
              className="bg-black border border-orange-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500"
              disabled={!isVerified}
            />
            <input
              type="text"
              placeholder="Teammate's Mobile Number"
              value={teammate.mobileNumber}
              onChange={(e) => handleTeammateDetailChange(field, "mobileNumber", e.target.value)}
              className="bg-black border border-orange-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500"
              disabled={!isVerified}
            />
          </div>
          {teammate.isManuallyEdited && isVerified && (
            <p className="text-yellow-400 text-xs">✏️ Manual edit mode - Your changes will be saved</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 px-4">
      <div className="bg-[#111] w-full max-w-3xl rounded-[40px] p-5 md:p-8 border border-orange-500/20 max-h-[90vh] overflow-y-auto cyber-card">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-4xl font-black text-orange-500 cyber-neon">JOIN MATCH</h2>
          <button onClick={onClose} className="bg-red-500 px-5 py-2 rounded-2xl font-black">CLOSE</button>
        </div>

        {/* Tournament Info */}
        <div className="mb-6 p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20">
          <h3 className="text-2xl font-black text-orange-400">{tournament?.tournamentTitle}</h3>
          <div className="flex gap-4 mt-2 flex-wrap">
            <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm">
              🎮 {tournamentType}
            </span>
            <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">
              👥 Team Size: {teamSize}
            </span>
            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
              📊 Total Slots: {totalSlots}
            </span>
            <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">
              💰 Entry Fee: 🪙 {entryFee}
            </span>
          </div>
        </div>

        {/* Team Type Indicator */}
        <div className="mb-6 p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/20">
          <p className="text-center text-yellow-400 font-bold">
            {isSoloOr1v1 && `🎮 ${tournamentType === "1V1" ? "1V1" : "SOLO"} MODE - Fill your details`}
            {(tournamentType === "DUO" || tournamentType === "2V2") && `👥 ${tournamentType} MODE - Fill team name, your details & teammate's details`}
            {tournamentType === "3V3" && "👥 3V3 MODE - Fill team name, your details & 2 teammates' details"}
            {tournamentType === "SQUAD" && "👨‍👩‍👧‍👦 SQUAD MODE - Fill team name, your details & teammates' details"}
          </p>
          {(tournamentType === "DUO" || tournamentType === "2V2" || tournamentType === "3V3" || tournamentType === "SQUAD") && (
            <p className="text-center text-blue-400 text-xs mt-2">
              ⚠️ Note: Each teammate must have a unique Website User ID (cannot be same as leader or other teammates)
            </p>
          )}
        </div>

        {/* TEAM NAME (for DUO, 3V3 & SQUAD) */}
        {(tournamentType === "DUO" || tournamentType === "2V2" || tournamentType === "3V3" || tournamentType === "SQUAD") && (
          <div className="mb-6 p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
            <h4 className="text-xl font-black text-yellow-400 mb-4">🏷️ TEAM NAME</h4>
            <input
              type="text"
              placeholder="Enter Your Team Name* (e.g., FireStorm, Alpha Squad)"
              value={joinData.teamName}
              onChange={(e) => setJoinData({ ...joinData, teamName: e.target.value })}
              className="w-full bg-black border border-yellow-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-500"
            />
          </div>
        )}

        {/* LEADER SECTION */}
        <div className="mb-6 p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
          <h4 className="text-xl font-black text-blue-400 mb-4">👑 TEAM LEADER (YOU)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Your Mobile No.*"
              value={joinData.mobileNumber}
              onChange={(e) => setJoinData({ ...joinData, mobileNumber: e.target.value })}
              className="bg-black border border-orange-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500"
            />
            <input
              type="text"
              placeholder="Free Fire UID*"
              value={joinData.gameUid}
              onChange={(e) => setJoinData({ ...joinData, gameUid: e.target.value })}
              className="bg-black border border-orange-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500"
            />
            <input
              type="text"
              placeholder="Ingame Name*"
              value={joinData.ingameName}
              onChange={(e) => setJoinData({ ...joinData, ingameName: e.target.value })}
              className="bg-black border border-orange-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500"
            />
            <input
              type="number"
              placeholder="Game Level*"
              value={joinData.gameLevel}
              onChange={(e) => setJoinData({ ...joinData, gameLevel: e.target.value })}
              className="bg-black border border-orange-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500"
            />
          </div>
          <p className="text-blue-400 text-xs mt-2">Your Website User ID: <span className="text-yellow-400 font-mono">{user?.uid}</span></p>
        </div>

        {/* TEAMMATES SECTION */}
        {(tournamentType === "DUO" || tournamentType === "2V2" || tournamentType === "3V3" || tournamentType === "SQUAD") && renderTeammateDetails("teammate1", "TEAMMATE 1", "bg-green-500/10 border-green-500/20")}
        
        {(tournamentType === "3V3" || tournamentType === "SQUAD") && renderTeammateDetails("teammate2", "TEAMMATE 2", "bg-purple-500/10 border-purple-500/20")}
        
        {tournamentType === "SQUAD" && renderTeammateDetails("teammate3", "TEAMMATE 3", "bg-pink-500/10 border-pink-500/20")}

        {/* SLOT SELECTION */}
        <div className="mt-6">
          <h4 className="text-2xl font-black text-orange-400 mb-5">
            SELECT {isSoloOr1v1 ? "SLOT" : (tournamentType === "DUO" || tournamentType === "2V2" || tournamentType === "3V3") ? "TEAM" : "SQUAD"}
            <span className="text-sm text-gray-400 ml-2">
              ({totalSlots} total {isSoloOr1v1 ? "slots" : (tournamentType === "DUO" || tournamentType === "2V2" || tournamentType === "3V3") ? "teams" : "squads"})
            </span>
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: totalSlots }).map((_, index) => {
              const slot = index + 1;
              const bookedTeam = getBookedTeam(slot);
              const isBooked = !!bookedTeam;

              return (
                <button
                  key={slot}
                  disabled={isBooked}
                  onClick={() => {
                    if (joinData.selectedSlot === slot) {
                      handleJoin();
                    } else {
                      setJoinData({ ...joinData, selectedSlot: slot });
                    }
                  }}
                  className={`min-h-[95px] rounded-2xl font-black text-sm border transition-all duration-300 p-2 flex items-center justify-center ${
                    isBooked
                      ? "bg-red-500/20 text-red-400 border-red-500/30 cursor-not-allowed"
                      : joinData.selectedSlot === slot
                      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-500 shadow-lg shadow-orange-500/30"
                      : "bg-[#111] text-white border-orange-500/20 hover:border-orange-500/50"
                  }`}
                >
                  {isBooked ? (
                    <div className="flex flex-col items-center text-center">
                      <span className="text-xs font-bold">❌ {isSoloOr1v1 ? "SLOT" : (tournamentType === "DUO" || tournamentType === "2V2" || tournamentType === "3V3") ? "TEAM" : "SQUAD"} {slot}</span>
                      <span className="text-[11px] font-bold mt-1 text-yellow-400 truncate max-w-full">
                        {bookedTeam.teamName || bookedTeam.ingameName}
                      </span>
                      <span className="text-[9px] text-gray-400 mt-0.5">
                        {bookedTeam.teamMembers?.length || 1}P Team
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center justify-between h-full w-full py-1">
                      <span className="text-xs font-bold text-gray-300">
                        {isSoloOr1v1 ? "SLOT" : (tournamentType === "DUO" || tournamentType === "2V2" || tournamentType === "3V3") ? "TEAM" : "SQUAD"} {slot}
                      </span>
                      {joinData.selectedSlot === slot ? (
                        <span className="mt-1.5 px-3 py-1 bg-white text-orange-600 rounded-lg text-[10px] font-black uppercase tracking-wider animate-pulse shadow-md border border-white">
                          JOIN NOW
                        </span>
                      ) : (
                        <span className="mt-1.5 px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-green-500/20 hover:text-green-300 transition-all">
                          JOIN NOW
                        </span>
                      )}
                      {!isSoloOr1v1 && (
                        <span className="text-[8px] text-gray-500 mt-1">
                          {teamSize}P Team Slot
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* TEAM SUMMARY */}
        {joinData.selectedSlot && (
          <div className="mt-6 p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20">
            <h4 className="text-orange-400 font-bold mb-2">📋 TEAM SUMMARY</h4>
            <div className="space-y-1 text-sm">
              <p className="text-white">{isSoloOr1v1 ? "Slot" : (tournamentType === "DUO" || tournamentType === "2V2" || tournamentType === "3V3") ? "Team" : "Squad"}: <span className="text-green-400">#{joinData.selectedSlot}</span></p>
              <p className="text-white">Team Size: <span className="text-yellow-400">{teamSize} Players</span></p>
              <p className="text-white">Entry Fee: <span className="text-orange-400">🪙 {entryFee} per player</span></p>
              {(tournamentType === "DUO" || tournamentType === "2V2" || tournamentType === "3V3" || tournamentType === "SQUAD") && (
                <p className="text-white">Team Name: <span className="text-yellow-400 font-bold">{joinData.teamName || "Not set"}</span></p>
              )}
              <p className="text-white">Leader: <span className="text-blue-400">{joinData.ingameName}</span></p>
              {(tournamentType === "DUO" || tournamentType === "2V2") && joinData.teammate1.isValid && (
                <p className="text-white">Teammate 1: <span className="text-green-400">{joinData.teammate1.ingameName}</span> (🪙 {joinData.teammate1.coins})</p>
              )}
              {tournamentType === "3V3" && (
                <>
                  {joinData.teammate1.isValid && <p className="text-white">Teammate 1: <span className="text-green-400">{joinData.teammate1.ingameName}</span> (🪙 {joinData.teammate1.coins})</p>}
                  {joinData.teammate2.isValid && <p className="text-white">Teammate 2: <span className="text-green-400">{joinData.teammate2.ingameName}</span> (🪙 {joinData.teammate2.coins})</p>}
                </>
              )}
              {tournamentType === "SQUAD" && (
                <>
                  {joinData.teammate1.isValid && <p className="text-white">Teammate 1: <span className="text-green-400">{joinData.teammate1.ingameName}</span> (🪙 {joinData.teammate1.coins})</p>}
                  {joinData.teammate2.isValid && <p className="text-white">Teammate 2: <span className="text-green-400">{joinData.teammate2.ingameName}</span> (🪙 {joinData.teammate2.coins})</p>}
                  {joinData.teammate3.isValid && <p className="text-white">Teammate 3: <span className="text-green-400">{joinData.teammate3.ingameName}</span> (🪙 {joinData.teammate3.coins})</p>}
                </>
              )}
            </div>
          </div>
        )}

        {/* JOIN BUTTON */}
        <button
          onClick={handleJoin}
          disabled={isAlreadyJoined || joinLoading}
          className={`w-full mt-8 py-4 rounded-2xl font-black text-lg cyber-btn transition-all duration-300 ${
            isAlreadyJoined
              ? "bg-green-500 text-black cursor-not-allowed"
              : joinLoading
              ? "bg-gray-600 text-white cursor-not-allowed opacity-50"
              : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/30"
          }`}
        >
          {isAlreadyJoined 
            ? "✅ ALREADY JOINED" 
            : joinLoading 
            ? "⏳ PROCESSING..." 
            : isSoloOr1v1 
              ? `🎮 JOIN ${tournamentType} (Slot ${joinData.selectedSlot || "?"})`
              : `🎮 JOIN ${tournamentType} - ${joinData.teamName || "TEAM"} (${(tournamentType === "DUO" || tournamentType === "2V2" || tournamentType === "3V3") ? "Team" : "Squad"} ${joinData.selectedSlot || "?"})`}
        </button>
        
        {/* Form Validation Hint */}
        {(() => {
          let hasError = false;
          let errorMsg = "";
          
          if (!joinData.mobileNumber || !joinData.gameUid || !joinData.ingameName || !joinData.gameLevel) {
            hasError = true;
            errorMsg = "Please fill all your details!";
          } else if (!joinData.selectedSlot) {
            hasError = true;
            errorMsg = "Please select a slot!";
          } else if ((tournamentType === "DUO" || tournamentType === "2V2" || tournamentType === "3V3" || tournamentType === "SQUAD") && !joinData.teamName) {
            hasError = true;
            errorMsg = "Please enter a team name!";
          } else if (tournamentType === "DUO" || tournamentType === "2V2") {
            if (!joinData.teammate1.userId || !joinData.teammate1.isValid) {
              hasError = true;
              errorMsg = "Please verify Teammate 1 Website User ID!";
            } else if (!joinData.teammate1.gameUid || !joinData.teammate1.ingameName || !joinData.teammate1.gameLevel) {
              hasError = true;
              errorMsg = "Please fill all details for Teammate 1!";
            } else if (joinData.teammate1.coins < entryFee) {
              hasError = true;
              errorMsg = `Teammate "${joinData.teammate1.ingameName}" has insufficient coins! Needs ${entryFee}, has ${joinData.teammate1.coins}`;
            }
          } else if (tournamentType === "SQUAD") {
            if (!joinData.teammate1.userId || !joinData.teammate1.isValid) {
              hasError = true;
              errorMsg = "Please verify Teammate 1 Website User ID!";
            } else if (!joinData.teammate1.gameUid || !joinData.teammate1.ingameName || !joinData.teammate1.gameLevel) {
              hasError = true;
              errorMsg = "Please fill all details for Teammate 1!";
            } else if (joinData.teammate1.coins < entryFee) {
              hasError = true;
              errorMsg = `Teammate "${joinData.teammate1.ingameName}" has insufficient coins! Needs ${entryFee}, has ${joinData.teammate1.coins}`;
            } else if (!joinData.teammate2.userId || !joinData.teammate2.isValid) {
              hasError = true;
              errorMsg = "Please verify Teammate 2 Website User ID!";
            } else if (!joinData.teammate2.gameUid || !joinData.teammate2.ingameName || !joinData.teammate2.gameLevel) {
              hasError = true;
              errorMsg = "Please fill all details for Teammate 2!";
            } else if (joinData.teammate2.coins < entryFee) {
              hasError = true;
              errorMsg = `Teammate "${joinData.teammate2.ingameName}" has insufficient coins! Needs ${entryFee}, has ${joinData.teammate2.coins}`;
            } else if (!joinData.teammate3.userId || !joinData.teammate3.isValid) {
              hasError = true;
              errorMsg = "Please verify Teammate 3 Website User ID!";
            } else if (!joinData.teammate3.gameUid || !joinData.teammate3.ingameName || !joinData.teammate3.gameLevel) {
              hasError = true;
              errorMsg = "Please fill all details for Teammate 3!";
            } else if (joinData.teammate3.coins < entryFee) {
              hasError = true;
              errorMsg = `Teammate "${joinData.teammate3.ingameName}" has insufficient coins! Needs ${entryFee}, has ${joinData.teammate3.coins}`;
            }
          }
          
          return hasError && !isAlreadyJoined && !joinLoading ? (
            <p className="text-red-400 text-center text-sm mt-3">
              ⚠️ {errorMsg}
            </p>
          ) : null;
        })()}
      </div>
    </div>
  );
}