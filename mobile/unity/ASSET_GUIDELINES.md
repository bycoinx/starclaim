StarClaim — Asset Guidelines (Unity)

Purpose
- Define conventions for 3D models, textures, audio and LOD to keep mobile performance consistent.

Models
- Format: glTF/GLB preferred for runtime import; FBX allowed for authoring.
- Tri-count targets:
  - StarCard3D (preview): < 2k tris
  - Vault shelf: < 5k tris
  - Galaxy background: low-poly sphere with starfield texture
- Naming: `sc_model_[type]_[name]_v001.glb`
- Pivot: Centered on origin; forward = +Z; up = +Y

Textures
- Use compressed formats: ASTC for iOS, ETC2 for Android fallback.
- Max base texture: 2048 for hero assets; 1024 for common props.
- Use MIP maps and normal maps where helpful.

LODs
- Provide LOD0/LOD1/LOD2 where appropriate. Use mesh simplification for LODs.

Particles & VFX
- Use simple particle textures (sprites) for mobile-friendly volumetrics.
- For Nebula: prefer billboarded sprites, soft particles, and baked noise textures to simulate volume.

Audio
- Use Ogg Vorbis/MP3 for compressed audio in builds. Keep UI SFX under 200ms.

General
- Use Addressables for heavy assets. Keep a small bootstrap catalog.
- Document each asset's expected memory and poly budget in a CSV manifest.

Testing
- Test on target devices for FPS and memory; keep a running log for asset regressions.
