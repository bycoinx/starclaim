import React, { useEffect, useRef } from "react";

/**
 * StarCanvas — animated starfield with twinkle + periodic shooting stars + mouse parallax.
 * Pure canvas, 300+ particles, requestAnimationFrame.
 */
export default function StarCanvas({ density = 320, className = "" }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf = 0;
    let stars = [];
    let shootingStars = [];
    let dust = [];

    // Slow camera drift for parallax effect
    const driftSpeed = 0.02; // pixels per frame (very slow)
    let driftOffsetX = 0;
    let driftOffsetY = 0;
    let driftDirX = (Math.random() > 0.5 ? 1 : -1);
    let driftDirY = (Math.random() > 0.5 ? 1 : -1);
    let driftChangeTimer = 0;
    const driftChangeInterval = 600; // Change direction every ~10 seconds at 60fps

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const parent = canvas.parentElement || { clientWidth: window.innerWidth, clientHeight: window.innerHeight };
      const { clientWidth, clientHeight } = parent;
      canvas.width = clientWidth * dpr;
      canvas.height = clientHeight * dpr;
      canvas.style.width = clientWidth + "px";
      canvas.style.height = clientHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      stars = Array.from({ length: density }, () => ({
        x: Math.random() * clientWidth,
        y: Math.random() * clientHeight,
        r: Math.random() * 1.4 + 0.2,
        a: Math.random() * 0.8 + 0.2,
        da: (Math.random() * 0.02 + 0.004) * (Math.random() > 0.5 ? 1 : -1),
        hue: Math.random() > 0.92 ? "gold" : Math.random() > 0.85 ? "blue" : "white",
        vx: (Math.random() - 0.5) * 0.05, // Slow drift X
        vy: (Math.random() - 0.5) * 0.05, // Slow drift Y
        parallaxFactor: Math.random() * 20 + 5, // How much it reacts to mouse
      }));

      // Initialize dust particles for subtle cosmic dust movement
      dust = Array.from({ length: 50 }, () => ({
        x: Math.random() * clientWidth,
        y: Math.random() * clientHeight,
        r: Math.random() * 1 + 0.2, // Very small: 0.2-1.2px
        a: Math.random() * 0.3 + 0.1, // Low opacity: 0.1-0.4
        vx: (Math.random() - 0.5) * 0.02, // Very slow drift
        vy: (Math.random() - 0.5) * 0.02, // Very slow drift
        hue: Math.random() > 0.7 ? "gold" : Math.random() > 0.4 ? "blue" : "white", // Slight color variation
      }));
    }

    function handleMouseMove(e) {
      const { clientWidth, clientHeight } = canvas.parentElement || { clientWidth: window.innerWidth, clientHeight: window.innerHeight };
      mouseRef.current = {
        x: (e.clientX / clientWidth) - 0.5,
        y: (e.clientY / clientHeight) - 0.5,
      };
    }

    function spawnShooting() {
      const parent = canvas.parentElement || { clientWidth: window.innerWidth, clientHeight: window.innerHeight };
      const { clientWidth, clientHeight } = parent;
      shootingStars.push({
        x: Math.random() * clientWidth * 0.4,
        y: Math.random() * clientHeight * 0.4,
        vx: 7 + Math.random() * 4,
        vy: 2 + Math.random() * 2,
        life: 0,
        maxLife: 90 + Math.random() * 40,
      });
    }

    function draw() {
      // Update slow camera drift
      driftChangeTimer++;
      if (driftChangeTimer >= driftChangeInterval) {
        // Occasionally change direction
        if (Math.random() > 0.7) driftDirX *= -1; // 30% chance to reverse X direction
        if (Math.random() > 0.7) driftDirY *= -1; // 30% chance to reverse Y direction
        driftChangeTimer = 0;
      }

      driftOffsetX += driftSpeed * driftDirX;
      driftOffsetY += driftSpeed * driftDirY;

      // Keep drift within bounds
      if (driftOffsetX > 300) driftOffsetX = -300;
      if (driftOffsetX < -300) driftOffsetX = 300;
      if (driftOffsetY > 300) driftOffsetY = -300;
      if (driftOffsetY < -300) driftOffsetY = 300;

      const parent = canvas.parentElement || { clientWidth: window.innerWidth, clientHeight: window.innerHeight };
      const { clientWidth, clientHeight } = parent;
      ctx.clearRect(0, 0, clientWidth, clientHeight);

      // stars
      for (const s of stars) {
        s.a += s.da;
        if (s.a <= 0.15 || s.a >= 1) s.da = -s.da;
        
        // Drift movement
        s.x += s.vx;
        s.y += s.vy;

        // Mouse Parallax
        const px = mouseRef.current.x * s.parallaxFactor;
        const py = mouseRef.current.y * s.parallaxFactor;

        // Apply camera drift (subtract because camera movement creates opposite apparent motion)
        let drawX = s.x + px - driftOffsetX;
        let drawY = s.y + py - driftOffsetY;

        // Wrap around logic for drift (considering parallax and camera drift)
        if (s.x < -30) s.x = clientWidth + 30;
        if (s.x > clientWidth + 30) s.x = -30;
        if (s.y < -30) s.y = clientHeight + 30;
        if (s.y > clientHeight + 30) s.y = -30;

        const color = s.hue === "gold"
          ? `rgba(212, 175, 55, ${s.a})` // Primary Gold #D4AF37
          : s.hue === "blue"
            ? `rgba(77, 124, 255, ${s.a})` // Cosmic Blue #4D7CFF
            : `rgba(240, 244, 255, ${s.a})`; // White stars
        
        ctx.beginPath();
        ctx.arc(drawX, drawY, s.r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        if (s.r > 1.1) {
          ctx.beginPath();
          ctx.arc(drawX, drawY, s.r * 3, 0, Math.PI * 2);
          ctx.fillStyle = color.replace(/[\d.]+\)$/, `${s.a * 0.08})`);
          ctx.fill();
        }
      }

      // Update and draw dust particles for subtle cosmic dust movement
      for (const d of dust) {
        // Update position
        d.x += d.vx;
        d.y += d.vy;

        // Apply camera drift (subtract because camera movement creates opposite apparent motion)
        const drawDx = d.x - driftOffsetX;
        const drawDy = d.y - driftOffsetY;

        // Wrap around
        if (drawDx < -10) drawDx = clientWidth + 10;
        if (drawDx > clientWidth + 10) drawDx = -10;
        if (drawDy < -10) drawDy = clientHeight + 10;
        if (drawDy > clientHeight + 10) drawDy = -10;

        // Draw dust particle
        const dustColor = d.hue === "gold"
          ? `rgba(212, 175, 55, ${d.a})` // Primary Gold
          : d.hue === "blue"
            ? `rgba(77, 124, 255, ${d.a})` // Cosmic Blue
            : `rgba(240, 244, 255, ${d.a})`; // White

        ctx.beginPath();
        ctx.arc(drawDx, drawDy, d.r, 0, Math.PI * 2);
        ctx.fillStyle = dustColor;
        ctx.fill();
      }

    // shooting stars
      shootingStars = shootingStars.filter((m) => m.life < m.maxLife);
      for (const m of shootingStars) {
        m.life += 1;
        m.x += m.vx;
        m.y += m.vy;
        const tailLen = 90;
        const grad = ctx.createLinearGradient(m.x - m.vx * tailLen * 0.1, m.y - m.vy * tailLen * 0.1, m.x, m.y);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(1, "rgba(255,255,255,0.95)");
        // Apply camera drift to shooting stars
        const drawMx = m.x - driftOffsetX;
        const drawMy = m.y - driftOffsetY;

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(drawMx - m.vx * 10, drawMy - m.vy * 10);
        ctx.lineTo(drawMx, drawMy);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(drawMx, drawMy, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    raf = requestAnimationFrame(draw);

    const shootingInterval = setInterval(() => {
      if (Math.random() > 0.35) spawnShooting();
    }, 3500);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(shootingInterval);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      aria-hidden
    />
  );
}

