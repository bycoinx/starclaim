import React, {useRef} from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'

function RotatingGalaxy(){
  const ref = useRef()
  useFrame((state, delta)=>{
    ref.current.rotation.y += delta * 0.02
  })
  return (
    <mesh ref={ref} rotation={[0,0,0]}>
      <sphereGeometry args={[15, 32, 32]} />
      <meshStandardMaterial color={'#071129'} side={2} />
    </mesh>
  )
}

export default function ThreeScene(){
  return (
    <div className="three-canvas">
      <Canvas camera={{position:[0,2,20], fov:50}}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5,5,5]} intensity={0.8} />
        <RotatingGalaxy />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} />
      </Canvas>
    </div>
  )
}
