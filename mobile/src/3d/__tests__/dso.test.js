/**
 * P0.8.4 - DSO Components Test Suite
 * 
 * 30+ tests covering catalog, LOD, rendering, and interaction
 */

import { DSOCatalog } from '../dso/DSOCatalog';
import { DSOLODManager } from '../dso/DSOLODManager';
import { DSORender, DSOManager } from '../dso/DSORender';
import { DSOInteraction, DSOInfoPanel } from '../dso/DSOInteraction';

// Sample DSO data
const sampleDSOs = [
  {
    _id: 'dso1',
    messierNumber: 1,
    ngcNumber: 1952,
    commonName: 'Crab Nebula',
    type: 'Supernova Remnant',
    raDegrees: 83.633,
    decDegrees: 22.014,
    distanceParsec: 1300,
    voyageX: 325.5,
    voyageY: 450.2,
    voyageZ: -1245.3,
    magnitude: 8.4,
    sizeArcmin: 5.5,
    color: [0.6, 0.8, 1.0],
    visibility: { minDistance: 100, maxDistance: 10000, minMagnitude: 15 },
  },
  {
    _id: 'dso2',
    messierNumber: 31,
    ngcNumber: 224,
    commonName: 'Andromeda',
    type: 'Spiral Galaxy',
    raDegrees: 10.685,
    decDegrees: 41.269,
    distanceParsec: 770000,
    voyageX: 150.0,
    voyageY: 600.0,
    voyageZ: 400.0,
    magnitude: 3.4,
    sizeArcmin: 220,
    color: [0.8, 0.7, 0.8],
    visibility: { minDistance: 100, maxDistance: 10000000, minMagnitude: 15 },
  },
];

describe('DSOCatalog', () => {
  let catalog;
  
  beforeEach(() => {
    catalog = new DSOCatalog(sampleDSOs);
  });
  
  test('should initialize with DSO data', () => {
    expect(catalog.dsos.length).toBe(2);
  });
  
  test('should index by Messier number', () => {
    const m1 = catalog.getByMessier(1);
    expect(m1.commonName).toBe('Crab Nebula');
    
    const m31 = catalog.getByMessier(31);
    expect(m31.commonName).toBe('Andromeda');
  });
  
  test('should index by NGC number', () => {
    const ngc = catalog.getByNGC(1952);
    expect(ngc.messierNumber).toBe(1);
  });
  
  test('should find DSOs by name', () => {
    const dso = catalog.getByName('Crab Nebula');
    expect(dso.messierNumber).toBe(1);
  });
  
  test('should find nearby DSOs (sphere search)', () => {
    const nearby = catalog.getNearby(325.5, 450.2, -1245.3, 1000);
    expect(nearby.length).toBeGreaterThan(0);
    expect(nearby[0].dso.commonName).toBe('Crab Nebula');
  });
  
  test('should get DSOs by type', () => {
    const supernovae = catalog.getByType('Supernova Remnant');
    expect(supernovae.length).toBe(1);
  });
  
  test('should get brightest DSOs', () => {
    const brightest = catalog.getBrightestDSOs(2);
    expect(brightest[0].magnitude).toBeLessThan(brightest[1].magnitude);
  });
  
  test('should get all Messier objects', () => {
    const messier = catalog.getAllMessier();
    expect(messier.length).toBe(2);
  });
  
  test('should provide catalog statistics', () => {
    const stats = catalog.getStats();
    expect(stats.totalDSOs).toBe(2);
    expect(stats.messierObjects).toBe(2);
  });
});

