import React from "react";

export default function WeeklyLeaderboard({ tournament }) {
  if (!tournament || !tournament.registeredTeams || Object.keys(tournament.registeredTeams).length === 0) {
    return (
      <div className="bg-black/40 border border-white/5 rounded-2xl p-8 text-center">
        <p className="text-gray-400">No players registered yet or Leaderboard is empty.</p>
      </div>
    );
  }

  // Convert object to array and sort by rank
  const teamsArray = Object.values(tournament.registeredTeams).sort((a, b) => {
    if (!a.rank) return 1;
    if (!b.rank) return -1;
    return a.rank - b.rank;
  });

  let prizes = [];
  if (tournament.status === "COMPLETED" && tournament.rewardsDistributed) {
    const format = tournament.format || "Solo";
    const entryFee = tournament.entryFee || 50;
    const maxPrizePool = tournament.prizePool || 10000;
    const totalRegisteredPlayers = Object.keys(tournament.registeredTeams).length;
    const totalCollected = totalRegisteredPlayers * entryFee;
    const dynamicPrizePool = Math.floor(totalCollected * 0.80);
    const totalPrizePool = totalRegisteredPlayers > 0 ? dynamicPrizePool : maxPrizePool;

    if (format === "Squad") {
      prizes = [
        Math.floor(totalPrizePool * 0.50), // 1st
        Math.floor(totalPrizePool * 0.30), // 2nd
        Math.floor(totalPrizePool * 0.20)  // 3rd
      ];
    } else if (format === "Duo") {
      const lowestPrize = (entryFee * 2) + 40; // 4th place
      const remainingPool = Math.max(0, totalPrizePool - lowestPrize);
      prizes = [
        Math.floor(remainingPool * 0.50), // 1st
        Math.floor(remainingPool * 0.30), // 2nd
        Math.floor(remainingPool * 0.20), // 3rd
        lowestPrize                       // 4th
      ];
    } else { // Solo
      prizes = [
        Math.floor(totalPrizePool * 0.22), // 1st
        Math.floor(totalPrizePool * 0.15), // 2nd
        Math.floor(totalPrizePool * 0.10), // 3rd
      ];
      for (let i = 0; i < 7; i++) prizes.push(Math.floor(totalPrizePool * 0.038)); // 4th to 10th
      for (let i = 0; i < 10; i++) prizes.push(Math.floor(totalPrizePool * 0.0264)); // 11th to 20th
    }
  }

  const getStatusBadge = (index) => {
    const phase = tournament.status || "REGISTRATION";
    const isSolo = !tournament.format || tournament.format === "Solo";
    
    // Determine dynamic cutoffs based on format
    // Default solo: 48 max. Top 20 Semis, Top 10 Finals
    // Duo: 24 max. Top 12 Semis, Top 6 Finals
    // Squad: 12 max. Top 6 Semis, Top 3 Finals
    let semisCutoff = 20;
    let finalsCutoff = 10;
    
    if (tournament.format === "Duo") {
      semisCutoff = 12;
      finalsCutoff = 6;
    } else if (tournament.format === "Squad") {
      semisCutoff = 6;
      finalsCutoff = 3;
    }

    if (phase === "REGISTRATION") {
      return { text: "REGISTERED", style: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
    }
    if (phase === "QUALIFIER") {
      return index < semisCutoff 
        ? { text: "IN SEMIS ZONE", style: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" }
        : { text: "AT RISK", style: "bg-red-500/20 text-red-400 border-red-500/30" };
    }
    if (phase === "SEMI_FINALS") {
      return index < finalsCutoff
        ? { text: "IN FINALS ZONE", style: "bg-green-500/20 text-green-400 border-green-500/30" }
        : { text: "ELIMINATED", style: "bg-red-500/20 text-red-400 border-red-500/30" };
    }
    if (phase === "FINALS") {
      return index < finalsCutoff
        ? { text: "FINALIST", style: "bg-green-500/20 text-green-400 border-green-500/30" }
        : { text: "ELIMINATED", style: "bg-red-500/20 text-red-400 border-red-500/30" };
    }
    if (phase === "COMPLETED") {
      if (index === 0) return { text: "CHAMPION", style: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
      return index < finalsCutoff
        ? { text: "FINALIST", style: "bg-green-500/20 text-green-400 border-green-500/30" }
        : { text: "ELIMINATED", style: "bg-red-500/20 text-red-400 border-red-500/30" };
    }
    return { text: "PLAYING", style: "bg-gray-500/20 text-gray-400 border-gray-500/30" };
  };

  return (
    <div className="bg-black/40 border border-white/5 rounded-2xl p-6 overflow-hidden">
      <h3 className="text-xl font-black text-white mb-6 border-b border-white/10 pb-2">Tournament Standings</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider">
              <th className="py-3 px-4 font-bold">Rank</th>
              <th className="py-3 px-4 font-bold">{(!tournament.format || tournament.format === "Solo") ? "Player" : "Team"}</th>
              <th className="py-3 px-4 font-bold text-center">Matches</th>
              <th className="py-3 px-4 font-bold text-center">Status</th>
              <th className="py-3 px-4 font-bold text-right">Match Rank</th>
              {tournament.status === "COMPLETED" && tournament.rewardsDistributed && (
                <th className="py-3 px-4 font-bold text-right text-yellow-500">Won (Coins)</th>
              )}
            </tr>
          </thead>
          <tbody>
            {teamsArray.map((team, index) => (
              <tr 
                key={team.userId} 
                className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                  index < 3 ? "bg-gradient-to-r from-orange-500/5 to-transparent" : ""
                }`}
              >
                <td className="py-4 px-4 font-black">
                  {index === 0 && <span className="text-yellow-500 text-xl mr-2">🥇</span>}
                  {index === 1 && <span className="text-gray-400 text-xl mr-2">🥈</span>}
                  {index === 2 && <span className="text-amber-600 text-xl mr-2">🥉</span>}
                  {index > 2 && <span className="text-gray-500 w-8 inline-block text-center">{index + 1}</span>}
                </td>
                <td className="py-4 px-4">
                  <div className="font-bold text-white">
                    {(!tournament.format || tournament.format === "Solo") ? team.inGameName : team.teamName}
                  </div>
                  {(!tournament.format || tournament.format === "Solo") ? (
                    <div className="text-xs text-gray-500">UID: {team.gameUid}</div>
                  ) : (
                    <div className="text-xs text-gray-400 mt-1 space-y-1">
                      <div>L: {team.inGameName}</div>
                      {team.teammates?.map((tm, idx) => (
                        <div key={idx}>T{idx+1}: {tm.inGameName}</div>
                      ))}
                    </div>
                  )}
                </td>
                <td className="py-4 px-4 text-center font-bold text-gray-300">
                  {team.matchesPlayed || 0}
                </td>
                <td className="py-4 px-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(index).style}`}>
                    {getStatusBadge(index).text}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="font-black text-xl text-orange-500">{team.rank ? `#${team.rank}` : '-'}</span>
                </td>
                {tournament.status === "COMPLETED" && tournament.rewardsDistributed && (
                  <td className="py-4 px-4 text-right">
                    {team.rank && index < prizes.length ? (
                      <span className="font-black text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded border border-yellow-500/20">
                        🏆 {prizes[index]}
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
