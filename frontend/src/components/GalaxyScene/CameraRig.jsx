import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import useDeviceOrientation from '../../hooks/useDeviceOrientation';

export default function CameraRig({ enableCinematic = true }) {
  const { camera } = useThree();
  const orient = useDeviceOrientation();
  const ref = useRef({ t: 0, mode: 'orbit' });

  const orbitWaypoints = [
    new Vector3(0, 50, 150),
    new Vector3(120, 30, 100),
    new Vector3(80, 60, -120),
    new Vector3(-100, 40, 80),
  ];

  const exploreTargets = [
    new Vector3(0, 0, 0),      // Sun
    new Vector3(5, 2, 10),     // Deep space region 1
    new Vector3(-8, 15, -12),  // Deep space region 2
    new Vector3(10, -5, 8),    // Deep space region 3
  ];

  useFrame((state, delta) => {
    if (!enableCinematic) return;

    ref.current.t += delta * 0.03;
    const cycleTime = ref.current.t % 60; // 60 second cycle
    const mode = cycleTime < 30 ? 'orbit' : 'explore';

    let targetPos;
    if (mode === 'orbit') {
      const idx = Math.floor((cycleTime / 30) * orbitWaypoints.length) % orbitWaypoints.length;
      const nextIdx = (idx + 1) % orbitWaypoints.length;
      const t = ((cycleTime / 30) * orbitWaypoints.length) % 1;
      targetPos = orbitWaypoints[idx].clone().lerp(orbitWaypoints[nextIdx], Math.sin(t * Math.PI) * 0.5 + 0.5);
    } else {
      const exploreIdx = Math.floor(((cycleTime - 30) / 30) * exploreTargets.length) % exploreTargets.length;
      const nextExploreIdx = (exploreIdx + 1) % exploreTargets.length;
      const t = ((cycleTime - 30) / 30) % 1;
      const start = exploreTargets[exploreIdx];
      const end = exploreTargets[nextExploreIdx];
      targetPos = new Vector3(
        start.x + (end.x - start.x) * (Math.sin(t * Math.PI) * 0.5 + 0.5),
        start.y + (end.y - start.y) * (Math.sin(t * Math.PI) * 0.5 + 0.5),
        start.z + (end.z - start.z) * (Math.sin(t * Math.PI) * 0.5 + 0.5)
      );
    }

    camera.position.lerp(targetPos, 0.02);
    camera.lookAt(0, 0, 0);

    if (orient && orient.isMobile && orient.beta != null && orient.gamma != null) {
      const beta = (orient.beta || 0) * (Math.PI / 180);
      const gamma = (orient.gamma || 0) * (Math.PI / 180);
      camera.rotation.x += (-beta * 0.05 - camera.rotation.x) * 0.08;
      camera.rotation.y += (-gamma * 0.05 - camera.rotation.y) * 0.08;
    }
  });

  return null;
}
