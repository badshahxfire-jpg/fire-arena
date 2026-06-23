import React, { useState, useEffect } from "react";
import logo from "../assets/logo.png";

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);

  // Simulate loading progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-black/90 pointer-events-none"></div>
      
      {/* Character Animation / GIF */}
      <div className="relative mb-8 z-10">
        <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full animate-pulse"></div>
        {/* Placeholder Free Fire GIF (using tenor or giphy) */}
        {/* If the GIF fails to load, it will show the alt text or we can fallback to logo */}
        <img 
          src="https://media1.tenor.com/m/o6oO8_Xp5gUAAAAd/free-fire.gif" 
          alt="Free Fire Loading" 
          className="w-48 h-48 md:w-64 md:h-64 object-contain relative z-10 drop-shadow-[0_0_15px_rgba(255,165,0,0.5)]"
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src = logo; // Fallback to your website logo
            e.target.className = "w-32 h-32 md:w-48 md:h-48 object-contain relative z-10 animate-bounce cyber-float";
          }}
        />
      </div>

      {/* Loading Text */}
      <h2 className="text-2xl md:text-3xl font-gaming font-black text-orange-400 tracking-widest mb-4 cyber-neon z-10">
        LOADING ARENA...
      </h2>

      {/* Progress Bar Container */}
      <div className="w-64 md:w-80 h-3 bg-gray-900 rounded-full border border-orange-500/30 overflow-hidden z-10 relative">
        {/* Progress Bar Fill */}
        <div 
          className="h-full bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-400 transition-all duration-300 ease-out relative"
          style={{ width: `${Math.min(progress, 100)}%` }}
        >
          {/* Shine effect on progress bar */}
          <div className="absolute inset-0 bg-white/20 w-full animate-[pulse_1s_ease-in-out_infinite]"></div>
        </div>
      </div>

      {/* Percentage */}
      <p className="mt-2 text-yellow-500 font-bold text-sm tracking-widest z-10">
        {Math.min(progress, 100)}%
      </p>
    </div>
  );
}
