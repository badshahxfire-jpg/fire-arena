import React, { useState, useEffect } from "react";
import { ref, get, update } from "firebase/database";
import { database } from "../../firebase";

export default function AppUpdateAdmin() {
  const [latestVersion, setLatestVersion] = useState("");
  const [minVersion, setMinVersion] = useState("");
  const [updateUrl, setUpdateUrl] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snapshot = await get(ref(database, "settings/appUpdate"));
        if (snapshot.exists()) {
          const data = snapshot.val();
          setLatestVersion(data.latestVersion || "");
          setMinVersion(data.minVersion || "");
          setUpdateUrl(data.updateUrl || "");
          setReleaseNotes(data.releaseNotes || "");
        }
      } catch (err) {
        console.error("Failed to fetch app update settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await update(ref(database, "settings/appUpdate"), {
        latestVersion: latestVersion.trim(),
        minVersion: minVersion.trim(),
        updateUrl: updateUrl.trim(),
        releaseNotes: releaseNotes.trim(),
      });
      alert("App update configuration saved successfully! 🔥");
    } catch (err) {
      alert("Error saving app update: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="max-w-5xl mx-auto px-6 py-10">
      <div className="bg-[#111] rounded-[40px] p-6 md:p-8 border border-blue-500/10 cyber-card">
        <h2 className="text-4xl font-black text-blue-400 mb-6 cyber-neon">
          🚀 APP UPDATE CONTROL PANEL
        </h2>
        <p className="text-gray-400 mb-8 text-sm md:text-base">
          Configure the app versions and the update link. If the user's native app version is below the "Minimum Required Version", they will be forced to update before they can use the app.
        </p>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-gray-300 font-bold text-xs uppercase tracking-wider">
                Latest App Version (नवीनतम वर्शन)
              </label>
              <input
                type="text"
                placeholder="e.g. 1.0.1"
                value={latestVersion}
                onChange={(e) => setLatestVersion(e.target.value)}
                required
                className="w-full bg-black rounded-2xl px-5 py-4 outline-none border border-white/5 text-white text-sm focus:border-blue-500/30 transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-gray-300 font-bold text-xs uppercase tracking-wider">
                Minimum Required Version (न्यूनतम आवश्यक वर्शन)
              </label>
              <input
                type="text"
                placeholder="e.g. 1.0.0"
                value={minVersion}
                onChange={(e) => setMinVersion(e.target.value)}
                required
                className="w-full bg-black rounded-2xl px-5 py-4 outline-none border border-white/5 text-white text-sm focus:border-blue-500/30 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-gray-300 font-bold text-xs uppercase tracking-wider">
              APK Download URL (एपीके डाउनलोड लिंक)
            </label>
            <input
              type="url"
              placeholder="e.g. https://your-site.com/download/app.apk"
              value={updateUrl}
              onChange={(e) => setUpdateUrl(e.target.value)}
              required
              className="w-full bg-black rounded-2xl px-5 py-4 outline-none border border-white/5 text-white text-sm focus:border-blue-500/30 transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-gray-300 font-bold text-xs uppercase tracking-wider">
              Release Notes / Updates (नया क्या है)
            </label>
            <textarea
              placeholder="Write update description (e.g. Fixed back button, New features added...)"
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              rows={4}
              className="w-full bg-black rounded-2xl px-5 py-4 outline-none border border-white/5 text-white text-sm focus:border-blue-500/30 transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-black py-4 rounded-2xl font-black text-lg transition-all duration-300 hover:scale-[1.01] hover:bg-blue-600 disabled:opacity-50 cyber-btn"
          >
            {loading ? "SAVING..." : "💾 SAVE CONFIGURATION"}
          </button>
        </form>
      </div>
    </section>
  );
}
