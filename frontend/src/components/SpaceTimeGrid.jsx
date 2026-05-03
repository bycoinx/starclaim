import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * SpaceTimeGrid: Simulates the Einstein-Rosen curvature of space-time.
 * The grid dips at mass centers (Sun, Planets, Selected Targets).
 */
export default function SpaceTimeGrid({ massCenters = [] }) {
  const mesh = useMemo(() => {
    const size = 150;
    const divisions = 60;
    const geometry = new THREE.PlaneGeometry(size, size, divisions, divisions);
    
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position.array;

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      
      let totalDip = 0;
      
      // Calculate gravitational well
      massCenters.forEach(center => {
        const dx = x - center.x;
        const dz = z - center.z;
        const distSq = dx * dx + dz * dz;
        const dip = (center.mass || 2) / (1 + distSq / (center.radius || 1));
        totalDip += dip;
      });

      positions[i + 1] = -totalDip;
    }

    geometry.computeVertexNormals();
    return geometry;
  }, [massCenters]);

  return (
    <mesh geometry={mesh} position={[0, -5, 0]}>
      <meshBasicMaterial 
        color="#1e293b" 
        wireframe 
        transparent 
        opacity={0.12} 
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
