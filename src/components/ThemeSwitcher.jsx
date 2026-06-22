import { useState, useEffect, useRef } from "react";

const THEMES = [
  {
    id: "fire",
    name: "Fire",
    emoji: "🔥",
    hue: 0,
    bodyBg: "linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 30%, #0f0f1a 60%, #050508 100%)",
    desc: "Default",
  },
  {
    id: "ocean",
    name: "Ocean",
    emoji: "🌊",
    hue: 200,
    bodyBg: "linear-gradient(135deg, #050a14 0%, #0a1a3e 30%, #0a1020 60%, #030508 100%)",
    desc: "Cool Blue",
  },
  {
    id: "emerald",
    name: "Emerald",
    emoji: "💚",
    hue: 140,
    bodyBg: "linear-gradient(135deg, #050f0a 0%, #0a2e1a 30%, #0a1a0f 60%, #030805 100%)",
    desc: "Deep Green",
  },
  {
    id: "royal",
    name: "Royal",
    emoji: "💜",
    hue: 280,
    bodyBg: "linear-gradient(135deg, #0f050f 0%, #2e0a2e 30%, #1a0f1a 60%, #080508 100%)",
    desc: "Purple Vibes",
  },
  {
    id: "rose",
    name: "Rose",
    emoji: "🌹",
    hue: 330,
    bodyBg: "linear-gradient(135deg, #0f0508 0%, #2e0a1a 30%, #1a0f14 60%, #080305 100%)",
    desc: "Pinkish",
  },
  {
    id: "gold",
    name: "Gold",
    emoji: "⚡",
    hue: 40,
    bodyBg: "linear-gradient(135deg, #0f0d05 0%, #2e2a0a 30%, #1a180f 60%, #080705 100%)",
    desc: "Rich Yellow",
  },
];

// Generate CSS override for a theme based on hue rotation
function generateThemeCSS(theme) {
  const hue = theme.hue;

  // Structural aesthetic overrides per theme
  let structuralCSS = "";

  if (theme.id === "ocean") {
    // Ocean Theme: Sleek Glassmorphism (Frosted glass, teal/blue glow, round organic corners)
    structuralCSS = `
      /* Font */
      * {
        font-family: 'Outfit', sans-serif !important;
      }
      /* Cards & Containers */
      .cyber-card, 
      .bg-black, 
      .bg-\\[\\#111\\], 
      .bg-black\\/40, 
      .bg-black\\/60, 
      .bg-\\[\\#1a1a2e\\] {
        border-radius: 24px !important;
        backdrop-filter: blur(16px) !important;
        background-color: rgba(5, 12, 28, 0.75) !important;
        border: 1.5px solid rgba(14, 165, 233, 0.2) !important;
        box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.6), 0 0 20px rgba(14, 165, 233, 0.08) !important;
      }
      /* Buttons, Inputs, Selectors */
      .cyber-btn, 
      button, 
      input, 
      select, 
      .rounded-3xl, 
      .rounded-2xl, 
      .rounded-xl {
        border-radius: 14px !important;
      }
    `;
  } else if (theme.id === "emerald") {
    // Emerald Theme: Retro Terminal / Matrix (Sharp edges, monospace code styling, flat grid borders)
    structuralCSS = `
      @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
      /* Font */
      * {
        font-family: 'Share Tech Mono', monospace !important;
      }
      /* Cards & Containers */
      .cyber-card, 
      .bg-black, 
      .bg-\\[\\#111\\], 
      .bg-black\\/40, 
      .bg-black\\/60, 
      .bg-\\[\\#1a1a2e\\] {
        border-radius: 0px !important;
        background-color: #020805 !important;
        border: 1px solid rgba(16, 185, 129, 0.5) !important;
        box-shadow: 0 0 10px rgba(16, 185, 129, 0.1) !important;
      }
      /* Buttons, Inputs, Selectors */
      .cyber-btn, 
      button, 
      input, 
      select, 
      .rounded-3xl, 
      .rounded-2xl, 
      .rounded-xl {
        border-radius: 0px !important;
        border: 1px solid rgba(16, 185, 129, 0.7) !important;
      }
    `;
  } else if (theme.id === "royal") {
    // Royal Theme: Premium Violet Neon Glow (Curved edges, intense purple drop shadows)
    structuralCSS = `
      /* Cards & Containers */
      .cyber-card, 
      .bg-black, 
      .bg-\\[\\#111\\], 
      .bg-black\\/40, 
      .bg-black\\/60, 
      .bg-\\[\\#1a1a2e\\] {
        border-radius: 20px !important;
        border: 1.5px solid rgba(168, 85, 247, 0.4) !important;
        box-shadow: 0 15px 45px 0 rgba(0, 0, 0, 0.7), 0 0 25px rgba(168, 85, 247, 0.25) !important;
      }
      /* Buttons, Inputs, Selectors */
      .cyber-btn, 
      button, 
      input, 
      select, 
      .rounded-3xl, 
      .rounded-2xl, 
      .rounded-xl {
        border-radius: 12px !important;
      }
    `;
  } else if (theme.id === "gold") {
    // Gold Theme: Luxury Gold (Slightly rounded, sleek gold hairline borders)
    structuralCSS = `
      /* Font */
      * {
        font-family: 'Rajdhani', sans-serif !important;
      }
      /* Cards & Containers */
      .cyber-card, 
      .bg-black, 
      .bg-\\[\\#111\\], 
      .bg-black\\/40, 
      .bg-black\\/60, 
      .bg-\\[\\#1a1a2e\\] {
        border-radius: 6px !important;
        border: 1px solid rgba(234, 179, 8, 0.5) !important;
        box-shadow: 0 4px 20px 0 rgba(0,0,0,0.8), 0 0 15px rgba(234, 179, 8, 0.15) !important;
      }
      /* Buttons, Inputs, Selectors */
      .cyber-btn, 
      button, 
      input, 
      select, 
      .rounded-3xl, 
      .rounded-2xl, 
      .rounded-xl {
        border-radius: 4px !important;
      }
    `;
  }

  return `
    /* Theme: ${theme.name} */
    body {
      background: ${theme.bodyBg} !important;
      background-size: 400% 400% !important;
    }

    body::before {
      background-image: radial-gradient(
        circle at 50% 0%,
        hsla(${hue}, 90%, 53%, 0.06),
        transparent 50%
      ) !important;
    }

    /* Accent color overrides via hue-rotate on key containers */
    .cyber-neon {
      filter: hue-rotate(${hue - 25}deg);
    }

    .cyber-card {
      filter: hue-rotate(${hue - 25}deg);
    }

    .cyber-btn:not(:hover) {
      filter: hue-rotate(${hue - 25}deg);
    }

    .cyber-prize {
      filter: hue-rotate(${hue - 25}deg);
    }

    /* Glass border overrides */
    .border-glass-orange {
      border-color: hsla(${hue}, 90%, 53%, 0.18) !important;
    }

    .shadow-glass-glow {
      box-shadow: 0 8px 32px 0 rgba(0,0,0,0.6), 0 0 15px hsla(${hue}, 90%, 53%, 0.08) !important;
    }

    .text-glow-orange {
      text-shadow: 0 0 8px hsla(${hue}, 90%, 53%, 0.5) !important;
    }

    ${structuralCSS}
  `;
}

