using System.Collections;
using UnityEngine;
using UnityEngine.UI;

public class LoadingSceneController : MonoBehaviour
{
    public Slider progressBar;
    public TMPro.TextMeshProUGUI consoleText;

    void Start()
    {
        StartCoroutine(LoadingRoutine());
    }

    private IEnumerator LoadingRoutine()
    {
        float t = 0f;
        while (t < 1f)
        {
            t += Time.deltaTime * 0.25f; // slow progress for demo
            UpdateProgress(t);
            yield return null;
        }
        UpdateProgress(1f);
        yield return new WaitForSeconds(0.3f);
        // Notify TransitionManager that loading finished
        TransitionManager.Instance?.PlayNebulaTransition(() => {
            // Load next scene or trigger camera warp
        });
    }

    void UpdateProgress(float p)
    {
        if (progressBar) progressBar.value = p;
        if (consoleText) consoleText.text = GenerateConsoleLines(p);
    }

    string GenerateConsoleLines(float p)
    {
        int lines = Mathf.Clamp(Mathf.FloorToInt(p * 6f), 1, 6);
        string result = "";
        for (int i = 0; i < lines; i++) result += $"Loading subsystem {i+1}...\n";
        return result;
    }
}
