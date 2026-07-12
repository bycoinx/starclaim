/**
 * P0.8.3 - Camera Controller Tests
 * 
 * Validates camera movement, gesture detection,
 * and warp mechanics
 */

import { VoyageCamera, GestureDetector } from '../scenes/VoyageCamera';

describe('VoyageCamera', () => {
  let camera;
  
  beforeEach(() => {
    camera = new VoyageCamera({
      initialX: 0,
      initialY: 0,
      initialZ: 50,
      targetX: 0,
      targetY: 0,
      targetZ: 0,
    });
  });
  
  describe('initialization', () => {
    test('should have default position', () => {
      expect(camera.position.z).toBe(50);
      expect(camera.target.z).toBe(0);
    });
    
    test('should have default constraints', () => {
      expect(camera.minDistance).toBeGreaterThan(0);
      expect(camera.maxDistance).toBeGreaterThan(camera.minDistance);
    });
  });
  
  describe('distanceToTarget', () => {
    test('should calculate distance correctly', () => {
      const distance = camera.distanceToTarget();
      expect(distance).toBeCloseTo(50, 1);
    });
    
    test('should update after position change', () => {
      camera.setTarget(0, 0, -50);
      const distance = camera.distanceToTarget();
      expect(distance).toBeCloseTo(100, 1);
    });
  });
  
  describe('zoom', () => {
    test('should zoom in (decrease distance)', () => {
      const initialDistance = camera.distanceToTarget();
      camera.zoom(1.5); // Zoom in (factor > 1)
      const newDistance = camera.distanceToTarget();
      
      expect(newDistance).toBeLessThan(initialDistance);
    });
    
    test('should zoom out (increase distance)', () => {
      const initialDistance = camera.distanceToTarget();
      camera.zoom(0.5); // Zoom out (factor < 1)
      const newDistance = camera.distanceToTarget();
      
      expect(newDistance).toBeGreaterThan(initialDistance);
    });
    
    test('should respect min/max distance constraints', () => {
      // Zoom in too much
      camera.zoom(100);
      let distance = camera.distanceToTarget();
      expect(distance).toBeGreaterThanOrEqual(camera.minDistance);
      
      // Zoom out too much
      camera.zoom(0.0001);
      distance = camera.distanceToTarget();
      expect(distance).toBeLessThanOrEqual(camera.maxDistance);
    });
  });
  
  describe('orbit', () => {
    test('should rotate camera around target', () => {
      const initialX = camera.position.x;
      camera.orbit(Math.PI / 4, 0); // 45° yaw rotation
      const newX = camera.position.x;
      
      expect(newX).not.toBeCloseTo(initialX, 1);
    });
    
    test('should maintain distance during orbit', () => {
      const initialDistance = camera.distanceToTarget();
      camera.orbit(Math.PI / 2, Math.PI / 6);
      const newDistance = camera.distanceToTarget();
      
      expect(newDistance).toBeCloseTo(initialDistance, 1);
    });
    
    test('should clamp pitch to prevent gimbal lock', () => {
      // Try extreme pitch
      camera.orbit(0, Math.PI);
      
      // Should still be valid
      expect(camera.position.y).toBeDefined();
      expect(isNaN(camera.position.y)).toBe(false);
    });
  });
  
  describe('lock mode', () => {
    test('should enter lock mode', () => {
      const target = { x: 10, y: 5, z: -10 };
      camera.lockToTarget(target);
      
      expect(camera.mode).toBe('lock');
      expect(camera.isMoving).toBe(true);
    });
    
    test('should approach lock target', () => {
      const target = { x: 100, y: 0, z: 0 };
      camera.lockToTarget(target);
      
      const initialDistance = Math.hypot(
        camera.lockTarget.x - camera.target.x,
        camera.lockTarget.y - camera.target.y,
        camera.lockTarget.z - camera.target.z
      );
      
      camera.update(0.016); // Simulate frame
      
      const newDistance = Math.hypot(
        camera.lockTarget.x - camera.target.x,
        camera.lockTarget.y - camera.target.y,
        camera.lockTarget.z - camera.target.z
      );
      
      expect(newDistance).toBeLessThan(initialDistance);
    });
    
    test('should exit lock mode when target reached', () => {
      camera.lockToTarget(camera.target, 5);
      
      // Simulate many frames to reach target
      for (let i = 0; i < 100; i++) {
        camera.update(0.016);
      }
      
      expect(camera.mode).toBe('free');
      expect(camera.isMoving).toBe(false);
    });
  });
  
  describe('warp mode', () => {
    test('should enter warp mode', () => {
      const target = { x: 50, y: 50, z: 50 };
      camera.warpToTarget(target);
      
      expect(camera.mode).toBe('warp');
      expect(camera.warpProgress).toBe(0);
    });
    
    test('should progress warp animation', () => {
      const target = { x: 100, y: 0, z: 0 };
      camera.warpToTarget(target);
      
      camera.update(0.3); // 0.3 seconds
      
      expect(camera.warpProgress).toBeGreaterThan(0);
      expect(camera.warpProgress).toBeLessThan(1);
    });
    
    test('should complete warp in duration', () => {
      const target = { x: 100, y: 0, z: 0 };
      const onComplete = jest.fn();
      camera.warpToTarget(target, 10, onComplete);
      
      // Simulate full warp duration
      camera.update(1.6); // Slightly more than 1.5s
      
      expect(camera.mode).toBe('free');
      expect(onComplete).toHaveBeenCalled();
    });
    
    test('should call completion callback', () => {
      const callback = jest.fn();
      const target = { x: 100, y: 0, z: 0 };
      
      camera.warpToTarget(target, 10, callback);
      
      // Complete warp
      for (let i = 0; i < 100; i++) {
        camera.update(0.016);
        if (camera.mode !== 'warp') break;
      }
      
      expect(callback).toHaveBeenCalled();
    });
  });
  
  describe('free mode', () => {
    test('should apply velocity-based movement', () => {
      camera.mode = 'free';
      camera.velocity = { x: 10, y: 0, z: 0 };
      
      const initialX = camera.target.x;
      camera.update(0.016);
      
      expect(camera.target.x).toBeGreaterThan(initialX);
    });
    
    test('should apply friction to velocity', () => {
      camera.mode = 'free';
      camera.velocity = { x: 100, y: 0, z: 0 };
      
      camera.update(0.016);
      const vel1 = camera.velocity.x;
      
      camera.update(0.016);
      const vel2 = camera.velocity.x;
      
      expect(vel2).toBeLessThan(vel1);
    });
  });
  
  describe('utility methods', () => {
    test('should return camera state', () => {
      const state = camera.getCameraState();
      
      expect(state.position).toBeDefined();
      expect(state.target).toBeDefined();
      expect(state.up).toBeDefined();
      expect(state.fov).toBe(45);
    });
    
    test('should get view vector', () => {
      const view = camera.getViewVector();
      
      // Should be normalized
      const length = Math.hypot(view.x, view.y, view.z);
      expect(length).toBeCloseTo(1, 5);
    });
    
    test('should get right vector', () => {
      const right = camera.getRightVector();
      
      // Should be normalized
      const length = Math.hypot(right.x, right.y, right.z);
      expect(length).toBeCloseTo(1, 5);
      
      // Should be perpendicular to view
      const view = camera.getViewVector();
      const dot = view.x * right.x + view.y * right.y + view.z * right.z;
      expect(dot).toBeCloseTo(0, 5);
    });
  });
});

