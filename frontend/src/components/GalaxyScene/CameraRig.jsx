import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, MathUtils } from 'three';
import useDeviceOrientation from '../../hooks/useDeviceOrientation';

export default function CameraRig({ enableCinematic = true, fovBoost = false }) {
  const orient = useDeviceOrientation();
  const ref = useRef({ t: 0 });

  const orbitWaypoints = [
    new Vector3(0, 50, 150),
    new Vector3(120, 30, 100),
    new Vector3(80, 60, -120),
    new Vector3(-100, 40, 80),
  ];

  useFrame((state, delta) => {
    const { camera } = state;

    // FOV Boost during Warp
    const targetFov = fovBoost ? 110 : 60;
    camera.fov = MathUtils.lerp(camera.fov, targetFov, 0.05);
    camera.updateProjectionMatrix();

    if (!enableCinematic) return;

    ref.current.t += delta * 0.03;
    const cycleTime = ref.current.t % 60;
    
    const idx = Math.floor((cycleTime / 60) * orbitWaypoints.length) % orbitWaypoints.length;
    const nextIdx = (idx + 1) % orbitWaypoints.length;
    const t = ((cycleTime / 60) * orbitWaypoints.length) % 1;
    
    const targetPos = orbitWaypoints[idx].clone().lerp(orbitWaypoints[nextIdx], Math.sin(t * Math.PI) * 0.5 + 0.5);

    camera.position.lerp(targetPos, 0.01);
    camera.lookAt(0, 0, 0);

    // Subtle device motion parallax
    if (orient && orient.isMobile && orient.beta != null) {
      const beta = (orient.beta || 0) * (Math.PI / 180);
      const gamma = (orient.gamma || 0) * (Math.PI / 180);
      camera.position.x += gamma * 2.0;
      camera.position.y += beta * 2.0;
    }
  });

  return null;
}
