using UnityEngine;

// AppShell: persistent manager that survives scene loads and manages global state
public class AppShell : MonoBehaviour
{
    public static AppShell Instance { get; private set; }

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
        DontDestroyOnLoad(gameObject);
        Initialize();
    }

    void Initialize()
    {
        // Initialize services: AddressablesManager, Audio, TransitionManager, Input
        AddressablesManager.Initialize();
        TransitionManager.Instance?.Initialize();
        // Other initialization as required
    }
}