describe('GestureDetector', () => {
  let detector;
  let callbacks;
  
  beforeEach(() => {
    callbacks = {
      onPan: jest.fn(),
      onPinch: jest.fn(),
      onTap: jest.fn(),
      onLongTap: jest.fn(),
      onDoubleTap: jest.fn(),
    };
    
    detector = new GestureDetector(callbacks);
  });
  
  describe('tap detection', () => {
    test('should detect single tap', (done) => {
      const touchStart = {
        touches: [{ clientX: 100, clientY: 100 }],
      };
      const touchEnd = {
        touches: [],
      };
      
      detector.handleTouchStart(touchStart);
      
      setTimeout(() => {
        detector.handleTouchEnd(touchEnd);
        
        expect(callbacks.onTap).toHaveBeenCalled();
        done();
      }, 100);
    });
    
    test('should detect double tap', (done) => {
      const touchStart = {
        touches: [{ clientX: 100, clientY: 100 }],
      };
      const touchEnd = { touches: [] };
      
      // First tap
      detector.handleTouchStart(touchStart);
      setTimeout(() => {
        detector.handleTouchEnd(touchEnd);
        
        // Second tap quickly
        detector.handleTouchStart(touchStart);
        setTimeout(() => {
          detector.handleTouchEnd(touchEnd);
          
          expect(callbacks.onDoubleTap).toHaveBeenCalled();
          done();
        }, 100);
      }, 100);
    });
    
    test('should not detect pan as tap', (done) => {
      const touchStart = {
        touches: [{ clientX: 100, clientY: 100 }],
      };
      const touchMove = {
        touches: [{ clientX: 150, clientY: 150 }],
      };
      const touchEnd = { touches: [] };
      
      detector.handleTouchStart(touchStart);
      detector.handleTouchMove(touchMove);
      
      setTimeout(() => {
        detector.handleTouchEnd(touchEnd);
        
        expect(callbacks.onTap).not.toHaveBeenCalled();
        expect(callbacks.onPan).toHaveBeenCalled();
        done();
      }, 100);
    });
  });
  
  describe('pan detection', () => {
    test('should detect pan gesture', () => {
      const touchStart = {
        touches: [{ clientX: 100, clientY: 100 }],
      };
      const touchMove = {
        touches: [{ clientX: 150, clientY: 120 }],
      };
      
      detector.handleTouchStart(touchStart);
      detector.handleTouchMove(touchMove);
      
      expect(callbacks.onPan).toHaveBeenCalledWith(
        expect.objectContaining({
          deltaX: expect.any(Number),
          deltaY: expect.any(Number),
        })
      );
    });
    
    test('should accumulate pan deltas', () => {
      const touchStart = {
        touches: [{ clientX: 100, clientY: 100 }],
      };
      
      detector.handleTouchStart(touchStart);
      
      detector.handleTouchMove({
        touches: [{ clientX: 110, clientY: 105 }],
      });
      
      detector.handleTouchMove({
        touches: [{ clientX: 120, clientY: 110 }],
      });
      
      expect(callbacks.onPan).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('pinch detection', () => {
    test('should detect pinch zoom', () => {
      const touchStart = {
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 150, clientY: 150 },
        ],
      };
      const touchMove = {
        touches: [
          { clientX: 80, clientY: 80 },
          { clientX: 170, clientY: 170 },
        ],
      };
      
      detector.handleTouchStart(touchStart);
      detector.handleTouchMove(touchMove);
      
      expect(callbacks.onPinch).toHaveBeenCalledWith(
        expect.objectContaining({
          scale: expect.any(Number),
        })
      );
    });
  });
  
  describe('long tap detection', () => {
    test('should detect long tap', (done) => {
      const touchStart = {
        touches: [{ clientX: 100, clientY: 100 }],
      };
      const touchEnd = { touches: [] };
      
      detector.handleTouchStart(touchStart);
      
      setTimeout(() => {
        detector.handleTouchEnd(touchEnd);
        
        expect(callbacks.onLongTap).toHaveBeenCalled();
        done();
      }, 600);
    });
    
    test('should cancel long tap on movement', (done) => {
      const touchStart = {
        touches: [{ clientX: 100, clientY: 100 }],
      };
      const touchMove = {
        touches: [{ clientX: 200, clientY: 200 }],
      };
      const touchEnd = { touches: [] };
      
      detector.handleTouchStart(touchStart);
      
      setTimeout(() => {
        detector.handleTouchMove(touchMove);
        
        setTimeout(() => {
          detector.handleTouchEnd(touchEnd);
          
          expect(callbacks.onLongTap).not.toHaveBeenCalled();
          done();
        }, 200);
      }, 100);
    });
  });
});
