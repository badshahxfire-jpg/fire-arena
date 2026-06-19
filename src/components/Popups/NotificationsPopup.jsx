export default function NotificationsPopup({ notifications, user, onClose, onClearAll, onMarkAsRead, onMarkAllAsRead, isSoundMuted, onToggleMute }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 px-4">
      <div className="bg-[#111] w-full max-w-3xl rounded-[40px] p-5 md:p-8 border border-yellow-500/20 max-h-[90vh] overflow-y-auto cyber-card">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 mb-6 md:mb-8">
          <h2 className="text-2xl md:text-4xl font-black text-yellow-400 cyber-neon text-center md:text-left">NOTIFICATIONS</h2>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 w-full md:w-auto">
            <button
              onClick={onToggleMute}
              className={`px-4 md:px-5 py-2 rounded-xl md:rounded-2xl font-black text-sm md:text-base flex-1 md:flex-none text-center border transition-all duration-300 ${
                isSoundMuted 
                  ? "bg-red-500/20 text-red-500 border-red-500/30" 
                  : "bg-green-500/20 text-green-500 border-green-500/30"
              }`}
              title={isSoundMuted ? "Unmute Notifications" : "Mute Notifications"}
            >
              {isSoundMuted ? "🔇 UNMUTE" : "🔊 MUTE"}
            </button>
            <button
              onClick={onMarkAllAsRead}
              className="bg-blue-500 text-white px-4 md:px-5 py-2 rounded-xl md:rounded-2xl font-black text-sm md:text-base cyber-btn flex-1 md:flex-none text-center"
            >
              ✓ MARK ALL READ
            </button>
            <button
              onClick={onClearAll}
              className="bg-orange-500 text-black px-4 md:px-5 py-2 rounded-xl md:rounded-2xl font-black text-sm md:text-base cyber-btn flex-1 md:flex-none text-center"
            >
              🗑 CLEAR ALL
            </button>
            <button onClick={onClose} className="bg-red-500 px-4 md:px-5 py-2 rounded-xl md:rounded-2xl font-black text-sm md:text-base flex-1 md:flex-none text-center">
              CLOSE
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {notifications.length > 0 ? (
            [...notifications].reverse().map((item) => (
              <div
                key={item.id}
                onClick={() => onMarkAsRead(item.id)}
                className={`rounded-3xl p-5 border cursor-pointer duration-300 ${
                  item.seen
                    ? "bg-black border-gray-700"
                    : "bg-yellow-500/10 border-yellow-500/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-yellow-400">{item.title}</h3>
                  {!item.seen && (
                    <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full cyber-live">
                      NEW
                    </span>
                  )}
                </div>
                <p className="text-gray-300 mt-3">{item.message}</p>
                <p className="text-gray-500 text-sm mt-4">{item.time}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-20">
              <h3 className="text-3xl font-black text-gray-500">NO NOTIFICATIONS</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}