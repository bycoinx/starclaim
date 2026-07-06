/**
 * P0.8.5a - Complete VoyageApp with Three.js
 * 
 * Full working example integrating all P0.8.1-P0.8.4 components
 * with Three.js rendering for production deployment
 */

import * as THREE from 'three';
import { VoyageScene } from './3d/scenes/VoyageScene';
import { VoyageSceneThreeJS } from './3d/scenes/VoyageSceneThreeJS';
import { VoyageCamera, GestureDetector } from './3d/scenes/VoyageCamera';
import { StarLODManager, createLODManagerForProfile as createStarLODManager } from './3d/stars/StarLODManager';
import { DSOLODManager } from './3d/dso/DSOLODManager';
import { DSORender } from './3d/dso/DSORender';
import { StarInteraction, StarInfoPanel, StarReticle } from './3d/stars/StarInteraction';
import { DSOInteraction, DSOInfoPanel } from './3d/dso/DSOInteraction';

/**
 * Complete VoyageApp - Production-ready 3D star journey
 */
export class VoyageApp {
  constructor(containerSelector, options = {}) {
    this.container = document.querySelector(containerSelector);
    if (!this.container) {
      throw new Error(`Container ${containerSelector} not found`);
    }
    
    this.options = {
      deviceProfile: 'medium', // low, medium, high
      autoStart: true,
      debugMode: false,
      ...options
    };
    
    this.components = {};
    this.stats = {};
    
    this._setupLayout();
  }
  
  /**
   * Setup HTML layout
   */
  _setupLayout() {
    this.container.innerHTML = `
      <div class="voyage-app" style="width: 100%; height: 100%; display: flex; flex-direction: column;">
        <canvas id="voyage-canvas" style="flex: 1; display: block;"></canvas>
        <div id="voyage-hud" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none;">
          <div id="voyage-info-panel" style="
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(0, 15, 30, 0.9);
            border: 1px solid #00f3ff;
            border-radius: 4px;
            padding: 20px;
            color: #00f3ff;
            max-width: 300px;
            font-family: monospace;
            font-size: 12px;
            display: none;
            z-index: 100;
            pointer-events: auto;
          "></div>
          <svg id="voyage-reticle" style="
            position: absolute;
            width: 50px;
            height: 50px;
            display: none;
            z-index: 50;
          "></svg>
          <div id="voyage-stats" style="
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 15, 30, 0.8);
            border: 1px solid #00f3ff;
            border-radius: 4px;
            padding: 10px 15px;
            color: #00f3ff;
            font-family: monospace;
            font-size: 11px;
            line-height: 1.5;
          "></div>
        </div>
      </div>
    `;
    
    this.canvas = document.getElementById('voyage-canvas');
    this.infoPanelElement = document.getElementById('voyage-info-panel');
    this.reticleElement = document.getElementById('voyage-reticle');
    this.statsElement = document.getElementById('voyage-stats');
  }
  
