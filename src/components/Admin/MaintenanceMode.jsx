import { useState, useEffect } from "react";

export default function MaintenanceMode({ maintenanceMode, maintenanceDuration, maintenanceEndsAt, onToggle, allowedUsers = [], onUpdateAllowedUsers, onTestLogin }) {
  const [duration, setDuration] = useState(maintenanceDuration || "");
  const [timeLeft, setTimeLeft] = useState("");
  const [newAllowedUser, setNewAllowedUser] = useState("");

  const handleToggle = () => {
    onToggle(duration);
  };

  useEffect(() => {
    if (!maintenanceMode || !maintenanceEndsAt) {
      setTimeLeft("");
      return;
    }

    const updateTimer = () => {
      const difference = Number(maintenanceEndsAt) - Date.now();
      if (difference <= 0) {
        setTimeLeft("Maintenance should finish soon");
      } else {
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        
        let timeStr = "";
        if (hours > 0) timeStr += `${hours}h `;
        timeStr += `${minutes}m ${seconds}s`;
        setTimeLeft(timeStr);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [maintenanceMode, maintenanceEndsAt]);

  return (
    <section className="max-w-5xl mx-auto px-6 py-10">
      <div className="bg-[#111] rounded-[40px] p-8 border border-red-500/10 cyber-card">
        <div className="flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex-1">
            <h2 className="text-4xl font-black text-red-400 cyber-neon flex items-center gap-2">
              🚧 MAINTENANCE MODE
            </h2>
            <p className="text-gray-400 mt-3 text-lg">
              {maintenanceMode 
                ? `Server is currently in maintenance mode. Users cannot access the platform. ${maintenanceDuration ? `Estimated duration: ${maintenanceDuration}` : ""}` 
                : "Server is running normally. Enable maintenance mode to block user access."}
            </p>
            
            {maintenanceMode && timeLeft && (
              <div className="mt-5 inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xl">
                <span className="text-2xl animate-spin">⏱️</span>
                <span>Time Remaining: <span className="text-white font-mono">{timeLeft}</span></span>
              </div>
            )}
            
            {!maintenanceMode && (
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Estimated time (e.g. 2 Hours, 30 Mins) [Optional]"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full max-w-sm bg-black rounded-xl px-4 py-3 outline-none border border-red-500/20 text-white"
                />
              </div>
            )}
          </div>
          {onToggle && (
            <button
              onClick={handleToggle}
              className={`px-8 py-4 rounded-2xl font-black text-lg transition-all duration-300 hover:scale-[1.02] cyber-btn whitespace-nowrap ${
                maintenanceMode
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-green-500 text-black hover:bg-green-600"
              }`}
            >
              {maintenanceMode ? "🔓 DISABLE MAINTENANCE" : "🔒 ENABLE MAINTENANCE"}
            </button>
          )}
        </div>
      </div>

      {onUpdateAllowedUsers && (
        <div className="bg-[#111] rounded-[40px] p-8 border border-blue-500/10 cyber-card mt-8">
          <h3 className="text-2xl font-black text-blue-400 mb-4 flex items-center gap-2">
            🔑 ALLOWED USERS (BYPASS MAINTENANCE)
          </h3>
          <p className="text-gray-400 mb-6 text-sm">Add UIDs or Emails of users (like yourself) who can log in even when the app is in maintenance mode.</p>
          
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              placeholder="Enter UID or Email to whitelist"
              value={newAllowedUser}
              onChange={(e) => setNewAllowedUser(e.target.value)}
              className="flex-1 max-w-sm bg-black rounded-xl px-4 py-3 outline-none border border-blue-500/20 text-white"
            />
            <button
              onClick={() => {
                if(newAllowedUser.trim() && !allowedUsers.includes(newAllowedUser.trim())) {
                  onUpdateAllowedUsers([...allowedUsers, newAllowedUser.trim()]);
                  setNewAllowedUser("");
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition"
            >
              ADD USER
            </button>
          </div>

          {allowedUsers.length > 0 ? (
            <div className="space-y-3">
              {allowedUsers.map((user, idx) => (
                <div key={idx} className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-gray-800 max-w-md">
                  <span className="text-white font-mono">{user}</span>
                  <button 
                    onClick={() => {
                      onUpdateAllowedUsers(allowedUsers.filter(u => u !== user));
                    }}
                    className="text-red-500 hover:text-red-400 font-bold text-sm"
                  >
                    REMOVE
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No allowed users added yet.</p>
          )}
        </div>
      )}

      {onTestLogin && (
        <div className="text-center mt-12">
          <button 
            onClick={onTestLogin}
            className="text-gray-600 hover:text-gray-400 text-sm underline transition"
          >
            Admin / Tester Login Bypass
          </button>
        </div>
      )}
    </section>
  );
}