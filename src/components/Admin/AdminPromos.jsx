import React, { useState, useEffect } from "react";
import { database } from "../../firebase";
import { ref, onValue, push, remove, set } from "firebase/database";

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

  useEffect(() => {
    const promosRef = ref(database, "promos");
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
      const promosRef = ref(database, "promos");
      await push(promosRef, {
        title: title,
        desc: desc,
        icon: icon,
        bg: bgClass,
        timestamp: Date.now(),
      });
      
      setTitle("");
      setDesc("");
      alert("Promo Banner added successfully!");
    } catch (error) {
      console.error("Error adding promo:", error);
      alert("Failed to add promo");
    }
    setLoading(false);
  };

  const handleDeletePromo = async (id) => {
    if (!window.confirm("Are you sure you want to delete this promo banner?")) return;
    try {
      await remove(ref(database, `promos/${id}`));
    } catch (error) {
      console.error("Error deleting promo:", error);
      alert("Failed to delete promo");
    }
  };

  return (
    <div className="bg-black/40 p-4 md:p-8 rounded-2xl border border-white/10 max-w-4xl mx-auto mt-6 shadow-2xl">
      <h2 className="text-2xl font-black text-orange-500 mb-6 flex items-center gap-2">
        <span>🖼️</span> Manage Promo Banners
      </h2>

      {/* Add New Promo Form */}
      <form onSubmit={handleAddPromo} className="bg-[#0f0f12] p-5 rounded-2xl border border-white/5 mb-8 space-y-4">
        <h3 className="text-lg font-bold text-white mb-4">Create New Banner</h3>
        
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
          {loading ? "Adding..." : "Add Promo Banner"}
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
                <div className="w-full md:w-1/3 p-4 flex justify-end bg-[#0a0a0f]">
                  <button
                    onClick={() => handleDeletePromo(promo.id)}
                    className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-sm font-bold hover:bg-red-500 hover:text-white transition-colors"
                  >
                    Delete Banner
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
