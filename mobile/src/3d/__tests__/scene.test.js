/**
 * P0.8.4b - VoyageScene Integration Tests
 * 
 * Test scene orchestration, component integration, and rendering pipeline
 */

import { VoyageScene } from '../scenes/VoyageScene';

describe('VoyageScene', () => {
  let scene;
  let mockCanvas;
  let mockCamera;
  let mockStarRenderer;
  let mockDSORenderer;
  let mockStarInteraction;
  let mockDSOInteraction;
  let mockGestureDetector;
  
  beforeEach(() => {
    // Create mock canvas
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 800;
    mockCanvas.height = 600;
    
    // Create mock components
    mockCamera = {
      position: { x: 0, y: 0, z: 50 },
      target: { x: 0, y: 0, z: 0 },
      up: { x: 0, y: 1, z: 0 },
      distance: 100,
      fov: 45,
      yaw: 0,
      pitch: 0,
      update: jest.fn(),
      pan: jest.fn(),
      zoom: jest.fn(),
      warpToTarget: jest.fn(),
    };
    
    mockStarRenderer = {
      setStars: jest.fn(),
      renderFrame: jest.fn(() => []),
      lodManager: {
        updateFrameTiming: jest.fn(),
      },
    };
    
    mockDSORenderer = {
      setDSOs: jest.fn(),
      renderFrame: jest.fn(() => []),
      lodManager: {
        updateFrameTiming: jest.fn(),
      },
    };
    
    mockStarInteraction = {
      setCallbacks: jest.fn(),
      onTap: jest.fn(),
      getSelectedStar: jest.fn(() => null),
      clearSelection: jest.fn(),
    };
    
    mockDSOInteraction = {
      setCallbacks: jest.fn(),
      onTap: jest.fn(),
      getSelectedDSO: jest.fn(() => null),
      clearSelection: jest.fn(),
    };
    
    mockGestureDetector = {
      onPan: null,
      onPinch: null,
      onTap: null,
      onDoubleTap: null,
      onLongTap: null,
    };
    
    scene = new VoyageScene({
      canvas: mockCanvas,
      camera: mockCamera,
      starRenderer: mockStarRenderer,
      dsoRenderer: mockDSORenderer,
      starInteraction: mockStarInteraction,
      dsoInteraction: mockDSOInteraction,
      gestureDetector: mockGestureDetector,
    });
  });
  
  describe('initialization', () => {
    test('should initialize with canvas', async () => {
      await scene.initialize();
      expect(scene.canvas).toBe(mockCanvas);
    });
    
    test('should set up gesture handling', async () => {
      await scene.initialize();
      expect(mockGestureDetector.onPan).toBeDefined();
      expect(mockGestureDetector.onPinch).toBeDefined();
      expect(mockGestureDetector.onTap).toBeDefined();
    });
    
    test('should set up interaction callbacks', async () => {
      await scene.initialize();
      expect(mockStarInteraction.setCallbacks).toHaveBeenCalled();
      expect(mockDSOInteraction.setCallbacks).toHaveBeenCalled();
    });
  });
  
  describe('data loading', () => {
    test('should load star data', async () => {
      const starData = [
        { id: 's1', displayName: 'Sirius', voyageX: 0, voyageY: 0, voyageZ: -10 },
      ];
      
      await scene.loadStars(starData);
      
      expect(mockStarRenderer.setStars).toHaveBeenCalledWith(starData);
      expect(scene.stats.starCount).toBe(1);
    });
    
    test('should load DSO data', async () => {
      const dsoData = [
        { id: 'd1', commonName: 'Crab', voyageX: 100, voyageY: 100, voyageZ: 100 },
      ];
      
      await scene.loadDSOs(dsoData);
      
      expect(mockDSORenderer.setDSOs).toHaveBeenCalledWith(dsoData);
      expect(scene.stats.dsoCount).toBe(1);
    });
  });
  
  describe('rendering', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });
    
    test('should start rendering loop', () => {
      jest.spyOn(window, 'requestAnimationFrame');
      
      scene.start();
      
      expect(scene.isRunning).toBe(true);
      expect(window.requestAnimationFrame).toHaveBeenCalled();
    });
    
    test('should stop rendering loop', () => {
      scene.start();
      scene.stop();
      
      expect(scene.isRunning).toBe(false);
    });
    
    test('should update camera during render', () => {
      scene.start();
      jest.advanceTimersByTime(16); // ~60 FPS
      
      expect(mockCamera.update).toHaveBeenCalled();
    });
    
    test('should render stars and DSOs', () => {
      mockStarRenderer.renderFrame.mockReturnValue([
        { type: 'star', position: { x: 0, y: 0, z: 0 } },
      ]);
      mockDSORenderer.renderFrame.mockReturnValue([
        { type: 'billboard', position: { x: 100, y: 100, z: 100 } },
      ]);
      
      scene.start();
      jest.advanceTimersByTime(16);
      
      expect(mockStarRenderer.renderFrame).toHaveBeenCalled();
      expect(mockDSORenderer.renderFrame).toHaveBeenCalled();
    });
  });
  
  describe('gesture handling', () => {
    test('should handle pan gesture', async () => {
      await scene.initialize();
      
      mockGestureDetector.onPan({ deltaX: 10, deltaY: 20 });
      
      expect(mockCamera.pan).toHaveBeenCalledWith(10, 20);
    });
    
    test('should handle pinch gesture', async () => {
      await scene.initialize();
      
      mockGestureDetector.onPinch({ scale: 1.5 });
      
      expect(mockCamera.zoom).toHaveBeenCalledWith(1.5);
    });
    
    test('should handle tap gesture', async () => {
      await scene.initialize();
      
      mockGestureDetector.onTap({ x: 400, y: 300 });
      
      expect(mockStarInteraction.onTap).toHaveBeenCalledWith(400, 300, 800, 600);
    });
  });
  
  describe('selection', () => {
    test('should handle star selection', async () => {
      await scene.initialize();
      
      const starData = {
        star: { id: 's1', displayName: 'Sirius' },
        screenDistance: 5,
      };
      
      // Trigger star selection callback
      const starCallbacks = mockStarInteraction.setCallbacks.mock.calls[0][0];
      starCallbacks.onSelect(starData);
      
      expect(scene.onSelectionChanged).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'star' })
      );
    });
    
    test('should handle DSO selection', async () => {
      await scene.initialize();
      
      const dsoData = {
        dso: { id: 'd1', commonName: 'Crab' },
        screenDistance: 5,
      };
      
      // Trigger DSO selection callback
      const dsoCallbacks = mockDSOInteraction.setCallbacks.mock.calls[0][0];
      dsoCallbacks.onSelect(dsoData);
      
      expect(scene.onSelectionChanged).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'dso' })
      );
    });
  });
  
  describe('statistics', () => {
    test('should track frame statistics', () => {
      scene.start();
      jest.useFakeTimers();
      jest.advanceTimersByTime(16);
      
      const stats = scene.getStats();
      
      expect(stats.fps).toBeGreaterThan(0);
      expect(stats.frameTime).toBeGreaterThan(0);
      expect(stats.starCount).toBeDefined();
      expect(stats.dsoCount).toBeDefined();
      
      jest.useRealTimers();
    });
  });
  
  describe('camera state', () => {
    test('should export camera state', () => {
      const state = scene.getCameraState();
      
      expect(state.position).toEqual(mockCamera.position);
      expect(state.target).toEqual(mockCamera.target);
      expect(state.fov).toBe(mockCamera.fov);
      expect(state.distance).toBe(mockCamera.distance);
    });
  });
  
  describe('resize', () => {
    test('should handle resize', () => {
      scene.resize(1024, 768);
      
      expect(scene.width).toBe(1024);
      expect(scene.height).toBe(768);
      expect(mockCanvas.width).toBe(1024);
      expect(mockCanvas.height).toBe(768);
    });
  });
  
  describe('cleanup', () => {
    test('should destroy scene', () => {
      scene.start();
      scene.destroy();
      
      expect(scene.isRunning).toBe(false);
      expect(scene.sceneObjects.stars.length).toBe(0);
      expect(scene.sceneObjects.dsos.length).toBe(0);
    });
  });
});
