import React, { useRef, useEffect, useState } from "react";

export default function WelcomeScratchCard({ onClaim, onClose }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isScratched, setIsScratched] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const lastPosRef = useRef(null);

  // Generate CSS confetti particles
  const triggerConfetti = () => {
    const particles = [];
    const colors = ["#f43f5e", "#3b82f6", "#10b981", "#eab308", "#a855f7", "#ec4899"];
    for (let i = 0; i < 60; i++) {
      particles.push({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 2,
        size: 5 + Math.random() * 10,
        tilt: Math.random() * 360,
      });
    }
    setConfetti(particles);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions based on visible parent container
    const rect = canvas.parentNode.getBoundingClientRect();
    canvas.width = rect.width || 300;
    canvas.height = rect.height || 180;

    // Draw scratchable cover
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#2c1654"); // Dark purple
    gradient.addColorStop(0.5, "#4c1d95"); // Bright purple
    gradient.addColorStop(1, "#1e1b4b"); // Navy
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw cyberpunk texture grid pattern
    ctx.strokeStyle = "rgba(168, 85, 247, 0.15)";
    ctx.lineWidth = 1;
    const gridSize = 15;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw text overlay
    ctx.fillStyle = "#f59e0b"; // Yellow gold
    ctx.font = "900 18px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🎁 WELCOME BONUS", canvas.width / 2, canvas.height / 2 - 20);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("SCRATCH WITH MOUSE OR FINGER", canvas.width / 2, canvas.height / 2 + 15);
    ctx.fillStyle = "#a855f7";
    ctx.fillText("TO REVEAL YOUR REWARD!", canvas.width / 2, canvas.height / 2 + 32);
  }, []);

  // Calculate percentage of canvas scratched off
  const checkScratchPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;
    let transparentCount = 0;
    const step = 24; // Sample every 6th pixel (4 channels per pixel, so 6 * 4 = 24) to optimize speed
    
    for (let i = 3; i < pixels.length; i += step) {
      if (pixels[i] < 128) {
        transparentCount++;
      }
    }

    const totalSamples = Math.floor(pixels.length / step);
    const percentage = (transparentCount / totalSamples) * 100;

    if (percentage > 10 && !isScratched) {
      setIsScratched(true);
      // Fade out and clear the rest
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      triggerConfetti();
    }
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Support both mouse and touch events
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    lastPosRef.current = getCoordinates(e);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPosRef.current = null;
  };

  const draw = (e) => {
    if (!isDrawing || isScratched) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Prevent scrolling on mobile while scratching
    if (e.cancelable) e.preventDefault();

    const { x, y } = getCoordinates(e);

    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = 45; // Scratch brush size
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    if (lastPosRef.current) {
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.arc(x, y, 22.5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    lastPosRef.current = { x, y };

    checkScratchPercentage();
  };

  const handleClaimClick = async () => {
    setClaimed(true);
    await onClaim();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      
      {/* Confetti Animation Container */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {confetti.map((p) => (
          <div
            key={p.id}
            className="absolute top-[-20px] rounded-sm pointer-events-none animate-confetti-fall"
            style={{
              left: `${p.left}%`,
              backgroundColor: p.color,
              width: `${p.size}px`,
              height: `${p.size}px`,
              transform: `rotate(${p.tilt}deg)`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      <div 
        ref={containerRef}
        className="w-full max-w-sm bg-[#0a0a16] border-2 border-purple-500 rounded-3xl p-6 relative shadow-[0_0_50px_rgba(168,85,247,0.3)] animate-scale-up"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 cyber-neon tracking-wide">
            🎉 NEW PLAYER GIFT
          </h2>
          <p className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-widest">
            Welcome to Baadshah Arena
          </p>
        </div>

        {/* Scratch Box Area */}
        <div className="relative w-full h-[220px] bg-black rounded-2xl overflow-hidden border border-purple-500/20 shadow-inner flex flex-col justify-center items-center z-10">
          
          {/* Inner Reward (Hidden underneath the scratch layer) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#120c24] to-black">
            <span className="text-5xl animate-bounce mb-2">🪙</span>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">YOUR WELCOME REWARD</p>
            <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 cyber-prize mt-1">
              +20 COINS
            </h3>
            
            {isScratched && (
              <button
                onClick={handleClaimClick}
                disabled={claimed}
                className="mt-4 px-8 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black rounded-xl font-black text-sm md:text-base transition-all duration-300 hover:scale-[1.03] shadow-[0_0_20px_rgba(234,179,8,0.4)] disabled:opacity-50 relative z-20 pointer-events-auto cursor-pointer"
              >
                {claimed ? "CLAIMING... ⏳" : "🎁 CLAIM 20 COINS"}
              </button>
            )}
            
            {isScratched && !claimed && (
              <span className="text-[10px] text-green-400 mt-2 font-bold animate-pulse absolute bottom-2">
                ✨ SCRATCHED SUCCESSFULLY!
              </span>
            )}
          </div>

          {/* HTML5 Canvas Scratchable Cover Layer */}
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className={`absolute inset-0 cursor-crosshair transition-opacity duration-500 ${
              isScratched ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          />
        </div>

        {/* Bottom Actions */}
        <div className="mt-6 flex flex-col gap-3">
          {!isScratched && (
            <div className="text-center py-3 text-sm text-gray-500 font-bold border border-dashed border-gray-700 rounded-2xl bg-black/40">
              👆 Scratch above to reveal reward!
            </div>
          )}

          {/* Close button - only active if scratch is complete or user decides to claim later */}
          <button
            onClick={onClose}
            className="w-full text-center text-xs text-gray-500 hover:text-white transition-colors py-1.5 font-bold uppercase tracking-wider"
          >
            Claim Later
          </button>
        </div>
      </div>

      {/* Styled inline animations to avoid CSS file pollution */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-up {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        .animate-scale-up {
          animation: scale-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-confetti-fall {
          animation: confetti-fall 3s linear forwards;
        }
      `}</style>
    </div>
  );
}
