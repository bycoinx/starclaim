import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Html, Text } from '@react-three/drei'

function RotatingGalaxy({ onClaim, claimStatus }) {
  const ref = useRef()

  useFrame((state, delta) => {
    if (!ref.current) return
    ref.current.rotation.y += delta * 0.08
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime / 4) * 0.08
  })

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[4.5, 64, 64]} />
        <meshStandardMaterial
          color="#1f4d8f"
          metalness={0.8}
          roughness={0.12}
          emissive="#2c80ff"
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.2, 5.8, 128]} />
        <meshBasicMaterial color="#54d7ff" transparent opacity={0.18} />
      </mesh>
      <Text position={[0, 0, 4.9]} fontSize={0.8} color="#fff" anchorX="center" anchorY="middle">
        STAR
      </Text>
      <Html center position={[0, 0, 6.4]}>
        <button className={`claim-button ${claimStatus}`} onClick={onClaim} disabled={claimStatus === 'pending'}>
          {claimStatus === 'pending'
            ? 'Pending...'
            : claimStatus === 'success'
            ? 'Claimed!'
            : 'Claim Token'}
        </button>
      </Html>
    </group>
  )
}

export default function ThreeScene({ onClaim, claimStatus }) {
  return (
    <div className="three-canvas">
      <Canvas camera={{ position: [0, 0, 20], fov: 45 }}>
        <color attach="background" args={['#040a18']} />
        <ambientLight intensity={0.55} />
        <pointLight position={[12, 12, 10]} intensity={1.05} />
        <RotatingGalaxy onClaim={onClaim} claimStatus={claimStatus} />
        <Stars radius={250} depth={100} count={5500} factor={6} saturation={0} fade speed={0.2} />
        <OrbitControls enablePan={false} enableZoom minDistance={10} maxDistance={40} zoomSpeed={0.6} rotateSpeed={0.5} />
      </Canvas>
    </div>
  )
}
