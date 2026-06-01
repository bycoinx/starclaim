using UnityEngine;

// NebulaTransitionController: placeholder controller which will trigger VFX Graph or particle effect
public class NebulaTransitionController : MonoBehaviour
{
    public ParticleSystem nebulaParticles;

    public void Play(float duration = 1.2f)
    {
        if (nebulaParticles == null) return;
        nebulaParticles.Play();
        CancelInvoke(nameof(Stop));
        Invoke(nameof(Stop), duration);
    }

    public void Stop()
    {
        if (nebulaParticles == null) return;
        nebulaParticles.Stop();
    }
}
