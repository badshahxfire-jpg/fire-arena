import { useState, useEffect } from "react";
import { ref, onValue, remove } from "firebase/database";
import { database } from "../../firebase";

export default function AdminMatchResults({ isAdmin }) {
  const [matchResults, setMatchResults] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showDetailsPopup, setShowDetailsPopup] = useState(false);

  useEffect(() => {
    if (showDetailsPopup) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [showDetailsPopup]);

  const [showUidPopup, setShowUidPopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(null);
  const [filterType, setFilterType] = useState("ALL");
  const [playerResults, setPlayerResults] = useState([]);

  useEffect(() => {
    const resultsRef = ref(database, "playerResults");
    const unsubscribe = onValue(resultsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedData = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        setPlayerResults(loadedData);
      } else {
        setPlayerResults([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const resultsRef = ref(database, "matchResults");
    const unsubscribe = onValue(resultsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedData = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        setMatchResults(loadedData.reverse());
      } else {
        setMatchResults([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDeleteResult = async (resultId) => {
    if (!window.confirm("Delete this match result?")) return;
    try {
      await remove(ref(database, `matchResults/${resultId}`));
      alert("Deleted successfully!");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteAllResults = async () => {
    if (!window.confirm("Delete ALL match results?")) return;
    try {
      await remove(ref(database, "matchResults"));
      alert("All deleted successfully!");
    } catch (error) {
      alert(error.message);
    }
  };

  // Function to handle user click - shows UID popup
  const handleUserClick = (user, tournamentId) => {
    setSelectedUser({ ...user, tournamentId });
    setShowUidPopup(true);
  };

  const filteredResults = matchResults.filter((item) => {
    if (filterType === "ALL") return true;
    return item.tournamentType === filterType;
  });

  const getPositionBadge = (position) => {
    if (position === 1) return <span className="text-yellow-400 font-bold">🥇 1st</span>;
    if (position === 2) return <span className="text-gray-300 font-bold">🥈 2nd</span>;
    if (position === 3) return <span className="text-orange-400 font-bold">🥉 3rd</span>;
    return <span className="text-blue-400">#{position}</span>;
  };

  const getTotalDistributed = (results) => {
    return results?.reduce((sum, w) => sum + (w.winCoins || 0), 0) || 0;
  };

  if (!isAdmin) return null;

  return (
    <section className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-4xl md:text-5xl font-black text-purple-400 cyber-neon">🏆 MATCH RESULTS</h2>
          <p className="text-gray-400 text-sm mt-2">Click on any player to view their UID</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilterType("ALL")} className={`px-4 py-2 rounded-xl font-bold transition ${filterType === "ALL" ? "bg-purple-500 text-white" : "bg-black/50 text-gray-400 border border-purple-500/20"}`}>ALL</button>
          <button onClick={() => setFilterType("SOLO")} className={`px-4 py-2 rounded-xl font-bold transition ${filterType === "SOLO" ? "bg-orange-500 text-white" : "bg-black/50 text-gray-400 border border-orange-500/20"}`}>SOLO</button>
          <button onClick={() => setFilterType("DUO")} className={`px-4 py-2 rounded-xl font-bold transition ${filterType === "DUO" ? "bg-green-500 text-white" : "bg-black/50 text-gray-400 border border-green-500/20"}`}>DUO</button>
          <button onClick={() => setFilterType("SQUAD")} className={`px-4 py-2 rounded-xl font-bold transition ${filterType === "SQUAD" ? "bg-blue-500 text-white" : "bg-black/50 text-gray-400 border border-blue-500/20"}`}>SQUAD</button>
          <button 
            onClick={async () => {
              setLoadingAction("deleteAll");
              await handleDeleteAllResults();
              setLoadingAction(null);
            }} 
            disabled={loadingAction === "deleteAll"}
            className="px-4 py-2 rounded-xl font-bold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition disabled:opacity-50"
          >
            {loadingAction === "deleteAll" ? "⏳ DELETING..." : "🗑 DELETE ALL"}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-purple-900/20 to-black rounded-2xl p-4 border border-purple-500/20 text-center">
          <p className="text-gray-400 text-sm">Total Tournaments</p>
          <p className="text-3xl font-black text-purple-400">🏆 {matchResults.length}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-900/20 to-black rounded-2xl p-4 border border-yellow-500/20 text-center">
          <p className="text-gray-400 text-sm">Prize Distributed</p>
          <p className="text-3xl font-black text-yellow-400">🪙 {matchResults.reduce((sum, m) => sum + (m.totalDistributed || getTotalDistributed(m.results)), 0)}</p>
        </div>
        <div className="bg-gradient-to-br from-green-900/20 to-black rounded-2xl p-4 border border-green-500/20 text-center">
          <p className="text-gray-400 text-sm">Total Winners</p>
          <p className="text-3xl font-black text-green-400">👥 {matchResults.reduce((sum, m) => sum + (m.results?.length || 0), 0)}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-900/20 to-black rounded-2xl p-4 border border-orange-500/20 text-center">
          <p className="text-gray-400 text-sm">Avg Prize/Match</p>
          <p className="text-3xl font-black text-orange-400">🪙 {matchResults.length > 0 ? Math.floor(matchResults.reduce((sum, m) => sum + (m.totalPrizePool || 0), 0) / matchResults.length) : 0}</p>
        </div>
      </div>

      {/* Results List */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading results...</p>
        </div>
      ) : (
        <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
          {filteredResults.length > 0 ? (
            filteredResults.map((result) => (
              <div key={result.id} className="bg-gradient-to-br from-gray-900/50 to-black rounded-2xl border border-purple-500/20 overflow-hidden">
                {/* Result Header */}
                <div className="bg-gradient-to-r from-purple-900/30 to-transparent p-4 border-b border-purple-500/20">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <h3 className="text-xl font-black text-orange-500">{result.tournamentTitle}</h3>
                      <div className="flex gap-3 mt-1">
                        <span className="text-purple-400 text-sm">🎮 {result.tournamentType}</span>
                        <span className="text-blue-400 text-sm">🗺️ {result.map}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold">Completed</span>
                      <button 
                        onClick={async () => {
                          setLoadingAction(`delete-${result.id}`);
                          await handleDeleteResult(result.id);
                          setLoadingAction(null);
                        }} 
                        disabled={loadingAction === `delete-${result.id}`}
                        className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold hover:bg-red-500/30 transition disabled:opacity-50"
                      >
                        {loadingAction === `delete-${result.id}` ? "⏳" : "🗑"}
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs mt-2">📅 {result.createdAt}</p>
                </div>
                
                {/* Prize Summary */}
                <div className="p-4 border-b border-gray-800">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div><p className="text-gray-500 text-xs">Prize Pool</p><p className="text-yellow-400 font-bold text-lg">🪙 {result.totalPrizePool || 0}</p></div>
                    <div><p className="text-gray-500 text-xs">Winners</p><p className="text-green-400 font-bold text-lg">👥 {result.results?.length || 0}</p></div>
                    <div><p className="text-gray-500 text-xs">Distributed</p><p className="text-purple-400 font-bold text-lg">🪙 {result.totalDistributed || getTotalDistributed(result.results)}</p></div>
                    <div><p className="text-gray-500 text-xs">Remaining</p><p className="text-orange-400 font-bold text-lg">🪙 {(result.totalPrizePool || 0) - (result.totalDistributed || getTotalDistributed(result.results))}</p></div>
                  </div>
                </div>
                
                {/* Winners List - Clickable */}
                <div className="p-4">
                  <p className="text-gray-400 text-xs uppercase mb-3">🏆 WINNERS (Click on any player to see UID)</p>
                  <div className="space-y-2">
                    {result.results?.sort((a, b) => Number(a.position) - Number(b.position)).map((winner, idx) => {
                      const winnerUid = winner.uid || winner.userId || winner.id;
                      const coins = winner.winCoins || playerResults.find(
                        r => (r.tournamentId === result.id || r.tournamentId === result.tournamentId) && r.userId === winnerUid && r.approved
                      )?.winCoins || 0;
                      return (
                        <div 
                          key={idx} 
                          onClick={() => handleUserClick(winner, result.id || result.tournamentId)}
                          className="flex justify-between items-center py-2 px-3 border-b border-gray-800 last:border-0 hover:bg-purple-500/20 rounded-lg cursor-pointer transition-all duration-200"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-16">{getPositionBadge(winner.position)}</span>
                            <span className="text-white font-medium hover:text-purple-400 transition">
                              {winner.name || "Unknown"}
                              <span className="text-gray-500 text-xs ml-2">(Click for UID)</span>
                            </span>
                          </div>
                          <span className="text-green-400 font-bold">🪙 {coins}</span>
                        </div>
                      );
                    })}
                  </div>
                  {result.results?.length > 10 && (
                    <p className="text-center text-gray-500 text-xs mt-3">+ {result.results.length - 10} more winners</p>
                  )}
                  <button onClick={() => { setSelectedTournament(result); setShowDetailsPopup(true); }} className="w-full mt-4 py-2 rounded-xl font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 transition">📋 VIEW FULL DETAILS</button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-black/30 rounded-2xl">
              <p className="text-gray-400 text-lg">No match results found</p>
              <p className="text-gray-500 text-sm mt-2">Complete tournaments will appear here</p>
            </div>
          )}
        </div>
      )}

      {/* User UID Popup - Shows when admin clicks on a user */}
      {showUidPopup && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100]">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 max-w-md w-full mx-4 border border-purple-500/30 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-black text-purple-400">👤 PLAYER DETAILS</h3>
              <button onClick={() => setShowUidPopup(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            
            <div className="space-y-4">
              {/* Player Name */}
              <div className="bg-black/50 rounded-xl p-4">
                <p className="text-gray-400 text-sm">PLAYER NAME</p>
                <p className="text-xl font-bold text-orange-500">{selectedUser.name || "Unknown"}</p>
              </div>
              
              {/* Position */}
              <div className="bg-black/50 rounded-xl p-4">
                <p className="text-gray-400 text-sm">POSITION</p>
                <p className="text-xl font-bold text-yellow-400">
                  {selectedUser.position === 1 ? "🥇 1st Place" : 
                   selectedUser.position === 2 ? "🥈 2nd Place" : 
                   selectedUser.position === 3 ? "🥉 3rd Place" : 
                   `#${selectedUser.position} Place`}
                </p>
              </div>
              
              {/* Tokens Won */}
              <div className="bg-black/50 rounded-xl p-4">
                <p className="text-gray-400 text-sm">TOKENS WON</p>
                <p className="text-2xl font-bold text-green-400">
                  🪙 {(() => {
                    const playerUid = selectedUser.uid || selectedUser.userId || selectedUser.id;
                    return selectedUser.winCoins || playerResults.find(
                      r => r.tournamentId === selectedUser.tournamentId && r.userId === playerUid && r.approved
                    )?.winCoins || 0;
                  })()}
                </p>
              </div>
              
              {/* User UID - Main Focus */}
              <div className="bg-black/50 rounded-xl p-4">
                <p className="text-gray-400 text-sm">🔑 USER UID</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-blue-400 font-mono text-sm break-all">{selectedUser.uid || "N/A"}</p>
                  {selectedUser.uid && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedUser.uid);
                        alert("✅ UID Copied to Clipboard!");
                      }}
                      className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs hover:bg-purple-500/30 transition flex items-center gap-1"
                    >
                      📋 COPY
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowUidPopup(false)}
              className="w-full mt-6 py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 transition"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Full Details Popup */}
      {showDetailsPopup && selectedTournament && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 px-4">
          <div className="bg-[#0a0a0f] w-full max-w-4xl rounded-3xl p-6 border border-purple-500/20 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-purple-500/20">
              <h2 className="text-2xl font-black text-purple-400">🏆 {selectedTournament.tournamentTitle}</h2>
              <button onClick={() => setShowDetailsPopup(false)} className="bg-red-500 text-white px-5 py-2 rounded-2xl font-black">CLOSE</button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-purple-500/10 rounded-2xl">
              <div><p className="text-gray-400 text-xs">Type</p><p className="text-orange-400 font-bold">🎮 {selectedTournament.tournamentType}</p></div>
              <div><p className="text-gray-400 text-xs">Map</p><p className="text-blue-400 font-bold">🗺️ {selectedTournament.map}</p></div>
              <div><p className="text-gray-400 text-xs">Prize Pool</p><p className="text-yellow-400 font-bold">🪙 {selectedTournament.totalPrizePool}</p></div>
              <div><p className="text-gray-400 text-xs">Date</p><p className="text-gray-300 text-sm">{selectedTournament.createdAt}</p></div>
            </div>
            
            <h3 className="text-xl font-black text-green-400 mb-4">🏆 ALL WINNERS (Click on any player to see UID)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 text-gray-400">POSITION</th>
                    <th className="text-left py-3 text-gray-400">PLAYER NAME</th>
                    <th className="text-right py-3 text-gray-400">TOKENS</th>
                   </tr>
                </thead>
                <tbody>
                  {selectedTournament.results?.sort((a, b) => Number(a.position) - Number(b.position)).map((winner, idx) => {
                    const winnerUid = winner.uid || winner.userId || winner.id;
                    const coins = winner.winCoins || playerResults.find(
                      r => (r.tournamentId === selectedTournament.id || r.tournamentId === selectedTournament.tournamentId) && r.userId === winnerUid && r.approved
                    )?.winCoins || 0;
                    return (
                      <tr 
                        key={idx} 
                        onClick={() => handleUserClick(winner, selectedTournament.id || selectedTournament.tournamentId)}
                        className="border-b border-gray-800 hover:bg-purple-500/20 cursor-pointer transition-all duration-200"
                      >
                        <td className="py-3">
                          {winner.position === 1 ? "🥇 1st" : winner.position === 2 ? "🥈 2nd" : winner.position === 3 ? "🥉 3rd" : `#${winner.position}`}
                         </td>
                        <td className="py-3 text-white hover:text-purple-400 transition">
                          {winner.name || "Unknown"}
                          <span className="text-gray-500 text-xs ml-2">(Click)</span>
                         </td>
                        <td className="py-3 text-right text-green-400 font-bold">🪙 {coins}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-700">
                    <td colSpan="2" className="py-3 text-right font-bold text-gray-400">TOTAL:</td>
                    <td className="py-3 text-right text-yellow-400 font-bold">
                      🪙 {selectedTournament.results?.reduce((sum, w) => {
                        const wUid = w.uid || w.userId || w.id;
                        const coins = w.winCoins || playerResults.find(
                          r => (r.tournamentId === selectedTournament.id || r.tournamentId === selectedTournament.tournamentId) && r.userId === wUid && r.approved
                        )?.winCoins || 0;
                        return sum + coins;
                      }, 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <button 
              onClick={async () => {
                setLoadingAction(`deleteFull-${selectedTournament.id}`);
                await handleDeleteResult(selectedTournament.id);
                setLoadingAction(null);
                setShowDetailsPopup(false);
              }} 
              disabled={loadingAction === `deleteFull-${selectedTournament.id}`}
              className="w-full mt-6 py-3 rounded-2xl font-bold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition disabled:opacity-50 disabled:cursor-wait"
            >
              {loadingAction === `deleteFull-${selectedTournament.id}` ? "⏳ DELETING..." : "🗑 DELETE THIS RESULT"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}