import { useEffect, useRef, useState } from 'react';

/**
 * Hook to measure FPS and frame time for P0.1 stability audit
 * Returns: { fps, frameTime, heapUsed }
 */
export function useFpsMonitor() {
  const [metrics, setMetrics] = useState({
    fps: 0,
    frameTime: 0,
    heapUsed: 0,
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const frameTimesRef = useRef([]);
  const rafIdRef = useRef(null);

  useEffect(() => {
    const measureFrame = () => {
      const now = Date.now();
      const deltaMs = now - lastTimeRef.current;

      // Measure frame time
      frameTimesRef.current.push(deltaMs);
      if (frameTimesRef.current.length > 120) frameTimesRef.current.shift();

      const avgFrameTime =
        frameTimesRef.current.length > 0
          ? frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length
          : 0;

      // Calculate FPS every 500ms
      frameCountRef.current++;
      if (deltaMs >= 500) {
        const fps = (frameCountRef.current * 1000) / deltaMs;
        frameCountRef.current = 0;
        lastTimeRef.current = now;

        // Get heap memory (if available)
        let heap = 0;
        if (global.gc) {
          global.gc();
          const perfMem = performance?.memory;
          heap = perfMem?.usedJSHeapSize || 0;
        }

        setMetrics({
          fps: fps,
          frameTime: avgFrameTime,
          heapUsed: heap,
        });
      }

      rafIdRef.current = requestAnimationFrame(measureFrame);
    };

    rafIdRef.current = requestAnimationFrame(measureFrame);
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  return metrics;
}
