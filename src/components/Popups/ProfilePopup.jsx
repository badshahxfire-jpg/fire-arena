import { useState, useEffect } from "react";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { generateReferralCode } from "../../utils/generateReferralCode";

export default function ProfilePopup({ user, playerData, coins, onClose, onChangeName, onOpenReferral }) {
  const [newPlayerName, setNewPlayerName] = useState("");
  const [showCopied, setShowCopied] = useState(false);
  const [referralCode, setReferralCode] = useState(null);
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    totalEarned: 0
  });
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [tempName, setTempName] = useState("");

  // AUTO-GENERATE REFERRAL CODE IF MISSING
  useEffect(() => {
    const checkAndGenerateReferralCode = async () => {
      if (user && playerData) {
        // Check if referral code exists
        let code = playerData.referralCode;
        
        if (!code) {
          // Generate new referral code
          const name = playerData.name || playerData.displayName || user.email || "USER";
          const newCode = generateReferralCode(user.uid, name);
          
          // Update in Firestore
          await updateDoc(doc(db, "users", user.uid), {
            referralCode: newCode,
            referralStats: {
              totalReferrals: 0,
              completedReferrals: 0,
              pendingReferrals: 0,
              totalEarned: 0
            },
            referredBy: playerData.referredBy || null
          });
          
          setReferralCode(newCode);
          console.log("✅ Auto-generated referral code for user:", newCode);
        } else {
          setReferralCode(code);
        }
        
        // Set referral stats
        if (playerData.referralStats) {
          setReferralStats(playerData.referralStats);
        }
      }
    };
    
    checkAndGenerateReferralCode();
  }, [user, playerData]);

  const handleChangeName = () => {
    if (tempName.trim()) {
      onChangeName(tempName);
      setShowNameEdit(false);
      setTempName("");
    }
  };

  const openNameEdit = () => {
    setTempName(playerData?.name || "");
    setShowNameEdit(true);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setShowCopied(label);
    setTimeout(() => setShowCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 px-4">
      <div className="bg-[#111] w-full max-w-2xl rounded-[40px] p-5 md:p-8 border border-purple-500/20 max-h-[90vh] overflow-y-auto cyber-card">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 mb-6 md:mb-8">
          <h2 className="text-2xl md:text-4xl font-black text-purple-400 cyber-neon text-center md:text-left">PLAYER PROFILE</h2>
          <button onClick={onClose} className="bg-red-500 px-4 md:px-5 py-2 rounded-xl md:rounded-2xl font-black text-sm md:text-base w-full md:w-auto text-center">CLOSE</button>
        </div>

        <div className="space-y-6">
          {/* PLAYER NAME with EDIT ICON */}
          <div className="bg-black rounded-3xl p-6">
            <p className="text-gray-400">PLAYER NAME</p>
            <div className="flex items-center justify-between mt-2">
              <h3 className="text-2xl font-black text-orange-500">{playerData?.name || "Not Set"}</h3>
              {!playerData?.nameChanged && (
                <button
                  onClick={openNameEdit}
                  className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1"
                >
                  <span>✏️</span> EDIT
                </button>
              )}
              {playerData?.nameChanged && (
                <span className="bg-gray-500/20 text-gray-400 px-3 py-2 rounded-xl text-xs font-bold">
                  🔒 Name changed
                </span>
              )}
            </div>
          </div>

          {/* EMAIL */}
          <div className="bg-black rounded-3xl p-6">
            <p className="text-gray-400">EMAIL</p>
            <div className="flex items-center justify-between mt-2">
              <h3 className="text-xl font-black text-green-400 break-all">{user?.email}</h3>
              <button
                onClick={() => copyToClipboard(user?.email, "email")}
                className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              >
                {showCopied === "email" ? "✅ COPIED" : "📋 COPY"}
              </button>
            </div>
          </div>

          {/* USER UID with COPY BUTTON */}
          <div className="bg-black rounded-3xl p-6">
            <p className="text-gray-400">USER UID</p>
            <div className="flex items-center justify-between mt-2">
              <h3 className="text-sm font-black text-blue-400 break-all font-mono">{user?.uid}</h3>
              <button
                onClick={() => copyToClipboard(user?.uid, "uid")}
                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
              >
                {showCopied === "uid" ? (
                  <>
                    <span>✅</span> COPIED
                  </>
                ) : (
                  <>
                    <span>📋</span> COPY UID
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AVAILABLE COINS */}
          <div className="bg-black rounded-3xl p-6">
            <p className="text-gray-400">AVAILABLE COINS</p>
            <h3 className="text-4xl font-black text-orange-500 mt-2 cyber-prize">🪙 {coins}</h3>
          </div>

          {/* TOTAL WINS */}
          <div className="bg-black rounded-3xl p-6">
            <p className="text-gray-400">TOTAL WINS</p>
            <h3 className="text-4xl font-black text-yellow-400 mt-2">🏆 {playerData?.wins || 0}</h3>
          </div>

          {/* TOP 3 FINISHES */}
          <div className="bg-black rounded-3xl p-6">
            <p className="text-gray-400">TOP 3 FINISHES</p>
            <h3 className="text-4xl font-black text-green-400 mt-2">🔥 {playerData?.top3 || 0}</h3>
          </div>


        </div>
      </div>

      {/* NAME EDIT MODAL */}
      {showNameEdit && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[60] px-4">
          <div className="bg-[#111] w-full max-w-md rounded-[30px] p-6 border border-orange-500/20 cyber-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-orange-400">✏️ CHANGE NAME</h3>
              <button
                onClick={() => setShowNameEdit(false)}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded-xl text-sm font-bold"
              >
                ✕
              </button>
            </div>
            
            <p className="text-gray-400 text-sm mb-4">
              Current Name: <span className="text-orange-400 font-bold">{playerData?.name || "Not Set"}</span>
            </p>
            
            <input
              type="text"
              placeholder="Enter New Name"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="w-full bg-black border border-orange-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 mb-4"
              autoFocus
            />
            
            <p className="text-yellow-400 text-xs mb-4">
              ⚠️ You can change your name only <span className="font-bold text-red-400">ONE TIME</span>. Choose wisely!
            </p>
            
            <button
              onClick={handleChangeName}
              disabled={!tempName.trim() || tempName === playerData?.name}
              className={`w-full py-3 rounded-xl font-bold text-base transition-all ${
                !tempName.trim() || tempName === playerData?.name
                  ? "bg-gray-600 cursor-not-allowed text-gray-300"
                  : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              }`}
            >
              CONFIRM CHANGE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}