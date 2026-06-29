import React, { useState, useEffect } from "react";

export default function AdminWeeklyDashboard({ weeklyTournaments, createWeeklyTournament, updateStatus, updateTeamRank, cancelWeeklyTournament, updateRoomDetails, distributeWeeklyRewards, generateLobbies, updateLobbyDetails, advancePhase, updateTournamentRules }) {
  const [showCreate, setShowCreate] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showJoinedPlayers, setShowJoinedPlayers] = useState(false);
  const [showLobbyManagerPopup, setShowLobbyManagerPopup] = useState(false);
  const [showEditRules, setShowEditRules] = useState(false);
  const [editRules, setEditRules] = useState([]);
  const [playersPerLobby, setPlayersPerLobby] = useState(48);
  const [newTournament, setNewTournament] = useState({
    title: "",
    description: "",
    prizePool: 10000,
    entryFee: 50,
    maxPlayers: 48,
    format: "Solo",
  });

  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [pageView, setPageView] = useState("active"); // active, completed
  const [pointData, setPointData] = useState({ userId: "", position: 1 });
  const [qualifiedPlayers, setQualifiedPlayers] = useState([]);

  const getPlacementPoints = (pos) => {
    if (pos === 1) return 20;
    if (pos === 2) return 15;
    if (pos === 3) return 12;
    if (pos === 4) return 10;
    if (pos === 5) return 8;
    if (pos >= 6 && pos <= 10) return 5;
    if (pos >= 11 && pos <= 20) return 2;
    return 0;
  };

  const activeTournaments = weeklyTournaments ? weeklyTournaments.filter(t => !(t.status === "COMPLETED" && t.rewardsDistributed)) : [];
  const pastTournaments = weeklyTournaments ? weeklyTournaments.filter(t => t.status === "COMPLETED" && t.rewardsDistributed) : [];

  const displayTournaments = pageView === "active" ? activeTournaments : pastTournaments;

  const currentTournament = displayTournaments && displayTournaments.length > 0 
    ? (selectedTournamentId 
        ? displayTournaments.find(t => t.id === selectedTournamentId) || displayTournaments[0] 
        : displayTournaments[0]) 
    : null;

  const [roomData, setRoomData] = useState({ roomId: "", roomPassword: "", matchDate: "", matchTime: "" });

  useEffect(() => {
    if (currentTournament) {
      setRoomData({
        roomId: currentTournament.roomId || "",
        roomPassword: currentTournament.roomPassword || ""
      });
    }
  }, [currentTournament]);

  const handleCreate = async () => {
    const success = await createWeeklyTournament(newTournament);
    if (success) {
      alert("Weekly Tournament Created!");
      setShowCreate(false);
    }
  };



  return (
    <>
      <div className="bg-black/40 border border-orange-500/20 p-6 rounded-2xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-orange-500 flex items-center gap-2">
            <span>📅</span> WEEKLY TOURNAMENTS
          </h2>
          <p className="text-sm text-gray-400">Manage multi-stage weekly tournaments, lobbies, and rewards.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-500 hover:bg-orange-400 text-black font-black px-6 py-2 rounded-xl whitespace-nowrap shadow-[0_0_15px_rgba(249,115,22,0.3)]"
        >
          MANAGE TOURNAMENTS
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md overflow-y-auto flex items-start justify-center p-4 md:p-8">
           <div className="bg-[#0f0f13] border border-orange-500/30 rounded-2xl w-full max-w-7xl p-6 md:p-8 relative mt-10 mb-10 animate-in fade-in zoom-in duration-200 shadow-2xl">
             <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 w-10 h-10 rounded-full flex items-center justify-center transition-all z-[110]"
              >
                ✕
              </button>
              
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600 mb-8 flex items-center gap-2 uppercase">
                <span>📅</span> MANAGE WEEKLY TOURNAMENTS
              </h2>

      {/* Top Controls & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-4">
        <div className="flex gap-4">
          <button 
            onClick={() => { setPageView("active"); setSelectedTournamentId(""); }}
            className={`px-6 py-2 rounded-t-lg font-black text-lg transition-all ${pageView === "active" ? "text-orange-500 border-b-2 border-orange-500" : "text-gray-500 hover:text-white"}`}
          >
            🟢 ACTIVE TOURNAMENTS
          </button>
          <button 
            onClick={() => { setPageView("completed"); setSelectedTournamentId(""); }}
            className={`px-6 py-2 rounded-t-lg font-black text-lg transition-all ${pageView === "completed" ? "text-orange-500 border-b-2 border-orange-500" : "text-gray-500 hover:text-white"}`}
          >
            ⚪ COMPLETED MATCH RESULTS
          </button>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-orange-500 hover:bg-orange-400 text-black font-black px-6 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)]"
        >
          + CREATE NEW TOURNAMENT
        </button>
      </div>

      {!currentTournament && displayTournaments.length === 0 && (
        <div className="text-center text-gray-500 py-12 bg-black/40 rounded-2xl border border-white/5">
           No {pageView === "active" ? "active" : "completed"} tournaments found.
        </div>
      )}

      {/* Create Form Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 md:p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-gradient-to-b from-gray-900 to-black border border-orange-500/30 rounded-2xl w-full max-w-2xl shadow-2xl relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 md:p-8 shrink-0 border-b border-white/10 relative">
              <button 
                onClick={() => setShowCreate(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10"
              >
                ✕
              </button>
              <h3 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600 uppercase tracking-tight m-0 pr-8">Create New Weekly Tournament</h3>
            </div>
            
            {/* Scrollable Content */}
            <div className="p-5 md:p-8 overflow-y-auto no-scrollbar flex-1 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Tournament Title</label>
                <input
                  type="text"
                  placeholder="e.g. Weekly Showdown #1"
                  value={newTournament.title}
                  onChange={e => setNewTournament({...newTournament, title: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Description / Rules</label>
                <textarea
                  placeholder="Enter tournament rules..."
                  value={newTournament.description}
                  onChange={e => setNewTournament({...newTournament, description: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                  rows="3"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Prize Pool</label>
                  <input
                    type="number"
                    value={newTournament.prizePool}
                    onChange={e => setNewTournament({...newTournament, prizePool: parseInt(e.target.value)})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Entry Fee</label>
                  <input
                    type="number"
                    value={newTournament.entryFee}
                    onChange={e => setNewTournament({...newTournament, entryFee: parseInt(e.target.value)})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Max Teams</label>
                  <input
                    type="number"
                    value={newTournament.maxPlayers}
                    onChange={e => setNewTournament({...newTournament, maxPlayers: parseInt(e.target.value)})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Format</label>
                  <select
                    value={newTournament.format}
                    onChange={e => setNewTournament({...newTournament, format: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="Solo">Solo</option>
                    <option value="Duo">Duo</option>
                    <option value="Squad">Squad</option>
                  </select>
                </div>
              </div>
              <div className="pt-4">
                <button 
                  onClick={() => {
                    handleCreate();
                    setShowCreate(false);
                  }} 
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-black px-6 py-4 rounded-xl w-full shadow-lg transform transition-all active:scale-95"
                >
                  PUBLISH TOURNAMENT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Tournament Management */}
      {currentTournament && (
        <>
        <div className="mb-6 bg-black/40 border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-4">
          <label className="font-bold text-white whitespace-nowrap">Manage Tournament:</label>
          <select
            value={currentTournament.id}
            onChange={e => setSelectedTournamentId(e.target.value)}
            className="w-full md:flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white"
          >
            {displayTournaments.map(t => <option key={t.id} value={t.id}>{t.title} ({t.format}) - {t.status}</option>)}
          </select>
          <button
            onClick={() => setShowJoinedPlayers(true)}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-lg whitespace-nowrap"
          >
            👥 View Joined Players ({currentTournament.registeredTeams ? Object.keys(currentTournament.registeredTeams).length : 0})
          </button>
          <button
            onClick={() => {
               setEditRules(currentTournament.rules || [
                  `${(!currentTournament.format || currentTournament.format === "Solo") ? "Players" : "Teams"} must register before Wednesday.`,
                  "Qualifier matches happen on Thursday & Friday.",
                  `Top 10 ${(!currentTournament.format || currentTournament.format === "Solo") ? "players" : "teams"} advance to Grand Finals on Sunday.`,
                  "Point system applies based on match standings."
               ]);
               setShowEditRules(true);
            }}
            className="w-full md:w-auto bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-2 rounded-lg whitespace-nowrap"
          >
            📝 Edit Rules
          </button>
        </div>
        
        {/* Edit Rules Modal */}
        {showEditRules && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-900 border border-purple-500/30 p-6 rounded-2xl w-full max-w-2xl shadow-2xl relative animate-in fade-in zoom-in duration-200">
              <button 
                onClick={() => setShowEditRules(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition-all"
              >
                ✕
              </button>
              <h3 className="text-xl font-black text-purple-400 mb-6 uppercase">Edit Rules & Schedule</h3>
              
              <div className="space-y-3 mb-6">
                 {editRules.map((rule, idx) => (
                    <div key={idx} className="flex gap-2">
                       <input 
                         type="text"
                         value={rule}
                         onChange={(e) => {
                            const newRules = [...editRules];
                            newRules[idx] = e.target.value;
                            setEditRules(newRules);
                         }}
                         className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                       />
                       <button 
                         onClick={() => {
                            const newRules = editRules.filter((_, i) => i !== idx);
                            setEditRules(newRules);
                         }}
                         className="bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white px-3 rounded-lg"
                       >
                         ✕
                       </button>
                    </div>
                 ))}
              </div>
              <div className="flex gap-4">
                 <button 
                   onClick={() => setEditRules([...editRules, ""])}
                   className="flex-1 border border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-white py-2 rounded-lg"
                 >
                   + Add Rule
                 </button>
                 <button 
                   onClick={async () => {
                      const finalRules = editRules.filter(r => r.trim() !== "");
                      const success = await updateTournamentRules(currentTournament.id, finalRules);
                      if (success) {
                         alert("Rules updated successfully!");
                         setShowEditRules(false);
                      }
                   }}
                   className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg"
                 >
                   Save Rules
                 </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Joined Players Modal */}
        {showJoinedPlayers && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-900 border border-blue-500/30 p-6 rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in duration-200">
              <button 
                onClick={() => setShowJoinedPlayers(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition-all"
              >
                ✕
              </button>
              <h3 className="text-xl font-black text-blue-400 mb-6 uppercase">Joined Players / Teams</h3>
              
              {!currentTournament.registeredTeams || Object.keys(currentTournament.registeredTeams).length === 0 ? (
                <p className="text-gray-400 text-center py-8">No players have joined this tournament yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(currentTournament.registeredTeams).map(([uid, team]) => (
                    <div key={uid} className="bg-black/50 border border-white/10 p-4 rounded-xl">
                      <div className="font-bold text-white mb-2 pb-2 border-b border-white/5 flex justify-between items-center">
                        <span className="text-orange-400">{team.teamName || team.inGameName || team.playerName}</span>
                        <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-300">
                          {team.teammates ? `${team.teammates.length + 1} Players` : "Solo"}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-300"><span className="text-gray-500">Leader UID:</span> {team.gameUid || team.playerId}</p>
                        <p className="text-gray-300"><span className="text-gray-500">IGN:</span> {team.inGameName || team.playerName}</p>
                        {team.mobile && <p className="text-gray-300"><span className="text-gray-500">Phone:</span> {team.mobile}</p>}
                        
                        {team.teammates && team.teammates.map((mate, idx) => (
                          <div key={idx} className="mt-2 pt-2 border-t border-white/5">
                            <p className="text-gray-300"><span className="text-gray-500">Mate {idx+1} UID:</span> {mate.gameUid || mate.uid}</p>
                            <p className="text-gray-300"><span className="text-gray-500">Mate {idx+1} IGN:</span> {mate.inGameName || mate.ign}</p>
                            {mate.mobileNumber && <p className="text-gray-300"><span className="text-gray-500">Mate {idx+1} Phone:</span> {mate.mobileNumber}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tournament Header with Format */}
        <div className="mb-8 flex items-center justify-between bg-gradient-to-r from-gray-900 to-black p-6 rounded-2xl border border-white/5 shadow-lg">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">{currentTournament.title}</h2>
              <span className={`px-4 py-1 text-sm font-black uppercase rounded-full border ${
                currentTournament.format === "Squad" ? "bg-purple-500/20 text-purple-400 border-purple-500/50" :
                currentTournament.format === "Duo" ? "bg-blue-500/20 text-blue-400 border-blue-500/50" :
                "bg-orange-500/20 text-orange-400 border-orange-500/50"
              }`}>
                🎮 {currentTournament.format || "Solo"} TOURNAMENT
              </span>
            </div>
            <p className="text-gray-400 text-sm">{currentTournament.description || "Manage the matches, rules, and rewards below."}</p>
          </div>
          <div className="hidden md:block text-right">
             <div className="text-xs text-gray-500 mb-1">Current Phase</div>
             <div className="text-xl font-black text-orange-500 animate-pulse">{currentTournament.status}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Status Controls */}
          <div className="bg-black/40 border border-white/10 p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Phase Controls</h3>
            {pageView !== "completed" ? (
              <>
                <p className="text-gray-400 text-sm mb-4">Change the phase of the tournament to lock/unlock features for users.</p>
                
                <div className="flex flex-col gap-2">
                  {["REGISTRATION", "QUALIFIER", "SEMI_FINALS", "FINALS", "COMPLETED"].map(status => (
                    <button
                      key={status}
                      onClick={() => updateStatus(currentTournament.id, status)}
                      className={`py-2 px-4 rounded-lg font-bold text-sm text-left border transition-all ${
                        currentTournament.status === status 
                          ? "bg-orange-500/20 border-orange-500 text-orange-500" 
                          : "bg-black/50 border-white/10 text-gray-400 hover:bg-white/5"
                      }`}
                    >
                      {status === currentTournament.status ? "▶ ACTIVE: " : "Set to: "} {status}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-center text-sm font-bold mb-4">
                 ✅ This tournament is fully completed and results are published.
              </div>
            )}

            <div className={`mt-6 pt-6 border-t ${pageView === "completed" ? "border-white/10" : "border-red-500/20"}`}>
              <button
                onClick={async () => {
                  if (window.confirm(`Are you sure you want to permanently DELETE this tournament? This cannot be undone!`)) {
                    const success = await cancelWeeklyTournament(currentTournament.id);
                    if (success) alert("Tournament Deleted.");
                  }
                }}
                className={`w-full font-bold px-4 py-2 rounded-lg transition-all ${pageView === "completed" ? "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]" : "bg-red-600/20 hover:bg-red-600 border border-red-500 text-red-100"}`}
              >
                🗑️ {pageView === "completed" ? "DELETE TOURNAMENT" : "CANCEL TOURNAMENT"}
              </button>
            </div>
          </div>

          {/* Open Lobby Manager Button */}
          {pageView !== "completed" && (
          <div className="bg-black/40 border border-white/10 p-6 rounded-2xl col-span-1 lg:col-span-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Manage Lobbies & Approvals</h3>
              <p className="text-gray-400 text-sm">Assign players to lobbies, set room details, enter points, and approve qualifiers.</p>
            </div>
            <button 
              onClick={() => setShowLobbyManagerPopup(true)} 
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-lg"
            >
              Open Lobby Manager
            </button>
          </div>
          )}

          {/* Points & Lobbies Manager Popup */}
          {pageView !== "completed" && showLobbyManagerPopup && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-gray-900 border border-blue-500/30 p-6 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto shadow-2xl relative animate-in zoom-in duration-200">
                <button onClick={() => setShowLobbyManagerPopup(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white font-bold text-xl">✕</button>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 pr-8">
              <div>
                <h3 className="text-lg font-bold text-white">Manage Lobbies & Approvals</h3>
                <p className="text-gray-400 text-sm">Assign players to lobbies, set room details, enter points, and approve qualifiers.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 bg-black/50 p-2 rounded-lg border border-white/5">
                <label className="text-sm text-gray-400 font-bold whitespace-nowrap">Max per Lobby:</label>
                <input 
                  type="number" 
                  value={playersPerLobby}
                  onChange={(e) => setPlayersPerLobby(parseInt(e.target.value) || 48)}
                  className="w-20 bg-black/60 border border-white/20 rounded-md px-2 py-1 text-white text-center font-bold"
                  title="Max Players/Teams per lobby"
                  min="2"
                  max="100"
                />
                <button 
                  onClick={async () => {
                    if (window.confirm(`This will auto-assign all ACTIVE players into random lobbies of ${playersPerLobby} players/teams max. Continue?`)) {
                      await generateLobbies(currentTournament.id, playersPerLobby);
                      alert("Lobbies generated!");
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-md font-bold text-white text-sm whitespace-nowrap w-full sm:w-auto"
                >
                  Auto-Assign Lobbies
                </button>
              </div>
            </div>

            {currentTournament.lobbies ? (
              <div className="space-y-6">
                {Object.values(currentTournament.lobbies).map(lobby => (
                  <div key={lobby.id} className="bg-black/50 border border-white/5 p-4 rounded-xl">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-4">
                      <h4 className="font-bold text-white text-lg">{lobby.name} <span className="text-sm text-gray-400">({lobby.teams?.length || 0} Players)</span></h4>
                    </div>

                    {/* Players in Lobby */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-4">
                      {lobby.teams?.map(uid => {
                        const team = currentTournament.registeredTeams[uid];
                        if (!team) return null;
                        const isQualifying = qualifiedPlayers.includes(uid);
                        return (
                          <div key={uid} className={`flex items-center justify-between p-2 rounded border ${isQualifying ? 'bg-green-900/30 border-green-500/50' : 'bg-black/40 border-white/5'}`}>
                            <div className="flex flex-col truncate pr-2">
                              <span className="text-sm text-white font-bold truncate">
                                {team.teamName || team.playerName || team.inGameName}
                                {team.teammates && team.teammates.length > 0 && (
                                  <span className="ml-2 text-[10px] bg-purple-500/20 text-purple-400 px-1 rounded border border-purple-500/30">
                                    +{team.teammates.length}
                                  </span>
                                )}
                              </span>
                              
                              {team.teammates && team.teammates.length > 0 && (
                                <div className="text-[10px] text-gray-400 mt-1 leading-tight border-l-2 border-purple-500/30 pl-2">
                                  <span className="text-gray-300">L:</span> {team.playerName || team.inGameName}
                                  {team.teammates.map((tm, idx) => (
                                    <span key={idx} className="block truncate"><span className="text-gray-500">T{idx+1}:</span> {tm.ign || tm.inGameName}</span>
                                  ))}
                                </div>
                              )}
                              
                              <span className="text-xs text-orange-400 font-bold mt-1">Rank: {team.rank || '-'}</span>
                            </div>
                            <div className="flex gap-2 items-center flex-shrink-0">
                               <button 
                                 onClick={() => {
                                    const pos = prompt(`Enter Rank (1, 2, 3...) for ${team.inGameName || team.teamName}`);
                                    if (pos) {
                                      const p = parseInt(pos);
                                      if (!isNaN(p) && p > 0) {
                                        updateTeamRank(currentTournament.id, uid, p);
                                      } else {
                                        alert("Invalid Rank");
                                      }
                                    }
                                 }}
                                 className="text-xs bg-orange-700 hover:bg-orange-600 text-white px-2 py-1 rounded whitespace-nowrap"
                               >
                                 Set Rank
                               </button>
                               <label className="flex items-center gap-1 cursor-pointer">
                                 <input 
                                   type="checkbox" 
                                   checked={isQualifying}
                                   onChange={(e) => {
                                     if (e.target.checked) setQualifiedPlayers([...qualifiedPlayers, uid]);
                                     else setQualifiedPlayers(qualifiedPlayers.filter(id => id !== uid));
                                   }}
                                 />
                                 <span className="text-xs text-gray-300">Qualify</span>
                               </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="mt-8 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-center">
                  <h4 className="text-lg font-bold text-white mb-2">Advance Tournament Phase</h4>
                  <p className="text-sm text-gray-400 mb-4">Clicking this will advance {qualifiedPlayers.length} selected players to the next phase, reset their points to 0, and ELIMINATE everyone else.</p>
                  
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <select id="nextPhaseSelect" className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white">
                      <option value="DAY_1_MATCH">To Day 1 (All Players)</option>
                      <option value="DAY_2_QUALIFIERS">To Day 2 (Qualifiers)</option>
                      <option value="SEMI_FINALS">To Day 3 (Semi-Finals)</option>
                      <option value="FINALS">To Day 4 (Finals)</option>
                    </select>
                    <button 
                      onClick={async () => {
                        if (qualifiedPlayers.length === 0) return alert("Select at least 1 player to qualify!");
                        const nextPhase = document.getElementById("nextPhaseSelect").value;
                        if (window.confirm(`Advance ${qualifiedPlayers.length} players to ${nextPhase}? Everyone else will be eliminated.`)) {
                          const success = await advancePhase(currentTournament.id, nextPhase, qualifiedPlayers);
                          if (success) {
                            alert("Phase advanced successfully!");
                            setQualifiedPlayers([]); // Reset
                          }
                        }
                      }}
                      className="bg-green-600 hover:bg-green-500 text-white font-black px-6 py-2 rounded-lg"
                    >
                      APPROVE & ADVANCE TO NEXT ROUND
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-gray-500 text-sm text-center py-8 bg-black/50 rounded-xl border border-white/5">
                No lobbies created yet. Click "Auto-Assign Lobbies" above.
              </div>
            )}
              </div>
            </div>
          )}

          <div className="col-span-1 lg:col-span-2">
            
          {/* Room Details Section */}
          {pageView !== "completed" && (
            <div className="bg-black/40 border border-white/10 p-6 rounded-2xl mb-8">
              <h3 className="text-lg font-bold text-white mb-4">Set Schedule & Match Credentials</h3>
            <p className="text-gray-400 text-sm mb-6">Set the schedule early so players know when to play. Enter the Room ID and Password right before the match starts.</p>
            
            {currentTournament.lobbies ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.values(currentTournament.lobbies).map(lobby => (
                  <div key={lobby.id} className="bg-black/50 border border-white/10 p-4 rounded-xl">
                    <h4 className="font-bold text-white mb-4 border-b border-white/10 pb-2">{lobby.name} Details</h4>
                    
                    {/* Schedule Section */}
                    <div className="mb-4">
                      <h5 className="text-sm font-bold text-gray-300 mb-2">1. Set Match Schedule</h5>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Match Date</label>
                          <input 
                            type="date" 
                            className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-2 text-white text-sm"
                            defaultValue={lobby.matchDate}
                            id={`date-details-${lobby.id}`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Match Time</label>
                          <input 
                            type="time" 
                            className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-2 text-white text-sm"
                            defaultValue={lobby.matchTime}
                            id={`time-details-${lobby.id}`}
                          />
                        </div>
                      </div>
                      <button 
                        onClick={async () => {
                          const mDate = document.getElementById(`date-details-${lobby.id}`).value;
                          const mTime = document.getElementById(`time-details-${lobby.id}`).value;
                          // Keep existing credentials
                          const rId = document.getElementById(`room-details-${lobby.id}`)?.value || lobby.roomId || "";
                          const rPass = document.getElementById(`pass-details-${lobby.id}`)?.value || lobby.roomPassword || "";
                          const success = await updateLobbyDetails(currentTournament.id, lobby.id, rId, rPass, mDate, mTime);
                          if (success) alert(`${lobby.name} Schedule Saved!`);
                        }}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg mt-2 text-sm"
                      >
                        📅 SAVE SCHEDULE
                      </button>
                    </div>

                    {/* Credentials Section */}
                    <div className="pt-4 border-t border-white/10">
                      <h5 className="text-sm font-bold text-gray-300 mb-2">2. Set Room ID & Password (Later)</h5>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Room ID</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 123456" 
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-2 text-white mb-2"
                          defaultValue={lobby.roomId}
                          id={`room-details-${lobby.id}`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Password</label>
                        <input 
                          type="text" 
                          placeholder="e.g. pass123" 
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-2 text-white mb-2"
                          defaultValue={lobby.roomPassword}
                          id={`pass-details-${lobby.id}`}
                        />
                      </div>
                      <button 
                        onClick={async () => {
                          const rId = document.getElementById(`room-details-${lobby.id}`).value;
                          const rPass = document.getElementById(`pass-details-${lobby.id}`).value;
                          // Keep existing schedule
                          const mDate = document.getElementById(`date-details-${lobby.id}`)?.value || lobby.matchDate || "";
                          const mTime = document.getElementById(`time-details-${lobby.id}`)?.value || lobby.matchTime || "";
                          const success = await updateLobbyDetails(currentTournament.id, lobby.id, rId, rPass, mDate, mTime);
                          if (success) alert(`${lobby.name} Credentials Saved!`);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg mt-2 text-sm"
                      >
                        🎮 SAVE CREDENTIALS
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 max-w-md">
                {/* Overall Schedule */}
                <div className="mb-6">
                  <h5 className="text-sm font-bold text-gray-300 mb-2">1. Set Match Schedule</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Match Date (Overall)</label>
                      <input
                        type="date"
                        value={roomData.matchDate !== undefined ? roomData.matchDate : (currentTournament.matchDate || "")}
                        onChange={e => setRoomData({...roomData, matchDate: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Match Time (Overall)</label>
                      <input
                        type="time"
                        value={roomData.matchTime !== undefined ? roomData.matchTime : (currentTournament.matchTime || "")}
                        onChange={e => setRoomData({...roomData, matchTime: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const success = await updateRoomDetails(
                        currentTournament.id, 
                        roomData.roomId || currentTournament.roomId || "", 
                        roomData.roomPassword || currentTournament.roomPassword || "",
                        roomData.matchDate !== undefined ? roomData.matchDate : currentTournament.matchDate,
                        roomData.matchTime !== undefined ? roomData.matchTime : currentTournament.matchTime
                      );
                      if (success) alert("Schedule saved!");
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3 rounded-lg mt-4"
                  >
                    📅 SAVE SCHEDULE
                  </button>
                </div>

                {/* Overall Credentials */}
                <div className="pt-6 border-t border-white/10">
                  <h5 className="text-sm font-bold text-gray-300 mb-2">2. Set Room ID & Password (Later)</h5>
                  <div className="mb-4">
                    <label className="block text-xs text-gray-400 mb-1">Room ID (Overall)</label>
                    <input
                      type="text"
                      value={roomData.roomId !== undefined ? roomData.roomId : (currentTournament.roomId || "")}
                      onChange={e => setRoomData({...roomData, roomId: e.target.value})}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                      placeholder="e.g. 12345678"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs text-gray-400 mb-1">Room Password</label>
                    <input
                      type="text"
                      value={roomData.roomPassword !== undefined ? roomData.roomPassword : (currentTournament.roomPassword || "")}
                      onChange={e => setRoomData({...roomData, roomPassword: e.target.value})}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                      placeholder="e.g. pass123"
                    />
                  </div>
                  <button
                    onClick={async () => {
                      const success = await updateRoomDetails(
                        currentTournament.id, 
                        roomData.roomId !== undefined ? roomData.roomId : currentTournament.roomId, 
                        roomData.roomPassword !== undefined ? roomData.roomPassword : currentTournament.roomPassword,
                        roomData.matchDate || currentTournament.matchDate || "",
                        roomData.matchTime || currentTournament.matchTime || ""
                      );
                      if (success) alert("Room credentials saved!");
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-lg"
                  >
                    🎮 SAVE CREDENTIALS
                  </button>
                </div>
              </div>
            )}
          </div>
          )}
          {/* Publish Results & Reward Distribution */}
          <div className="bg-black/40 border border-white/10 p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Review & Publish Results</h3>
            <p className="text-gray-400 text-sm mb-4">Verify the final ranks before distributing coins. Only Ranked 1, 2, and 3 will receive the top prizes.</p>
            
            {currentTournament.status === "COMPLETED" ? (
              currentTournament.rewardsDistributed ? (
                <>
                  <div className="bg-green-500/20 border border-green-500/30 text-green-400 p-4 rounded-xl text-center font-bold mb-6">
                    ✅ Results Published & Rewards Distributed!
                  </div>
                  <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                    <h4 className="text-white font-bold mb-3 border-b border-white/10 pb-2">Winning Teams</h4>
                    {(() => {
                      const topWinners = Object.values(currentTournament.registeredTeams || {})
                        .filter(t => t.rank && t.rank <= 3)
                        .sort((a,b) => a.rank - b.rank);
                      
                      if (topWinners.length === 0) return <p className="text-gray-500 text-sm">No winners recorded.</p>;
                      
                      return (
                        <div className="space-y-2">
                          {topWinners.map(w => (
                            <div key={w.userId} className="flex justify-between items-start text-sm py-3 px-4 bg-white/5 rounded-lg border border-white/5">
                               <div className="flex flex-col gap-2">
                                 <div className="flex items-center gap-2">
                                   <span className={`font-black ${w.rank === 1 ? 'text-yellow-500' : w.rank === 2 ? 'text-gray-400' : 'text-amber-600'}`}>
                                     #{w.rank}
                                   </span>
                                   <span className="text-white font-bold text-base">{w.teamName || w.playerName || w.inGameName}</span>
                                 </div>
                               </div>
                               <span className="text-green-400 font-bold text-sm bg-green-500/10 px-3 py-1 rounded">WINNER</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-black/50 p-4 rounded-xl mb-6 border border-white/5">
                    <h4 className="text-white font-bold mb-3 border-b border-white/10 pb-2">Final Winners List</h4>
                    {(() => {
                      const topWinners = Object.values(currentTournament.registeredTeams || {})
                        .filter(t => t.rank && t.rank <= 3)
                        .sort((a,b) => a.rank - b.rank);
                      
                      if (topWinners.length === 0) {
                        return <p className="text-red-400 text-sm font-bold">⚠️ No players have been ranked 1, 2, or 3. Please set ranks above!</p>;
                      }
                      
                      return (
                        <div className="space-y-2">
                          {topWinners.map(w => (
                            <div key={w.userId} className="flex justify-between items-start text-sm py-3 px-4 bg-white/5 rounded-lg border border-white/5">
                               <div className="flex flex-col gap-2">
                                 <div className="flex items-center gap-2">
                                   <span className={`font-black ${w.rank === 1 ? 'text-yellow-500' : w.rank === 2 ? 'text-gray-400' : 'text-amber-600'}`}>
                                     #{w.rank}
                                   </span>
                                   <span className="text-white font-bold text-base">{w.teamName || w.playerName || w.inGameName}</span>
                                 </div>
                                 
                                 {w.teammates && w.teammates.length > 0 && (
                                   <div className="ml-6 text-xs text-gray-400 border-l-2 border-white/10 pl-3 space-y-1">
                                     <div><span className="text-gray-500">L:</span> {w.playerName || w.inGameName}</div>
                                     {w.teammates.map((tm, idx) => (
                                        <div key={idx}><span className="text-gray-500">T{idx+1}:</span> {tm.ign || tm.inGameName}</div>
                                     ))}
                                   </div>
                                 )}
                               </div>
                               
                               <div className="flex flex-col items-end gap-2">
                                 <span className="text-xs text-gray-500 font-mono bg-black/50 px-2 py-1 rounded">UID: {w.gameUid || '-'}</span>
                                 {w.teammates && w.teammates.length > 0 && (
                                   <span className="text-[10px] font-bold bg-purple-500/20 text-purple-400 px-2 py-1 rounded border border-purple-500/30 uppercase tracking-wider">
                                     TEAM OF {w.teammates.length + 1}
                                   </span>
                                 )}
                               </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  <button
                    onClick={async () => {
                      const topWinners = Object.values(currentTournament.registeredTeams || {}).filter(t => t.rank && t.rank <= 3);
                      if (topWinners.length === 0) {
                        return alert("Please set at least Rank 1, 2, or 3 before publishing results.");
                      }
                      if (window.confirm(`Are you sure you want to publish results? Coins will be permanently distributed to the ${topWinners.length} winners listed above.`)) {
                        const success = await distributeWeeklyRewards(currentTournament);
                        if (success) alert("Results published and rewards distributed successfully!");
                        else alert("Error distributing rewards.");
                      }
                    }}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-black px-6 py-4 rounded-xl text-lg animate-pulse shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                  >
                    🏆 PUBLISH RESULTS & DISTRIBUTE COINS
                  </button>
                </>
              )
            ) : (
              <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-4 rounded-xl text-center text-sm font-bold">
                ⚠️ Tournament must be marked as "COMPLETED" to review winners and distribute rewards.
              </div>
            )}
            </div>
          </div>
        </div>
        </>
      )}
           </div>
        </div>
      )}
    </>
  );
}
