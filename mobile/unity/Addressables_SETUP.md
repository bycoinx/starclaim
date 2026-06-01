Addressables — Setup & Remote Content Guide

Purpose
- Configure Addressables to manage remote 3D assets (GLB/GLTF/FBX), textures and audio.
- Keep initial app download small and stream heavy assets on demand.

Steps
1. Install Addressables package (Package Manager)
   - Window → Package Manager → search "Addressables" → Install

2. Create Addressables groups
   - Window → Asset Management → Addressables → Groups
   - Create groups: `bootstrap` (small, built-in), `remote-models`, `remote-textures`, `audio`.

3. Configure Profiles
   - Profiles → create `Local` and `Remote` profiles.
   - `Remote` profile: set `Build Path` to `RemoteBuildPath` (e.g. `Assets/AddressablesBuilds/Remote`) and `Load Path` to remote CDN URL placeholder (e.g. `https://cdn.example.com/starclaim/{BuildTarget}`).

4. Mark assets as addressable
   - Select large model (GLB/FBX) → tick Addressable → assign to `remote-models` group.

5. Build & Host
   - Build → Build Player Content (Addressables) to generate catalogs.
   - Upload the generated content (from `ServerData` / `AddressablesBuilds` folder) to your CDN (S3, Cloudflare, etc.).
   - Ensure `Remote.LoadPath` points to deployed CDN URL.

6. Runtime loading sample (C#)
```csharp
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;

public class AddressablesManager : MonoBehaviour {
    public async void LoadModel(string address) {
        var handle = Addressables.LoadAssetAsync<GameObject>(address);
        await handle.Task;
        if (handle.Status == AsyncOperationStatus.Succeeded) {
            Instantiate(handle.Result);
        }
    }
}
```

7. Catalog update strategy
   - Use versioned catalog names or remote profiles to update content without re-submitting app.
   - Keep `bootstrap` small and include the initial catalog reference.

Performance tips
- Compress textures for mobile (ASTC preferred). Use lower resolution MIP maps for distant LOD.
- Use Addressables GC/Release patterns to free memory when unloading scenes.

Security
- Sign CDN assets or use authenticated URLs if content is sensitive.

Troubleshooting
- If assets fail to load on device, check remote URL, CORS headers, and HTTPS certificate.
- Test remote content locally with `Local` profile first.
