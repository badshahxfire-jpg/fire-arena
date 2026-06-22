import { useState, useEffect } from "react";

export default function ZoomControl() {
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 1.5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  useEffect(() => {
    // Scaling the root font size scales all rem-based Tailwind classes smoothly
    document.documentElement.style.fontSize = `${16 * zoomLevel}px`;
  }, [zoomLevel]);

  return (
    <div className="fixed top-24 right-2 md:right-6 z-[999] flex flex-col gap-2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 shadow-2xl transition-all">
      <button onClick={handleZoomIn} className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-xl text-white transition-all active:scale-95" title="Zoom In">
        +
      </button>
      <button onClick={resetZoom} className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center font-bold text-[9px] md:text-[10px] text-orange-400 transition-all active:scale-95" title="Reset Zoom">
        {(zoomLevel * 100).toFixed(0)}%
      </button>
      <button onClick={handleZoomOut} className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-2xl text-white transition-all active:scale-95" title="Zoom Out">
        -
      </button>
    </div>
  );
}
