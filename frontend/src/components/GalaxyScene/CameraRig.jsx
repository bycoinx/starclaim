import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import useDeviceOrientation from '../../hooks/useDeviceOrientation';

export default function CameraRig({ enableCinematic = true }) {
  const { camera } = useThree();
  const orient = useDeviceOrientation();
  const ref = useRef({ t: 0, idx: 0 });

  const waypoints = [
    new Vector3(0, 15, 50),
    new Vector3(30, 8, 20),
    new Vector3(-20, 12, 60),
    new Vector3(0, 25, 120),
  ];

  useFrame((state, delta) => {
    if (!enableCinematic) return;
    ref.current.t += delta * 0.05; // slow progression
    const idx = Math.floor(ref.current.t) % waypoints.length;
    const nextIdx = (idx + 1) % waypoints.length;
    const localT = ref.current.t - Math.floor(ref.current.t);
    const current = waypoints[idx];
    const next = waypoints[nextIdx];
    const target = current.clone().lerp(next, localT);
    // smooth lerp camera position
    camera.position.lerp(target, 0.04);
    camera.lookAt(0, 0, 0);

    // apply small device orientation influence
    if (orient && orient.isMobile && orient.beta != null && orient.gamma != null) {
      const beta = (orient.beta || 0) * (Math.PI / 180);
      const gamma = (orient.gamma || 0) * (Math.PI / 180);
      camera.rotation.x += (-beta * 0.05 - camera.rotation.x) * 0.08;
      camera.rotation.y += (-gamma * 0.05 - camera.rotation.y) * 0.08;
    }
  });

  return null;
}
