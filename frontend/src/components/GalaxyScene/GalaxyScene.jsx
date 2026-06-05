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
  const refNear = useRef();
  const refMid = useRef();
  const refFar = useRef();
  const refUltraFar = useRef();

  // LOD thresholds (parsec) - optimized for 120K stars
  const NEAR_MAX = 50;    // ultra detail (bright stars)
  const MID_MAX = 200;    // detail (mid brightness)
  const FAR_MAX = 500;    // sparse (distant stars)
  const ULTRA_FAR_MAX = 2000; // very distant (minimal detail)

  // Lists computed unconditionally to satisfy hooks rules
  const nearList = useMemo(() => stars ? stars.filter(s => { const d = parseFloat(s.dist||0); return !isNaN(d) && d <= NEAR_MAX; }) : [], [stars]);
  const midList = useMemo(() => stars ? stars.filter(s => { const d = parseFloat(s.dist||0); return !isNaN(d) && d > NEAR_MAX && d <= MID_MAX; }) : [], [stars]);
  const farList = useMemo(() => stars ? stars.filter(s => { const d = parseFloat(s.dist||0); return !isNaN(d) && d > MID_MAX && d <= FAR_MAX; }) : [], [stars]);
  const ultraFarList = useMemo(() => stars ? stars.filter(s => { const d = parseFloat(s.dist||0); return !isNaN(d) && d > FAR_MAX && d <= ULTRA_FAR_MAX; }) : [], [stars]);

  const { nearGeom, midGeom, farGeom, ultraFarGeom } = useMemo(() => {
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
    const fG = farList.length ? build(farList, 0.3) : null;
    const uG = ultraFarList.length ? build(ultraFarList, 0.15) : null;
    return { nearGeom: nG, midGeom: mG, farGeom: fG, ultraFarGeom: uG };
  }, [nearList, midList, farList, ultraFarList]);

  useFrame(({ clock }) => {
    if (refNear.current) refNear.current.material.opacity = 0.95 + Math.sin(clock.getElapsedTime() * 0.6) * 0.03;
    if (refMid.current) refMid.current.material.opacity = 0.35 + Math.sin(clock.getElapsedTime() * 0.4) * 0.02;
    if (refFar.current) refFar.current.material.opacity = 0.2 + Math.sin(clock.getElapsedTime() * 0.3) * 0.01;
    if (refUltraFar.current) refUltraFar.current.material.opacity = 0.1 + Math.sin(clock.getElapsedTime() * 0.2) * 0.005;
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

  if (!nearGeom && !midGeom && !farGeom && !ultraFarGeom) return null;

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
      {farGeom && (
        <points ref={refFar} geometry={farGeom}>
          <pointsMaterial vertexColors size={0.3} sizeAttenuation={true} depthWrite={false} transparent opacity={0.2} blending={THREE.AdditiveBlending} />
        </points>
      )}
      {ultraFarGeom && (
        <points ref={refUltraFar} geometry={ultraFarGeom}>
          <pointsMaterial vertexColors size={0.15} sizeAttenuation={true} depthWrite={false} transparent opacity={0.1} blending={THREE.AdditiveBlending} />
        </points>
      )}
    </>
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

  // Fly to selected star
  const flyToStar = (star) => {
    setTargetStar(star);
    setUseFlyControls(false); // Switch to orbit mode for better control
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
          <fog attach="fog" args={["#000010", 100, 3000]} />
          <ambientLight intensity={0.12} />
          {stars && <HYGStarField stars={stars} ownedStars={ownedStars} onStarClick={(s) => setSelected(s)} />}
          <SolarSystemScene />
          <CameraRig enableCinematic={true} />
          <CameraAnimator targetStar={targetStar} onArrived={handleArrival} />
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
      <StarPopup star={selected} onClose={() => setSelected(null)} onClaim={() => { if (externalOnStarClick) externalOnStarClick(selected); }} />
    </div>
  );
}
