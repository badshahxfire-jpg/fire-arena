import { useState, useRef, useEffect } from "react";
import backgroundMusic from "../assets/background-music.mp3";

export default function BackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem("bgm_muted") === "true";
    } catch (e) {
      console.warn("localStorage is not available for bgm_muted:", e);
      return false;
    }
  });
  
  const fixedVolume = 0.2; // Soft, fixed ambient background music volume
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : fixedVolume;
      audio.loop = true;

      // Attempt autoplay
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.log("Autoplay prevented by browser, waiting for user click.", err);
          setIsPlaying(false);
        });
      }
    }
  }, []);

  const handleToggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    // If autoplay was blocked and it's not currently playing, start playing unmuted
    if (!isPlaying) {
      audio.volume = fixedVolume;
      setIsMuted(false);
      try {
        localStorage.setItem("bgm_muted", "false");
      } catch (e) {
        console.warn(e);
      }
      audio.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(err => console.error("Failed to start audio playback:", err));
      return;
    }

    // Toggle mute state
    if (isMuted) {
      audio.volume = fixedVolume;
      setIsMuted(false);
      try {
        localStorage.setItem("bgm_muted", "false");
      } catch (e) {
        console.warn(e);
      }
    } else {
      audio.volume = 0;
      setIsMuted(true);
      try {
        localStorage.setItem("bgm_muted", "true");
      } catch (e) {
        console.warn(e);
      }
    }
  };

  return (
    <>
      <audio ref={audioRef} src={backgroundMusic} preload="auto" />

      {/* Music Widget Floating circular button - placed top right (below navbar) */}
      <div className="fixed top-[90px] right-6 z-[100] font-sans group">
        
        {/* Hover Slide-out Label */}
        <span className="absolute right-14 top-1/2 transform -translate-y-1/2 bg-[#0a0a0f]/80 backdrop-blur-sm border border-orange-500/20 text-[10px] font-black tracking-widest text-orange-400 px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-glass-glow">
          {isMuted || !isPlaying ? "🔊 PLAY MUSIC" : "🔇 MUTE MUSIC"}
        </span>

        {/* Circular Button */}
        <button
          onClick={handleToggleMute}
          className={`w-12 h-12 rounded-full bg-glass border border-orange-500/20 shadow-glass-glow flex items-center justify-center transition-all duration-300 hover:scale-110 relative ${
            isPlaying && !isMuted ? "border-orange-500/50" : "hover:border-orange-500/40"
          }`}
          title={isMuted || !isPlaying ? "Play Background Music" : "Mute Background Music"}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Spinning vinyl record background */}
            <svg 
              className={`absolute inset-0 w-full h-full text-orange-500/40 ${isPlaying && !isMuted ? 'animate-spin' : ''}`} 
              style={{ animationDuration: '4s' }} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="0.5"
            >
              <circle cx="12" cy="12" r="11" fill="#111" stroke="#333" strokeWidth="1" />
              <circle cx="12" cy="12" r="9" stroke="#222" strokeWidth="0.5" strokeDasharray="2,2" />
              <circle cx="12" cy="12" r="7" stroke="#222" strokeWidth="0.5" strokeDasharray="3,3" />
              <circle cx="12" cy="12" r="5" stroke="#222" strokeWidth="0.5" />
            </svg>

            {/* Static Foreground Icon in the Center */}
            <div className="relative z-10 text-orange-500 drop-shadow-[0_0_5px_rgba(249,115,22,0.6)]">
              {isMuted || !isPlaying ? (
                /* Mute Speaker Icon */
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                </svg>
              ) : (
                /* Playing Speaker Icon */
                <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z"/>
                </svg>
              )}
            </div>
          </div>

          {/* Glowing status indicator dot (green = playing/unmuted, red = muted/inactive) */}
          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0a0a0f] shadow-md transition-colors duration-300 ${
            isPlaying && !isMuted ? "bg-green-500 shadow-green-500/50" : "bg-red-500 shadow-red-500/50"
          }`} />

          {/* Pulsing ring visual invitation to click if muted/stopped */}
          {(isMuted || !isPlaying) && (
            <span className="absolute inset-0 rounded-full border border-orange-500/30 animate-ping opacity-75 pointer-events-none" style={{ animationDuration: '2s' }} />
          )}
        </button>
      </div>
    </>
  );
}