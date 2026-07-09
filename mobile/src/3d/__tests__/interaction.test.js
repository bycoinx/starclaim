/**
 * P0.8.3 - Star Interaction Tests
 */

import { StarInteraction, StarInfoPanel, StarReticle } from '../stars/StarInteraction';

describe('StarInteraction', () => {
  let interaction;
  let mockCamera;
  
  beforeEach(() => {
    mockCamera = {
      position: { x: 0, y: 0, z: 50 },
      fov: 45,
      getViewVector: () => ({ x: 0, y: 0, z: -1 }),
      getRightVector: () => ({ x: 1, y: 0, z: 0 }),
      up: { x: 0, y: 1, z: 0 },
    };
    
    interaction = new StarInteraction({
      camera: mockCamera,
      onSelect: jest.fn(),
      onHover: jest.fn(),
      onDeselect: jest.fn(),
    });
  });
  
  describe('screenToRay', () => {
    test('should convert screen coordinates to ray', () => {
      const ray = interaction.screenToRay(400, 300, 800, 600);
      
      expect(ray).toBeDefined();
      expect(ray.origin).toBeDefined();
      expect(ray.direction).toBeDefined();
      expect(ray.origin).toEqual(mockCamera.position);
    });
    
    test('should normalize ray direction', () => {
      const ray = interaction.screenToRay(400, 300, 800, 600);
      
      const len = Math.sqrt(
        ray.direction.x**2 + 
        ray.direction.y**2 + 
        ray.direction.z**2
      );
      
      expect(len).toBeCloseTo(1, 5);
    });
    
    test('should handle center screen', () => {
      const ray = interaction.screenToRay(400, 300, 800, 600);
      
      expect(ray.origin).toBeDefined();
      expect(ray.direction).toBeDefined();
    });
  });
  
  describe('findStarsNearRay', () => {
    beforeEach(() => {
      interaction.setStars([
        {
          properName: 'Star A',
          voyageX: 0,
          voyageY: 0,
          voyageZ: -10,
          magnitude: 3,
        },
        {
          properName: 'Star B',
          voyageX: 5,
          voyageY: 5,
          voyageZ: -20,
          magnitude: 5,
        },
        {
          properName: 'Star C',
          voyageX: 100,
          voyageY: 100,
          voyageZ: 100,
          magnitude: 2,
        },
      ]);
    });
    
    test('should find nearby stars', () => {
      const ray = {
        origin: { x: 0, y: 0, z: 50 },
        direction: { x: 0, y: 0, z: -1 },
      };
      
      const nearby = interaction.findStarsNearRay(ray, 100, 10);
      
      expect(nearby.length).toBeGreaterThan(0);
    });
    
    test('should sort by screen distance', () => {
      const ray = {
        origin: { x: 0, y: 0, z: 50 },
        direction: { x: 0, y: 0, z: -1 },
      };
      
      const nearby = interaction.findStarsNearRay(ray, 100, 10);
      
      for (let i = 1; i < nearby.length; i++) {
        expect(nearby[i].screenDistance).toBeGreaterThanOrEqual(
          nearby[i-1].screenDistance
        );
      }
    });
    
    test('should limit results', () => {
      const ray = {
        origin: { x: 0, y: 0, z: 50 },
        direction: { x: 0, y: 0, z: -1 },
      };
      
      const nearby = interaction.findStarsNearRay(ray, 100, 2);
      
      expect(nearby.length).toBeLessThanOrEqual(2);
    });
  });
  
  describe('onTap', () => {
    test('should select nearby star', () => {
      interaction.setStars([
        {
          properName: 'Sirius',
          voyageX: 0,
          voyageY: 0,
          voyageZ: -10,
          magnitude: -1.46,
        },
      ]);
      
      interaction.onTap(400, 300, 800, 600);
      
      expect(interaction.getSelectedStar()).toBeDefined();
    });
    
    test('should deselect if no star hit', () => {
      interaction.setStars([]);
      interaction.selectedStar = { properName: 'Old Star' };
      
      interaction.onTap(400, 300, 800, 600);
      
      expect(interaction.getSelectedStar()).toBeNull();
    });
  });
  
  describe('selection state', () => {
    test('should track selected star', () => {
      const star = { properName: 'Vega', magnitude: 0.03 };
      interaction.selectedStar = star;
      
      expect(interaction.getSelectedStar()).toBe(star);
    });
    
    test('should clear selection', () => {
      interaction.selectedStar = { properName: 'Polaris' };
      interaction.clearSelection();
      
      expect(interaction.getSelectedStar()).toBeNull();
      expect(interaction.getHoveredStar()).toBeNull();
    });
  });
});

describe('StarInfoPanel', () => {
  let panel;
  let container;
  
  beforeEach(() => {
    container = document.createElement('div');
    panel = new StarInfoPanel({
      container,
      onWarp: jest.fn(),
      onInfo: jest.fn(),
      onFavorite: jest.fn(),
    });
  });
  
  describe('showStar', () => {
    test('should display star information', () => {
      const star = {
        properName: 'Sirius',
        spectralType: 'A1V',
        magnitude: -1.46,
        distanceParsec: 2.64,
        raDegrees: 101.29,
        decDegrees: -16.71,
        constellation: 'Canis Major',
      };
      
      panel.showStar(star);
      
      expect(panel.visible).toBe(true);
      expect(container.style.display).not.toBe('none');
      expect(container.innerHTML).toContain('Sirius');
    });
    
    test('should show all star details', () => {
      const star = {
        properName: 'Vega',
        spectralType: 'A0V',
        magnitude: 0.03,
        distanceParsec: 7.76,
        raDegrees: 279.23,
        decDegrees: 38.78,
        constellation: 'Lyra',
      };
      
      panel.showStar(star);
      
      expect(container.innerHTML).toContain('A0V');
      expect(container.innerHTML).toContain('0.03');
      expect(container.innerHTML).toContain('7.76');
    });
  });
  
  describe('hide', () => {
    test('should hide panel', () => {
      panel.showStar({ properName: 'Test' });
      panel.hide();
      
      expect(panel.visible).toBe(false);
      expect(container.style.display).toBe('none');
    });
  });
});

describe('StarReticle', () => {
  let reticle;
  let container;
  
  beforeEach(() => {
    container = document.createElement('div');
    reticle = new StarReticle({
      container,
      color: '#00f3ff',
    });
  });
  
  describe('show', () => {
    test('should display reticle', () => {
      reticle.show(400, 300);
      
      expect(reticle.visible).toBe(true);
      expect(container.style.display).not.toBe('none');
      expect(container.innerHTML).toContain('svg');
    });
  });
  
  describe('hide', () => {
    test('should hide reticle', () => {
      reticle.show(400, 300);
      reticle.hide();
      
      expect(reticle.visible).toBe(false);
      expect(container.style.display).toBe('none');
    });
  });
  
  describe('updatePosition', () => {
    test('should update reticle position', () => {
      reticle.show(400, 300);
      const initialHTML = container.innerHTML;
      
      reticle.updatePosition(500, 400);
      
      // Position should be reflected in styling
      expect(reticle.position.x).toBe(500);
      expect(reticle.position.y).toBe(400);
    });
  });
});
