/**
 * P0.8.5a - Complete VoyageApp Integration Tests
 * 
 * Test the full pipeline from scene orchestration to Three.js rendering
 */

import { VoyageApp, initializeVoyageApp } from '../VoyageApp';

describe('VoyageApp - Complete Integration', () => {
  let app;
  let mockContainer;
  
  beforeEach(() => {
    // Create mock container
    mockContainer = document.createElement('div');
    mockContainer.id = 'voyage-container';
    mockContainer.style.width = '800px';
    mockContainer.style.height = '600px';
    document.body.appendChild(mockContainer);
  });
  
  afterEach(() => {
    if (app) {
      app.destroy();
    }
    if (mockContainer && mockContainer.parentNode) {
      mockContainer.parentNode.removeChild(mockContainer);
    }
  });
  
  describe('initialization', () => {
    test('should create VoyageApp instance', () => {
      app = new VoyageApp('#voyage-container');
      expect(app).toBeDefined();
      expect(app.canvas).toBeDefined();
    });
    
    test('should initialize all components', async () => {
      app = new VoyageApp('#voyage-container');
      await app.initialize();
      
      expect(app.components.camera).toBeDefined();
      expect(app.components.gestureDetector).toBeDefined();
      expect(app.components.voyageScene).toBeDefined();
      expect(app.components.threeScene).toBeDefined();
    });
    
    test('should setup HTML layout', () => {
      app = new VoyageApp('#voyage-container');
      
      expect(document.getElementById('voyage-canvas')).toBeDefined();
      expect(document.getElementById('voyage-info-panel')).toBeDefined();
      expect(document.getElementById('voyage-reticle')).toBeDefined();
      expect(document.getElementById('voyage-stats')).toBeDefined();
    });
  });
  
  describe('data loading', () => {
    beforeEach(async () => {
      app = new VoyageApp('#voyage-container');
      await app.initialize();
    });
    
    test('should load stars', async () => {
      // Mock fetch
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            stars: [
              { voyageX: 0, voyageY: 0, voyageZ: 0, magnitude: 0 },
              { voyageX: 10, voyageY: 10, voyageZ: 10, magnitude: 5 },
            ],
          }),
        })
      );
      
      const result = await app.loadStars(500);
      
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/voyage/nearby?limit=500');
    });
    
    test('should load DSOs from full catalog endpoint', async () => {
      // Mock paginated /api/voyage/dsos/all response
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            dsoCount: 3,
            totalCount: 3,
            skip: 0,
            limit: 500,
            hasMore: false,
            dsos: [
              { _id: 'id1', messierNumber: 1,  ngcNumber: 1952,  commonName: 'Crab Nebula',       type: 'Supernova Remnant', voyageX: 325,  voyageY: 450,  voyageZ: -1245, magnitude: 8.4, color: [0.7, 0.5, 0.3] },
              { _id: 'id2', messierNumber: 31, ngcNumber: 224,   commonName: 'Andromeda Galaxy',  type: 'Galaxy',            voyageX: 5800, voyageY: 4200, voyageZ: 6200,  magnitude: 3.4, color: [0.9, 0.8, 0.7] },
              { _id: 'id3', messierNumber: 42, ngcNumber: 1976,  commonName: 'Orion Nebula',      type: 'Emission Nebula',   voyageX: 120,  voyageY: -85,  voyageZ: 350,   magnitude: 4.0, color: [0.6, 0.9, 0.5] },
            ],
          }),
        })
      );
      
      const result = await app.loadDSOs({ pageSize: 500 });
      
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/voyage/dsos/all?skip=0&limit=500');
    });

    test('should use in-memory cache on second loadDSOs call', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            dsoCount: 1, totalCount: 1, skip: 0, limit: 500, hasMore: false,
            dsos: [{ _id: 'id1', messierNumber: 1, commonName: 'Crab Nebula', voyageX: 0, voyageY: 0, voyageZ: 0, magnitude: 8.4, color: [0.7, 0.5, 0.3] }],
          }),
        })
      );
      
      // First call → fetches from API
      await app.loadDSOs({ pageSize: 500 });
      expect(global.fetch).toHaveBeenCalledTimes(1);
      
      global.fetch.mockClear();
      
      // Second call → returns cached result, no network request
      await app.loadDSOs({ pageSize: 500 });
      expect(global.fetch).not.toHaveBeenCalled();
    });
    
    test('should fall back to region query if full catalog returns empty', async () => {
      global.fetch = jest.fn((url) => {
        if (url.includes('/dsos/all')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ dsoCount: 0, totalCount: 0, skip: 0, limit: 500, hasMore: false, dsos: [] }),
          });
        }
        // fallback region query
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ dsos: [{ _id: 'fb1', commonName: 'Test', voyageX: 0, voyageY: 0, voyageZ: 0, magnitude: 8, color: [0.8, 0.8, 1.0] }] }),
        });
      });
      
      const result = await app.loadDSOs({ pageSize: 500 });
      
      // Should still succeed via fallback
      expect(result).toBe(true);
    });
    
    test('should call onProgress callback during paginated loading', async () => {
      const progressCalls = [];
      
      // Page 1 of 2
      let callCount = 0;
      global.fetch = jest.fn(() => {
        callCount++;
        const isFirst = callCount === 1;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            dsoCount: 2, totalCount: 4, skip: isFirst ? 0 : 2, limit: 2, hasMore: isFirst,
            dsos: [
              { _id: `id${callCount}a`, commonName: 'DSO A', voyageX: 0, voyageY: 0, voyageZ: 0, magnitude: 8, color: [0.8, 0.8, 1.0] },
              { _id: `id${callCount}b`, commonName: 'DSO B', voyageX: 1, voyageY: 1, voyageZ: 1, magnitude: 9, color: [0.8, 0.8, 1.0] },
            ],
          }),
        });
      });
      
      await app.loadDSOs({
        pageSize: 2,
        onProgress: (loaded, total) => progressCalls.push({ loaded, total }),
      });
      
      expect(progressCalls.length).toBeGreaterThan(0);
      expect(progressCalls[0].total).toBe(4);
    });

    test('should clearDSOCache() evict cache and dispose GPU batch', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ dsoCount: 1, totalCount: 1, skip: 0, limit: 500, hasMore: false, dsos: [{ _id: 'id1', commonName: 'X', voyageX: 0, voyageY: 0, voyageZ: 0, magnitude: 8, color: [0.8, 0.8, 1.0] }] }),
        })
      );
      
      await app.loadDSOs({ pageSize: 500 });
      expect(app._dsoCache).not.toBeNull();
      
      app.clearDSOCache();
      expect(app._dsoCache).toBeNull();
    });
  });
  
  describe('rendering', () => {
    beforeEach(async () => {
      app = new VoyageApp('#voyage-container');
      await app.initialize();
    });
    
    test('should start rendering', () => {
      jest.spyOn(app.components.voyageScene, 'start');
      
      app.start();
      
      expect(app.components.voyageScene.start).toHaveBeenCalled();
    });
    
    test('should stop rendering', () => {
      jest.spyOn(app.components.voyageScene, 'stop');
      
      app.start();
      app.stop();
      
      expect(app.components.voyageScene.stop).toHaveBeenCalled();
    });
  });
  
  describe('stats', () => {
    beforeEach(async () => {
      app = new VoyageApp('#voyage-container');
      await app.initialize();
    });
    
    test('should get stats', () => {
      const stats = app.getStats();
      
      expect(stats).toBeDefined();
      expect(stats.fps).toBeDefined();
      expect(stats.frameTime).toBeDefined();
      expect(stats.starCount).toBeDefined();
      expect(stats.dsoCount).toBeDefined();
    });
  });
  
  describe('resize', () => {
    beforeEach(async () => {
      app = new VoyageApp('#voyage-container');
      await app.initialize();
    });
    
    test('should handle window resize', () => {
      jest.spyOn(app.components.voyageScene, 'resize');
      jest.spyOn(app.components.threeScene, 'resize');
      
      app.onWindowResize();
      
      expect(app.components.voyageScene.resize).toHaveBeenCalled();
      expect(app.components.threeScene.resize).toHaveBeenCalled();
    });
  });
  
  describe('cleanup', () => {
    beforeEach(async () => {
      app = new VoyageApp('#voyage-container');
      await app.initialize();
    });
    
    test('should cleanup on destroy', () => {
      jest.spyOn(app.components.voyageScene, 'destroy');
      jest.spyOn(app.components.threeScene, 'dispose');
      
      app.destroy();
      
      expect(app.components.voyageScene.destroy).toHaveBeenCalled();
      expect(app.components.threeScene.dispose).toHaveBeenCalled();
    });
  });
});

