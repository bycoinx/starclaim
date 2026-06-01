using UnityEngine;

[RequireComponent(typeof(Camera))]
public class CameraController : MonoBehaviour
{
    public Transform target;
    public float smoothTime = 0.6f;
    public Vector3 offset = new Vector3(0, 2, -6);

    private Vector3 velocity = Vector3.zero;

    void LateUpdate()
    {
        if (target == null) return;
        Vector3 desiredPosition = target.position + offset;
        transform.position = Vector3.SmoothDamp(transform.position, desiredPosition, ref velocity, smoothTime);
        transform.LookAt(target);
    }

    public void DollyTo(Transform newTarget, float duration = 1.2f)
    {
        // For POC, simply switch target and rely on SmoothDamp.
        target = newTarget;
        // In a full implementation, trigger a coroutine to animate camera parameters.
    }
}
