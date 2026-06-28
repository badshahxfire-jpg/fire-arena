// src/utils/prizeDistribution.js

export const getPrizeDistribution = (totalPrizePool, totalPlayers, tournamentType, entryFee = 0) => {
  const pool = Number(totalPrizePool);
  const players = Number(totalPlayers);
  let rewards = [];
  let winnerCount = 0;

  if (tournamentType === "SOLO") {
    if (players >= 40) {
      winnerCount = 20;
      rewards = [
        { label: "🥇 Top 1", percent: 12, position: 1, count: 1 },
        { label: "🥈 Top 2", percent: 10, position: 2, count: 1 },
        { label: "🥉 Top 3", percent: 8, position: 3, count: 1 },
        { label: "🏅 Top 4-5", percent: 5, position: "4-5", count: 2 },
        { label: "🔥 Top 6-10", percent: 4, position: "6-10", count: 5 },
        { label: "⚡ Top 11-15", percent: 3.5, position: "11-15", count: 5 },
        { label: "✨ Top 16-20", percent: 3, position: "16-20", count: 5 }
      ];
    } 
    else if (players >= 35) {
      winnerCount = 16;
      rewards = [
        { label: "🥇 Top 1", percent: 12, position: 1, count: 1 },
        { label: "🥈 Top 2", percent: 10, position: 2, count: 1 },
        { label: "🥉 Top 3", percent: 8, position: 3, count: 1 },
        { label: "🏅 Top 4-5", percent: 5, position: "4-5", count: 2 },
        { label: "🔥 Top 6-10", percent: 4, position: "6-10", count: 5 },
        { label: "⚡ Top 11-15", percent: 4, position: "11-15", count: 5 },
        { label: "✨ Top 16", percent: 3, position: 16, count: 1 }
      ];
    }
    else if (players >= 30) {
      winnerCount = 14;
      rewards = [
        { label: "🥇 Top 1", percent: 12, position: 1, count: 1 },
        { label: "🥈 Top 2", percent: 10, position: 2, count: 1 },
        { label: "🥉 Top 3", percent: 8, position: 3, count: 1 },
        { label: "🏅 Top 4-5", percent: 5, position: "4-5", count: 2 },
        { label: "🔥 Top 6-10", percent: 4, position: "6-10", count: 5 },
        { label: "⚡ Top 11-14", percent: 4, position: "11-14", count: 4 }
      ];
    }
    else if (players >= 20) {
      winnerCount = 10;
      rewards = [
        { label: "🥇 Top 1", percent: 20, position: 1, count: 1 },
        { label: "🥈 Top 2", percent: 15, position: 2, count: 1 },
        { label: "🥉 Top 3", percent: 10, position: 3, count: 1 },
        { label: "🏅 Top 4-5", percent: 8, position: "4-5", count: 2 },
        { label: "🔥 Top 6-10", percent: 4, position: "6-10", count: 5 }
      ];
    }
    else if (players >= 15) {
      winnerCount = 8;
      rewards = [
        { label: "🥇 Top 1", percent: 20, position: 1, count: 1 },
        { label: "🥈 Top 2", percent: 15, position: 2, count: 1 },
        { label: "🥉 Top 3", percent: 12, position: 3, count: 1 },
        { label: "🏅 Top 4", percent: 10, position: 4, count: 1 },
        { label: "🔥 Top 5", percent: 9, position: 5, count: 1 },
        { label: "⚡ Top 6", percent: 8, position: 6, count: 1 },
        { label: "✨ Top 7", percent: 7, position: 7, count: 1 },
        { label: "💫 Top 8", percent: 6, position: 8, count: 1 }
      ];
    }
    else if (players >= 10) {
      winnerCount = 5;
      rewards = [
        { label: "🥇 Top 1", percent: 30, position: 1, count: 1 },
        { label: "🥈 Top 2", percent: 25, position: 2, count: 1 },
        { label: "🥉 Top 3", percent: 20, position: 3, count: 1 },
        { label: "🏅 Top 4", percent: 15, position: 4, count: 1 },
        { label: "🔥 Top 5", percent: 10, position: 5, count: 1 }
      ];
    }
    else {
      winnerCount = 3;
      rewards = [
        { label: "🥇 Top 1", percent: 50, position: 1, count: 1 },
        { label: "🥈 Top 2", percent: 30, position: 2, count: 1 },
        { label: "🥉 Top 3", percent: 20, position: 3, count: 1 }
      ];
    }
  }
  else if (tournamentType === "DUO") {
    if (players >= 48) {
      winnerCount = 10;
      rewards = [
        { label: "🥇 Team #1", percent: 20, position: 1, count: 1, teamSize: 2 },
        { label: "🥈 Team #2", percent: 15, position: 2, count: 1, teamSize: 2 },
        { label: "🥉 Team #3", percent: 10, position: 3, count: 1, teamSize: 2 },
        { label: "🏅 Team #4-5", percent: 8, position: "4-5", count: 2, teamSize: 2 },
        { label: "🔥 Team #6-10", percent: 5, position: "6-10", count: 5, teamSize: 2 }
      ];
    } else if (players >= 40) {
      winnerCount = 8;
      rewards = [
        { label: "🥇 Team #1", percent: 22, position: 1, count: 1, teamSize: 2 },
        { label: "🥈 Team #2", percent: 16, position: 2, count: 1, teamSize: 2 },
        { label: "🥉 Team #3", percent: 12, position: 3, count: 1, teamSize: 2 },
        { label: "🏅 Team #4-5", percent: 9, position: "4-5", count: 2, teamSize: 2 },
        { label: "🔥 Team #6-8", percent: 6, position: "6-8", count: 3, teamSize: 2 }
      ];
    } else if (players >= 30) {
      winnerCount = 6;
      rewards = [
        { label: "🥇 Team #1", percent: 25, position: 1, count: 1, teamSize: 2 },
        { label: "🥈 Team #2", percent: 18, position: 2, count: 1, teamSize: 2 },
        { label: "🥉 Team #3", percent: 14, position: 3, count: 1, teamSize: 2 },
        { label: "🏅 Team #4-6", percent: 10, position: "4-6", count: 3, teamSize: 2 }
      ];
    } else if (players >= 20) {
      winnerCount = 4;
      rewards = [
        { label: "🥇 Team #1", percent: 40, position: 1, count: 1, teamSize: 2 },
        { label: "🥈 Team #2", percent: 30, position: 2, count: 1, teamSize: 2 },
        { label: "🥉 Team #3", percent: 20, position: 3, count: 1, teamSize: 2 },
        { label: "🏅 Team #4", percent: 10, position: 4, count: 1, teamSize: 2 }
      ];
    } else {
      winnerCount = 2;
      rewards = [
        { label: "🥇 Team #1", percent: 60, position: 1, count: 1, teamSize: 2 },
        { label: "🥈 Team #2", percent: 40, position: 2, count: 1, teamSize: 2 }
      ];
    }
  }
  else if (tournamentType === "2V2") {
    winnerCount = 1;
    rewards = [
      { label: "🥇 Winning Team", percent: 100, position: 1, count: 1, teamSize: 2 }
    ];
  }
  else if (tournamentType === "SQUAD") {
    if (players >= 48) {
      winnerCount = 5;
      rewards = [
        { label: "🥇 Squad #1", percent: 35, position: 1, count: 1, teamSize: 4 },
        { label: "🥈 Squad #2", percent: 25, position: 2, count: 1, teamSize: 4 },
        { label: "🥉 Squad #3", percent: 18, position: 3, count: 1, teamSize: 4 },
        { label: "🏅 Squad #4", percent: 12, position: 4, count: 1, teamSize: 4 },
        { label: "🔥 Squad #5", percent: 10, position: 5, count: 1, teamSize: 4 }
      ];
    }
    else if (players >= 32) {
      winnerCount = 4;
      rewards = [
        { label: "🥇 Squad #1", percent: 40, position: 1, count: 1, teamSize: 4 },
        { label: "🥈 Squad #2", percent: 30, position: 2, count: 1, teamSize: 4 },
        { label: "🥉 Squad #3", percent: 20, position: 3, count: 1, teamSize: 4 },
        { label: "🏅 Squad #4", percent: 10, position: 4, count: 1, teamSize: 4 }
      ];
    }
    else if (players >= 24) {
      winnerCount = 3;
      rewards = [
        { label: "🥇 Squad #1", percent: 50, position: 1, count: 1, teamSize: 4 },
        { label: "🥈 Squad #2", percent: 30, position: 2, count: 1, teamSize: 4 },
        { label: "🥉 Squad #3", percent: 20, position: 3, count: 1, teamSize: 4 }
      ];
    }
    else if (players >= 16) {
      winnerCount = 2;
      rewards = [
        { label: "🥇 Squad #1", percent: 60, position: 1, count: 1, teamSize: 4 },
        { label: "🥈 Squad #2", percent: 40, position: 2, count: 1, teamSize: 4 }
      ];
    }
    else {
      winnerCount = 1;
      rewards = [
        { label: "🥇 Squad #1", percent: 100, position: 1, count: 1, teamSize: 4 }
      ];
    }
  }
  else if (tournamentType === "1V1") {
    winnerCount = 1;
    rewards = [
      { label: "👑 Winner", percent: 100, position: 1, count: 1 }
    ];
  }
  else if (tournamentType === "3V3") {
    winnerCount = 1;
    rewards = [
      { label: "🥇 Winning Team", percent: 100, position: 1, count: 1, teamSize: 3 }
    ];
  }
  else if (tournamentType === "1V2") {
    winnerCount = 2;
    rewards = [
      { label: "🥇 Winner Team", percent: 50, position: 1, count: 1, teamSize: 2 },
      { label: "🥈 Runner Up", percent: 50, position: 2, count: 1, teamSize: 2 }
    ];
  }
  else if (tournamentType === "2V2") {
    winnerCount = 1;
    rewards = [
      { label: "🏆 Winning Team", percent: 100, position: 1, count: 1, teamSize: 2 }
    ];
  }
  else if (tournamentType === "3V3") {
    winnerCount = 1;
    rewards = [
      { label: "👑 Winning Team", percent: 100, position: 1, count: 1, teamSize: 3 }
    ];
  }
  else if (tournamentType === "4V4") {
    winnerCount = 1;
    rewards = [
      { label: "🏆 Winning Team", percent: 100, position: 1, count: 1, teamSize: 4 }
    ];
  }

  // Calculate base coins for each reward
  let calculatedRewards = [];
  let totalCalculated = 0;
  
  for (let reward of rewards) {
    let coinAmount = Math.floor(pool * (reward.percent / 100));
    calculatedRewards.push({
      ...reward,
      coinAmount: coinAmount,
      totalAmount: coinAmount * reward.count
    });
    totalCalculated += coinAmount * reward.count;
  }
  
  // Calculate remaining amount
  let remainingAmount = pool - totalCalculated;
  
  // Distribute remaining equally to all winners
  if (remainingAmount > 0) {
    let totalWinners = 0;
    for (let reward of rewards) {
      totalWinners += reward.count;
    }
    
    let extraPerWinner = Math.floor(remainingAmount / totalWinners);
    let remainingExtra = remainingAmount % totalWinners;
    
    // Add extra to each reward group
    for (let i = 0; i < calculatedRewards.length; i++) {
      let extraForGroup = extraPerWinner * calculatedRewards[i].count;
      if (remainingExtra > 0) {
        extraForGroup += Math.min(remainingExtra, calculatedRewards[i].count);
        remainingExtra -= Math.min(remainingExtra, calculatedRewards[i].count);
      }
      let extraPerPlayer = Math.floor(extraForGroup / calculatedRewards[i].count);
      calculatedRewards[i].coinAmount += extraPerPlayer;
      calculatedRewards[i].totalAmount = calculatedRewards[i].coinAmount * calculatedRewards[i].count;
    }
  }
  
  // Apply entryFee minimum logic for SOLO, DUO, and SQUAD
  const minPrizePerPlayer = (tournamentType === "SOLO" || tournamentType === "DUO" || tournamentType === "SQUAD") ? Number(entryFee) : 0;
  if (minPrizePerPlayer > 0 && calculatedRewards.length > 0) {
    const totalWinningPlayers = calculatedRewards.reduce((sum, r) => sum + r.count * (r.teamSize || 1), 0);
    const totalMinRequired = totalWinningPlayers * minPrizePerPlayer;
    
    if (totalMinRequired > pool) {
      // The pool is not enough to give everyone the minimum.
      // Distribute the pool as equally as possible.
      let equalShare = Math.floor(pool / totalWinningPlayers);
      let remainder = pool % totalWinningPlayers;
      
      for (let i = 0; i < calculatedRewards.length; i++) {
        let groupSize = calculatedRewards[i].count * (calculatedRewards[i].teamSize || 1);
        let groupExtra = 0;
        if (remainder > 0) {
          groupExtra = Math.min(remainder, groupSize);
          remainder -= groupExtra;
        }
        
        let groupTotal = equalShare * groupSize + groupExtra;
        calculatedRewards[i].coinAmount = Math.floor(groupTotal / calculatedRewards[i].count);
        calculatedRewards[i].totalAmount = groupTotal;
      }
    } else {
      let groupMins = calculatedRewards.map(r => (r.teamSize || 1) * minPrizePerPlayer * r.count);
      let totalExtraNeeded = 0;
      let extras = [];
      
      for (let i = 0; i < calculatedRewards.length; i++) {
        let currentTotal = calculatedRewards[i].coinAmount * calculatedRewards[i].count;
        let minTotal = groupMins[i];
        let extra = Math.max(0, currentTotal - minTotal);
        extras.push(extra);
        totalExtraNeeded += extra;
      }
      
      let allowedExtra = pool - totalMinRequired;
      
      if (totalExtraNeeded > 0) {
        let scale = allowedExtra / totalExtraNeeded;
        let spent = totalMinRequired;
        
        for (let i = 0; i < calculatedRewards.length; i++) {
          let extra = extras[i];
          let scaledExtra = Math.floor(extra * scale);
          let groupTotal = groupMins[i] + scaledExtra;
          
          calculatedRewards[i].coinAmount = Math.floor(groupTotal / calculatedRewards[i].count);
          calculatedRewards[i].totalAmount = groupTotal;
          spent += scaledExtra;
        }
        
        let remainder = pool - spent;
        let idx = 0;
        while (remainder > 0 && idx < calculatedRewards.length) {
          calculatedRewards[idx].totalAmount += 1;
          calculatedRewards[idx].coinAmount = Math.floor(calculatedRewards[idx].totalAmount / calculatedRewards[idx].count);
          remainder--;
          idx++;
        }
      } else {
        let spent = totalMinRequired;
        for (let i = 0; i < calculatedRewards.length; i++) {
          calculatedRewards[i].coinAmount = (calculatedRewards[i].teamSize || 1) * minPrizePerPlayer;
          calculatedRewards[i].totalAmount = calculatedRewards[i].coinAmount * calculatedRewards[i].count;
        }
        let remainder = pool - spent;
        let idx = 0;
        while (remainder > 0 && idx < calculatedRewards.length) {
          calculatedRewards[idx].totalAmount += 1;
          calculatedRewards[idx].coinAmount = Math.floor(calculatedRewards[idx].totalAmount / calculatedRewards[idx].count);
          remainder--;
          idx++;
        }
      }
    }
  }
  
  // Format final rewards
  const finalRewards = calculatedRewards.map(reward => {
    if (reward.teamSize) {
      return {
        label: reward.label,
        percent: reward.percent,
        position: reward.position,
        perTeam: reward.totalAmount,
        perPlayer: Math.floor(reward.totalAmount / reward.teamSize),
        count: reward.count
      };
    } else {
      return {
        label: reward.label,
        percent: reward.percent,
        position: reward.position,
        perPlayer: reward.coinAmount,
        coins: reward.coinAmount,
        count: reward.count
      };
    }
  });
  
  return { winnerCount, rewards: finalRewards, totalPrizePool: pool, totalPlayers: players };
};

