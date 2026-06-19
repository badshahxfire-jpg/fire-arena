import { useState, useEffect } from "react";
import { ref, onValue, push, remove, update } from "firebase/database";
import { database } from "../../firebase";

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newType, setNewType] = useState("info"); // info, warning, success, urgent
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editType, setEditType] = useState("info");
  const [loading, setLoading] = useState(false);

  // Subscribe to announcements
  useEffect(() => {
    const announcementsRef = ref(database, "announcements");
    const unsubscribe = onValue(announcementsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loaded = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        // Sort by createdAt descending (newest first)
        loaded.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setAnnouncements(loaded);
      } else {
        setAnnouncements([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAdd = async () => {
    if (!newTitle.trim() || !newMessage.trim()) {
      alert("Title aur Message dono fill karo! ❌");
      return;
    }
    setLoading(true);
    try {
      const announcementsRef = ref(database, "announcements");
      await push(announcementsRef, {
        title: newTitle.trim(),
        message: newMessage.trim(),
        type: newType,
        active: true,
        createdAt: Date.now(),
      });
      setNewTitle("");
      setNewMessage("");
      setNewType("info");
    } catch (err) {
      console.error("Error adding announcement:", err);
      alert("Failed to add announcement ❌");
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await remove(ref(database, `announcements/${id}`));
    } catch (err) {
      console.error("Error deleting announcement:", err);
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      await update(ref(database, `announcements/${id}`), {
        active: !currentActive,
      });
    } catch (err) {
      console.error("Error toggling announcement:", err);
    }
  };

  const startEdit = (ann) => {
    setEditingId(ann.id);
    setEditTitle(ann.title);
    setEditMessage(ann.message);
    setEditType(ann.type || "info");
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editMessage.trim()) {
      alert("Title aur Message dono fill karo! ❌");
      return;
    }
    try {
      await update(ref(database, `announcements/${editingId}`), {
        title: editTitle.trim(),
        message: editMessage.trim(),
        type: editType,
      });
      setEditingId(null);
    } catch (err) {
      console.error("Error updating announcement:", err);
    }
  };

  const typeStyles = {
    info: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", icon: "📢" },
    warning: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400", icon: "⚠️" },
    success: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400", icon: "✅" },
    urgent: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", icon: "🚨" },
  };

  return (
    <section className="max-w-7xl mx-auto px-6 py-10">
      <h2 className="text-4xl font-black text-cyan-400 mb-8 cyber-neon">📢 ANNOUNCEMENTS MANAGER</h2>

      {/* Add New Announcement */}
      <div className="bg-[#0a0a0f] rounded-3xl p-6 border border-cyan-500/20 mb-8">
        <h3 className="text-xl font-black text-cyan-400 mb-4">➕ NEW ANNOUNCEMENT</h3>

        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-xs block mb-1.5 font-bold">TITLE</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. New Tournament Coming Soon!"
              className="bg-black/60 border border-gray-800 rounded-xl px-4 py-3 w-full text-white font-bold focus:border-cyan-500/50 outline-none"
              maxLength={100}
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs block mb-1.5 font-bold">MESSAGE</label>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Write your announcement message here..."
              className="bg-black/60 border border-gray-800 rounded-xl px-4 py-3 w-full text-white font-bold focus:border-cyan-500/50 outline-none resize-none h-24"
              maxLength={300}
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs block mb-1.5 font-bold">TYPE</label>
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(typeStyles).map(([key, style]) => (
                <button
                  key={key}
                  onClick={() => setNewType(key)}
                  className={`py-2.5 rounded-xl font-black text-xs transition-all border ${
                    newType === key
                      ? `${style.bg} ${style.border} ${style.text} scale-105`
                      : "bg-black/40 border-gray-800 text-gray-500 hover:text-white"
                  }`}
                >
                  {style.icon} {key.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black text-lg hover:scale-[1.01] transition disabled:opacity-50"
          >
            {loading ? "Adding..." : "📢 PUBLISH ANNOUNCEMENT"}
          </button>
        </div>
      </div>

      {/* Active Announcements List */}
      <h3 className="text-2xl font-black text-orange-400 mb-4">📋 ALL ANNOUNCEMENTS ({announcements.length})</h3>

      {announcements.length === 0 ? (
        <div className="text-center py-12 bg-black/30 rounded-2xl border border-gray-800">
          <p className="text-gray-500 text-lg">No announcements yet</p>
          <p className="text-gray-600 text-sm mt-1">Create your first announcement above</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => {
            const style = typeStyles[ann.type] || typeStyles.info;
            const isEditing = editingId === ann.id;

            return (
              <div
                key={ann.id}
                className={`${style.bg} rounded-2xl p-5 border ${style.border} transition-all ${
                  !ann.active ? "opacity-40" : ""
                }`}
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="bg-black/60 border border-gray-700 rounded-xl px-3 py-2 w-full text-white font-bold focus:border-cyan-500/50 outline-none"
                    />
                    <textarea
                      value={editMessage}
                      onChange={(e) => setEditMessage(e.target.value)}
                      className="bg-black/60 border border-gray-700 rounded-xl px-3 py-2 w-full text-white font-bold focus:border-cyan-500/50 outline-none resize-none h-20"
                    />
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(typeStyles).map(([key, st]) => (
                        <button
                          key={key}
                          onClick={() => setEditType(key)}
                          className={`py-1.5 rounded-lg font-bold text-[10px] transition-all border ${
                            editType === key
                              ? `${st.bg} ${st.border} ${st.text}`
                              : "bg-black/40 border-gray-800 text-gray-500"
                          }`}
                        >
                          {st.icon} {key.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="flex-1 py-2 bg-green-500 text-black rounded-xl font-black text-sm"
                      >
                        ✅ SAVE
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 py-2 bg-gray-700 text-white rounded-xl font-black text-sm"
                      >
                        CANCEL
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{style.icon}</span>
                          <h4 className={`text-lg font-black ${style.text}`}>{ann.title}</h4>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                            ann.active 
                              ? "bg-green-500/10 text-green-400 border-green-500/30"
                              : "bg-red-500/10 text-red-400 border-red-500/30"
                          }`}>
                            {ann.active ? "ACTIVE" : "HIDDEN"}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">{ann.message}</p>
                        <p className="text-gray-600 text-[10px] mt-2">
                          📅 {new Date(ann.createdAt).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleToggleActive(ann.id, ann.active)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-black transition ${
                          ann.active
                            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20"
                            : "bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20"
                        }`}
                      >
                        {ann.active ? "👁️‍🗨️ HIDE" : "👁️ SHOW"}
                      </button>
                      <button
                        onClick={() => startEdit(ann)}
                        className="px-4 py-1.5 rounded-lg text-xs font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition"
                      >
                        ✏️ EDIT
                      </button>
                      <button
                        onClick={() => handleDelete(ann.id)}
                        className="px-4 py-1.5 rounded-lg text-xs font-black bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition"
                      >
                        🗑️ DELETE
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
