import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls, FlyControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import loadHygStars from '../../data/hygdata_v3_sample';
import { PLANETS, keplerEllipsePosition, SOLAR_SCALE } from '../../data/solarSystem';
import CameraRig from './CameraRig';
import useDeviceOrientation from '../../hooks/useDeviceOrientation';
import StarPopup from './StarPopup';

function LoadingOverlay() {
  return (
    <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff'}}>
      <div style={{background:'rgba(0,0,0,0.6)',padding:12,borderRadius:8}}>Loading galaxy…</div>
    </div>
  );
}


function HYGStarField({ stars, ownedStars = [], onStarClick = () => {} }) {
  const refStars = useRef();
  const STAR_SHADER = useMemo(() => ({
    uniforms: {},
    vertexShader: `
      attribute float size;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * clamp(120.0 / -mvPosition.z, 0.2, 16.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.2, d);
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  }), []);

  const { starGeometry, starCount } = useMemo(() => {
    if (!stars || !stars.length) return { starGeometry: null, starCount: 0 };
    const positions = new Float32Array(stars.length * 3);
    const colors = new Float32Array(stars.length * 3);
    const sizes = new Float32Array(stars.length);
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      positions[i * 3] = s.threeX;
      positions[i * 3 + 1] = s.threeY;
      positions[i * 3 + 2] = s.threeZ;
      const c = new THREE.Color(s.color);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      sizes[i] = Math.max(0.5, Math.min(6.0, s.size || 0.6));
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return { starGeometry: geometry, starCount: stars.length };
  }, [stars]);

  useFrame(({ clock }) => {
    if (refStars.current) {
      refStars.current.material.opacity = 0.7 + Math.sin(clock.getElapsedTime() * 0.3) * 0.12;
    }
  });

  const handlePointerDown = (e) => {
    e.stopPropagation();
    const idx = e.index;
    if (idx != null && Array.isArray(stars) && idx >= 0 && idx < stars.length) {
      onStarClick(stars[idx]);
    }
  };

  if (!starGeometry || !starCount) return null;

  return (
    <points ref={refStars} geometry={starGeometry} onPointerDown={handlePointerDown}>
      <shaderMaterial attach="material" {...STAR_SHADER} />
    </points>
  );
}

function StarSelectionMarker({ star }) {
  if (!star) return null;
  return (
    <mesh position={[star.threeX, star.threeY, star.threeZ]}>
      <sphereGeometry args={[Math.max((star.size || 1) * 0.22, 0.22), 16, 16]} />
      <meshBasicMaterial color="#89d7ff" transparent opacity={0.22} side={THREE.DoubleSide} />
    </mesh>
  );
}

function BinaryStarNet({ stars }) {
  const lineGeometry = useMemo(() => {
    if (!stars || stars.length === 0) return null;
    const candidates = stars.filter((s) => s.mag < 3.2).sort((a, b) => a.mag - b.mag).slice(0, 120);
    const segments = [];
    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length && segments.length < 28; j++) {
        const a = candidates[i];
        const b = candidates[j];
        if (!a || !b) continue;
        const dx = a.threeX - b.threeX;
        const dy = a.threeY - b.threeY;
        const dz = a.threeZ - b.threeZ;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist > 0.015 && dist < 0.09) {
          segments.push(a.threeX, a.threeY, a.threeZ);
          segments.push(b.threeX, b.threeY, b.threeZ);
        }
      }
    }
    if (!segments.length) return null;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(segments), 3));
    return geometry;
  }, [stars]);

  if (!lineGeometry) return null;
  return (
    <lineSegments geometry={lineGeometry}>
      <lineBasicMaterial color="#7ae1ff" transparent opacity={0.18} depthWrite={false} />
    </lineSegments>
  );
}

function OrbitRing({ radius, tilt, visible }) {
  const geometry = useMemo(() => {
    const inner = Math.max(0.01, radius * SOLAR_SCALE - 0.02);
    const outer = radius * SOLAR_SCALE + 0.02;
    return new THREE.RingGeometry(inner, outer, 128);
  }, [radius]);

  return visible ? (
    <mesh rotation={[Math.PI / 2, 0, 0]} geometry={geometry}>
      <meshBasicMaterial color="#8fb8ff" transparent opacity={0.1} side={THREE.DoubleSide} />
    </mesh>
  ) : null;
}

function SolarSystemScene() {
  const planetRefs = useRef([]);

  useFrame(() => {
    const t = Date.now() / 1000;
    for (let i = 0; i < PLANETS.length; i++) {
      const node = planetRefs.current[i];
      if (!node) continue;
      const orbit = keplerEllipsePosition(PLANETS[i].sma, PLANETS[i].e, PLANETS[i].period, t);
      node.position.set(orbit[0], orbit[1], orbit[2]);
    }
  });

  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial emissive={'#FFA500'} emissiveIntensity={3} color={'#FFA500'} />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={5} distance={500} color={'#FFF5E0'} />
      {PLANETS.map((p, index) => {
        const tiltRad = (p.tilt || 0) * Math.PI / 180;
        return (
          <group key={p.name}>
            <group rotation={[tiltRad, 0, 0]}>
              <OrbitRing radius={p.sma} visible={p.sma > 0.3} />
            </group>
            <group ref={(el) => { planetRefs.current[index] = el; }}>
              <mesh position={[p.sma * SOLAR_SCALE, 0, 0]}>
                <sphereGeometry args={[Math.max(p.radius * SOLAR_SCALE, 0.04), 24, 24]} />
                <meshStandardMaterial color={p.color} emissive={p.color} emissiveIntensity={0.2} />
              </mesh>
              {p.hasRings && (
                <mesh rotation={[Math.PI / 2, 0, 0]} position={[p.sma * SOLAR_SCALE, 0, 0]}>
                  <ringGeometry args={[0.11 * SOLAR_SCALE, 0.14 * SOLAR_SCALE, 64]} />
                  <meshStandardMaterial color="#d6c18d" transparent opacity={0.35} side={THREE.DoubleSide} />
                </mesh>
              )}
            </group>
          </group>
        );
      })}
    </group>
  );
}

function NebulaBackground() {
  const meshRef = useRef();
  const uniforms = useMemo(() => ({ time: { value: 0 } }), []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.time.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={meshRef} rotation={[0, 0, 0]}>
      <sphereGeometry args={[850, 64, 64]} />
      <shaderMaterial
        transparent
        side={THREE.BackSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={
          `varying vec3 vWorldPosition;
           void main() {
             vec4 worldPosition = modelMatrix * vec4(position, 1.0);
             vWorldPosition = worldPosition.xyz;
             gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
           }`
        }
        fragmentShader={
          `uniform float time;
           varying vec3 vWorldPosition;
           float noise(vec3 p) {
             return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
           }
           void main() {
             vec3 dir = normalize(vWorldPosition);
             float n = noise(dir * 12.0 + vec3(0.0, time * 0.05, 0.0));
             float band = pow(max(0.0, dot(dir, vec3(0.0, 0.08, 1.0))), 9.0);
             float swirl = sin(dir.x * 15.0 + time * 0.08) * 0.22 + cos(dir.z * 10.0 - time * 0.07) * 0.16;
             vec3 base = mix(vec3(0.01, 0.02, 0.05), vec3(0.06, 0.05, 0.10), band);
             vec3 glow = vec3(0.18, 0.10, 0.20) * smoothstep(0.4, 0.75, n + swirl);
             vec3 color = base + glow * 0.45;
             gl_FragColor = vec4(color, 0.9);
           }`
        }
      />
    </mesh>
  );
}

function MilkyWayBand() {
  const geometry = useMemo(() => new THREE.TorusGeometry(430, 6, 90, 240, Math.PI * 1.2), []);
  return (
    <mesh geometry={geometry} rotation={[Math.PI / 2, 0, 0]}>
      <meshBasicMaterial color="#4e71ff" transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

function CameraAnimator({ targetStar, onArrived }) {
  useFrame(({ camera }) => {
    if (targetStar) {
      const targetPos = new THREE.Vector3(targetStar.threeX, targetStar.threeY, targetStar.threeZ);
      const currentPos = camera.position.clone();
      const distance = currentPos.distanceTo(targetPos);
      
      if (distance > 2) {
        const direction = new THREE.Vector3().subVectors(targetPos, currentPos).normalize();
        const speed = Math.min(distance * 0.1, 5);
        camera.position.add(direction.multiplyScalar(speed));
        camera.lookAt(targetPos);
      } else {
        onArrived();
      }
    }
  });

  return null;
}

function ShootingStar() {
  const groupRef = useRef();
  const [active, setActive] = useState(false);
  const startPos = useRef(new THREE.Vector3());
  const endPos = useRef(new THREE.Vector3());
  const progress = useRef(0);
  const speed = useRef(0.5 + Math.random() * 0.5);

  useEffect(() => {
    const spawn = () => {
      if (Math.random() < 0.4) { // 40% chance every check (more frequent)
        // Random start position in sky
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const r = 500 + Math.random() * 500;
        
        startPos.current.set(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta)
        );
        
        // End position (downward direction)
        endPos.current.copy(startPos.current).add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 100,
            -200 - Math.random() * 100,
            (Math.random() - 0.5) * 100
          )
        );
        
        progress.current = 0;
        speed.current = 0.5 + Math.random() * 0.5;
        setActive(true);
      }
    };

    const interval = setInterval(spawn, 2000); // Check every 2 seconds (more frequent)
    return () => clearInterval(interval);
  }, []);

  useFrame(() => {
    if (active && groupRef.current) {
      progress.current += 0.02 * speed.current;
      
      if (progress.current >= 1) {
        setActive(false);
        return;
      }

      const currentPos = new THREE.Vector3().lerpVectors(startPos.current, endPos.current, progress.current);
      groupRef.current.position.copy(currentPos);
      
      // Rotate to face direction of movement
      const direction = new THREE.Vector3().subVectors(endPos.current, startPos.current).normalize();
      groupRef.current.lookAt(groupRef.current.position.clone().add(direction));
    }
  });

  if (!active) return null;

  return (
    <group ref={groupRef}>
      {/* Shooting star head */}
      <mesh>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Trail */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.01, 15, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
      </mesh>
      {/* Glow */}
      <pointLight intensity={2} distance={20} color="#ffffff" />
    </group>
  );
}

export default function GalaxyScene({ ownedStars = [], onStarClick: externalOnStarClick }) {
  const [stars, setStars] = useState(null);
  const [selected, setSelected] = useState(null);
  const [useFlyControls, setUseFlyControls] = useState(false);
  const [targetStar, setTargetStar] = useState(null);
  const cameraRef = useRef();
  const orient = useDeviceOrientation();

  useEffect(() => {
    let mounted = true;
    loadHygStars({ limit: 120000 }).then(s => { if (mounted) setStars(s); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const flyToStar = (star) => {
    if (!star) return;
    setTargetStar(star);
    setUseFlyControls(false);
  };

  const claimStar = (star) => {
    if (!star) return;
    setSelected(null);
    if (externalOnStarClick) externalOnStarClick(star);
  };

  const handleArrival = () => {
    setTargetStar(null);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {!stars && <LoadingOverlay />}
      <Canvas ref={cameraRef} camera={{ position: [0, 15, 50], fov: 60, near: 0.001, far: 100000 }} gl={{ antialias: true, logarithmicDepthBuffer: true }} style={{ width: '100%', height: '100%', background: '#000005' }}>
        <Suspense fallback={null}>
          <color attach="background" args={["#000005"]} />
          <NebulaBackground />
          <MilkyWayBand />
          <fog attach="fog" args={["#000010", 500, 10000]} />
          <ambientLight intensity={0.12} />
          {stars && <HYGStarField stars={stars} ownedStars={ownedStars} onStarClick={(s) => setSelected(s)} />}
          {selected && <StarSelectionMarker star={selected} />}
          {stars && <BinaryStarNet stars={stars} />}
          <SolarSystemScene />
          <CameraRig enableCinematic={true} />
          <CameraAnimator targetStar={targetStar} onArrived={handleArrival} />
          <ShootingStar />
          <EffectComposer>
            <Bloom luminanceThreshold={0.3} luminanceSmoothing={0.9} intensity={1.0} />
          </EffectComposer>
          {useFlyControls ? (
            <FlyControls
              makeDefault
              movementSpeed={50}
              domElement={document.documentElement}
              rollSpeed={0.5}
            />
          ) : (
            <OrbitControls enablePan enableZoom enableRotate={!orient.isMobile} zoomSpeed={0.8} minDistance={0.5} maxDistance={5000} makeDefault />
          )}
        </Suspense>
      </Canvas>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={() => setUseFlyControls(!useFlyControls)}
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
            border: '1px solid #444',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          {useFlyControls ? 'Orbit Mode' : 'Fly Mode'}
        </button>
        {selected && (
          <button
            onClick={() => flyToStar(selected)}
            style={{
              background: 'rgba(0, 100, 200, 0.7)',
              color: '#fff',
              border: '1px solid #4488ff',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Go to {selected.proper || 'Star'}
          </button>
        )}
      </div>
      <StarPopup
        star={selected}
        onClose={() => setSelected(null)}
        onClaim={() => claimStar(selected)}
        onFocus={() => flyToStar(selected)}
      />
    </div>
  );
}