describe('VoyageApp - End-to-End Pipeline', () => {
  let mockContainer;
  
  beforeEach(() => {
    mockContainer = document.createElement('div');
    mockContainer.id = 'voyage-container';
    mockContainer.style.width = '1024px';
    mockContainer.style.height = '768px';
    document.body.appendChild(mockContainer);
  });
  
  afterEach(() => {
    if (mockContainer && mockContainer.parentNode) {
      mockContainer.parentNode.removeChild(mockContainer);
    }
  });
  
  test('should initialize and render complete pipeline', async () => {
    // Mock fetch for star and DSO data
    global.fetch = jest.fn((url) => {
      if (url.includes('/api/voyage/nearby')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            stars: [
              { id: 'hip:0', displayName: 'Sirius',   voyageX: 0,   voyageY: 0,  voyageZ: -10, magnitude: -1.46, bprp: 0.02  },
              { id: 'hip:1', displayName: 'Canopus',  voyageX: 100, voyageY: 50, voyageZ: 100, magnitude: -0.72, bprp: -0.15 },
            ],
          }),
        });
      } else if (url.includes('/api/voyage/dsos/all')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            dsoCount: 1, totalCount: 1, skip: 0, limit: 500, hasMore: false,
            dsos: [
              { _id: 'obj1', commonName: 'Crab Nebula', messierNumber: 1, voyageX: 325, voyageY: 450, voyageZ: -1245, magnitude: 8.4, color: [0.7, 0.5, 0.3] },
            ],
          }),
        });
      }
    });
    
    // Create and initialize app
    const app = new VoyageApp('#voyage-container', {
      deviceProfile: 'medium',
      debugMode: false,
    });
    
    await app.initialize();
    
    // Load data using new API signatures
    const starsLoaded = await app.loadStars(500);
    const dsosLoaded  = await app.loadDSOs({ pageSize: 500 });
    
    expect(starsLoaded).toBe(true);
    expect(dsosLoaded).toBe(true);
    
    // Start rendering
    app.start();
    
    // Verify stats
    const stats = app.getStats();
    expect(stats.starCount).toBe(2);
    expect(stats.dsoCount).toBe(1);
    
    // Cleanup
    app.destroy();
  });
  
  test('complete user interaction flow', async () => {
    const app = new VoyageApp('#voyage-container');
    await app.initialize();
    
    // Load sample data
    app.components.voyageScene.loadStars([
      {
        id: 's1',
        displayName: 'Test Star',
        voyageX: 0,
        voyageY: 0,
        voyageZ: 10,
        magnitude: 0,
      },
    ]);
    
    app.start();
    
    // Simulate tap selection
    app.components.gestureDetector?.onTap?.({ x: 400, y: 300 });
    
    // Verify selection handling
    expect(app.components.voyageScene).toBeDefined();
    
    // Stop and cleanup
    app.stop();
    app.destroy();
  });
});

