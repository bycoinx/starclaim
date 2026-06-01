StarClaim — Unity Project Scaffold

Purpose
- Starter README for the Unity (final-quality) project.
- Guides devs to create a Unity LTS project, configure URP, Addressables and recommended packages.

Recommended Unity
- Use the latest Unity LTS (e.g. 2023.4 LTS or 2024.1 LTS) at time of development.
- Target Render Pipeline: URP (Universal Render Pipeline) configured for mobile.

Project setup (developer machine)
1. Install Unity Hub and Unity LTS (recommended) + Android/iOS build modules.
2. Create new project: "3D (URP)" template or create empty and add URP package.
3. Project name: `StarClaim-Mobile` — set organization and default company id.
4. Source control: initialize Git in the project folder and enable Git LFS for large assets.

Quick commands (PowerShell)
```powershell
# Create repo folder and init git
mkdir StarClaim-Mobile
cd StarClaim-Mobile
git init
# Install Git LFS if not installed (one-time)
# choco install git-lfs    # on Windows with Chocolatey
git lfs install
```

Essential Packages (Package Manager)
- Universal RP (URP)
- Addressables
- Input System (optional: for advanced input mappings)
- Post Processing (URP integrated)
- VFX Graph (if device targets support)
- Netcode / WebSocket plugin as needed

Addressables
- Use Addressables to load large 3D assets and streaming content from CDN.
- See `Addressables_SETUP.md` for detailed steps and recommended profile for remote catalog.

Project structure (recommended)
- Assets/
  - Art/Models/ (glTF/GLB/FBX)
  - Art/Textures/
  - Scenes/
    - Boot.unity (AppShell, splash + settings)
    - Hub.unity (Galactic Hub)
    - Loading.unity (LoadingScene / Matchmaking)
    - Map.unity (Starry Map)
    - Vault.unity (Star Vault)
    - Market.unity (Cosmic Market)
  - Scripts/
    - Core/ (AppShell, CameraController, TransitionManager)
    - UI/ (HUDPanel, LayerModal, FloatingWheel)
    - Systems/ (AddressablesManager, Networking)
  - Resources/
- ProjectSettings/

Build & CI
- Use Unity Cloud Build or a CI runner with Unity CLI to automate builds.
- Use Fastlane for iOS TestFlight and Google Play uploads.

Notes
- Keep mobile-friendly polycounts and use compressed textures (ASTC preferred, ETC2 fallback).
- Document target minimum devices and maintain an internal "graphics settings" profile for Low/Medium/High.

Contact
- Add project owners, art leads and release manager contacts here.
