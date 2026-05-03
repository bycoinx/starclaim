import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Crown, Gem, LocateFixed, ShoppingBag, Sparkles, Star, Lock, EyeOff } from "lucide-react";
import { useT } from "../lib/i18n";

const tierMeta = {
  legendary: { color: "#E0BB6A", aura: "#C9A84C", label: "Tier 1", boost: 2.2, Icon: Crown },
  zodiac: { color: "#B197FC", aura: "#7B5EA7", label: "Tier 1", boost: 1.8, Icon: Gem },
  named: { color: "#7CC4FF", aura: "#4DA6FF", label: "Tier 2", boost: 1.4, Icon: Sparkles },
  constellation: { color: "#5EF0BF", aura: "#2DD4A0", label: "Tier 2", boost: 1.2, Icon: Star },
  standard: { color: "#F0F4FF", aura: "#8899BB", label: "Tier 3", boost: 1.0, Icon: Star },
  protected: { color: "#FFD700", aura: "#FFA500", label: "VAULT", boost: 2.5, Icon: Lock },
};

// Family Protocol Protected Bodies
const PROTECTED_BODIES = [
  { name: "Sun (Güneş)", code: "SOL-00", ra: "0h 0m", dec: "0", tier: "protected", constellation: "Solar System", description: "The heart of the family legacy." },
  { name: "Mars", code: "MARS-04", ra: "12h 0m", dec: "20", tier: "protected", constellation: "Solar System", description: "The warrior's vault." },
  { name: "Jupiter", code: "JUP-05", ra: "6h 30m", dec: "-10", tier: "protected", constellation: "Solar System", description: "The storm of memories." },
];

function parseRa(ra = "0h 0m") {
  const hMatch = ra.match(/(-?\d+(?:\.\d+)?)h/);
  const mMatch = ra.match(/(\d+(?:\.\d+)?)m/);
  const h = hMatch ? Number(hMatch[1]) : 0;
  const m = mMatch ? Number(mMatch[1]) : 0;
  return ((h + m / 60) / 24) * Math.PI * 2;
}

function parseDec(dec = "0") {
  const match = dec.match(/[-+]?\d+(?:\.\d+)?/);
  return THREE.MathUtils.degToRad(match ? Number(match[0]) : 0);
}

function starPosition(raStr, decStr, radius = 10) {
  const ra = parseRa(raStr);
  const dec = parseDec(decStr);
  return new THREE.Vector3(
    radius * Math.cos(dec) * Math.cos(ra),
    radius * Math.sin(dec),
    radius * Math.cos(dec) * Math.sin(ra)
  );
}

function makeGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.2, "rgba(255,255,255,0.6)");
  g.addColorStop(0.5, "rgba(255,255,255,0.1)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

export default function SkySphere({ stars, onClaim }) {
  const { t, lang } = useT();
  const mountRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [ready, setReady] = useState(false);

  const allStars = useMemo(() => [...stars, ...PROTECTED_BODIES], [stars]);
  const selectedMeta = selected ? tierMeta[selected.tier] || tierMeta.standard : tierMeta.standard;
  const SelectedIcon = selectedMeta.Icon;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let raf = 0;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#020617");
    
    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(0, 5, 20);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.2;
    controls.minDistance = 5;
    controls.maxDistance = 50;

    // Background Starfield
    const bgGeometry = new THREE.BufferGeometry();
    const bgCount = 4000;
    const bgPos = new Float32Array(bgCount * 3);
    for (let i = 0; i < bgCount * 3; i++) {
      bgPos[i] = (Math.random() - 0.5) * 200;
    }
    bgGeometry.setAttribute("position", new THREE.BufferAttribute(bgPos, 3));
    const bgMaterial = new THREE.PointsMaterial({ color: "#475569", size: 0.1, transparent: true, opacity: 0.5 });
    scene.add(new THREE.Points(bgGeometry, bgMaterial));

    // Lighting
    scene.add(new THREE.AmbientLight("#1e293b", 0.5));
    const mainLight = new THREE.PointLight("#E0BB6A", 2, 100);
    mainLight.position.set(20, 20, 20);
    scene.add(mainLight);

    const glowTexture = makeGlowTexture();
    const selectable = [];
    const constellationGroups = {};

    allStars.forEach((star) => {
      const meta = tierMeta[star.tier] || tierMeta.standard;
      const radius = star.tier === "protected" ? 8 : 12;
      const pos = starPosition(star.ra, star.dec, radius);
      const size = star.tier === "protected" ? 0.2 : (5.5 - (star.magnitude || 4.5)) / 10 + 0.05;

      const group = new THREE.Group();
      group.position.copy(pos);

      // Core Star
      const starGeo = new THREE.SphereGeometry(size * (meta.boost || 1), 16, 16);
      const starMat = new THREE.MeshBasicMaterial({ color: meta.color });
      const starMesh = new THREE.Mesh(starGeo, starMat);
      starMesh.userData.star = star;
      group.add(starMesh);
      selectable.push(starMesh);

      // Glow Sprite
      const spriteMat = new THREE.SpriteMaterial({ 
        map: glowTexture, 
        color: meta.aura, 
        transparent: true, 
        opacity: 0.6, 
        blending: THREE.AdditiveBlending,
        depthWrite: false 
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.setScalar(size * 12 * (meta.boost || 1));
      group.add(sprite);

      scene.add(group);

      if (star.constellation !== "Unknown" && star.tier !== "protected") {
        if (!constellationGroups[star.constellation]) constellationGroups[star.constellation] = [];
        constellationGroups[star.constellation].push(pos);
      }
    });

    // Draw Constellation Lines (Improved Logic)
    Object.entries(constellationGroups).forEach(([name, points]) => {
      if (points.length < 2) return;
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: "#334155", transparent: true, opacity: 0.2 });
      const line = new THREE.LineSegments(geometry, material); // Use LineSegments for cleaner look
      scene.add(line);
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(selectable);
      if (intersects.length > 0) {
        const star = intersects[0].object.userData.star;
        setSelected(star);
        controls.autoRotate = false;
        // Smoothly look at the star
        const targetPos = intersects[0].object.getWorldPosition(new THREE.Vector3());
        controls.target.lerp(targetPos, 0.1);
      }
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    const animate = () => {
      raf = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();
    setReady(true);

    return () => {
      cancelAnimationFrame(raf);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.dispose();
      glowTexture.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [allStars]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-sc-gold/20 bg-[#020617] h-[600px] lg:h-[750px]">
      <div ref={mountRef} className="absolute inset-0" />
      
      {/* UI Overlays */}
      <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="glass rounded-2xl p-4 border-sc-gold/30">
            <div className="text-[10px] tracking-[0.4em] uppercase text-sc-gold mb-1">Cosmic Memory Map</div>
            <div className="text-sm text-sc-text-muted">{lang === "TR" ? "Evrensel Hafıza Atlası v1.0" : "Universal Memory Atlas v1.0"}</div>
          </div>
          <div className="glass rounded-2xl p-4 text-right border-sc-gold/30">
            <div className="text-[10px] tracking-[0.4em] uppercase text-sc-text-muted mb-1">Quantum Status</div>
            <div className="text-sm text-sc-green flex items-center gap-2 justify-end">
              <ShieldCheck className="w-4 h-4" /> Secure
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="glass-gold rounded-3xl p-6 pointer-events-auto w-full max-w-md animate-fade-up">
            {selected ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`text-[10px] tracking-[0.3em] uppercase px-2 py-1 rounded bg-sc-gold/10 ${selected.tier === 'protected' ? 'text-sc-gold' : 'text-sc-text-muted'}`}>
                    {selected.tier === 'protected' ? 'PROTECTED VAULT' : t(`tier_${selected.tier}`)}
                  </div>
                  <div className="font-mono text-[10px] text-sc-text-muted">{selected.code}</div>
                </div>
                <h3 className="font-display text-3xl mb-1 gold-gradient-text">{selected.name}</h3>
                <p className="text-xs text-sc-text-muted mb-4">{selected.constellation} Takımyıldızı</p>
                
                {selected.tier === "protected" ? (
                  <div className="space-y-4">
                    <p className="text-sm italic font-accent text-sc-text/80 leading-relaxed border-l-2 border-sc-gold pl-4">
                      {selected.description}
                    </p>
                    <div className="bg-sc-gold/5 rounded-xl p-4 border border-sc-gold/20 flex items-center gap-3">
                      <Lock className="w-5 h-5 text-sc-gold" />
                      <div className="text-xs text-sc-gold uppercase tracking-widest font-display">Sadece Aile Protokolü ile erişilebilir</div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="glass rounded-xl p-3 text-center">
                        <div className="text-[10px] uppercase text-sc-text-muted mb-1">RA</div>
                        <div className="text-xs font-mono">{selected.ra}</div>
                      </div>
                      <div className="glass rounded-xl p-3 text-center">
                        <div className="text-[10px] uppercase text-sc-text-muted mb-1">Dec</div>
                        <div className="text-xs font-mono">{selected.dec}</div>
                      </div>
                      <div className="glass rounded-xl p-3 text-center">
                        <div className="text-[10px] uppercase text-sc-text-muted mb-1">Mag</div>
                        <div className="text-xs font-mono">{selected.magnitude || "4.5"}</div>
                      </div>
                    </div>
                    <button onClick={() => onClaim(selected)} className="btn-gold w-full flex items-center justify-center gap-2">
                      <ShoppingBag className="w-4 h-4" /> {t("picker_claim")} · ${selected.price}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4 py-2">
                <div className="w-12 h-12 rounded-2xl bg-sc-gold/10 flex items-center justify-center">
                  <LocateFixed className="w-6 h-6 text-sc-gold" />
                </div>
                <div>
                  <div className="font-display text-xl">{lang === "TR" ? "Bir Yıldız veya Kasa Seç" : "Select a Star or Vault"}</div>
                  <p className="text-xs text-sc-text-muted">{lang === "TR" ? "Koordinatlar ve hafıza alanları burada açılır." : "Coordinates and memory spaces open here."}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-[#020617] text-sc-gold">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}
    </div>
  );
}

