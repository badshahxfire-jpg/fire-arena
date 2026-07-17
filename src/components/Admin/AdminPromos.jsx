import React, { useState, useEffect } from "react";
import { database } from "../../firebase";
import { ref, onValue, push, update, remove, set } from "firebase/database";

const BACKGROUNDS = [
  { name: "Orange/Red (Fire)", class: "bg-gradient-to-r from-orange-600 to-red-600" },
  { name: "Purple/Indigo (Space)", class: "bg-gradient-to-r from-purple-600 to-indigo-600" },
  { name: "Emerald/Teal (Money)", class: "bg-gradient-to-r from-emerald-600 to-teal-600" },
  { name: "Blue/Cyan (Ice)", class: "bg-gradient-to-r from-blue-600 to-cyan-600" },
  { name: "Rose/Pink (Love)", class: "bg-gradient-to-r from-rose-600 to-pink-600" },
  { name: "Yellow/Amber (Gold)", class: "bg-gradient-to-r from-yellow-500 to-amber-600" },
];

export default function AdminPromos() {
  const [promos, setPromos] = useState([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [icon, setIcon] = useState("🔥");
  const [bgClass, setBgClass] = useState(BACKGROUNDS[0].class);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    const promosRef = ref(database, "settings/promos");
    const unsubscribe = onValue(promosRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const promoList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setPromos(promoList.reverse()); // Show newest first
      } else {
        setPromos([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAddPromo = async (e) => {
    e.preventDefault();
    if (!title || !desc || !icon) return alert("Please fill all fields!");
    
    setLoading(true);
    try {
      if (editId) {
        await update(ref(database, `settings/promos/${editId}`), {
          title, desc, icon, bg: bgClass,
        });
        alert("Promo Banner updated successfully!");
      } else {
        const promosRef = ref(database, "settings/promos");
        await push(promosRef, {
          title, desc, icon, bg: bgClass, timestamp: Date.now(),
        });
        alert("Promo Banner added successfully!");
      }
      resetForm();
    } catch (error) {
      console.error("Error saving promo:", error);
      alert("Failed to save promo");
    }
    setLoading(false);
  };

  const resetForm = () => {
    setTitle("");
    setDesc("");
    setIcon("🔥");
    setBgClass(BACKGROUNDS[0].class);
    setEditId(null);
  };

  const handleEditClick = (promo) => {
    setTitle(promo.title);
    setDesc(promo.desc);
    setIcon(promo.icon);
    setBgClass(promo.bg);
    setEditId(promo.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRestoreDefaults = async () => {
    if (!window.confirm("This will add the 3 original default banners. Proceed?")) return;
    setLoading(true);
    try {
      const defaults = [
        { title: "MEGA TOURNAMENT 🏆", desc: "Join the biggest BGMI event this weekend! Prize pool up to ₹50,000.", bg: "bg-gradient-to-r from-orange-600 to-red-600", icon: "🔥", timestamp: Date.now() },
        { title: "NEW PER KILL MATCHES 💀", desc: "Earn coins for every kill! The more you kill, the more you win.", bg: "bg-gradient-to-r from-purple-600 to-indigo-600", icon: "⚔️", timestamp: Date.now() + 1 },
        { title: "REFER & EARN 💸", desc: "Invite your squad and earn free coins on their first match.", bg: "bg-gradient-to-r from-emerald-600 to-teal-600", icon: "🤝", timestamp: Date.now() + 2 }
      ];
      for (const p of defaults) {
        await push(ref(database, "settings/promos"), p);
      }
      alert("Defaults restored!");
    } catch (e) {
      console.error(e);
      alert("Failed to restore");
    }
    setLoading(false);
  };

  const handleDeletePromo = async (id) => {
    if (!window.confirm("Are you sure you want to delete this promo banner?")) return;
    try {
      await remove(ref(database, `settings/promos/${id}`));
    } catch (error) {
      console.error("Error deleting promo:", error);
      alert("Failed to delete promo");
    }
  };

  return (
    <div className="bg-black/40 p-4 md:p-8 rounded-2xl border border-white/10 max-w-4xl mx-auto mt-6 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-orange-500 flex items-center gap-2">
          <span>🖼️</span> Manage Promo Banners
        </h2>
        <button 
          onClick={handleRestoreDefaults}
          className="px-3 py-1.5 bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500 hover:text-black rounded-lg text-xs font-bold transition-all"
        >
          RESTORE DEFAULTS
        </button>
      </div>

      {/* Add/Edit New Promo Form */}
      <form onSubmit={handleAddPromo} className="bg-[#0f0f12] p-5 rounded-2xl border border-white/5 mb-8 space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">
            {editId ? "Edit Banner" : "Create New Banner"}
          </h3>
          {editId && (
            <button type="button" onClick={resetForm} className="text-xs text-gray-400 hover:text-white underline">
              Cancel Edit
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 text-xs font-bold mb-1 block">Title (Short)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. MEGA TOURNAMENT 🏆"
              className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-white"
              maxLength={30}
              required
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-bold mb-1 block">Emoji Icon</label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="🔥"
              className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-white"
              maxLength={5}
              required
            />
          </div>
        </div>

        <div>
          <label className="text-gray-400 text-xs font-bold mb-1 block">Description</label>
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Join the biggest BGMI event this weekend!"
            className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-white"
            maxLength={80}
            required
          />
        </div>

        <div>
          <label className="text-gray-400 text-xs font-bold mb-1 block">Background Color</label>
          <select
            value={bgClass}
            onChange={(e) => setBgClass(e.target.value)}
            className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-white"
          >
            {BACKGROUNDS.map((bg, idx) => (
              <option key={idx} value={bg.class}>{bg.name}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl font-bold text-black mt-4 hover:scale-[1.02] transition-transform disabled:opacity-50"
        >
          {loading ? "Saving..." : editId ? "Update Banner" : "Add Promo Banner"}
        </button>
      </form>

      {/* Existing Promos */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Live Banners ({promos.length})</h3>
        <div className="space-y-4">
          {promos.length === 0 ? (
            <p className="text-gray-500 text-sm italic">No banners active. The carousel won't show anything.</p>
          ) : (
            promos.map((promo) => (
              <div key={promo.id} className="relative bg-black border border-white/10 rounded-2xl overflow-hidden flex flex-col md:flex-row md:items-center">
                {/* Banner Preview */}
                <div className={`w-full md:w-2/3 p-4 flex items-center justify-between ${promo.bg}`}>
                  <div className="flex-1">
                    <h2 className="text-lg font-black text-white uppercase tracking-wide drop-shadow-md">
                      {promo.title}
                    </h2>
                    <p className="text-white/80 text-xs mt-1 font-medium max-w-sm drop-shadow-sm">
                      {promo.desc}
                    </p>
                  </div>
                  <div className="text-4xl drop-shadow-2xl ml-2">
                    {promo.icon}
                  </div>
                </div>

                {/* Actions */}
                <div className="w-full md:w-1/3 p-4 flex justify-end gap-2 bg-[#0a0a0f]">
                  <button
                    onClick={() => handleEditClick(promo)}
                    className="px-4 py-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-lg text-sm font-bold hover:bg-blue-500 hover:text-white transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePromo(promo.id)}
                    className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-sm font-bold hover:bg-red-500 hover:text-white transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
