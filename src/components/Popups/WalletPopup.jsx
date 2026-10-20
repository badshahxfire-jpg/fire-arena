import { useState, useEffect, useRef } from "react";
import paymentQR from "../../assets/paymentQR.png";
import { secureFetch } from "../../utils/backendApi";

export default function WalletPopup({ user, coins, winCoins, onClose, onTopup, onShowWithdraw, onShowCoinHistory, paymentRequests, buttonLoading, transferCoins, verifyRecipient }) {
  const [topupAmount, setTopupAmount] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [addCoinStep, setAddCoinStep] = useState(1);

  // Zero-UTR Live Auto-Detection States (5 Minutes = 300 Seconds)
  const [isAutoChecking, setIsAutoChecking] = useState(false);
  const [autoCheckSeconds, setAutoCheckSeconds] = useState(300);
  const [autoSuccessMsg, setAutoSuccessMsg] = useState("");
  const [showManualUtr, setShowManualUtr] = useState(false);
  const pollTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  const startAutoCheck = (startTime = Date.now()) => {
    setIsAutoChecking(true);
    setAutoCheckSeconds(300);
    setAutoSuccessMsg("");

    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    countdownTimerRef.current = setInterval(() => {
      setAutoCheckSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          clearInterval(pollTimerRef.current);
          setIsAutoChecking(false);
          setShowManualUtr(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await secureFetch("/api/check-incoming-payment", {
          amount: Number(topupAmount),
          startTime: startTime
        });

        if (res && res.status === "SUCCESS") {
          clearInterval(pollTimerRef.current);
          clearInterval(countdownTimerRef.current);
          setIsAutoChecking(false);
          setAutoSuccessMsg(res.message || `Payment Verified! 🪙 ${res.amount} Coins Added!`);
          setTimeout(() => {
            setAddCoinStep(1);
            setTopupAmount("");
            setAutoSuccessMsg("");
          }, 3500);
        }
      } catch (e) {
        console.warn("Polling error:", e.message);
      }
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

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
                  <button onClick={() => {
                    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
                    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
                    setIsAutoChecking(false);
                    setAddCoinStep(1);
                  }} className="text-gray-400 hover:text-white text-sm font-bold flex items-center gap-1">
                    ◀ BACK
                  </button>
                  <p className="text-orange-400 font-black">🪙 {topupAmount} COINS</p>
                </div>

                {/* 1. SUCCESS CELEBRATION CARD */}
                {autoSuccessMsg ? (
                  <div className="bg-emerald-950/80 border-2 border-emerald-500 rounded-3xl p-8 text-center my-6 animate-scale-in shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                    <div className="text-6xl mb-3 animate-bounce">🎉</div>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-emerald-400">PAYMENT VERIFIED!</h3>
                    <p className="text-white mt-3 font-bold text-lg">{autoSuccessMsg}</p>
                    <p className="text-emerald-300/80 text-sm mt-3">Coins credited to your wallet automatically!</p>
                  </div>
                ) : isAutoChecking ? (
                  /* 2. LIVE AUTO-DETECT RADAR + QR CODE TOGETHER */
                  <div className="bg-[#0c0c14]/90 border border-orange-500/40 rounded-3xl p-5 text-center my-3 shadow-lg shadow-orange-500/10 space-y-4">
                    {/* Live Listening Header */}
                    <div className="bg-orange-950/40 border border-orange-500/30 rounded-2xl p-3 flex items-center justify-between px-4">
                      <div className="flex items-center gap-3 text-left">
                        <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
                          <div className="absolute inset-0 rounded-full border-2 border-orange-500/30 border-t-orange-400 animate-spin"></div>
                          <span className="text-sm animate-pulse">⚡</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-orange-400 tracking-wide">DETECTING ₹{topupAmount} PAYMENT...</h4>
                          <p className="text-gray-400 text-[11px]">Scan QR or pay via UPI — coins credit automatically</p>
                        </div>
                      </div>
                      <div className="text-2xl md:text-3xl font-mono font-black text-white tracking-widest bg-black/60 px-3 py-1 rounded-xl border border-white/10 shrink-0">
                        {String(Math.floor(autoCheckSeconds / 60)).padStart(2, '0')}:{String(autoCheckSeconds % 60).padStart(2, '0')}
                      </div>
                    </div>

                    {/* QR Code always visible for scanning / screenshot */}
                    <div className="relative group max-w-[210px] mx-auto">
                      <a href={paymentQR} download="FIRE-ARENA-PAYMENT-QR">
                        <img 
                          src={paymentQR} 
                          alt="PhonePe Business QR" 
                          className="w-48 mx-auto rounded-2xl border-2 border-orange-500/40 shadow-lg shadow-orange-500/20 cursor-pointer hover:scale-105 transition-transform bg-white p-2" 
                        />
                      </a>
                      <p className="text-[10px] text-gray-400 mt-1 font-bold">📸 Scan or Screenshot QR to Pay</p>
                    </div>

                    {/* UPI ID & Copy */}
                    <div className="flex items-center justify-center gap-2 bg-white/5 py-1.5 px-3 rounded-xl border border-white/10 max-w-xs mx-auto">
                      <p className="text-green-400 font-mono font-bold text-xs tracking-wide">Q105526409@ybl</p>
                      <button 
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText("Q105526409@ybl");
                          alert("UPI ID Copied: Q105526409@ybl");
                        }}
                        className="bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 text-[11px] px-2 py-0.5 rounded border border-orange-500/30 transition-all font-bold"
                      >
                        📋 COPY
                      </button>
                    </div>

                    {/* Mobile 1-Tap Pay Link */}
                    <a 
                      href={`upi://pay?pa=Q105526409@ybl&pn=Fire%20arena&am=${topupAmount}&cu=INR&tn=CoinTopup_${user?.uid?.slice(0, 5) || "User"}`}
                      className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black py-3 rounded-xl shadow-lg shadow-purple-900/30 hover:scale-[1.01] active:scale-[0.99] transition-all text-xs md:text-sm border border-purple-400/30 font-sans"
                    >
                      <span>⚡</span> OPEN PHONEPE / GPAY TO PAY ₹{topupAmount}
                    </a>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs px-2">
                      <button 
                        type="button"
                        onClick={() => {
                          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
                          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
                          setIsAutoChecking(false);
                          setShowManualUtr(true);
                        }}
                        className="text-orange-400 hover:text-orange-300 underline font-bold transition-colors"
                      >
                        Enter 12-Digit UTR manually
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
                          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
                          setIsAutoChecking(false);
                        }}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        ✕ Stop Radar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 3. NORMAL PAYMENT SCREEN */
                  <div>
                    <p className="text-center text-orange-400 font-bold mb-4">SCAN QR & PAY {topupAmount} RUPEES</p>
                    <div className="relative group max-w-[220px] mx-auto">
                      <a href={paymentQR} download="FIRE-ARENA-QR">
                        <img src={paymentQR} alt="PhonePe Business QR" className="w-52 mx-auto rounded-3xl border-2 border-orange-500/40 shadow-lg shadow-orange-500/20 cursor-pointer hover:scale-105 transition-transform bg-white p-2" />
                      </a>
                    </div>

                    <div className="flex items-center justify-center gap-2 mt-4 bg-white/5 py-2 px-4 rounded-xl border border-white/10 max-w-sm mx-auto">
                      <p className="text-green-400 font-mono font-bold text-sm tracking-wide">Q105526409@ybl</p>
                      <button 
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText("Q105526409@ybl");
                          alert("UPI ID Copied: Q105526409@ybl");
                        }}
                        className="bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 text-xs px-2.5 py-1 rounded-lg border border-orange-500/30 transition-all font-sans font-bold"
                      >
                        📋 COPY
                      </button>
                    </div>
                    <p className="text-center text-gray-400 text-xs mt-1">Merchant: <span className="text-orange-400 font-bold">Fire arena</span></p>

                    {/* Instant Mobile UPI Intent Link & Auto-Detect Trigger */}
                    <div className="mt-5 space-y-2.5">
                      <a 
                        href={`upi://pay?pa=Q105526409@ybl&pn=Fire%20arena&am=${topupAmount}&cu=INR&tn=CoinTopup_${user?.uid?.slice(0, 5) || "User"}`}
                        onClick={() => {
                          startAutoCheck();
                        }}
                        className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-purple-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm md:text-base border border-purple-400/30 font-sans"
                      >
                        <span>⚡</span> PAY VIA PHONEPE / GPAY / PAYTM
                      </a>

                      <button
                        type="button"
                        onClick={() => startAutoCheck()}
                        className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 py-3 rounded-2xl font-bold transition-all text-sm flex items-center justify-center gap-2"
                      >
                        <span>🔄</span> I HAVE PAID — CHECK AUTOMATICALLY
                      </button>
                    </div>

                    {/* Manual Fallback Toggle */}
                    <div className="mt-6 pt-4 border-t border-white/10 text-center">
                      <button
                        type="button"
                        onClick={() => setShowManualUtr(!showManualUtr)}
                        className="text-xs text-gray-400 hover:text-white font-sans transition-colors"
                      >
                        {showManualUtr ? "▲ Hide Manual UTR Option" : "▼ Paid via another device or PC? Enter UTR manually"}
                      </button>
                    </div>

                    {showManualUtr && (
                      <div className="mt-4 animate-fade-in bg-black/40 p-4 rounded-2xl border border-white/10">
                        <p className="text-gray-400 mb-2 text-xs font-bold uppercase">Enter 12-Digit UTR / UPI Ref / Transaction ID</p>
                        <input
                          type="text"
                          placeholder="12-digit UTR (e.g. 428912345678)"
                          value={utrNumber}
                          onChange={(e) => setUtrNumber(e.target.value)}
                          className="w-full bg-[#111] text-white rounded-2xl px-5 py-3 outline-none mb-3 border border-white/10 focus:border-orange-500/50 transition-all font-sans text-sm"
                        />

                        <p className="text-gray-400 mb-2 text-xs font-bold uppercase">Screenshot (Optional)</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setPaymentScreenshot(e.target.files[0])}
                          className="w-full bg-[#111] text-gray-400 rounded-2xl px-4 py-2.5 outline-none mb-2 border border-white/10 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-500/20 file:text-orange-400 hover:file:bg-orange-500/30 transition-all font-sans text-xs"
                        />
                        {paymentScreenshot && <p className="text-green-400 mt-1 text-xs">{paymentScreenshot.name}</p>}

                        <button
                          onClick={handleTopup}
                          disabled={buttonLoading}
                          className={`w-full mt-4 bg-orange-600 hover:bg-orange-500 text-white py-3 rounded-2xl font-black cyber-btn transition-all ${
                            buttonLoading ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          {buttonLoading ? "VERIFYING..." : "SUBMIT UTR"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
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