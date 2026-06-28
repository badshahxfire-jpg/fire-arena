import { useState, useEffect, useRef } from "react";

export default function ZoomControl() {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isHorizontal, setIsHorizontal] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  useEffect(() => {
    const savedPos = localStorage.getItem("zoomControlPos");
    const savedOrient = localStorage.getItem("zoomControlHorizontal");
    if (savedPos) {
      try {
        const parsed = JSON.parse(savedPos);
        // Ensure it's not totally off-screen
        parsed.x = Math.max(0, Math.min(parsed.x, window.innerWidth - 60));
        parsed.y = Math.max(0, Math.min(parsed.y, window.innerHeight - 60));
        setPosition(parsed);
      } catch (e) {
        setPosition({ x: window.innerWidth - 60, y: 100 });
      }
    } else {
      setPosition({ x: window.innerWidth - 60, y: 100 });
    }
    
    if (savedOrient) {
      setIsHorizontal(savedOrient === "true");
    }
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("zoomControlPos", JSON.stringify(position));
    }
  }, [position, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("zoomControlHorizontal", String(isHorizontal));
    }
  }, [isHorizontal, isMounted]);

  const handleZoomIn = (e) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.min(prev + 0.1, 1.5));
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  const resetZoom = (e) => {
    e.stopPropagation();
    setZoomLevel(1);
  };

  useEffect(() => {
    // Scaling the root font size scales all rem-based Tailwind classes smoothly
    document.documentElement.style.fontSize = `${16 * zoomLevel}px`;
  }, [zoomLevel]);

  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return; // Only left click
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    
    let newX = dragRef.current.initialX + dx;
    let newY = dragRef.current.initialY + dy;
    
    // Clamping to screen boundaries based on orientation
    const boxWidth = isHorizontal ? 220 : 60;
    const boxHeight = isHorizontal ? 60 : 220;
    newX = Math.max(0, Math.min(newX, window.innerWidth - boxWidth));
    newY = Math.max(0, Math.min(newY, window.innerHeight - boxHeight));
    
    setPosition({ x: newX, y: newY });
  };

  const onPointerUp = (e) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  if (!isMounted) return null; // Avoid hydration mismatch on initial render

  return (
    <div 
      className={`fixed z-[999] flex ${isHorizontal ? 'flex-row items-center' : 'flex-col items-center'} gap-2 bg-black/80 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-1.5 shadow-2xl ${isDragging ? 'cursor-grabbing scale-105 shadow-cyan-500/20 transition-none' : 'cursor-grab transition-all duration-300'}`}
      style={{ left: `${position.x}px`, top: `${position.y}px`, touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Drag Handle Indicator */}
      <div className={`flex justify-center opacity-50 ${isHorizontal ? 'px-1 h-full items-center' : 'w-full py-1'}`}>
        <div className={`bg-white/30 rounded-full ${isHorizontal ? 'w-1 h-4' : 'w-4 h-1'}`} />
      </div>
      
      <button onPointerDown={e => e.stopPropagation()} onClick={handleZoomIn} className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-xl text-white transition-all active:scale-95 shrink-0" title="Zoom In">
        +
      </button>
      <button onPointerDown={e => e.stopPropagation()} onClick={resetZoom} className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center font-bold text-[9px] md:text-[10px] text-orange-400 transition-all active:scale-95 shrink-0" title="Reset Zoom">
        {(zoomLevel * 100).toFixed(0)}%
      </button>
      <button onPointerDown={e => e.stopPropagation()} onClick={handleZoomOut} className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-2xl text-white transition-all active:scale-95 shrink-0" title="Zoom Out">
        -
      </button>
      
      <div className={isHorizontal ? "h-6 w-px bg-white/20" : "w-6 h-px bg-white/20"} />
      
      <button onPointerDown={e => e.stopPropagation()} onClick={() => setIsHorizontal(!isHorizontal)} className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center font-bold text-lg text-cyan-400 transition-all active:scale-95 shrink-0" title="Rotate">
        ↻
      </button>
    </div>
  );
}
