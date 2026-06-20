import React from "react";

export default function AppUpdatePopup({ updateConfig, isForceUpdate, onClose }) {
  const handleUpdate = () => {
    if (updateConfig && updateConfig.updateUrl) {
      window.open(updateConfig.updateUrl, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center z-[9999] px-4">
      <div className="bg-[#111] w-full max-w-md rounded-[40px] p-6 md:p-8 border border-blue-500/20 text-center cyber-card">
        <div className="text-5xl mb-4 animate-bounce">🚀</div>
        <h2 className="text-3xl font-black text-blue-400 mb-2 cyber-neon">NEW UPDATE AVAILABLE</h2>
        <p className="text-gray-400 text-sm mb-6">
          A new version of the app is available! Please update to ensure everything runs smoothly.
        </p>

        {updateConfig?.releaseNotes && (
          <div className="text-left mb-6 bg-black/40 p-4 rounded-[20px] border border-white/5 space-y-2 text-xs">
            <p className="text-blue-400 font-extrabold tracking-wider uppercase border-b border-white/5 pb-1">
              What's New / नया क्या है:
            </p>
            <p className="text-gray-300 whitespace-pre-line leading-relaxed">
              {updateConfig.releaseNotes}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleUpdate}
            className="w-full bg-blue-500 hover:bg-blue-600 text-black py-4 rounded-2xl font-black text-lg transition-transform duration-300 hover:scale-[1.02] cyber-btn"
          >
            UPDATE NOW
          </button>
          
          {!isForceUpdate && (
            <button
              onClick={onClose}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 rounded-2xl font-black text-sm transition-transform duration-300 hover:scale-[1.02]"
            >
              LATER / बाद में
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
