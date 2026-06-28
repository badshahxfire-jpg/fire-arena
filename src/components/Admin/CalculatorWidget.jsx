import React, { useState } from 'react';

export default function CalculatorWidget({ onClose }) {
  const [calcMode, setCalcMode] = useState('weekly'); // survival, perkill, weekly
  const [format, setFormat] = useState('Solo'); // Solo, Duo, Squad
  const [entryFee, setEntryFee] = useState(50);
  const [totalPlayers, setTotalPlayers] = useState(192);
  const [prizePool, setPrizePool] = useState(300); // For survival
  const [perKillPrize, setPerKillPrize] = useState(5); // For perkill
  const [winnerPrize, setWinnerPrize] = useState(0); // For perkill
  
  // Calculations
  const totalCollection = Number(entryFee) * Number(totalPlayers);
  
  let totalDistributed = 0;
  if (calcMode === 'survival') {
    totalDistributed = Number(prizePool);
  } else if (calcMode === 'weekly') {
    // Weekly logic: Solo distributes 90%, Duo/Squad distributes 80%
    const adminCut = format === 'Solo' ? 0.90 : 0.80;
    totalDistributed = Math.floor(totalCollection * adminCut);
  } else if (calcMode === 'perkill') {
    const totalKills = Number(totalPlayers) - 1;
    totalDistributed = (totalKills * Number(perKillPrize)) + Number(winnerPrize);
  }

  const adminProfit = totalCollection - totalDistributed;
  const profitMargin = totalCollection > 0 ? ((adminProfit / totalCollection) * 100).toFixed(1) : 0;

  return (
    <div className="fixed bottom-24 right-6 z-[999] animate-fade-in-up">
      <div className="bg-[#111] border-2 border-orange-500/50 rounded-3xl p-5 shadow-[0_0_40px_rgba(249,115,22,0.3)] w-80 cyber-card relative">
        <button 
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full font-black flex items-center justify-center border-2 border-[#111] shadow-lg"
        >
          ✕
        </button>
        
        <h3 className="text-orange-500 font-black text-center mb-4">🏆 PROFIT CALCULATOR</h3>

        {/* Mode Selector */}
        <div className="flex gap-1 bg-black p-1 rounded-xl mb-4 border border-white/10">
          <button onClick={() => setCalcMode('survival')} className={`flex-1 text-xs py-2 font-bold rounded-lg transition-all ${calcMode === 'survival' ? 'bg-orange-500 text-black' : 'text-gray-400'}`}>SURVIVAL</button>
          <button onClick={() => setCalcMode('perkill')} className={`flex-1 text-xs py-2 font-bold rounded-lg transition-all ${calcMode === 'perkill' ? 'bg-orange-500 text-black' : 'text-gray-400'}`}>PER KILL</button>
          <button onClick={() => setCalcMode('weekly')} className={`flex-1 text-xs py-2 font-bold rounded-lg transition-all ${calcMode === 'weekly' ? 'bg-orange-500 text-black' : 'text-gray-400'}`}>WEEKLY</button>
        </div>

        {calcMode === 'weekly' && (
          <div className="flex justify-center gap-2 mb-4">
            <button onClick={() => setFormat('Solo')} className={`px-3 py-1 rounded text-xs font-bold ${format === 'Solo' ? 'bg-blue-500 text-black' : 'bg-black text-gray-400 border border-white/10'}`}>SOLO (90% Dist)</button>
            <button onClick={() => setFormat('Duo')} className={`px-3 py-1 rounded text-xs font-bold ${format === 'Duo' ? 'bg-blue-500 text-black' : 'bg-black text-gray-400 border border-white/10'}`}>DUO (80% Dist)</button>
            <button onClick={() => setFormat('Squad')} className={`px-3 py-1 rounded text-xs font-bold ${format === 'Squad' ? 'bg-blue-500 text-black' : 'bg-black text-gray-400 border border-white/10'}`}>SQUAD (80% Dist)</button>
          </div>
        )}

        {/* Inputs */}
        <div className="space-y-3 mb-5">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm font-bold">Entry Fee (🪙)</span>
            <input type="number" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} className="w-24 bg-black border border-orange-500/30 text-orange-400 font-bold px-2 py-1 rounded text-right focus:outline-none focus:border-orange-500" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm font-bold">Total Players</span>
            <input type="number" value={totalPlayers} onChange={(e) => setTotalPlayers(e.target.value)} className="w-24 bg-black border border-blue-500/30 text-blue-400 font-bold px-2 py-1 rounded text-right focus:outline-none focus:border-blue-500" />
          </div>

          {calcMode === 'perkill' && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm font-bold">Per Kill Prize</span>
                <input type="number" value={perKillPrize} onChange={(e) => setPerKillPrize(e.target.value)} className="w-24 bg-black border border-green-500/30 text-green-400 font-bold px-2 py-1 rounded text-right focus:outline-none focus:border-green-500" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm font-bold">Winner Prize</span>
                <input type="number" value={winnerPrize} onChange={(e) => setWinnerPrize(e.target.value)} className="w-24 bg-black border border-yellow-500/30 text-yellow-400 font-bold px-2 py-1 rounded text-right focus:outline-none focus:border-yellow-500" />
              </div>
            </>
          )}
          
          {calcMode === 'survival' && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm font-bold">Prize Pool</span>
              <input type="number" value={prizePool} onChange={(e) => setPrizePool(e.target.value)} className="w-24 bg-black border border-pink-500/30 text-pink-400 font-bold px-2 py-1 rounded text-right focus:outline-none focus:border-pink-500" />
            </div>
          )}
        </div>

        {/* Results */}
        <div className="bg-black/80 rounded-2xl p-4 border border-white/5 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400 text-xs font-bold">Total Collection:</span>
            <span className="text-white font-black text-sm">🪙 {totalCollection}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400 text-xs font-bold">Max Distribution:</span>
            <span className="text-red-400 font-black text-sm">🪙 {totalDistributed}</span>
          </div>
          <div className="h-px bg-white/10 my-2"></div>
          <div className="flex justify-between items-end">
            <span className="text-gray-400 text-xs font-bold">Admin Profit:</span>
            <div className="text-right">
              <span className={`font-black text-xl ${adminProfit >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                {adminProfit >= 0 ? '+ 🪙' : '- 🪙'} {Math.abs(adminProfit)}
              </span>
              <p className={`text-[10px] ${adminProfit >= 0 ? 'text-green-500/70' : 'text-red-500/70'} font-bold`}>
                Margin: {profitMargin}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
