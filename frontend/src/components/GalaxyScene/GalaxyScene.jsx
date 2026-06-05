import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
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

function MilkyWayBackground() {
  const geom = useMemo(() => {
    const points = 20000;
    const positions = new Float32Array(points * 3);
    const colors = new Float32Array(points * 3);
    for (let i = 0; i < points; i++) {
      const r = Math.random() * 800;
      const theta = Math.random() * Math.PI * 2;
      const x = r * Math.cos(theta);
      const y = (Math.random() - 0.5) * 4.0;
      const z = r * Math.sin(theta);
      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      const t = Math.min(1, r / 800);
      // inner warm, outer cool
      const ir = 1.0 * (1 - t) + 0.6 * t;
      const ig = 0.9 * (1 - t) + 0.7 * t;
      const ib = 0.5 * (1 - t) + 1.0 * t;
      colors[i * 3 + 0] = ir;
      colors[i * 3 + 1] = ig;
      colors[i * 3 + 2] = ib;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, []);

  return (
    <points geometry={geom} frustumCulled={false}>
      <pointsMaterial vertexColors size={0.3} sizeAttenuation={true} depthWrite={false} transparent opacity={0.9} />
    </points>
  );
}

function HYGStarField({ stars, ownedStars = [], onStarClick = () => {} }) {
  const refNear = useRef();
  const refMid = useRef();

  // LOD thresholds (parsec)
  const NEAR_MAX = 200; // fully detailed
  const MID_MAX = 500; // mid detail, faded

  // Lists computed unconditionally to satisfy hooks rules
  const nearList = useMemo(() => stars ? stars.filter(s => { const d = parseFloat(s.dist||0); return !isNaN(d) && d <= NEAR_MAX; }) : [], [stars]);
  const midList = useMemo(() => stars ? stars.filter(s => { const d = parseFloat(s.dist||0); return !isNaN(d) && d > NEAR_MAX && d <= MID_MAX; }) : [], [stars]);

  const { nearGeom, midGeom } = useMemo(() => {
    const build = (arr, sizeMultiplier = 1) => {
      const positions = new Float32Array(arr.length * 3);
      const colors = new Float32Array(arr.length * 3);
      const sizes = new Float32Array(arr.length);
      for (let i = 0; i < arr.length; i++) {
        const s = arr[i];
        positions[i * 3 + 0] = s.threeX;
        positions[i * 3 + 1] = s.threeY;
        positions[i * 3 + 2] = s.threeZ;
        const c = new THREE.Color(s.color);
        colors[i * 3 + 0] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
        sizes[i] = (s.size || 0.5) * sizeMultiplier;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      g.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      return g;
    };

    const nG = nearList.length ? build(nearList, 1.0) : null;
    const mG = midList.length ? build(midList, 0.6) : null;
    return { nearGeom: nG, midGeom: mG };
  }, [nearList, midList]);

  useFrame(({ clock }) => {
    if (refNear.current) refNear.current.material.opacity = 0.95 + Math.sin(clock.getElapsedTime() * 0.6) * 0.03;
    if (refMid.current) refMid.current.material.opacity = 0.35 + Math.sin(clock.getElapsedTime() * 0.4) * 0.02;
  });

  const handlePointerDown = (e, list) => {
    e.stopPropagation();
    const idx = e.index;
    if (idx != null) {
      // map back to correct star in original array: brute force search by position
      const pos = [e.point.x, e.point.y, e.point.z];
      const found = list.find(s => Math.abs(s.threeX - pos[0]) < 1e-4 && Math.abs(s.threeY - pos[1]) < 1e-4 && Math.abs(s.threeZ - pos[2]) < 1e-4);
      if (found) onStarClick(found);
    }
  };

  if (!nearGeom && !midGeom) return null;

  return (
    <>
      {nearGeom && (
        <points ref={refNear} geometry={nearGeom} onPointerDown={(e) => handlePointerDown(e, nearList)}>
          <pointsMaterial vertexColors size={0.8} sizeAttenuation={true} depthWrite={false} transparent opacity={0.95} blending={THREE.AdditiveBlending} />
        </points>
      )}
      {midGeom && (
        <points ref={refMid} geometry={midGeom} onPointerDown={(e) => handlePointerDown(e, midList)}>
          <pointsMaterial vertexColors size={0.5} sizeAttenuation={true} depthWrite={false} transparent opacity={0.35} blending={THREE.AdditiveBlending} />
        </points>
      )}
    </>
  );
}

function SolarSystemScene() {
  const group = useRef();
  useFrame(() => {
    // update planets positions
    if (!group.current) return;
    const t = Date.now() / 1000;
    for (let i = 0; i < PLANETS.length; i++) {
      const node = group.current.children[i];
      if (!node) continue;
      const p = keplerEllipsePosition(PLANETS[i].sma, PLANETS[i].e, PLANETS[i].period, t);
      node.position.set(p[0], p[1], p[2]);
    }
  });

  return (
    <group ref={group}>
      {/* Sun */}
      <mesh position={[0,0,0]}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial emissive={'#FFA500'} emissiveIntensity={3} color={'#FFA500'} />
      </mesh>
      <pointLight position={[0,0,0]} intensity={5} distance={500} color={'#FFF5E0'} />
      {PLANETS.map((p, i) => (
        <mesh key={p.name} position={[p.sma * SOLAR_SCALE, 0, 0]}>
          <sphereGeometry args={[p.radius * SOLAR_SCALE, 16, 16]} />
          <meshStandardMaterial color={p.color} />
        </mesh>
      ))}
    </group>
  );
}

export default function GalaxyScene({ ownedStars = [], onStarClick: externalOnStarClick }) {
  const [stars, setStars] = useState(null);
  const [selected, setSelected] = useState(null);
  const orient = useDeviceOrientation();

  useEffect(() => {
    let mounted = true;
    loadHygStars({ limit: 9000 }).then(s => { if (mounted) setStars(s); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {!stars && <LoadingOverlay />}
      <Canvas camera={{ position: [0, 15, 50], fov: 60, near: 0.001, far: 100000 }} gl={{ antialias: true, logarithmicDepthBuffer: true }} style={{ width: '100%', height: '100%', background: '#000005' }}>
        <Suspense fallback={null}>
          <color attach="background" args={["#000005"]} />
          <fog attach="fog" args={["#000010", 200, 2000]} />
          <ambientLight intensity={0.1} />
          <MilkyWayBackground />
          {stars && <HYGStarField stars={stars} ownedStars={ownedStars} onStarClick={(s) => setSelected(s)} />}
          <SolarSystemScene />
          <CameraRig enableCinematic={true} />
          <EffectComposer>
            <Bloom luminanceThreshold={0.3} luminanceSmoothing={0.9} intensity={1.0} />
          </EffectComposer>
          <OrbitControls enablePan enableZoom enableRotate={!orient.isMobile} zoomSpeed={0.8} minDistance={0.5} maxDistance={5000} makeDefault />
        </Suspense>
      </Canvas>
      <StarPopup star={selected} onClose={() => setSelected(null)} onClaim={() => { if (externalOnStarClick) externalOnStarClick(selected); }} />
    </div>
  );
}
