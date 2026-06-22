import { useEffect, useRef } from "react";

export default function ThemeParticles() {
  const canvasRef = useRef(null);
  const themeRef = useRef("fire");

  useEffect(() => {
    // Determine initial theme from body attribute
    const initialTheme = document.body.getAttribute("data-theme") || "fire";
    themeRef.current = initialTheme;

    // Canvas Setup
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particle System Variables
    let particles = [];
    const maxParticles = 65;

    // Helper: random range
    const random = (min, max) => Math.random() * (max - min) + min;

    // Particle Factory
    const createParticle = (theme, isInitial = false) => {
      const size = random(2, 5.5);
      let x = random(0, width);
      let y = height + 10;
      let vy = random(-1.4, -0.4);
      let vx = random(-0.4, 0.4);
      let color = "rgba(249, 115, 22, 0.4)"; // Fire Default
      let maxLife = random(100, 200);

      // If initial page load/theme change, scatter y coordinates across entire screen height
      if (isInitial) {
        y = random(0, height);
      }

      if (theme === "ocean") {
        // Ocean: rising bubbles
        vy = random(-1.0, -0.3);
        vx = random(-0.25, 0.25);
        color = `rgba(14, 165, 233, ${random(0.12, 0.28)})`;
      } else if (theme === "royal") {
        // Royal: drifting stardust
        vy = random(-0.7, -0.2);
        vx = random(-0.3, 0.3);
        color = `rgba(168, 85, 247, ${random(0.15, 0.42)})`;
      } else if (theme === "rose") {
        // Rose: petals falling down
        if (!isInitial) {
          y = -10;
        }
        vy = random(0.4, 1.2);
        vx = random(-0.6, 0.6);
        color = `rgba(244, 63, 94, ${random(0.18, 0.45)})`;
      } else if (theme === "gold") {
        // Gold: gold dust falling
        if (!isInitial) {
          y = -10;
        }
        vy = random(0.3, 1.0);
        vx = random(-0.4, 0.4);
        color = `rgba(234, 179, 8, ${random(0.18, 0.5)})`;
      } else if (theme === "cyber") {
        // Cyber: floating data characters
        vy = random(-0.6, 0.6);
        vx = random(-0.6, 0.6);
        color = `rgba(6, 182, 212, ${random(0.4, 0.9)})`;
      } else if (theme === "synth") {
        // Synth: fast moving horizontal laser lines
        if (!isInitial) {
          x = random() > 0.5 ? -10 : width + 10;
        }
        vy = random(-0.1, 0.1);
        vx = x < width / 2 ? random(1, 3) : random(-3, -1);
        color = `rgba(217, 70, 239, ${random(0.2, 0.6)})`;
      } else if (theme === "toxic") {
        // Toxic: glowing green blobs rising slowly
        vy = random(-0.8, -0.1);
        vx = random(-0.2, 0.2);
        color = `rgba(132, 204, 22, ${random(0.1, 0.3)})`;
      }

      return {
        x,
        y,
        vx,
        vy,
        size,
        color,
        life: maxLife,
        maxLife,
        wiggle: random(0, Math.PI * 2),
        wiggleSpeed: random(0.01, 0.04),
        char: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$#@%&*".charAt(Math.floor(Math.random() * 42)),
        rotation: random(0, Math.PI * 2),
        rotationSpeed: random(-0.05, 0.05)
      };
    };

    // Initialize the particles system
    const initParticles = (theme) => {
      particles = [];
      if (theme === "emerald" || theme === "cyber") return; // Matrix doesn't use standard particles
      for (let i = 0; i < maxParticles; i++) {
        particles.push(createParticle(theme, true));
      }
    };

    // Listen to theme-change events
    const handleThemeChange = (e) => {
      const nextTheme = e.detail || "fire";
      themeRef.current = nextTheme;
      initParticles(nextTheme);
    };
    window.addEventListener("theme-change", handleThemeChange);

    // Handle Resize
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles(themeRef.current);
    };
    window.addEventListener("resize", handleResize);

    // Initial fill
    initParticles(initialTheme);

    // Matrix Column Settings
    const matrixFontSize = 14;
    let matrixColumns = Math.floor(width / matrixFontSize);
    let matrixDrops = Array(matrixColumns).fill(0);
    const matrixChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$#@%&*";

    // Re-calculate matrix drops on resize
    const initMatrix = () => {
      matrixColumns = Math.floor(width / matrixFontSize);
      matrixDrops = Array(matrixColumns).fill(0).map(() => random(-height / matrixFontSize, 0));
    };
    initMatrix();

    // Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const activeTheme = themeRef.current;

      if (activeTheme === "emerald" || activeTheme === "cyber") {
        // --- MATRIX CODE RAIN ---
        ctx.fillStyle = "rgba(0, 0, 0, 0.08)"; // trail effect
        ctx.fillRect(0, 0, width, height); // Apply trail
        ctx.font = `bold ${matrixFontSize}px monospace`;

        for (let i = 0; i < matrixDrops.length; i++) {
          const text = matrixChars.charAt(Math.floor(Math.random() * matrixChars.length));
          const x = i * matrixFontSize;
          const y = matrixDrops[i] * matrixFontSize;

          // Glowing matrix text (emerald=green, cyber=cyan)
          ctx.fillStyle = activeTheme === "cyber" ? "rgba(6, 182, 212, 0.85)" : "rgba(16, 185, 129, 0.85)";
          ctx.fillText(text, x, y);

          // Highlight lead character
          if (Math.random() > 0.98) {
            ctx.fillStyle = "#fff";
            ctx.fillText(text, x, y);
          }

          // Reset drop if it goes offscreen
          if (y > height && Math.random() > 0.975) {
            matrixDrops[i] = 0;
          }
          matrixDrops[i] += 0.55; // speed
        }
      } else {
        // --- STANDARD PARTICLE THEMES ---
        // Spawn replacement particles if count dropped below max
        if (particles.length < maxParticles && Math.random() > 0.3) {
          particles.push(createParticle(activeTheme, false));
        }

        // Draw and update particles
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          
          // Update Particle Position
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 1;

          // Add gentle horizontal wiggle wave
          p.wiggle += p.wiggleSpeed;
          p.x += Math.sin(p.wiggle) * 0.15;

          if (activeTheme === "rose") {
            // falling sway
            p.vx += Math.cos(p.wiggle) * 0.02;
          }
          
          // Draw Particle
          ctx.beginPath();
          const alpha = p.life / p.maxLife;

          if (activeTheme === "synth") {
            // Fast laser lines
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - p.vx * 10, p.y - p.vy * 10);
            ctx.strokeStyle = p.color.replace(/[\d.]+\)$/, `${alpha})`);
            ctx.lineWidth = p.size / 2;
            ctx.stroke();
          } else if (activeTheme === "ocean") {
            // Bubble with outline
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.strokeStyle = p.color.replace(/[\d.]+\)$/, `${alpha * 0.4})`);
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = p.color.replace(/[\d.]+\)$/, `${alpha * 0.1})`);
            ctx.fill();
          } else {
            // Glowing particle
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
            grad.addColorStop(0, p.color.replace(/[\d.]+\)$/, `${alpha * 0.8})`));
            grad.addColorStop(1, "rgba(0,0,0,0)");
            
            ctx.fillStyle = grad;
            ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
            ctx.fill();
          }

          // Remove dead particles
          if (p.life <= 0 || p.y < -50 || p.y > height + 50 || p.x < -50 || p.x > width + 50) {
            particles.splice(i, 1);
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Clean up
    return () => {
      window.removeEventListener("theme-change", handleThemeChange);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[0]"
      style={{ opacity: 0.85 }}
    />
  );
}
