import { bindWebGLContextLifecycle } from "./ThreeRendererTelemetry";

describe("WebGL context lifecycle binding", () => {
  test("prevents context loss disposal and reports restoration", () => {
    const canvas = document.createElement("canvas");
    const onLost = vi.fn();
    const onRestored = vi.fn();
    const unbind = bindWebGLContextLifecycle(canvas, { onLost, onRestored });
    const lostEvent = new Event("webglcontextlost", { cancelable: true });

    canvas.dispatchEvent(lostEvent);
    canvas.dispatchEvent(new Event("webglcontextrestored"));

    expect(lostEvent.defaultPrevented).toBe(true);
    expect(onLost).toHaveBeenCalledTimes(1);
    expect(onRestored).toHaveBeenCalledTimes(1);

    unbind();
    canvas.dispatchEvent(new Event("webglcontextrestored"));
    expect(onRestored).toHaveBeenCalledTimes(1);
  });
});
