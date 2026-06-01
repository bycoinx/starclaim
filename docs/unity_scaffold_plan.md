Unity Scaffold Plan — Tasks & Commands

Goal: Initialize a Unity LTS project scaffold in the repo, prepare Addressables, set up git with LFS, and provide a POC LoadingScene + NebulaTransition to iterate on.

Local steps for developer (high-level)
1. Create Unity project using Unity Hub (3D URP template).
2. Copy this scaffold folder into project root or set the repo root as Unity project root.
3. Add `.gitignore` and enable Git LFS. Track `.glb,.fbx,.png,.tga,.wav` with LFS.

Suggested Git LFS tracking
```bash
git lfs track "*.glb"
git lfs track "*.fbx"
git lfs track "*.png"
git lfs track "*.tga"
git lfs track "*.wav"
```

Unity Hub CLI example (if available)
- Note: Unity Hub CLI varies by OS and installed Hub version. Example:
```powershell
"C:\Program Files\Unity Hub\Unity Hub.exe" -- --headless create --name "StarClaim-Mobile" --path "C:\path\to\StarClaim-Mobile" --template "3D (URP)"
```

Editor tasks (once project created)
- Import URP, Addressables, Input System, VFX Graph (if needed)
- Create Scenes: `Boot`, `Hub`, `Loading`, `Map`, `Vault`, `Market`
- Implement `AppShell` prefab (persistent GameObject) to manage transitions and AddressablesManager
- Implement `LoadingScene` prototype: progress bar + console text + warp camera sequence
- Implement `NebulaTransition` using simple particle system or VFX Graph; hook to TransitionManager events

CI and Build
- Add a CI job that can run Unity Test Runner and build Player for Android/iOS using Unity CLI.
- Consider Unity Cloud Build for faster iteration.

POC Delivery
- Target POC: `LoadingScene` and `NebulaTransition` working on an Android emulator or device.
- Share APK/TestFlight link for early playtesting.

Notes
- Creating the binary Unity project files in the repo is heavy. Keep scenes and scripts, but store large art assets in a separate `art/` repo or use Addressables remote storage.
- Document asset naming conventions and LOD guidelines in `mobile/unity/ASSET_GUIDELINES.md` (create as next task).
