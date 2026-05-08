import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useT } from '../lib/i18n';
import Sun from './Sun';

// --- SHADERS ---

// Earth Shader: Day/Night transition
const earthVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vSunDirection;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vSunDirection = normalize(-worldPosition.xyz); // Sun is at (0,0,0)
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const earthFragmentShader = `
  uniform float time;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vSunDirection;
  
  // Better noise for continents
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
  }

  void main() {
    float intensity = dot(vNormal, vSunDirection);
    
    // Continents using layered noise
    float land = noise(vUv * 8.0) + 0.5 * noise(vUv * 16.0);
    bool isLand = land > 0.8;
    
    // Polar ice caps
    float polar = smoothstep(0.15, 0.0, vUv.y) + smoothstep(0.85, 1.0, vUv.y);
    
    vec3 oceanColor = vec3(0.05, 0.15, 0.5);
    vec3 landColor = vec3(0.1, 0.4, 0.15);
    vec3 iceColor = vec3(0.9, 0.9, 1.0);
    
    vec3 dayColor = mix(oceanColor, landColor, step(0.8, land));
    dayColor = mix(dayColor, iceColor, polar);
    
    // Animated clouds
    float cloudNoise = noise(vUv * 10.0 + time * 0.05) * noise(vUv * 5.0 - time * 0.02);
    vec3 clouds = vec3(1.0) * smoothstep(0.4, 0.8, cloudNoise);
    dayColor = mix(dayColor, clouds, smoothstep(0.4, 0.7, cloudNoise) * 0.6);
    
    // Night with city lights
    float lights = pow(fract(sin(vUv.x * 150.0) * cos(vUv.y * 150.0) * 1234.5), 30.0) * step(0.8, land);
    vec3 nightColor = mix(vec3(0.0, 0.01, 0.05), vec3(1.0, 0.7, 0.2), lights * 2.0);
    
    vec3 finalColor = mix(nightColor, dayColor, smoothstep(-0.2, 0.2, intensity));
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// Jupiter Shader: Animated gas bands
const jupiterFragmentShader = `
  uniform float time;
  varying vec2 vUv;
  
  void main() {
    float bands = sin(vUv.y * 40.0 + time * 0.2 + sin(vUv.x * 5.0) * 0.5);
    float noise = fract(sin(dot(vUv ,vec2(12.9898,78.233))) * 43758.5453);
    
    vec3 color1 = vec3(0.85, 0.47, 0.03); // Orange
    vec3 color2 = vec3(0.98, 0.82, 0.3);  // Yellow/Tan
    vec3 redSpot = vec3(0.6, 0.1, 0.0);   // Great Red Spot color
    
    vec3 finalColor = mix(color1, color2, bands * 0.5 + 0.5);
    
    // Simulate Red Spot at specific UV
    float distToSpot = distance(vUv, vec2(0.7, 0.4));
    finalColor = mix(redSpot, finalColor, smoothstep(0.05, 0.1, distToSpot));
    
    gl_FragColor = vec4(finalColor + noise * 0.02, 1.0);
  }
`;

// --- COMPONENTS ---

function SaturnRings({ radius }) {
  const pointsRef = useRef();
  const particleCount = 7000;
  
  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const s = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = radius * 1.5 + Math.random() * radius * 1.2;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.15;
      pos[i * 3 + 2] = Math.sin(angle) * r;
      s[i] = Math.random() * 0.06 + 0.02;
    }
    return [pos, s];
  }, [radius]);

  useFrame(() => {
    if (pointsRef.current) pointsRef.current.rotation.y += 0.0015;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color="#d4af37" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function Atmosphere({ size, color, opacity = 0.2 }) {
  return (
    <mesh scale={1.15}>
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial 
        color={color} 
        transparent 
        opacity={opacity} 
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

const PLANETS_CONFIG = [
  { name: "Mercury", nameTr: "Merkür", dist: 30, size: 0.8, speed: 0.047, color: "#9ca3af" },
  { name: "Venus", nameTr: "Venüs", dist: 50, size: 1.5, speed: 0.035, color: "#fbbf24", hasAtmosphere: true },
  { name: "Earth", nameTr: "Dünya", dist: 75, size: 1.6, speed: 0.029, isEarth: true },
  { name: "Mars", nameTr: "Mars", dist: 100, size: 1.0, speed: 0.024, color: "#ef4444" },
  { name: "Jupiter", nameTr: "Jüpiter", dist: 140, size: 3.5, speed: 0.013, isJupiter: true },
  { name: "Saturn", nameTr: "Satürn", dist: 190, size: 3.0, speed: 0.009, color: "#fcd34d", hasRings: true },
  { name: "Uranus", nameTr: "Uranüs", dist: 240, size: 2.2, speed: 0.006, color: "#60a5fa" },
  { name: "Neptune", nameTr: "Neptün", dist: 280, size: 2.1, speed: 0.005, color: "#312e81" },
];

export default function PlanetarySystem({ onSelect }) {
  const { lang } = useT();
  const groupRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!groupRef.current) return;
    
    groupRef.current.children.forEach((child) => {
      if (child.userData && child.userData.type === "planet") {
        const p = child.userData;
        const angle = t * p.speed + (p.index * 1.5);
        child.position.x = Math.cos(angle) * p.dist;
        child.position.z = Math.sin(angle) * p.dist;
        child.rotation.y += 0.005;

        // Update Shaders Time
        if (p.isJupiter || p.isEarth) {
          const mesh = child.children.find(c => c.type === 'Mesh');
          if (mesh && mesh.material.uniforms) {
            mesh.material.uniforms.time.value = t;
          }
        }
      }
    });
  });

  return (
    <group ref={groupRef}>
      <Sun onSelect={onSelect} />

      {PLANETS_CONFIG.map((p, i) => (
        <group 
          key={p.name}
          userData={{ type: "planet", index: i, ...p }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect({
              name: lang === "TR" ? p.nameTr : p.name,
              code: `SOL-0${i+1}`,
              constellation: "Solar System",
              tier: "Planetary Body"
            });
          }}
        >
          {/* Planet Body */}
          <mesh>
            <sphereGeometry args={[p.size, 64, 64]} />
            {p.isEarth ? (
              <shaderMaterial 
                uniforms={{ time: { value: 0 } }}
                vertexShader={earthVertexShader}
                fragmentShader={earthFragmentShader}
              />
            ) : p.isJupiter ? (
              <shaderMaterial 
                uniforms={{ time: { value: 0 } }}
                vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
                fragmentShader={jupiterFragmentShader}
              />
            ) : (
              <meshStandardMaterial color={p.color} roughness={0.7} metalness={0.2} />
            )}
          </mesh>

          {/* Special Effects */}
          {p.isEarth && <Atmosphere size={p.size} color="#60a5fa" opacity={0.3} />}
          {p.hasAtmosphere && <Atmosphere size={p.size} color="#fbbf24" opacity={0.2} />}
          {p.hasRings && <SaturnRings radius={p.size} />}

          {/* Orbit Line */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[p.dist - 0.2, p.dist + 0.2, 128]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.03} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
