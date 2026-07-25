import { useState } from "react";
import paymentQR from "../../assets/paymentQR.png";

export default function WalletPopup({ user, coins, winCoins, onClose, onTopup, onShowWithdraw, onShowCoinHistory, paymentRequests, buttonLoading, transferCoins, verifyRecipient }) {
  const [topupAmount, setTopupAmount] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [addCoinStep, setAddCoinStep] = useState(1);

  // Transfer Coins States
  const [recipient, setRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [verifiedName, setVerifiedName] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferMessage, setTransferMessage] = useState("");

  const handleTopup = async () => {
    await onTopup(topupAmount, utrNumber, paymentScreenshot);
    setAddCoinStep(1);
    setTopupAmount("");
    setUtrNumber("");
    setPaymentScreenshot(null);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 px-4">
      <div className="bg-glass-heavy w-full max-w-6xl h-[92vh] rounded-[30px] p-5 md:p-8 border border-glass-orange overflow-y-auto shadow-glass-glow animate-scale-in font-gaming cyber-card">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 md:mb-8 gap-4">
          <div className="flex gap-2 items-center">
            <h2 className="text-2xl md:text-4xl font-extrabold text-orange-500 text-glow-orange cyber-neon text-center md:text-left">
              MY WALLET
            </h2>
            <button 
              onClick={onShowCoinHistory}
              className="bg-gray-800 hover:bg-gray-700 text-xs px-3 py-1 rounded-full text-white font-bold ml-2 transition-colors border border-gray-600 flex items-center gap-1"
            >
              <span>📜</span> Coin History
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 w-full md:w-auto">
            <button
              onClick={onShowWithdraw}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl font-bold transition-all duration-300 hover:scale-105 active:scale-95 shadow-md shadow-emerald-500/10 cyber-btn flex-1 md:flex-none text-center text-sm md:text-base"
            >
              💸 WITHDRAW
            </button>
            <button
              onClick={onClose}
              className="bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white px-4 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl font-bold transition-all duration-300 hover:scale-105 active:scale-95 flex-1 md:flex-none text-center text-sm md:text-base"
            >
              CLOSE
            </button>
          </div>
        </div>

        {/* Balance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#050508]/60 rounded-3xl p-6 text-center border border-white/5 shadow-inner">
            <p className="text-gray-400 text-xs md:text-base font-bold tracking-widest">TOTAL BALANCE</p>
            <h1 className="text-4xl md:text-6xl font-extrabold text-orange-500 text-glow-orange mt-2 md:mt-3 cyber-prize">
              🪙 {coins}
            </h1>
            <p className="text-gray-500 text-[10px] md:text-xs mt-2 uppercase">Used for joining matches</p>
          </div>
          <div className="bg-[#050508]/60 rounded-3xl p-6 text-center border border-emerald-500/10 shadow-inner">
            <p className="text-emerald-400/80 text-xs md:text-base font-bold tracking-widest">WINNINGS</p>
            <h1 className="text-4xl md:text-6xl font-extrabold text-emerald-500 mt-2 md:mt-3 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              🪙 {winCoins || 0}
            </h1>
            <p className="text-emerald-500/50 text-[10px] md:text-xs mt-2 uppercase">Available for withdraw</p>
          </div>
          <div className="bg-[#050508]/60 rounded-3xl p-6 text-center border border-blue-500/10 shadow-inner">
            <p className="text-blue-400/80 text-xs md:text-base font-bold tracking-widest">DEPOSIT & BONUS</p>
            <h1 className="text-4xl md:text-6xl font-extrabold text-blue-500 mt-2 md:mt-3 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              🪙 {Math.max(0, coins - (winCoins || 0))}
            </h1>
            <p className="text-blue-500/50 text-[10px] md:text-xs mt-2 uppercase">Cannot be withdrawn</p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid md:grid-cols-2 gap-8 mt-10">
          {/* Add Coins Section */}
          <div className="bg-[#050508]/40 rounded-3xl p-6 border border-glass-orange/50 shadow-inner">
            <h3 className="text-2xl font-extrabold text-orange-500 text-glow-orange mb-6">ADD COINS</h3>
            
            {addCoinStep === 1 && (
              <div className="animate-fade-in">
                <p className="text-gray-400 mb-2">1 rupee = 1 coin</p>
                <input
                  type="number"
                  placeholder="Enter Coins Amount"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  className="w-full bg-[#111] text-white rounded-2xl px-5 py-4 outline-none mb-4 border border-white/10 focus:border-orange-500/50 transition-all font-sans"
                />
                <button
                  onClick={() => {
                    if (Number(topupAmount) > 0) setAddCoinStep(2);
                    else alert("Please enter a valid amount");
                  }}
                  className="w-full bg-orange-500 text-black py-3.5 rounded-2xl font-black cyber-btn transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  NEXT
                </button>
              </div>
            )}

            {addCoinStep === 2 && (
              <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <button onClick={() => setAddCoinStep(1)} className="text-gray-400 hover:text-white text-sm font-bold flex items-center gap-1">
                    ◀ BACK
                  </button>
                  <p className="text-orange-400 font-black">🪙 {topupAmount} COINS</p>
                </div>

                <p className="text-center text-orange-400 font-bold mb-4">SCAN QR & PAY {topupAmount} RUPEES</p>
                <a href={paymentQR} download="FIRE-BAADSHAH-QR">
                  <img src={paymentQR} alt="QR" className="w-48 mx-auto rounded-3xl border border-orange-500/20 cursor-pointer hover:scale-105 transition-transform" />
                </a>
                <p className="text-center text-green-400 mt-4 font-bold text-sm">919131793234@waaxis</p>

                <p className="text-gray-400 mt-5 mb-2 text-sm">ENTER UTR NUMBER</p>
                <input
                  type="text"
                  placeholder="12-digit UTR Number"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="w-full bg-[#111] text-white rounded-2xl px-5 py-3.5 outline-none mb-4 border border-white/10 focus:border-orange-500/50 transition-all font-sans"
                />

                <p className="text-gray-400 mb-2 text-sm">UPLOAD SCREENSHOT</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPaymentScreenshot(e.target.files[0])}
                  className="w-full bg-[#111] text-gray-400 rounded-2xl px-4 py-3 outline-none mb-2 border border-white/10 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-orange-500/20 file:text-orange-400 hover:file:bg-orange-500/30 transition-all font-sans"
                />
                {paymentScreenshot && <p className="text-green-400 mt-1 text-xs">{paymentScreenshot.name}</p>}

                <button
                  onClick={handleTopup}
                  disabled={buttonLoading}
                  className={`w-full mt-6 bg-gradient-to-r from-orange-600 to-red-600 text-white py-3.5 rounded-2xl font-black shadow-md shadow-orange-900/20 cyber-btn transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                    buttonLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {buttonLoading ? "PROCESSING..." : "SUBMIT PAYMENT"}
                </button>
              </div>
            )}

            {/* Add Coins History */}
            <h4 className="text-xl font-black mb-4 mt-8 text-orange-400">ADD COINS HISTORY</h4>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {paymentRequests?.filter((item) => item.userId === user?.uid).reverse().map((item) => (
                <div key={item.id} className="bg-[#111] rounded-2xl p-4">
                  <p className="text-orange-400 font-black">🪙 {item.amount} Coins</p>
                  <p className={`font-black mt-2 ${
                    item.status === "PENDING" ? "text-yellow-400"
                    : item.status === "APPROVED" ? "text-green-400"
                    : "text-red-400"
                  }`}>
                    {item.status === "PENDING" ? "⏳ ADD COINS PENDING"
                    : item.status === "APPROVED" ? "✅ ADD COINS COMPLETED"
                    : "❌ ADD COINS REJECTED"}
                  </p>
                  <p className="text-gray-500 text-sm mt-2">🕒 {item.createdAt}</p>
                  {item.completedTime && <p className="text-green-400 text-sm mt-1">✅ COMPLETED: {item.completedTime}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Transfer Coins Section */}
          <div className="bg-[#050508]/40 rounded-3xl p-6 border border-glass-orange/50 shadow-inner flex flex-col justify-between min-h-[450px]">
            <div>
              <h3 className="text-2xl font-extrabold text-orange-500 text-glow-orange mb-4">FRIENDS COINS TRANSFER</h3>
              <p className="text-gray-400 mb-6 text-xs leading-relaxed">Send coins instantly to any user via their registered Email or Referral Code.</p>
              
              <div className="space-y-4">
                {/* Recipient Input */}
                <div>
                  <label className="text-gray-400 text-[10px] md:text-xs font-bold block mb-2 uppercase tracking-wider">RECIPIENT EMAIL / REFERRAL CODE</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. user@gmail.com or BAAD123"
                      value={recipient}
                      onChange={(e) => {
                        setRecipient(e.target.value);
                        setVerifiedName(""); // Reset verification if they change recipient
                        setTransferMessage("");
                      }}
                      disabled={isTransferring}
                      className="flex-1 bg-[#111] text-white rounded-2xl px-4 py-3.5 outline-none border border-white/10 focus:border-orange-500/50 transition-all font-sans text-sm"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!recipient.trim()) return;
                        setIsVerifying(true);
                        setTransferMessage("");
                        const result = await verifyRecipient(recipient);
                        setIsVerifying(false);
                        if (result.success) {
                          setVerifiedName(result.name);
                        } else {
                          setVerifiedName("");
                          alert(result.message || "Recipient not found ❌");
                        }
                      }}
                      disabled={isVerifying || !recipient.trim() || isTransferring}
                      className="bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/20 px-4 py-2 rounded-2xl font-bold transition-all text-xs flex items-center justify-center min-w-[90px] disabled:opacity-50"
                    >
                      {isVerifying ? "VERIFYING..." : "VERIFY"}
                    </button>
                  </div>
                  {verifiedName && (
                    <div className="mt-2 text-green-400 text-xs font-bold flex items-center gap-1.5 animate-fade-in bg-green-500/10 border border-green-500/20 px-3 py-2 rounded-xl">
                      <span>👤 Verified: </span> <span className="text-white uppercase font-extrabold">{verifiedName}</span>
                    </div>
                  )}
                </div>

                {/* Amount Input */}
                <div>
                  <label className="text-gray-400 text-[10px] md:text-xs font-bold block mb-2 uppercase tracking-wider">AMOUNT TO TRANSFER</label>
                  <input
                    type="number"
                    placeholder="Enter Transfer Amount"
                    value={transferAmount}
                    onChange={(e) => {
                      setTransferAmount(e.target.value);
                      setTransferMessage("");
                    }}
                    disabled={isTransferring}
                    className="w-full bg-[#111] text-white rounded-2xl px-4 py-3.5 outline-none border border-white/10 focus:border-orange-500/50 transition-all font-sans text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Transfer Button & Status Message */}
            <div className="mt-8">
              {transferMessage && (
                <p className={`text-center text-xs font-bold mb-3 p-2 rounded-xl ${
                  transferMessage.includes("Successfully") ? "text-green-400 bg-green-500/10 border border-green-500/20" : "text-red-400 bg-red-500/10 border border-red-500/20"
                }`}>
                  {transferMessage}
                </p>
              )}

              <button
                type="button"
                onClick={async () => {
                  if (!recipient.trim() || !transferAmount) {
                    alert("Please fill in recipient and amount details ❌");
                    return;
                  }
                  if (Number(transferAmount) <= 0) {
                    alert("Transfer amount must be greater than 0 ❌");
                    return;
                  }
                  if (Number(transferAmount) > coins) {
                    alert(`Insufficient balance! You only have 🪙 ${coins} coins.`);
                    return;
                  }

                  // If not verified yet, verify first for safety
                  let finalVerifiedName = verifiedName;
                  if (!finalVerifiedName) {
                    setIsVerifying(true);
                    const verifyResult = await verifyRecipient(recipient);
                    setIsVerifying(false);
                    if (!verifyResult.success) {
                      alert(verifyResult.message || "Recipient verification failed ❌");
                      return;
                    }
                    finalVerifiedName = verifyResult.name;
                    setVerifiedName(verifyResult.name);
                  }

                  const confirmTransfer = window.confirm(`Are you sure you want to transfer 🪙 ${transferAmount} coins to "${finalVerifiedName}"?`);
                  if (!confirmTransfer) return;

                  setIsTransferring(true);
                  setTransferMessage("");
                  const result = await transferCoins(recipient, transferAmount);
                  setIsTransferring(false);
                  
                  if (result.success) {
                    setTransferMessage(result.message);
                    setRecipient("");
                    setTransferAmount("");
                    setVerifiedName("");
                  } else {
                    setTransferMessage(result.message || "Transfer failed ❌");
                  }
                }}
                disabled={isTransferring || isVerifying || !recipient.trim() || !transferAmount}
                className={`w-full bg-gradient-to-r from-orange-500 to-amber-600 text-black font-black py-4 rounded-2xl shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base`}
              >
                {isTransferring ? "⚡ TRANSFERRING..." : "💸 SEND COINS NOW"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}