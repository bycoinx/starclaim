using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;

public class AddressablesManager : MonoBehaviour
{
    public static AddressablesManager Instance { get; private set; }

    public static void Initialize()
    {
        // Placeholder static init; in a full impl, you'd create a GameObject and attach
    }

    public async Task<GameObject> LoadModelAsync(string address)
    {
        var handle = Addressables.LoadAssetAsync<GameObject>(address);
        await handle.Task;
        if (handle.Status == AsyncOperationStatus.Succeeded)
        {
            return handle.Result;
        }
        Debug.LogWarning($"Addressables failed to load: {address}");
        return null;
    }

    public void Release(GameObject go)
    {
        Addressables.ReleaseInstance(go);
    }
}