export default function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState("fire");
  const panelRef = useRef(null);

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("fb-arena-theme");
    if (saved) {
      const theme = THEMES.find((t) => t.id === saved);
      if (theme) {
        setActiveTheme(saved);
        applyTheme(theme);
      }
    }
  }, []);

  // Click outside to close
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const applyTheme = (theme) => {
    // Remove existing theme style tag
    const existing = document.getElementById("theme-override-css");
    if (existing) existing.remove();

    const css = generateThemeCSS(theme);
    if (css) {
      const style = document.createElement("style");
      style.id = "theme-override-css";
      style.textContent = css;
      document.head.appendChild(style);
    }
  };

  const handleSelect = (theme) => {
    setActiveTheme(theme.id);
    applyTheme(theme);
    localStorage.setItem("fb-arena-theme", theme.id);
    setIsOpen(false);
  };

  const currentTheme = THEMES.find((t) => t.id === activeTheme) || THEMES[0];

  return (
    <div ref={panelRef} className="fixed bottom-6 left-6 z-[999]">
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group w-12 h-12 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 hover:border-white/30 shadow-2xl flex items-center justify-center text-xl transition-all duration-300 hover:scale-110"
        title="Change Theme"
      >
        <span className="group-hover:animate-spin" style={{ animationDuration: "1s" }}>
          🎨
        </span>
      </button>

      {/* Theme Picker Panel */}
      {isOpen && (
        <div className="absolute bottom-16 left-0 w-64 bg-[#0a0a10]/95 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-theme-pop">
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-white/5">
            <h4 className="text-sm font-black text-white tracking-wider flex items-center gap-2">
              🎨 THEME
            </h4>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Active: {currentTheme.emoji} {currentTheme.name}
            </p>
          </div>

          {/* Theme Grid */}
          <div className="p-3 grid grid-cols-3 gap-2">
            {THEMES.map((theme) => {
              const isActive = theme.id === activeTheme;
              return (
                <button
                  key={theme.id}
                  onClick={() => handleSelect(theme)}
                  className={`relative flex flex-col items-center gap-1 py-3 px-1 rounded-xl transition-all duration-300 ${
                    isActive
                      ? "bg-white/10 border border-white/20 scale-105 shadow-lg"
                      : "bg-white/[0.03] border border-transparent hover:bg-white/[0.06] hover:border-white/10"
                  }`}
                >
                  <span className="text-xl">{theme.emoji}</span>
                  <span className="text-[10px] font-bold text-gray-300">{theme.name}</span>
                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-[8px] text-white font-bold shadow-md">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 pb-3 pt-1">
            <p className="text-[9px] text-gray-600 text-center">
              Theme preference is saved locally
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