describe('DSOLODManager', () => {
  let lodManager;
  
  beforeEach(() => {
    lodManager = new DSOLODManager();
  });
  
  test('should assign LOD levels by distance', () => {
    const dso = sampleDSOs[0];
    
    expect(lodManager.getLODLevel(dso, 500)).toBe('billboard');
    expect(lodManager.getLODLevel(dso, 2000)).toBe('point');
    expect(lodManager.getLODLevel(dso, 6000)).toBe('skip');
  });
  
  test('should check magnitude visibility', () => {
    const faintDSO = { ...sampleDSOs[0], magnitude: 20 };
    expect(lodManager.getLODLevel(faintDSO, 500)).toBe('skip');
  });
  
  test('should calculate screen size', () => {
    const size = lodManager.getDSOScreenSize(sampleDSOs[0], 1000, 600, 45);
    expect(size).toBeGreaterThan(0);
    expect(size).toBeLessThanOrEqual(64);
  });
  
  test('should calculate brightness', () => {
    const brightness = lodManager.getDSOBrightness(sampleDSOs[0], 1000);
    expect(brightness).toBeGreaterThan(0);
    expect(brightness).toBeLessThanOrEqual(1);
  });
  
  test('should calculate glow intensity', () => {
    const glowBillboard = lodManager.getDSOGlow(sampleDSOs[0], 'billboard');
    const glowPoint = lodManager.getDSOGlow(sampleDSOs[0], 'point');
    
    expect(glowBillboard).toBeGreaterThan(glowPoint);
  });
  
  test('should provide rendering parameters', () => {
    const params = lodManager.getDSORenderingParams(
      sampleDSOs[0], 500, 600
    );
    
    expect(params.lodLevel).toBe('billboard');
    expect(params.screenSize).toBeGreaterThan(0);
    expect(params.brightness).toBeGreaterThan(0);
  });
  
  test('should respect rendering budget', () => {
    expect(lodManager.shouldRender(sampleDSOs[0], 'billboard', { billboard: 50 })).toBe(true);
    expect(lodManager.shouldRender(sampleDSOs[0], 'billboard', { billboard: 100 })).toBe(false);
  });
  
  test('should adapt quality based on frame time', () => {
    const initialBudget = lodManager.billboardBudget;
    
    lodManager.updateFrameTiming(20);  // Slow frame
    expect(lodManager.billboardBudget).toBeLessThan(initialBudget);
    
    lodManager.updateFrameTiming(12);  // Fast frame
    expect(lodManager.billboardBudget).toBeGreaterThan(initialBudget * 0.9);
  });
  
  test('should create device profile', () => {
    const lowProfile = DSOLODManager.createForProfile('low');
    const highProfile = DSOLODManager.createForProfile('high');
    
    expect(lowProfile.billboardBudget).toBeLessThan(highProfile.billboardBudget);
  });
});

describe('DSORender', () => {
  let renderer;
  
  beforeEach(() => {
    renderer = new DSORender({
      lodManager: new DSOLODManager(),
    });
  });
  
  test('should create billboard render object', () => {
    const billboard = renderer.createBillboard(
      sampleDSOs[0],
      10,
      0.8,
      [0.6, 0.8, 1.0]
    );
    
    expect(billboard.type).toBe('billboard');
    expect(billboard.size).toBeGreaterThan(0);
    expect(billboard.brightness).toBe(0.8);
  });
  
  test('should create point render object', () => {
    const point = renderer.createPoint(
      sampleDSOs[0],
      0.8,
      [0.6, 0.8, 1.0]
    );
    
    expect(point.type).toBe('point');
    expect(point.pointSize).toBeGreaterThan(0);
  });
  
  test('should render DSO with LOD', () => {
    const rendered = renderer.renderDSO(sampleDSOs[0], 500, 600);
    
    expect(rendered).toBeDefined();
    expect(rendered.type).toBe('billboard');
  });
  
  test('should render frame with all DSOs', () => {
    const rendered = renderer.renderFrame(sampleDSOs, 1000, 600);
    
    expect(rendered.length).toBeGreaterThan(0);
  });
  
  test('should track render statistics', () => {
    renderer.renderFrame(sampleDSOs, 500, 600);
    const stats = renderer.getStats();
    
    expect(stats.renderedCount.billboard).toBeGreaterThanOrEqual(0);
    expect(stats.totalRenderable).toBeGreaterThanOrEqual(0);
  });
});