  /**
   * Initialize app
   */
  async initialize() {
    try {
      console.log('🚀 Initializing VoyageApp...');
      
      // Initialize camera
      this.components.camera = new VoyageCamera({
        position: { x: 0, y: 0, z: 50 },
        target: { x: 0, y: 0, z: 0 },
        minDistance: 0.5,
        maxDistance: 10000,
      });
      
      // Initialize gesture detector
      this.components.gestureDetector = new GestureDetector({
        element: this.canvas,
        tapThreshold: 300,
        longTapDuration: 500,
      });
      
      // Initialize LOD managers
      this.components.starLOD = createStarLODManager(this.options.deviceProfile);
      this.components.dsoLOD = DSOLODManager.createForProfile(this.options.deviceProfile);
      
      // Initialize renderers (abstract)
      this.components.starRenderer = {
        lodManager: this.components.starLOD,
        setStars: (stars) => this._handleStarData(stars),
        renderFrame: (distance, height) => this._renderStars(distance, height),
      };
      
      this.components.dsoRenderer = new DSORender({
        lodManager: this.components.dsoLOD,
      });
      
      // Initialize interaction
      this.components.starInteraction = new StarInteraction({
        camera: this.components.camera,
      });
      
      this.components.dsoInteraction = new DSOInteraction({
        camera: this.components.camera,
      });
      
      // Initialize UI
      this.components.infoPanel = new StarInfoPanel({
        container: this.infoPanelElement,
      });
      
      this.components.reticle = new StarReticle({
        container: this.reticleElement,
      });
      
      // Create VoyageScene (abstract orchestration)
      this.components.voyageScene = new VoyageScene({
        canvas: this.canvas,
        camera: this.components.camera,
        starRenderer: this.components.starRenderer,
        dsoRenderer: this.components.dsoRenderer,
        starInteraction: this.components.starInteraction,
        dsoInteraction: this.components.dsoInteraction,
        gestureDetector: this.components.gestureDetector,
        infoPanel: this.components.infoPanel,
        reticle: this.components.reticle,
        onSelectionChanged: (selection) => this._onSelectionChanged(selection),
      });
      
      await this.components.voyageScene.initialize();
      
      // Create Three.js renderer (concrete rendering)
      this.components.threeScene = new VoyageSceneThreeJS(this.canvas);
      
      // Hook up render loop to Three.js
      this._setupRenderLoop();
      
      console.log('✅ VoyageApp initialized');
      return true;
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Setup render loop with Three.js
   */
  _setupRenderLoop() {
    let lastFrameTime = Date.now();
    
    const animate = () => {
      requestAnimationFrame(animate);
      
      try {
        // Get camera state from VoyageScene
        const cameraState = this.components.voyageScene.getCameraState();
        
        // Update Three.js camera
        this.components.threeScene.updateCamera(cameraState);
        
        // Clear and re-render only stars (dynamic per-frame)
        // DSOs are rendered via a static batched BufferGeometry (setBatchedDSOs) —
        // no per-frame clear/re-add needed, so DO NOT call clearDSOs() here.
        this.components.threeScene.clearStars();
        
        // Get render objects from VoyageScene
        const stats = this.components.voyageScene.getStats();
        
        // Render stars in Three.js (dynamic, camera-distance-based LOD)
        stats.starRenderables?.forEach(starObj => {
          try {
            this.components.threeScene.renderStar(starObj);
          } catch (e) {
            console.warn('Star render error:', e);
          }
        });
        
        // DSOs: already rendered as batched GPU geometry — no per-frame work needed.
        // Per-frame individual DSO rendering is skipped intentionally for performance.
        
        // Render Three.js frame
        this.components.threeScene.render();
        
        // Update stats display (show batched DSO count)
        const dsoCount = this.components.threeScene.getBatchedDSOCount?.() ?? stats.dsoCount;
        this._updateStatsDisplay({ ...stats, dsoCount });
        
      } catch (error) {
        console.error('Render loop error:', error);
      }
    };
    
    animate();
  }
  
  /**
   * Handle star data
   */
  _handleStarData(stars) {
    this.starData = stars;
    console.log(`📍 Loaded ${stars.length} stars`);
  }
  
  /**
   * Render stars
   */
  _renderStars(distance, height) {
    if (!this.starData) return [];
    
    return this.starData
      .filter(star => {
        const d = Math.hypot(star.voyageX, star.voyageY, star.voyageZ);
        return d > 0.1 && d < distance + 1000; // Basic frustum culling
      })
      .map(star => ({
        type: 'star',
        position: { x: star.voyageX, y: star.voyageY, z: star.voyageZ },
        color: this._getStarColor(star),
        size: this._getStarSize(star, distance),
        brightness: Math.max(0.1, 1 - star.magnitude / 20),
        glow: star.magnitude < 2 ? 0.5 : 0,
      }));
  }
  
  /**
   * Get star color
   */
  _getStarColor(star) {
    // Simple color by magnitude
    if (star.bprp !== undefined) {
      // Use B-RP color
      const bprp = Math.max(-0.5, Math.min(3, star.bprp));
      const hue = (1 - bprp / 3.5) * 240; // Blue to Red
      const rgb = this._hslToRgb(hue, 100, 50);
      return [rgb.r / 255, rgb.g / 255, rgb.b / 255];
    }
    return [0.8, 0.8, 1.0]; // Default white-blue
  }
  
  /**
   * HSL to RGB conversion
   */
  _hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return {
      r: Math.round(255 * f(0)),
      g: Math.round(255 * f(8)),
      b: Math.round(255 * f(4)),
    };
  }
  
  /**
   * Get star size
   */
  _getStarSize(star, distance) {
    const mag = star.magnitude || 5;
    const size = Math.max(0.5, 3 - mag / 2);
    return size * (50 / Math.max(10, distance));
  }
  
  /**
   * Handle selection changed
   */
  _onSelectionChanged(selection) {
    if (this.options.debugMode) {
      console.log('Selection changed:', selection);
    }
  }
  
  /**
   * Update stats display
   */
  _updateStatsDisplay(stats) {
    if (!this.statsElement) return;
    
    this.statsElement.innerHTML = `
      <div>🎯 FPS: ${stats.fps || 0}</div>
      <div>⏱️  Frame: ${stats.frameTime?.toFixed(1) || 0}ms</div>
      <div>⭐ Stars: ${stats.starCount || 0}</div>
      <div>🌌 DSOs: ${stats.dsoCount || 0}</div>
      <div>📍 Distance: ${stats.cameraDistance?.toFixed(1) || 0} pc</div>
    `;
  }
  
  /**
   * Load stars from backend
   */
  async loadStars(limit = 500) {
    try {
      console.log('📥 Loading stars...');
      const response = await fetch(`/api/voyage/nearby?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      await this.components.voyageScene.loadStars(data.stars || data);
      
      console.log(`✅ Loaded ${(data.stars || data).length} stars`);
      return true;
    } catch (error) {
      console.error('❌ Failed to load stars:', error);
      return false;
    }
  }
  
  /**
   * Load full DSO catalog from backend (110 Messier + 500 NGC).
   * Uses paginated /api/voyage/dsos/all for complete catalog retrieval.
   * Falls back to region query if full catalog endpoint unavailable.
   *
   * @param {Object} options
   * @param {number} options.pageSize   - Objects per request (default 500)
   * @param {Function} options.onProgress - Progress callback (loaded, total)
   */
  async loadDSOs({ pageSize = 500, onProgress } = {}) {
    // Return cached catalog if already loaded
    if (this._dsoCache && this._dsoCache.length > 0) {
      console.log(`📦 Using cached DSO catalog (${this._dsoCache.length} objects)`);
      await this.components.voyageScene.loadDSOs(this._dsoCache);
      return true;
    }

    try {
      console.log('📥 Loading full DSO catalog (110 Messier + 500+ NGC)...');
      const allDSOs = [];
      let skip = 0;
      let hasMore = true;
      let totalCount = null;

      // Paginated load loop
      while (hasMore) {
        const url = `/api/voyage/dsos/all?skip=${skip}&limit=${pageSize}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} from ${url}`);
        }

        const data = await response.json();
        const batch = data.dsos || [];

        allDSOs.push(...batch);

        // Capture total on first page
        if (totalCount === null) {
          totalCount = data.totalCount || batch.length;
        }

        if (onProgress) {
          onProgress(allDSOs.length, totalCount);
        }

        hasMore = data.hasMore === true && batch.length > 0;
        skip += batch.length;

        // Safety cap: never fetch more than 5 000 DSOs in one session
        if (allDSOs.length >= 5000) break;
      }

      if (allDSOs.length === 0) {
        // Graceful fallback: region query for visible objects
        console.warn('⚠️  Full catalog empty — falling back to region query');
        return this._loadDSOsFallback();
      }

      // Cache for subsequent calls
      this._dsoCache = allDSOs;

      // Push to abstract VoyageScene (stats, interaction, LOD)
      await this.components.voyageScene.loadDSOs(allDSOs);

      // Push to Three.js batched GPU renderer (single draw call for all objects)
      if (this.components.threeScene?.setBatchedDSOs) {
        this.components.threeScene.setBatchedDSOs(allDSOs);
      }

      console.log(`✅ DSO catalog loaded: ${allDSOs.length} objects (${
        allDSOs.filter(d => d.messierNumber != null).length} Messier + ${
        allDSOs.filter(d => d.messierNumber == null).length} NGC)`);

      return true;
    } catch (error) {
      console.error('❌ Failed to load DSO catalog:', error);
      // Attempt fallback
      return this._loadDSOsFallback();
    }
  }

  /**
   * Fallback: load region-visible DSOs if full catalog unavailable
   * @private
   */
  async _loadDSOsFallback() {
    try {
      console.log('🔄 Fallback: loading region DSOs...');
      const response = await fetch('/api/voyage/dsos?distance=1000&radius=5000&limit=50');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const dsos = data.dsos || [];
      await this.components.voyageScene.loadDSOs(dsos);
      console.log(`⚠️  Fallback loaded ${dsos.length} DSOs`);
      return dsos.length > 0;
    } catch (err) {
      console.error('❌ Fallback DSO load also failed:', err);
      return false;
    }
  }

  /**
   * Invalidate the in-memory DSO cache (call after catalog re-import)
   */
  clearDSOCache() {
    this._dsoCache = null;
    // Also dispose the GPU batch so next loadDSOs() re-uploads fresh data
    if (this.components.threeScene?._disposeBatchedDSOs) {
      this.components.threeScene._disposeBatchedDSOs();
    }
    console.log('🗑️  DSO cache cleared');
  }
  
  /**
   * Start rendering
   */
  start() {
    this.components.voyageScene.start();
    console.log('▶️  Rendering started');
  }
  
  /**
   * Stop rendering
   */
  stop() {
    this.components.voyageScene.stop();
    console.log('⏹️  Rendering stopped');
  }
  
  /**
   * Resize handler
   */
  onWindowResize() {
    const rect = this.container.getBoundingClientRect();
    this.components.voyageScene.resize(rect.width, rect.height);
    this.components.threeScene.resize(rect.width, rect.height);
  }
  
  /**
   * Get stats
   */
  getStats() {
    return this.components.voyageScene.getStats();
  }
  
  /**
   * Cleanup
   */
  destroy() {
    this.components.voyageScene?.destroy();
    this.components.threeScene?.dispose();
    console.log('🧹 VoyageApp destroyed');
  }
}

/**
 * Initialize app on page load
 */
export async function initializeVoyageApp() {
  try {
    // Create app instance
    const app = new VoyageApp('#voyage-container', {
      deviceProfile: 'medium',
      debugMode: false,
    });
    
    // Initialize
    await app.initialize();
    
    // Load data — full DSO catalog (623 objects) with progress logging
    await app.loadStars(500);
    await app.loadDSOs({
      pageSize: 500,
      onProgress: (loaded, total) => {
        console.log(`📥 DSO loading: ${loaded}/${total}`);
      },
    });
    
    // Start rendering
    app.start();
    
    // Handle resize
    window.addEventListener('resize', () => app.onWindowResize());
    
    // Cleanup on unload
    window.addEventListener('beforeunload', () => app.destroy());
    
    return app;
  } catch (error) {
    console.error('Failed to initialize VoyageApp:', error);
    throw error;
  }
}
