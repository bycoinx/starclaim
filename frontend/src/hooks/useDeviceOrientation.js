import { useEffect, useState } from 'react';

export function useDeviceOrientation() {
  const [orient, setOrient] = useState({ isMobile: false, alpha: null, beta: null, gamma: null });

  useEffect(() => {
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (!isMobile || typeof window === 'undefined') return;
    setOrient(o => ({ ...o, isMobile: true }));

    let baseAlpha = null;
    const handler = (e) => {
      if (baseAlpha === null && typeof e.alpha === 'number') baseAlpha = e.alpha;
      const alpha = typeof e.alpha === 'number' ? ((e.alpha - (baseAlpha || 0) + 360) % 360) : null;
      const beta = typeof e.beta === 'number' ? e.beta : null;
      const gamma = typeof e.gamma === 'number' ? e.gamma : null;
      setOrient({ isMobile: true, alpha, beta, gamma });
    };

    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS
      DeviceOrientationEvent.requestPermission().then(res => {
        if (res === 'granted') window.addEventListener('deviceorientation', handler);
      }).catch(() => {});
    } else {
      window.addEventListener('deviceorientation', handler);
    }

    return () => {
      window.removeEventListener('deviceorientation', handler);
    };
  }, []);

  return orient;
}

export default useDeviceOrientation;
