using System.Collections;
using UnityEngine;

public class TransitionManager : MonoBehaviour
{
    public static TransitionManager Instance { get; private set; }

    private void Awake()
    {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    public void Initialize()
    {
        // hook up references if needed
    }

    public void PlayNebulaTransition(System.Action onComplete = null)
    {
        StartCoroutine(NebulaCoroutine(onComplete));
    }

    private IEnumerator NebulaCoroutine(System.Action onComplete)
    {
        // placeholder timeline: spawn -> expand -> settle -> reveal
        yield return new WaitForSeconds(0.9f);
        onComplete?.Invoke();
    }
}