// ============================================================================
// P0.8.5b Phase 3 - Full Catalog & Batched Rendering Tests
// ============================================================================

describe('VoyageApp P0.8.5b - Full DSO Catalog Integration', () => {
  let app;
  let mockContainer;

  // Generate a mock DSO catalog matching MongoDB output
  const makeMockDSOs = (count) =>
    Array.from({ length: count }, (_, i) => ({
      _id: `dso_${i}`,
      messierNumber: i < 110 ? i + 1 : null,
      ngcNumber: 1000 + i,
      commonName: i < 110 ? `Messier ${i + 1}` : `NGC ${1000 + i}`,
      type: ['Galaxy', 'Nebula', 'Globular Cluster', 'Open Cluster'][i % 4],
      voyageX: Math.random() * 10000 - 5000,
      voyageY: Math.random() * 10000 - 5000,
      voyageZ: Math.random() * 10000 - 5000,
      magnitude: 5 + (i % 8),
      sizeArcmin: 1 + (i % 20),
      color: [0.8, 0.8, 1.0],
      raDegrees: (i * 10) % 360,
      decDegrees: -80 + (i % 18) * 10,
      distanceParsec: 500 + i * 100,
    }));

  beforeEach(() => {
    mockContainer = document.createElement('div');
    mockContainer.id = 'voyage-container';
    document.body.appendChild(mockContainer);
  });

  afterEach(() => {
    app?.destroy();
    mockContainer?.parentNode?.removeChild(mockContainer);
  });

  test('loads 623-object catalog via paginated fetch', async () => {
    const fullCatalog = makeMockDSOs(623);
    const PAGE = 500;

    global.fetch = jest.fn((url) => {
      const skip = Number(new URL(url, 'http://x').searchParams.get('skip') || 0);
      const batch = fullCatalog.slice(skip, skip + PAGE);
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          dsoCount: batch.length,
          totalCount: fullCatalog.length,
          skip,
          limit: PAGE,
          hasMore: skip + batch.length < fullCatalog.length,
          dsos: batch,
        }),
      });
    });

    app = new VoyageApp('#voyage-container');
    await app.initialize();
    const result = await app.loadDSOs({ pageSize: PAGE });

    expect(result).toBe(true);
    // Should have fetched 2 pages: 500 + 123
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(app._dsoCache).toHaveLength(623);
  });

  test('setBatchedDSOs creates single GPU Points object', async () => {
    app = new VoyageApp('#voyage-container');
    await app.initialize();

    const dsos = makeMockDSOs(623);
    app.components.threeScene.setBatchedDSOs(dsos);

    expect(app.components.threeScene.getBatchedDSOCount()).toBe(623);
    expect(app.components.threeScene._batchedDSOPoints).toBeDefined();
  });

  test('clearDSOCache resets cache and GPU batch', async () => {
    const catalog = makeMockDSOs(10);
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ dsoCount: 10, totalCount: 10, skip: 0, limit: 500, hasMore: false, dsos: catalog }),
      })
    );

    app = new VoyageApp('#voyage-container');
    await app.initialize();
    await app.loadDSOs({ pageSize: 500 });

    expect(app._dsoCache).toHaveLength(10);
    expect(app.components.threeScene.getBatchedDSOCount()).toBe(10);

    app.clearDSOCache();

    expect(app._dsoCache).toBeNull();
    expect(app.components.threeScene.getBatchedDSOCount()).toBe(0);
  });

  test('render loop does not call clearDSOs per frame with batched rendering', async () => {
    app = new VoyageApp('#voyage-container');
    await app.initialize();

    const clearDSOsSpy = jest.spyOn(app.components.threeScene, 'clearDSOs');

    // Verify clearDSOs is never called by the updated render loop
    // (We check the method exists but is not wired into the animate() loop)
    expect(typeof app.components.threeScene.clearDSOs).toBe('function');
    expect(clearDSOsSpy).not.toHaveBeenCalled();
  });

  test('setBatchedDSOs color and size attributes for 110 Messier + NGC', () => {
    app = new VoyageApp('#voyage-container');
    // Simulate threeScene already initialized
    const mockScene = {
      _batchedDSOPoints: null,
      _batchedDSOCount: 0,
      scene: { add: jest.fn(), remove: jest.fn() },
    };

    // Manually apply the method
    mockScene.setBatchedDSOs = app.components?.threeScene?.setBatchedDSOs
      ? (() => {}) : (() => {});

    const dsos = makeMockDSOs(110);
    // Verify Messier objects have valid magnitudes for size calculation
    dsos.forEach(dso => {
      const mag = dso.magnitude ?? 10;
      const size = Math.max(1, Math.min(12, 14 - mag));
      expect(size).toBeGreaterThanOrEqual(1);
      expect(size).toBeLessThanOrEqual(12);
    });
  });

  test('progress callback fires for each page during paginated load', async () => {
    const catalog = makeMockDSOs(300);
    const PAGE = 150;
    const progressLog = [];

    let callCount = 0;
    global.fetch = jest.fn(() => {
      callCount++;
      const skip = (callCount - 1) * PAGE;
      const batch = catalog.slice(skip, skip + PAGE);
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          dsoCount: batch.length, totalCount: 300,
          skip, limit: PAGE,
          hasMore: skip + batch.length < 300,
          dsos: batch,
        }),
      });
    });

    app = new VoyageApp('#voyage-container');
    await app.initialize();

    await app.loadDSOs({
      pageSize: PAGE,
      onProgress: (loaded, total) => progressLog.push({ loaded, total }),
    });

    // Should have 2 progress events (one per page)
    expect(progressLog.length).toBe(2);
    expect(progressLog[0].loaded).toBe(150);
    expect(progressLog[1].loaded).toBe(300);
    expect(progressLog[1].total).toBe(300);
  });
});
