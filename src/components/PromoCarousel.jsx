import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { database } from "../firebase";
import { ref, onValue } from "firebase/database";

export default function PromoCarousel({ onPromoClick }) {
  const [promos, setPromos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const promosRef = ref(database, "settings/promos");
    const unsubscribe = onValue(promosRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const promoList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setPromos(promoList.reverse());
      } else {
        setPromos([]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (promos.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [promos.length]);

  if (promos.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8 mt-2 cursor-pointer">
      <div className="relative h-28 sm:h-32 rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
        <AnimatePresence mode="wait">
          <motion.div
            key={promos[currentIndex].id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            onClick={() => onPromoClick && onPromoClick(promos[currentIndex])}
            className={`absolute inset-0 flex items-center justify-between p-6 ${promos[currentIndex].bg}`}
          >
            <div className="flex-1">
              {promos[currentIndex].matchId && (
                <div className="inline-block px-2 py-0.5 mb-1 bg-white/20 rounded-full text-[10px] font-black text-white uppercase animate-pulse">
                  🎯 Click to Join
                </div>
              )}
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide drop-shadow-md">
                {promos[currentIndex].title}
              </h2>
              <p className="text-white/80 text-xs sm:text-sm mt-1 font-medium max-w-sm drop-shadow-sm">
                {promos[currentIndex].desc}
              </p>
            </div>
            <div className="text-5xl sm:text-6xl drop-shadow-2xl">
              {promos[currentIndex].icon}
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Indicators */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          {promos.map((_, idx) => (
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
