import React from "react";
import ReactDOM from "react-dom";

export default function OfflineBlockPopup({ onClose }) {
  const adminWhatsApp = "+918085150679";
  
  const handleContactAdmin = () => {
    const message = encodeURIComponent("Hello Admin, my account was automatically blocked due to being offline for 15 days. Please unblock me.");
    window.open(`https://wa.me/${adminWhatsApp.replace(/[^0-9]/g, "")}?text=${message}`, "_blank");
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      ></div>

      {/* Popup Content */}
      <div className="relative w-full max-w-sm bg-[#08080a] border border-red-500/30 rounded-3xl shadow-2xl overflow-hidden animate-pop">
        
        {/* Header Graphic */}
        <div className="h-32 bg-gradient-to-br from-red-900/40 to-transparent flex items-center justify-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-red-500/20 blur-3xl rounded-full"></div>
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/50 flex items-center justify-center z-10 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
            <span className="text-3xl">⏳</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-8 text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-red-500/20 flex items-center justify-center transition-all"
          >
            ✕
          </button>

          <h3 className="text-xl font-black text-red-500 mb-2">ACCOUNT BLOCKED</h3>
          
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <p className="text-gray-300 text-sm leading-relaxed">
              Aapki ID <span className="text-red-400 font-bold">15 dino se zyada offline</span> rehne ki wajah se automatically block kar di gayi hai.
            </p>
            <p className="text-gray-400 text-xs mt-3">
              Kripya apne account ko dobara chalu karne ke liye Admin se sampark karein.
            </p>
          </div>

          <div className="space-y-3">
            <button 
              onClick={handleContactAdmin}
              className="w-full py-3.5 rounded-xl bg-green-500 hover:bg-green-600 text-black font-black flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:scale-[1.02]"
            >
              <span className="text-xl">💬</span>
              CONTACT ADMIN
            </button>
            
            <button 
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white text-sm font-bold transition-all hover:bg-white/10"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
