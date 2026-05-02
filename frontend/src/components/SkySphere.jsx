import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Crown, Gem, LocateFixed, ShoppingBag, Sparkles, Star } from "lucide-react";
import { useT } from "../lib/i18n";

const tierMeta = {
  legendary: { color: "#E0BB6A", aura: "#C9A84C", label: "Tier 1", boost: 1.9, Icon: Crown },
  zodiac: { color: "#B197FC", aura: "#7B5EA7", label: "Tier 1", boost: 1.55, Icon: Gem },
  named: { color: "#7CC4FF", aura: "#4DA6FF", label: "Tier 2", boost: 1.3, Icon: Sparkles },
  constellation: { color: "#5EF0BF", aura: "#2DD4A0", label: "Tier 2", boost: 1.12, Icon: Star },
  standard: { color: "#F0F4FF", aura: "#8899BB", label: "Tier 3", boost: 0.95, Icon: Star },
};

function parseRa(ra = "0h 0m") {
  const h = Number((ra.match(/(-?\d+(?:\.\d+)?)h/) || [0, 0])[1]);
  const m = Number((ra.match(/(\d+(?:\.\d+)?)m/) || [0, 0])[1]);
  return ((h + m / 60) / 24) * Math.PI * 2;
}

function parseDec(dec = "0") {
  const match = dec.match(/[-+]?\d+(?:\.\d+)?/);
  return THREE.MathUtils.degToRad(match ? Number(match[0]) : 0);
}

function starPosition(star, radius = 9) {
  const ra = parseRa(star.ra);
  const dec = parseDec(star.dec);
  return new THREE.Vector3(
    radius * Math.cos(dec) * Math.cos(ra),
    radius * Math.sin(dec),
    radius * Math.cos(dec) * Math.sin(ra)
  );
}

function magnitudeSize(star) {
  const mag = Number.isFinite(star.magnitude) ? star.magnitude : 4.5;
  const brightness = THREE.MathUtils.clamp((5.5 - mag) / 7, 0.28, 1.35);
  return brightness * (tierMeta[star.tier]?.boost || 1);
}

function makeGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,0.95)");
  g.addColorStop(0.24, "rgba(255,255,255,0.5)");
  g.addColorStop(0.58, "rgba(255,255,255,0.14)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

export default function SkySphere({ stars, onClaim }) {
  const { t, lang } = useT();
  const mountRef = useRef(null);
  const selectedRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [ready, setReady] = useState(false);

  const orderedStars = useMemo(() => stars.filter(Boolean), [stars]);
  const selectedMeta = selected ? tierMeta[selected.tier] || tierMeta.standard : tierMeta.standard;
  const SelectedIcon = selectedMeta.Icon;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || orderedStars.length === 0) return undefined;

    let raf = 0;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2("#050A1A", 0.035);

    const camera = new THREE.PerspectiveCamera(48, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 2.5, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.rotateSpeed = 0.36;
    controls.zoomSpeed = 0.7;
    controls.minDistance = 7;
    controls.maxDistance = 24;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.18;

    scene.add(new THREE.AmbientLight("#9bb9ff", 0.25));
    const goldLight = new THREE.PointLight("#C9A84C", 2.3, 40);
    goldLight.position.set(8, 8, 10);
    scene.add(goldLight);

    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(9.08, 48, 48),
      new THREE.MeshBasicMaterial({
        color: "#10234A",
        transparent: true,
        opacity: 0.08,
        wireframe: true,
      })
    );
    scene.add(shell);

    const glowTexture = makeGlowTexture();
    const selectable = [];
    const constellationLines = {};

    orderedStars.forEach((star) => {
      const meta = tierMeta[star.tier] || tierMeta.standard;
      const pos = starPosition(star);
      const size = magnitudeSize(star);

      const starMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.035 + size * 0.045, 16, 16),
        new THREE.MeshBasicMaterial({ color: meta.color })
      );
      starMesh.position.copy(pos);
      starMesh.userData.star = star;
      scene.add(starMesh);
      selectable.push(starMesh);

      const glow = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTexture,
          color: meta.aura,
          transparent: true,
          opacity: star.tier === "legendary" ? 0.58 : star.tier === "zodiac" ? 0.38 : 0.22,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      );
      glow.position.copy(pos);
      glow.scale.setScalar(0.42 + size * 0.72);
      scene.add(glow);

      if (!constellationLines[star.constellation]) constellationLines[star.constellation] = [];
      constellationLines[star.constellation].push(pos);
    });

    Object.values(constellationLines).forEach((positions) => {
      if (positions.length < 2) return;
      const geometry = new THREE.BufferGeometry().setFromPoints(positions.slice(0, 6));
      const line = new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({ color: "#4DA6FF", transparent: true, opacity: 0.12 })
      );
      scene.add(line);
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const selectFromEvent = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(selectable, false)[0];
      if (hit?.object?.userData?.star) {
        selectedRef.current = hit.object;
        setSelected(hit.object.userData.star);
        controls.autoRotate = false;
      }
    };

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };

    renderer.domElement.addEventListener("pointerdown", selectFromEvent);
    window.addEventListener("resize", onResize);

    const animate = () => {
      shell.rotation.y += 0.0008;
      if (selectedRef.current) {
        selectedRef.current.scale.setScalar(1.35 + Math.sin(Date.now() * 0.006) * 0.12);
      }
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };

    setReady(true);
    animate();

    return () => {
      setReady(false);
      cancelAnimationFrame(raf);
      renderer.domElement.removeEventListener("pointerdown", selectFromEvent);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      glowTexture.dispose();
      renderer.dispose();
      mount.replaceChildren();
    };
  }, [orderedStars]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-sc-gold/25 bg-[#050A1A] min-h-[560px] lg:min-h-[680px]">
      <div ref={mountRef} className="absolute inset-0" data-testid="sky-sphere" />
      <div className="absolute inset-x-0 top-0 p-5 pointer-events-none">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="glass rounded-xl px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.28em] text-sc-gold mb-1">3D Sky Atlas</div>
            <div className="text-sm text-sc-text-muted">
              {lang === "TR" ? "Sürükle, yakınlaş, bir yıldız seç." : "Drag, zoom, select a star."}
            </div>
          </div>
          <div className="glass rounded-xl px-4 py-3 text-right">
            <div className="text-[10px] uppercase tracking-[0.28em] text-sc-text-muted">Magnitude</div>
            <div className="text-sm text-sc-gold">{lang === "TR" ? "Parlaklık bilimsel veriye göre" : "Brightness follows catalog data"}</div>
          </div>
        </div>
      </div>

      {!ready && (
        <div className="absolute inset-0 grid place-items-center text-sc-text-muted">
          {lang === "TR" ? "Gökyüzü hazırlanıyor..." : "Preparing sky..."}
        </div>
      )}

      <div className="absolute left-5 right-5 bottom-5 lg:left-auto lg:w-[360px] pointer-events-none">
        <div className="glass-gold rounded-2xl p-5 pointer-events-auto">
          {selected ? (
            <>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-sc-gold mb-2">
                    <SelectedIcon className="w-3.5 h-3.5" /> {selectedMeta.label} · {t(`tier_${selected.tier}`)}
                  </div>
                  <h3 className="font-display text-2xl gold-gradient-text">{selected.name}</h3>
                  <div className="text-xs text-sc-text-muted">{selected.constellation}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest text-sc-text-muted">Parcel</div>
                  <div className="font-mono text-sm text-sc-blue">{selected.code}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-sc-text-muted mb-4">
                <div className="bg-sc-deep/50 rounded-lg p-2"><span className="block text-sc-text">RA</span>{selected.ra}</div>
                <div className="bg-sc-deep/50 rounded-lg p-2"><span className="block text-sc-text">Dec</span>{selected.dec}</div>
                <div className="bg-sc-deep/50 rounded-lg p-2"><span className="block text-sc-text">Mag</span>{selected.magnitude ?? "-"}</div>
              </div>
              <button onClick={() => onClaim(selected)} className="btn-gold w-full text-sm" data-testid={`sky-claim-${selected.code}`}>
                <span className="inline-flex items-center justify-center gap-2">
                  <ShoppingBag className="w-4 h-4" /> {t("picker_claim")} · ${selected.price}
                </span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <LocateFixed className="w-5 h-5 text-sc-gold" />
              <div>
                <div className="font-display text-lg">{lang === "TR" ? "Bir yıldız seç" : "Select a star"}</div>
                <p className="text-xs text-sc-text-muted">{lang === "TR" ? "Detay, koordinat ve satın alma burada açılır." : "Details, coordinates and purchase open here."}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
