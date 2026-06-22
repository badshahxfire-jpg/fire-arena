import { useState, useEffect, useRef } from "react";

export default function ZoomControl() {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  useEffect(() => {
    // Set initial position based on window size
    setPosition({ x: window.innerWidth - 60, y: 100 });
    setIsMounted(true);
  }, []);

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
    
    // Clamping to screen boundaries
    newX = Math.max(0, Math.min(newX, window.innerWidth - 50));
    newY = Math.max(0, Math.min(newY, window.innerHeight - 150));
    
    setPosition({ x: newX, y: newY });
  };

  const onPointerUp = (e) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  if (!isMounted) return null; // Avoid hydration mismatch on initial render

  return (
    <div 
      className={`fixed z-[999] flex flex-col gap-2 bg-black/80 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-1.5 shadow-2xl transition-transform ${isDragging ? 'cursor-grabbing scale-105 shadow-cyan-500/20' : 'cursor-grab'}`}
      style={{ left: `${position.x}px`, top: `${position.y}px`, touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Drag Handle Indicator */}
      <div className="w-full flex justify-center py-1 opacity-50">
        <div className="w-4 h-1 bg-white/30 rounded-full" />
      </div>
      
      <button onPointerDown={e => e.stopPropagation()} onClick={handleZoomIn} className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-xl text-white transition-all active:scale-95" title="Zoom In">
        +
      </button>
      <button onPointerDown={e => e.stopPropagation()} onClick={resetZoom} className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center font-bold text-[9px] md:text-[10px] text-orange-400 transition-all active:scale-95" title="Reset Zoom">
        {(zoomLevel * 100).toFixed(0)}%
      </button>
      <button onPointerDown={e => e.stopPropagation()} onClick={handleZoomOut} className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-2xl text-white transition-all active:scale-95" title="Zoom Out">
        -
      </button>
    </div>
  );
}
