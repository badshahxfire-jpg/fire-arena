import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PROMOS = [
  {
    id: 1,
    title: "MEGA TOURNAMENT 🏆",
    desc: "Join the biggest BGMI event this weekend! Prize pool up to ₹50,000.",
    bg: "bg-gradient-to-r from-orange-600 to-red-600",
    icon: "🔥",
  },
  {
    id: 2,
    title: "NEW PER KILL MATCHES 💀",
    desc: "Earn coins for every kill! The more you kill, the more you win.",
    bg: "bg-gradient-to-r from-purple-600 to-indigo-600",
    icon: "⚔️",
  },
  {
    id: 3,
    title: "REFER & EARN 💸",
    desc: "Invite your squad and earn free coins on their first match.",
    bg: "bg-gradient-to-r from-emerald-600 to-teal-600",
    icon: "🤝",
  },
];

export default function PromoCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PROMOS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8 mt-2 cursor-pointer">
      <div className="relative h-28 sm:h-32 rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className={`absolute inset-0 flex items-center justify-between p-6 ${PROMOS[currentIndex].bg}`}
          >
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide drop-shadow-md">
                {PROMOS[currentIndex].title}
              </h2>
              <p className="text-white/80 text-xs sm:text-sm mt-1 font-medium max-w-sm drop-shadow-sm">
                {PROMOS[currentIndex].desc}
              </p>
            </div>
            <div className="text-5xl sm:text-6xl drop-shadow-2xl">
              {PROMOS[currentIndex].icon}
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Indicators */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          {PROMOS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? "w-6 bg-white" : "w-2 bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
