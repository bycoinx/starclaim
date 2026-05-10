import React, { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const warpShader = {
  vertexShader: `
    uniform float time;
    uniform float speed;
    attribute float size;
    attribute vec3 customColor;
    varying vec3 vColor;
    varying float vOpacity;
    
    void main() {
      vColor = customColor;
      vec3 pos = position;
      
      // Infinite tunnel loop
      pos.z += time * speed;
      pos.z = mod(pos.z + 50.0, 100.0) - 50.0;
      
      // Light trail stretch effect
      float stretch = 1.0 + (speed * 0.1);
      pos.z *= (pos.z < 0.0) ? stretch : 1.0;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      
      // Size fades based on depth to avoid popping
      float depthFade = smoothstep(-50.0, -40.0, pos.z) * (1.0 - smoothstep(5.0, 10.0, pos.z));
      vOpacity = depthFade;
      
      gl_PointSize = size * (800.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying float vOpacity;
    void main() {
      float r = distance(gl_PointCoord, vec2(0.5));
      if (r > 0.5) discard;
      float strength = pow(1.0 - r * 2.0, 2.0);
      gl_FragColor = vec4(vColor, strength * vOpacity);
    }
  `
};

function ImaxWarpField({ count = 8000 }) {
  const meshRef = useRef();
  const [speed, setSpeed] = useState(15.0);

  const [positions, colors, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    
    const cyan = new THREE.Color("#22d3ee");
    const blue = new THREE.Color("#3b82f6");
    const white = new THREE.Color("#ffffff");

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.5 + Math.random() * 25.0;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.sin(angle) * radius;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100.0;

      const rand = Math.random();
      const color = rand > 0.8 ? cyan : rand > 0.4 ? blue : white;
      col[i * 3] = color.r; col[i * 3 + 1] = color.g; col[i * 3 + 2] = color.b;
      
      siz[i] = 0.5 + Math.random() * 2.5;
    }
    return [pos, col, siz];
  }, [count]);

  const uniforms = useMemo(() => ({
    time: { value: 0 },
    speed: { value: speed }
  }), [speed]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.time.value = state.clock.getElapsedTime();
      meshRef.current.material.uniforms.speed.value = THREE.MathUtils.lerp(meshRef.current.material.uniforms.speed.value, speed, 0.02);
    }
  });

  // Slow down the speed transition for epic feel
  useEffect(() => {
    const timer = setTimeout(() => setSpeed(60.0), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-customColor" count={count} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial 
        uniforms={uniforms} 
        vertexShader={warpShader.vertexShader} 
        fragmentShader={warpShader.fragmentShader} 
        transparent 
        blending={THREE.AdditiveBlending} 
        depthWrite={false} 
      />
    </points>
  );
}

export default function CinematicWarp({ onComplete }) {
  const [phase, setPhase] = useState("void"); // void -> logo -> warp -> finish

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("logo"), 1000);
    const t2 = setTimeout(() => setPhase("warp"), 4500); // Slower timing
    const t3 = setTimeout(() => {
        setPhase("finish");
        if (onComplete) onComplete();
    }, 8500); // Total 8.5s for more "Epic" feel

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === "logo" && (
          <motion.div
            key="logo"
            initial={{ opacity: 0, scale: 0.85, letterSpacing: "2em", filter: "blur(20px)" }}
            animate={{ opacity: 1, scale: 1, letterSpacing: "1.5em", filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 2.0, filter: "blur(40px)", letterSpacing: "3em" }}
            transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-sc-gold font-display text-4xl md:text-7xl font-bold uppercase pointer-events-none drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]"
          >
            StarClaim
          </motion.div>
        )}
      </AnimatePresence>

      {phase === "warp" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "brightness(3) blur(20px)" }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
        >
          <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
            <ImaxWarpField />
          </Canvas>
          {/* Cyan Glow Overlay */}
          <div className="absolute inset-0 bg-cyan-500/5 mix-blend-screen pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black pointer-events-none" />
        </motion.div>
      )}

      {/* Sub-bass vibration effect (visual) */}
      <motion.div
        animate={{
          backgroundColor: ["rgba(0,0,0,1)", "rgba(10,10,35,1)", "rgba(0,0,0,1)"],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 0.08, repeat: Infinity }}
        className="absolute inset-0 pointer-events-none z-[101]"
      />
    </div>
  );
}


