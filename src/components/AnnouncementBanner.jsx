import { useState, useEffect, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase";

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(false);
  const scrollRef = useRef(null);

  // Subscribe to active announcements
  useEffect(() => {
    const announcementsRef = ref(database, "announcements");
    const unsubscribe = onValue(announcementsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const active = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .filter((a) => a.active)
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setAnnouncements(active);
      } else {
        setAnnouncements([]);
      }
    });
    return () => unsubscribe();
  }, []);

  if (dismissed || announcements.length === 0) return null;

  const typeConfig = {
    info: { gradient: "from-blue-600/90 to-cyan-600/90", icon: "📢", border: "border-cyan-400/30" },
    warning: { gradient: "from-yellow-600/90 to-amber-600/90", icon: "⚠️", border: "border-yellow-400/30" },
    success: { gradient: "from-green-600/90 to-emerald-600/90", icon: "✅", border: "border-green-400/30" },
    urgent: { gradient: "from-red-600/90 to-rose-600/90", icon: "🚨", border: "border-red-400/30" },
  };

  // If single announcement, show static. If multiple, show scrolling marquee.
  const isSingle = announcements.length === 1;

  return (
    <div className="relative w-full overflow-hidden">
      {/* Glassmorphic background */}
      <div className={`relative bg-gradient-to-r ${typeConfig[announcements[0]?.type]?.gradient || typeConfig.info.gradient} backdrop-blur-xl border-b ${typeConfig[announcements[0]?.type]?.border || typeConfig.info.border}`}>
        
        {/* Dismiss button */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-white/60 hover:text-white text-lg font-bold bg-black/20 hover:bg-black/40 w-6 h-6 rounded-full flex items-center justify-center transition-all"
          title="Dismiss"
        >
          ×
        </button>

        {isSingle ? (
          /* Single announcement — static centered */
          <div className="px-10 py-2.5 text-center">
            <span className="text-sm font-bold text-white inline-flex items-center gap-2">
              <span>{typeConfig[announcements[0].type]?.icon || "📢"}</span>
              <span className="font-black">{announcements[0].title}</span>
              <span className="mx-1 text-white/40">—</span>
              <span className="font-medium text-white/90">{announcements[0].message}</span>
            </span>
          </div>
        ) : (
          /* Multiple announcements — scrolling marquee */
          <div className="overflow-hidden px-10 py-2.5">
            <div 
              ref={scrollRef}
              className="announcement-marquee whitespace-nowrap"
            >
              {/* Duplicate content for seamless loop */}
              {[...announcements, ...announcements].map((ann, idx) => {
                const config = typeConfig[ann.type] || typeConfig.info;
                return (
                  <span
                    key={`${ann.id}-${idx}`}
                    className="inline-flex items-center gap-2 text-sm font-bold text-white mx-12"
                  >
                    <span>{config.icon}</span>
                    <span className="font-black">{ann.title}</span>
                    <span className="mx-1 text-white/40">—</span>
                    <span className="font-medium text-white/90">{ann.message}</span>
                    <span className="mx-6 text-white/20">|</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