describe('DSOManager', () => {
  let manager;
  let mockCamera;
  
  beforeEach(() => {
    mockCamera = {
      position: { x: 0, y: 0, z: 0 },
      distance: 1000,
      raDegrees: 0,
      decDegrees: 0,
    };
    
    manager = new DSOManager({
      camera: mockCamera,
    });
    manager.catalog = new DSOCatalog(sampleDSOs);
  });
  
  test('should update visible DSOs', () => {
    manager.viewportHeight = 600;
    const rendered = manager.update(mockCamera, 16.67);
    
    expect(Array.isArray(rendered)).toBe(true);
  });
  
  test('should find DSOs near ray', () => {
    const ray = {
      origin: { x: 0, y: 0, z: 0 },
      direction: { x: 0, y: 0, z: -1 },
    };
    
    const found = manager.findDSOsNearRay(ray);
    expect(Array.isArray(found)).toBe(true);
  });
  
  test('should select DSO', () => {
    manager.selectDSO(sampleDSOs[0]);
    expect(manager.getSelectedDSO()).toBe(sampleDSOs[0]);
  });
  
  test('should clear selection', () => {
    manager.selectDSO(sampleDSOs[0]);
    manager.clearSelection();
    expect(manager.getSelectedDSO()).toBeNull();
  });
});

describe('DSOInteraction', () => {
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
    
    interaction = new DSOInteraction({
      camera: mockCamera,
      onSelect: jest.fn(),
      onHover: jest.fn(),
      onDeselect: jest.fn(),
    });
    
    interaction.setDSOs(sampleDSOs);
  });
  
  test('should convert screen to ray', () => {
    const ray = interaction.screenToRay(400, 300, 800, 600);
    
    expect(ray).toBeDefined();
    expect(ray.origin).toBeDefined();
    expect(ray.direction).toBeDefined();
  });
  
  test('should normalize ray direction', () => {
    const ray = interaction.screenToRay(400, 300, 800, 600);
    
    const len = Math.sqrt(
      ray.direction.x**2 + ray.direction.y**2 + ray.direction.z**2
    );
    
    expect(len).toBeCloseTo(1, 5);
  });
  
  test('should find DSOs near ray', () => {
    const ray = {
      origin: { x: 0, y: 0, z: 50 },
      direction: { x: 0, y: 0, z: -1 },
    };
    
    const nearby = interaction.findDSOsNearRay(ray, 2000, 10);
    expect(Array.isArray(nearby)).toBe(true);
  });
  
  test('should handle tap (DSO selection)', () => {
    interaction.onTap(400, 300, 800, 600);
    // Should call selection callback
    expect(interaction.getSelectedDSO()).toBeDefined();
  });
  
  test('should deselect on empty space tap', () => {
    interaction.selectedDSO = sampleDSOs[0];
    interaction.dsos = [];  // No DSOs at this location
    
    interaction.onTap(400, 300, 800, 600);
    expect(interaction.getSelectedDSO()).toBeNull();
  });
});

describe('DSOInfoPanel', () => {
  let panel;
  let container;
  
  beforeEach(() => {
    container = document.createElement('div');
    panel = new DSOInfoPanel({
      container,
      onWarp: jest.fn(),
      onInfo: jest.fn(),
      onFavorite: jest.fn(),
    });
  });
  
  test('should display DSO information', () => {
    panel.showDSO(sampleDSOs[0]);
    
    expect(panel.visible).toBe(true);
    expect(container.innerHTML).toContain('Crab Nebula');
  });
  
  test('should format Messier designation', () => {
    panel.showDSO(sampleDSOs[0]);
    
    expect(container.innerHTML).toContain('M1');
  });
  
  test('should display all DSO details', () => {
    panel.showDSO(sampleDSOs[0]);
    
    expect(container.innerHTML).toContain('Supernova Remnant');
    expect(container.innerHTML).toContain('8.4');
    expect(container.innerHTML).toContain('1300');
  });
  
  test('should hide panel', () => {
    panel.showDSO(sampleDSOs[0]);
    panel.hide();
    
    expect(panel.visible).toBe(false);
    expect(container.style.display).toBe('none');
  });
});
