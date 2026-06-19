import { useState } from "react";
import { getPrizeDistribution } from "../../utils/prizeDistribution";

export default function CreateTournament({ onCreateTournament }) {
  const [tournamentTitle, setTournamentTitle] = useState("");
  const [entryFee, setEntryFee] = useState("");
  const [totalTeams, setTotalTeams] = useState("");
  const [matchTime, setMatchTime] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [tournamentType, setTournamentType] = useState("SOLO");
  const [selectedMap, setSelectedMap] = useState("Bermuda");

  const fee = Number(entryFee || 0);
  const players = Number(totalTeams || 0);
  const totalCollection = fee * players;
  const adminProfit = Math.floor(totalCollection * 0.10);
  const totalPrizePool = totalCollection - adminProfit;
  
  const { rewards: prizeDistribution } = getPrizeDistribution(totalPrizePool, players, tournamentType, fee);

  const handleCreate = () => {
    if (!tournamentTitle || !entryFee || !totalTeams || !matchTime || !matchDate) {
      alert("Please fill all fields");
      return;
    }
    onCreateTournament({
      tournamentTitle,
      entryFee,
      totalTeams,
      matchTime,
      matchDate,
      tournamentType,
      selectedMap,
      adminProfit,
      totalPrizePool,
    });
  };

  const getWinnerCountText = () => {
    const players = Number(totalTeams);
    if (tournamentType === "SOLO") {
      if (players >= 40) return "🏆 TOP 20 WINNERS";
      if (players >= 35) return "🏆 TOP 16 WINNERS";
      if (players >= 30) return "🏆 TOP 14 WINNERS";
      if (players >= 20) return "🏆 TOP 10 WINNERS";
      if (players >= 15) return "🏆 TOP 8 WINNERS";
      if (players >= 10) return "🏆 TOP 5 WINNERS";
      return "🏆 TOP 3 WINNERS";
    }
    if (tournamentType === "DUO") return "🏆 TOP 4 TEAMS";
    if (tournamentType === "SQUAD") return "🏆 TOP 3 SQUADS";
    if (tournamentType === "1V1") return "🏆 WINNER TAKES ALL";
    if (tournamentType === "1V2") return "🏆 BOTH TEAMS WIN";
    if (tournamentType === "3V3") return "🏆 WINNING TEAM";
    if (tournamentType === "4V4") return "🏆 WINNING TEAM";
    return "🏆 WINNERS";
  };

  // FIXED: Calculate total distributed correctly
  const getTotalDistributed = () => {
    let total = 0;
    prizeDistribution.forEach(prize => {
      if (prize.perTeam) {
        // For DUO and SQUAD modes - perTeam is the total for that team
        total += prize.perTeam;
      } else if (prize.coins) {
        // For single positions
        total += prize.coins;
      } else if (prize.perPlayer && prize.count) {
        // For ranges like Top 4-5, Top 6-10 etc.
        total += prize.perPlayer * prize.count;
      } else if (prize.perPlayer) {
        total += prize.perPlayer;
      }
    });
    return total;
  };

  // Helper to display prize with multiplication info
  const renderPrize = (prize) => {
    if (prize.perTeam) {
      // For DUO and SQUAD modes
      return (
        <span className="text-green-400 font-bold">
          🪙 {prize.perTeam} Team / 🪙 {prize.perPlayer} Player
        </span>
      );
    } else if (prize.count && prize.count > 1) {
      // For ranges like Top 4-5, Top 6-10 etc.
      return (
        <span className="text-green-400 font-bold">
          🪙 {prize.perPlayer} × {prize.count} players = 🪙 {prize.perPlayer * prize.count}
        </span>
      );
    } else {
      // For single positions
      return (
        <span className="text-green-400 font-bold">
          🪙 {prize.coins}
        </span>
      );
    }
  };

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-20">
      <div className="bg-[#111] rounded-3xl p-4 sm:p-10 border border-orange-500/10 cyber-card">
        <h2 className="text-3xl sm:text-5xl font-black text-orange-500 text-center mb-10 cyber-neon">🔥 CREATE TOURNAMENT 🔥</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Tournament Title"
            value={tournamentTitle}
            onChange={(e) => setTournamentTitle(e.target.value)}
            className="bg-black rounded-2xl px-5 py-4 outline-none border border-orange-500/10 col-span-1 sm:col-span-2"
          />
          <input
            type="number"
            placeholder="Entry Fee (in Coins)"
            value={entryFee}
            onChange={(e) => setEntryFee(e.target.value)}
            className="bg-black rounded-2xl px-5 py-4 outline-none border border-orange-500/10"
          />
          <input
            type="number"
            placeholder="Total Players"
            value={totalTeams}
            onChange={(e) => setTotalTeams(e.target.value)}
            className="bg-black rounded-2xl px-5 py-4 outline-none border border-orange-500/10"
          />
          <input
            type="date"
            value={matchDate}
            onChange={(e) => setMatchDate(e.target.value)}
            className="bg-black rounded-2xl px-5 py-4 outline-none border border-orange-500/10"
          />
          <input
            type="time"
            value={matchTime}
            onChange={(e) => setMatchTime(e.target.value)}
            className="bg-black rounded-2xl px-5 py-4 outline-none border border-orange-500/10"
          />
          <select
            value={tournamentType}
            onChange={(e) => setTournamentType(e.target.value)}
            className="bg-black rounded-2xl px-5 py-4 outline-none border border-orange-500/10"
          >
            <option value="SOLO">SOLO</option>
            <option value="DUO">DUO</option>
            <option value="SQUAD">SQUAD</option>
            <option value="1V1">1V1</option>
            <option value="1V2">1V2</option>
            <option value="2V2">2V2</option>
            <option value="3V3">3V3</option>
            <option value="4V4">4V4</option>
          </select>
          <select
            value={selectedMap}
            onChange={(e) => setSelectedMap(e.target.value)}
            className="bg-black rounded-2xl px-5 py-4 outline-none border border-orange-500/10"
          >
            <option>Bermuda</option>
            <option>Bermuda 2.0</option>
            <option>Kalahari</option>
            <option>Purgatory</option>
            <option>Alpine</option>
            <option>Nexterra</option>
          </select>
        </div>

        {/* Prize Distribution Preview */}
        <div className="bg-black rounded-2xl p-5 border border-orange-500/10 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-black text-orange-400">🏆 PRIZE DISTRIBUTION</h3>
            <span className="text-sm text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full">
              {getWinnerCountText()}
            </span>
          </div>
          
          <div className="space-y-2 mb-4 pb-3 border-b border-gray-800">
            <div className="flex justify-between">
              <p className="text-gray-300">💰 Total Collection (100%)</p>
              <p className="text-white font-black">🪙 {totalCollection}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-gray-300">🏢 Admin Profit (10%)</p>
              <p className="text-yellow-400 font-black">🪙 {adminProfit}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-gray-300">🎯 Prize Pool (90%)</p>
              <p className="text-orange-400 font-black text-xl cyber-prize">🪙 {totalPrizePool}</p>
            </div>
          </div>
          
          <div className="mt-4">
            <p className="text-green-400 text-sm mb-3">📊 Winners Prize Distribution:</p>
            <div className="space-y-2">
              {prizeDistribution.map((prize, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">
                    {prize.label}
                    <span className="text-gray-500 text-xs ml-2">({prize.percent}%)</span>
                  </span>
                  {renderPrize(prize)}
                </div>
              ))}
            </div>
          </div>
          
          {/* Total Distributed - Now Correct */}
          <div className="mt-4 pt-3 border-t border-green-500/20 bg-green-500/5 rounded-lg p-2">
            <div className="flex justify-between items-center">
              <span className="text-green-400 text-sm font-bold">✅ Total Prize Distributed</span>
              <span className="text-green-400 font-bold text-lg">🪙 {getTotalDistributed()}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-gray-500 text-xs">Prize Pool</span>
              <span className="text-yellow-400 text-sm">🪙 {totalPrizePool}</span>
            </div>
            {getTotalDistributed() === totalPrizePool ? (
              <div className="text-green-500 text-xs text-center mt-2">
                ✓ Complete distribution! All {totalPrizePool} coins distributed.
              </div>
            ) : (
              <div className="text-yellow-500 text-xs text-center mt-2">
                ⚠️ Remaining: 🪙 {totalPrizePool - getTotalDistributed()} coins (will be added to top positions)
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleCreate}
          className="w-full mt-10 bg-gradient-to-r from-orange-500 to-red-600 text-black py-5 rounded-2xl text-xl font-black hover:scale-105 duration-300 cyber-btn"
        >
          🚀 CREATE TOURNAMENT
        </button>
      </div>
    </section>
  );
}