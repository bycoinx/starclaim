import { WebGLRenderer } from 'three';
import { ExpoGLRenderer } from '../rendering/ExpoGLRenderer';

describe('ExpoGLRenderer', () => {
  afterEach(() => jest.restoreAllMocks());

  test('requires an Expo GL context', () => {
    expect(() => new ExpoGLRenderer({})).toThrow('requires an Expo GL context');
  });

  test('applies Expo GL dimensions and renderer options', () => {
    const pixelRatio = jest.spyOn(WebGLRenderer.prototype, 'setPixelRatio');
    const setSize = jest.spyOn(WebGLRenderer.prototype, 'setSize');
    const setClearColor = jest.spyOn(WebGLRenderer.prototype, 'setClearColor');
    const gl = { drawingBufferWidth: 1080, drawingBufferHeight: 1920 };

    new ExpoGLRenderer({
      gl,
      pixelRatio: 2,
      width: 540,
      height: 960,
      clearColor: '#000011',
    });

    expect(pixelRatio).toHaveBeenCalledWith(2);
    expect(setSize).toHaveBeenCalledWith(540, 960);
    expect(setClearColor).toHaveBeenCalledWith('#000011');
  });
});
