import React, { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

function WarpField({ count = 5000 }) {
  const pointsRef = useRef();
  
  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Create stars in a tunnel/cylinder shape
      const angle = Math.random() * Math.PI * 2;
      const radius = 2 + Math.random() * 10;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.sin(angle) * radius;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100;
      spd[i] = 0.5 + Math.random() * 2;
    }
    return [pos, spd];
  }, [count]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const array = pointsRef.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      array[i * 3 + 2] += speeds[i] * 50 * delta; // Fly towards camera
      if (array[i * 3 + 2] > 10) {
        array[i * 3 + 2] = -90; // Reset to back of tunnel
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#fff"
        size={0.12}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

export default function CinematicWarp({ onComplete }) {
  const [phase, setPhase] = useState("void"); // void -> logo -> warp -> finish

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("logo"), 800);
    const t2 = setTimeout(() => setPhase("warp"), 3200);
    const t3 = setTimeout(() => {
        setPhase("finish");
        if (onComplete) onComplete();
    }, 5500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden">
      <AnimatePresence>
        {phase === "logo" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, letterSpacing: "1.5em" }}
            animate={{ opacity: 1, scale: 1, letterSpacing: "1.2em" }}
            exit={{ opacity: 0, scale: 1.5, filter: "blur(20px)" }}
            transition={{ duration: 1.8, ease: "easeOut" }}
            className="text-sc-gold font-display text-4xl md:text-6xl font-bold uppercase pointer-events-none"
          >
            StarClaim
          </motion.div>
        )}
      </AnimatePresence>

      {phase === "warp" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "brightness(2)" }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
            <WarpField />
          </Canvas>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
        </motion.div>
      )}

      {/* Vibration effect */}
      <motion.div
        animate={{
          backgroundColor: ["rgba(0,0,0,1)", "rgba(10,10,25,1)", "rgba(0,0,0,1)"],
        }}
        transition={{ duration: 0.15, repeat: Infinity }}
        className="absolute inset-0 pointer-events-none opacity-10"
      />
    </div>
  );
}