// Get prize for a specific position
export const getPrizeByPosition = (totalPrizePool, position, totalPlayers, tournamentType, entryFee = 0) => {
  const { rewards } = getPrizeDistribution(totalPrizePool, totalPlayers, tournamentType, entryFee);
  
  for (let reward of rewards) {
    if (typeof reward.position === 'string' && reward.position.includes('-')) {
      const [start, end] = reward.position.split('-').map(Number);
      if (position >= start && position <= end) {
        return reward.perPlayer || reward.coins || 0;
      }
    } else if (reward.position === position) {
      return reward.perPlayer || reward.coins || 0;
    }
  }
  return 0;
};

// Calculate final distribution for approved players (last gets remaining)
export const calculateFinalDistribution = (totalPrizePool, approvedPlayers, tournamentType, totalPlayers, entryFee = 0) => {
  const pool = Number(totalPrizePool);
  const approvedCount = approvedPlayers.length;
  
  if (tournamentType === "SOLO") {
    return approvedPlayers.map(player => {
      const position = Number(player.approvedPosition);
      const winCoins = getPrizeByPosition(pool, position, totalPlayers, tournamentType, entryFee);
      return { ...player, winCoins };
    });
  }
  
  if (approvedCount === 1) {
    return [{ ...approvedPlayers[0], winCoins: pool }];
  }
  
  const sortedPlayers = [...approvedPlayers].sort((a, b) => Number(a.approvedPosition) - Number(b.approvedPosition));
  let distribution = [];
  let remainingPool = pool;
  const minPrize = (tournamentType === "SOLO" || tournamentType === "DUO") ? (Number(entryFee) + 5) : 0;
  
  for (let i = 0; i < sortedPlayers.length; i++) {
    const player = sortedPlayers[i];
    const position = Number(player.approvedPosition);
    let winCoins;
    
    if (i === sortedPlayers.length - 1) {
      winCoins = remainingPool;
    } else {
      winCoins = getPrizeByPosition(pool, position, totalPlayers, tournamentType, entryFee);
      if (minPrize > 0 && winCoins > 0) {
        winCoins = Math.max(winCoins, minPrize);
      }
      if (winCoins > remainingPool) winCoins = remainingPool;
      remainingPool -= winCoins;
    }
    
    if (minPrize > 0 && winCoins > 0) {
      winCoins = Math.max(winCoins, minPrize);
    }
    
    distribution.push({ ...player, winCoins });
  }
  
  // DUO adjustment to prevent negative remaining pool
  if (tournamentType === "DUO") {
    let totalSpent = distribution.reduce((sum, p) => sum + p.winCoins, 0);
    if (totalSpent > pool) {
      let totalExtra = distribution.reduce((sum, p) => sum + Math.max(0, p.winCoins - minPrize), 0);
      let allowedExtra = pool - (distribution.length * minPrize);
      
      if (allowedExtra < 0) {
        const equalShare = Math.floor(pool / distribution.length);
        let remainder = pool % distribution.length;
        distribution.forEach((p, idx) => {
          p.winCoins = equalShare + (idx < remainder ? 1 : 0);
        });
      } else if (totalExtra > 0) {
        const scale = allowedExtra / totalExtra;
        let spent = distribution.length * minPrize;
        
        distribution.forEach(p => {
          const extra = Math.max(0, p.winCoins - minPrize);
          p.winCoins = minPrize + Math.floor(extra * scale);
          spent += Math.floor(extra * scale);
        });
        
        let remainder = pool - spent;
        let idx = 0;
        while (remainder > 0 && idx < distribution.length) {
          distribution[idx].winCoins += 1;
          remainder--;
          idx++;
        }
      } else {
        const equalShare = Math.floor(pool / distribution.length);
        let remainder = pool % distribution.length;
        distribution.forEach((p, idx) => {
          p.winCoins = equalShare + (idx < remainder ? 1 : 0);
        });
      }
    }
  }
  
  return distribution;
};