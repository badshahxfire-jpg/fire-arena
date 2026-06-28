import { useState } from "react";

export default function CreatePerKillTournament({ onCreateTournament }) {
  const [tournamentTitle, setTournamentTitle] = useState("");
  const [entryFee, setEntryFee] = useState("");
  const [perKillRate, setPerKillRate] = useState("");
  const [booyahBonus, setBooyahBonus] = useState("");
  const [secondBonus, setSecondBonus] = useState("");
  const [thirdBonus, setThirdBonus] = useState("");
  const [totalTeams, setTotalTeams] = useState("48"); // Default to 48 players for FF/PUBG style matches
  const [matchTime, setMatchTime] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [tournamentType, setTournamentType] = useState("SOLO");
  const [selectedMap, setSelectedMap] = useState("Bermuda");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!tournamentTitle || !entryFee || !perKillRate || !booyahBonus || !totalTeams || !matchTime || !matchDate) {
      alert("Please fill all fields");
      return;
    }
    setIsLoading(true);
    try {
      await onCreateTournament({
        tournamentTitle,
        entryFee: Number(entryFee),
        perKillRate: Number(perKillRate),
        booyahBonus: Number(booyahBonus),
        secondBonus: Number(secondBonus || 0),
        thirdBonus: Number(thirdBonus || 0),
        totalTeams: Number(totalTeams),
        matchTime,
        matchDate,
        tournamentType,
        selectedMap,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-20">
      <div className="bg-[#111] rounded-3xl p-4 sm:p-10 border border-orange-500/10 cyber-card">
        <h2 className="text-3xl sm:text-5xl font-black text-orange-500 text-center mb-10 cyber-neon">🔥 CREATE PER KILL TOURNAMENT 🔥</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Tournament Title"
            value={tournamentTitle}
            onChange={(e) => setTournamentTitle(e.target.value)}
            className="bg-black rounded-2xl px-5 py-4 outline-none border border-orange-500/10 text-white col-span-1 sm:col-span-2"
          />
          <input
            type="number"
            placeholder="Entry Fee (in Coins)"
            value={entryFee}
            onChange={(e) => setEntryFee(e.target.value)}
            className="bg-black rounded-2xl px-5 py-4 outline-none border border-orange-500/10 text-white"
          />
          <input
            type="number"
            placeholder="Per Kill Rate (in Coins)"
            value={perKillRate}
            onChange={(e) => setPerKillRate(e.target.value)}
            className="bg-black rounded-2xl px-5 py-4 outline-none border border-orange-500/10 text-white"
          />
          <input
            type="number"
            placeholder="🥇 1st Place / Booyah Bonus (in Coins)"
            value={booyahBonus}
            onChange={(e) => setBooyahBonus(e.target.value)}
            className="bg-black rounded-2xl px-5 py-4 outline-none border border-orange-500/10 text-white"
          />
          <input
            type="number"
            placeholder="🥈 2nd Place Bonus (in Coins) - Optional"
            value={secondBonus}
            onChange={(e) => setSecondBonus(e.target.value)}
            className="bg-black rounded-2xl px-5 py-4 outline-none border border-orange-500/10 text-white"
          />
          <input
            type="number"
            placeholder="🥉 3rd Place Bonus (in Coins) - Optional"
            value={thirdBonus}
            onChange={(e) => setThirdBonus(e.target.value)}
            className="bg-black rounded-2xl px-5 py-4 outline-none border border-orange-500/10 text-white"
          />
          <input
            type="number"
            placeholder="Total Slots (e.g. 48)"
            value={totalTeams}
            onChange={(e) => setTotalTeams(e.target.value)}
            className="bg-black rounded-2xl px-5 py-4 outline-none border border-orange-500/10 text-white"
          />
          <input
            type="date"
            value={matchDate}
            onChange={(e) => setMatchDate(e.target.value)}
            className="bg-black rounded-2xl px-5 py-4 outline-none border border-orange-500/10 text-white"
          />
          <input
            type="time"
            value={matchTime}
            onChange={(e) => setMatchTime(e.target.value)}
            className="bg-black rounded-2xl px-5 py-4 outline-none border border-orange-500/10 text-white"
          />
          <select
            value={tournamentType}
            onChange={(e) => setTournamentType(e.target.value)}
            className="bg-black rounded-2xl px-5 py-4 outline-none border border-orange-500/10 text-white"
          >
            <option value="SOLO">SOLO</option>
            <option value="DUO">DUO</option>
            <option value="SQUAD">SQUAD</option>
          </select>
          <select
            value={selectedMap}
            onChange={(e) => setSelectedMap(e.target.value)}
            className="bg-black rounded-2xl px-5 py-4 outline-none border border-orange-500/10 text-white"
          >
            <option>Bermuda</option>
            <option>Bermuda 2.0</option>
            <option>Kalahari</option>
            <option>Purgatory</option>
            <option>Alpine</option>
            <option>Nexterra</option>
          </select>
        </div>

        {/* Live Earnings Preview Info Box */}
        <div className="bg-black rounded-2xl p-5 border border-orange-500/10 mt-6">
          <h3 className="text-2xl font-black text-orange-400 mb-4">📊 PER KILL WINNINGS SYSTEM</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <p className="text-gray-300">⚔️ Earnings per Kill</p>
              <p className="text-white font-black">🪙 {perKillRate || 0} Coins</p>
            </div>
            <div className="flex justify-between">
              <p className="text-gray-300">🥇 1st Place / Booyah Bonus</p>
              <p className="text-yellow-400 font-black">🪙 {booyahBonus || 0} Coins</p>
            </div>
            <div className="flex justify-between">
              <p className="text-gray-300">🥈 2nd Place Bonus</p>
              <p className="text-gray-300 font-black">🪙 {secondBonus || 0} Coins</p>
            </div>
            <div className="flex justify-between">
              <p className="text-gray-300">🥉 3rd Place Bonus</p>
              <p className="text-orange-400 font-black">🪙 {thirdBonus || 0} Coins</p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-800 text-xs text-gray-400">
              Unlike normal tournaments, this mode does not have a fixed prize pool. Each participant is rewarded individually based on their specific performance details.
            </div>
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={isLoading}
          className={`w-full mt-10 text-black py-5 rounded-2xl text-xl font-black transition-all duration-300 cyber-btn ${
            isLoading
              ? "bg-gray-600 text-gray-300 opacity-50 cursor-wait"
              : "bg-gradient-to-r from-orange-500 to-red-600 hover:scale-105"
          }`}
        >
          {isLoading ? "⏳ CREATING..." : "🚀 CREATE PER KILL TOURNAMENT"}
        </button>
      </div>
    </section>
  );
}
