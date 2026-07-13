import { WebGLRenderer } from 'three';

/**
 * Adapts Expo GL's WebGL context to the canvas contract expected by Three.js.
 * This replaces expo-three's legacy Renderer without its browser polyfills.
 */
export class ExpoGLRenderer extends WebGLRenderer {
  constructor({ gl, canvas, pixelRatio = 1, clearColor, width, height, ...options }) {
    if (!gl) {
      throw new TypeError('ExpoGLRenderer requires an Expo GL context');
    }

    const rendererCanvas = canvas || {
      width: gl.drawingBufferWidth,
      height: gl.drawingBufferHeight,
      clientWidth: gl.drawingBufferWidth,
      clientHeight: gl.drawingBufferHeight,
      style: {},
      addEventListener() {},
      removeEventListener() {},
      setAttribute() {},
    };

    super({ canvas: rendererCanvas, context: gl, ...options });
    this.setPixelRatio(pixelRatio);

    if (width != null && height != null) {
      this.setSize(width, height);
    }
    if (clearColor != null) {
      this.setClearColor(clearColor);
    }
  }
}

export default ExpoGLRenderer;
