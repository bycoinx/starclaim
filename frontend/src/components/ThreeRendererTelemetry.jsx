import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

export function bindWebGLContextLifecycle(canvas, { onLost, onRestored } = {}) {
  if (!canvas) return () => {};
  const handleContextLost = (event) => {
    event.preventDefault();
    onLost?.(event);
  };
  const handleContextRestored = (event) => onRestored?.(event);
  canvas.addEventListener("webglcontextlost", handleContextLost);
  canvas.addEventListener("webglcontextrestored", handleContextRestored);
  return () => {
    canvas.removeEventListener("webglcontextlost", handleContextLost);
    canvas.removeEventListener("webglcontextrestored", handleContextRestored);
  };
}

export default function ThreeRendererTelemetry({
  onTelemetry,
  onError,
  onRestore,
  renderedObjects,
  quality,
  sampleIntervalMs = 1000,
}) {
  const { gl } = useThree();
  const sampleRef = useRef({ startedAt: 0, frames: 0 });

  useEffect(() => {
    const canvas = gl?.domElement;
    if (!canvas) return undefined;
    return bindWebGLContextLifecycle(canvas, {
      onLost: () => onError?.(new Error("WebGL context was lost."), "webgl-context-lost"),
      onRestored: () => {
        sampleRef.current = { startedAt: 0, frames: 0 };
        onRestore?.({ source: "webgl-context-restored" });
      },
    });
  }, [gl, onError, onRestore]);

  useFrame((state) => {
    if (!onTelemetry) return;
    const now = performance.now();
    if (!sampleRef.current.startedAt) sampleRef.current.startedAt = now;
    sampleRef.current.frames += 1;
    const elapsed = now - sampleRef.current.startedAt;
    if (elapsed < sampleIntervalMs) return;

    onTelemetry({
      fps: sampleRef.current.frames * 1000 / elapsed,
      frameTimeMs: elapsed / sampleRef.current.frames,
      renderedObjects: renderedObjects ?? state.gl.info.render.calls,
      renderCalls: state.gl.info.render.calls,
      geometries: state.gl.info.memory.geometries,
      textures: state.gl.info.memory.textures,
      quality,
    });
    sampleRef.current = { startedAt: now, frames: 0 };
  });

  return null;
}
