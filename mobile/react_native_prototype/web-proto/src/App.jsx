import React, {useState} from 'react'
import ThreeScene from './ThreeScene'

export default function App(){
  const [showNebula, setShowNebula] = useState(false)
  return (
    <div className="app">
      <ThreeScene />
      <div className="hud left">
        <div className="profile">Profile</div>
      </div>
      <div className="hud right">
        <div className="vault">Vault</div>
      </div>
      <div className="floating-wheel">
        <button onClick={()=>setShowNebula(true)}>Star Map</button>
        <button>Market</button>
        <button>Vault</button>
        <button>Stories</button>
      </div>

      {showNebula && (
        <div className="nebula-overlay" onAnimationEnd={()=>setShowNebula(false)}>
          <div className="nebula-inner"> </div>
        </div>
      )}
    </div>
  )
}
