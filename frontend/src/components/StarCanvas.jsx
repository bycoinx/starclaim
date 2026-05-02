import React, { useEffect, useRef } from "react";

/**
 * StarCanvas — animated starfield with twinkle + periodic shooting stars.
 * Pure canvas, 300+ particles, requestAnimationFrame.
 */
export default function StarCanvas({ density = 320, className = "" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf = 0;
    let stars = [];
    let shootingStars = [];

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const { clientWidth, clientHeight } = canvas.parentElement;
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
      }));
    }

    function spawnShooting() {
      const { clientWidth, clientHeight } = canvas.parentElement;
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
      const { clientWidth, clientHeight } = canvas.parentElement;
      ctx.clearRect(0, 0, clientWidth, clientHeight);

      // stars
      for (const s of stars) {
        s.a += s.da;
        if (s.a <= 0.15 || s.a >= 1) s.da = -s.da;
        const color = s.hue === "gold"
          ? `rgba(224, 187, 106, ${s.a})`
          : s.hue === "blue"
            ? `rgba(150, 195, 255, ${s.a})`
            : `rgba(240, 244, 255, ${s.a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        if (s.r > 1.1) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
          ctx.fillStyle = color.replace(/[\d.]+\)$/, `${s.a * 0.08})`);
          ctx.fill();
        }
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
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(m.x - m.vx * 10, m.y - m.vy * 10);
        ctx.lineTo(m.x, m.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(m.x, m.y, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(draw);

    const shootingInterval = setInterval(() => {
      if (Math.random() > 0.35) spawnShooting();
    }, 3500);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(shootingInterval);
      window.removeEventListener("resize", resize);
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
