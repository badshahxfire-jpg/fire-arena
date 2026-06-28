import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function WeeklyRegistrationCard({ tournament, user, onJoin }) {
  const [teamName, setTeamName] = useState("");
  const [inGameName, setInGameName] = useState("");
  const [uid, setUid] = useState("");
  const [mobile, setMobile] = useState("");
  const [gameLevel, setGameLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [leaderProfile, setLeaderProfile] = useState(null);

  const format = tournament.format || "Solo";
  const isSolo = format === "Solo";
  const numTeammates = format === "Duo" ? 1 : format === "Squad" ? 3 : 0;

  const [teammates, setTeammates] = useState([]);

  // Initialize teammates array based on format
  useEffect(() => {
    setTeammates(
      Array(numTeammates).fill({ websiteUid: "", inGameName: "", gameUid: "", gameLevel: "", mobileNumber: "", isVerified: false, verifying: false })
    );
  }, [numTeammates]);

  // Fetch leader profile data to autofill and enforce lock
  useEffect(() => {
    if (!user) return;
    const fetchLeaderProfile = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setLeaderProfile(data);
          
          if (data.gameUid) setUid(data.gameUid);
          if (data.mobileNumber || data.phone || data.phoneNumber) setMobile(data.mobileNumber || data.phone || data.phoneNumber);
          if (data.ingameName || data.displayName) setInGameName(data.ingameName || data.displayName);
          if (data.gameLevel || data.level) setGameLevel(data.gameLevel || data.level);
        }
      } catch (error) {
        console.error("Error fetching leader profile:", error);
      }
    };
    fetchLeaderProfile();
  }, [user]);

  const isRegistered = tournament.registeredTeams && user && tournament.registeredTeams[user.uid];
  const registeredCount = tournament.registeredTeams ? Object.keys(tournament.registeredTeams).length : 0;
  const maxPlayers = tournament.maxPlayers || 48;
  const isFull = registeredCount >= maxPlayers;

  const verifyTeammate = async (index, websiteUid) => {
    if (!websiteUid || websiteUid.trim() === "") return;
    
    if (websiteUid === user?.uid) {
       alert("You cannot enter your own ID as a teammate.");
       return;
    }
    for (let i = 0; i < teammates.length; i++) {
       if (i !== index && teammates[i].websiteUid === websiteUid) {
          alert("Duplicate ID entered!");
          return;
       }
    }

    const newTeammates = [...teammates];
    newTeammates[index].verifying = true;
    setTeammates(newTeammates);

    try {
      const userRef = doc(db, "users", websiteUid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        newTeammates[index] = {
          ...newTeammates[index],
          isVerified: true,
          inGameName: userData.ingameName || userData.displayName || userData.name || "",
          gameUid: userData.gameUid || userData.uid || "",
          gameLevel: userData.gameLevel || userData.level || "",
          mobileNumber: userData.mobileNumber || userData.phone || userData.phoneNumber || "",
          ingameNameLocked: userData.ingameNameLocked || false,
          gameUidLocked: userData.gameUidLocked || false,
          mobileNumberLocked: userData.mobileNumberLocked || false,
          coins: userData.coins || 0
        };
        alert(`✅ Teammate verified: ${newTeammates[index].inGameName}`);
      } else {
        newTeammates[index].isVerified = false;
        alert("❌ Website User ID not found!");
      }
    } catch (error) {
      console.error(error);
      alert("Error verifying teammate.");
    } finally {
      newTeammates[index].verifying = false;
      setTeammates([...newTeammates]);
    }
  };

  const handleTeammateChange = (index, value) => {
    const newTeammates = [...teammates];
    newTeammates[index] = { ...newTeammates[index], websiteUid: value, isVerified: false };
    setTeammates(newTeammates);
  };

  const handleTeammateDetailChange = (index, field, value) => {
    const newTeammates = [...teammates];
    newTeammates[index] = { ...newTeammates[index], [field]: value };
    setTeammates(newTeammates);
  };

  const handleJoin = async () => {
    if (!user) return alert("Please login first!");
    if (!mobile || mobile.length < 10) return alert("Please enter a valid Mobile Number!");
    if (!isSolo && !teamName) return alert("Please enter Team Name!");
    if (!inGameName || !uid) return alert("Please fill your in-game details!");
    if (!gameLevel) return alert("Please enter your Game Level!");

    if (!isSolo) {
       for (let i = 0; i < teammates.length; i++) {
         if (!teammates[i].isVerified) {
            return alert(`Please verify Teammate ${i + 1}'s Website ID!`);
         }
         if (!teammates[i].inGameName || !teammates[i].gameUid || !teammates[i].gameLevel) {
            return alert(`Please fill all details (IGN, UID, Level) for Teammate ${i + 1}!`);
         }
       }
    }

    setLoading(true);
    const teamDetails = { 
      mobile,
      inGameName, 
      gameUid: uid,
      gameLevel,
      teamName: isSolo ? inGameName : teamName,
      format,
      teammates: isSolo ? [] : teammates.map(t => ({
        websiteUid: t.websiteUid,
        inGameName: t.inGameName,
        gameUid: t.gameUid,
        gameLevel: t.gameLevel,
        mobileNumber: t.mobileNumber
      }))
    };

    const success = await onJoin(tournament.id, user, teamDetails);
    setLoading(false);
    if (success) {
      alert("Successfully registered for the Weekly Tournament!");
    } else {
      alert("Failed to register. Make sure you have enough coins.");
    }
  };

  if (tournament.status !== "REGISTRATION") {
    return (
      <div className="bg-black/40 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center h-full">
        <span className="text-4xl mb-4">🔒</span>
        <h3 className="text-xl font-bold text-white mb-2">Registration Closed</h3>
        <p className="text-gray-400 text-sm">
          The registration phase for this tournament is over. Keep an eye on the Leaderboard!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-black/40 border border-orange-500/20 rounded-2xl p-6 relative overflow-hidden group">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-2xl font-black text-white uppercase">Register {isSolo ? "Player" : "Team"}</h3>
        <div className="flex flex-col items-end gap-2">
          {isRegistered && (
            <div className="bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max">
              <span>✅</span> REGISTERED
            </div>
          )}
          <div className="bg-black/50 border border-white/10 px-3 py-1 rounded-lg text-sm flex items-center gap-1 w-max">
            <span className="text-gray-400">{isSolo ? "Players" : "Teams"}:</span>
            <span className={`${isFull ? 'text-red-500' : 'text-orange-500'} font-bold`}>{registeredCount}</span>
            <span className="text-gray-500">/ {maxPlayers}</span>
          </div>
        </div>
      </div>
      
      {isRegistered ? (
        <div className="text-center py-8">
          <p className="text-gray-300 mb-2">You are successfully registered!</p>
          <p className="text-sm text-gray-500">Wait for the qualifier matches to begin.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {!isSolo && (
            <div className="mb-6 p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
              <h4 className="text-xl font-black text-yellow-400 mb-4">🏷️ TEAM NAME</h4>
              <input 
                type="text" 
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Team Alpha"
                className="w-full bg-black border border-yellow-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors"
              />
            </div>
          )}

          {/* LEADER SECTION */}
          <div className="mb-6 p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
            <h4 className="text-xl font-black text-blue-400 mb-4">👑 TEAM LEADER (YOU)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <input 
                  type="tel"
                  placeholder="Your Mobile No.*"
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  className="w-full bg-black border border-orange-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={!!leaderProfile?.mobileNumberLocked}
                />
                {!!leaderProfile?.mobileNumberLocked && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs flex items-center gap-1 font-bold">
                    🔒 Locked
                  </span>
                )}
              </div>
              <div className="relative">
                <input 
                  type="number" 
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  placeholder="Free Fire UID*"
                  className="w-full bg-black border border-orange-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={!!leaderProfile?.gameUidLocked}
                />
                {!!leaderProfile?.gameUidLocked && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs flex items-center gap-1 font-bold">
                    🔒 Locked
                  </span>
                )}
              </div>
              <div className="relative">
                <input 
                  type="text" 
                  value={inGameName}
                  onChange={(e) => setInGameName(e.target.value)}
                  placeholder="Ingame Name*"
                  className="w-full bg-black border border-orange-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={!!leaderProfile?.ingameNameLocked}
                />
                {!!leaderProfile?.ingameNameLocked && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs flex items-center gap-1 font-bold">
                    🔒 Locked
                  </span>
                )}
              </div>
              <input 
                type="number" 
                value={gameLevel}
                onChange={(e) => setGameLevel(e.target.value)}
                placeholder="Game Level*"
                className="w-full bg-black border border-orange-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500"
              />
            </div>
            <p className="text-blue-400 text-xs mt-3">Your Website User ID: <span className="text-yellow-400 font-mono">{user?.uid}</span></p>
          </div>

          {!isSolo && teammates.map((teammate, index) => (
            <div key={index} className="bg-black/50 p-4 rounded-xl border border-white/5 space-y-3">
              <label className="block text-xs font-bold text-gray-400">Teammate {index + 1} Website User ID</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={teammate.websiteUid}
                  onChange={(e) => handleTeammateChange(index, e.target.value)}
                  placeholder="Website UID"
                  className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
                <button
                  onClick={() => verifyTeammate(index, teammate.websiteUid)}
                  disabled={teammate.verifying || !teammate.websiteUid || teammate.isVerified}
                  className="bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold px-4 py-2 rounded-lg disabled:opacity-50 transition-all"
                >
                  {teammate.verifying ? "..." : teammate.isVerified ? "VERIFIED" : "VERIFY"}
                </button>
              </div>
              {teammate.isVerified && (
                <div className="space-y-3 mt-3 border-t border-white/10 pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Teammate's Free Fire UID*"
                        value={teammate.gameUid}
                        onChange={(e) => handleTeammateDetailChange(index, "gameUid", e.target.value)}
                        className="w-full bg-black border border-orange-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={!!teammate.gameUidLocked}
                      />
                      {!!teammate.gameUidLocked && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs flex items-center gap-1 font-bold">
                          🔒 Locked
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Teammate's Ingame Name*"
                        value={teammate.inGameName}
                        onChange={(e) => handleTeammateDetailChange(index, "inGameName", e.target.value)}
                        className="w-full bg-black border border-orange-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={!!teammate.ingameNameLocked}
                      />
                      {!!teammate.ingameNameLocked && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs flex items-center gap-1 font-bold">
                          🔒 Locked
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Teammate's Mobile Number"
                        value={teammate.mobileNumber}
                        onChange={(e) => handleTeammateDetailChange(index, "mobileNumber", e.target.value)}
                        className="w-full bg-black border border-orange-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={!!teammate.mobileNumberLocked}
                      />
                      {!!teammate.mobileNumberLocked && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs flex items-center gap-1 font-bold">
                          🔒 Locked
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      placeholder="Game Level*"
                      value={teammate.gameLevel}
                      onChange={(e) => handleTeammateDetailChange(index, "gameLevel", e.target.value)}
                      className="w-full bg-black border border-orange-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 bg-black/40 p-3 rounded-lg border border-white/5 mt-2">
                    <div className="text-xs text-green-400 flex gap-2 items-center">
                      <span>✅ Verified User</span>
                      {(!teammate.gameUidLocked || !teammate.ingameNameLocked || !teammate.mobileNumberLocked) && (
                        <span className="text-gray-500 hidden sm:inline">(You can edit details if needed)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs">Wallet Balance:</span>
                      <span className="font-bold text-yellow-500 text-sm">🪙 {teammate.coins}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          <button 
            onClick={handleJoin}
            disabled={loading || isFull}
            className={`w-full font-black py-4 rounded-xl shadow-lg transform transition-all mt-4 ${
              isFull 
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-black active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
          >
            {loading ? "REGISTERING..." : isFull ? "TOURNAMENT FULL" : `JOIN NOW (${tournament.entryFee || 50} COINS)`}
          </button>
        </div>
      )}
    </div>
  );
}
