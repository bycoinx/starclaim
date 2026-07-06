/**
 * P0.8.4b - VoyageScene
 * 
 * Unified 3D scene orchestration for Celestia-like star journey
 * 
 * Combines:
 * - Star field rendering (P0.8.2)
 * - DSO rendering (P0.8.4a)
 * - Camera control (P0.8.3)
 * - Unified selection system
 * - Gesture handling
 */

export class VoyageScene {
  constructor(options = {}) {
    this.canvas = options.canvas;
    this.width = this.canvas?.width || 1024;
    this.height = this.canvas?.height || 768;
    
    // Scene components
    this.camera = options.camera;
    this.starRenderer = options.starRenderer;
    this.dsoRenderer = options.dsoRenderer;
    this.starInteraction = options.starInteraction;
    this.dsoInteraction = options.dsoInteraction;
    this.gestureDetector = options.gestureDetector;
    
    // Three.js/Babylon scene objects
    this.scene = null;
    this.renderer3D = null;
    this.sceneObjects = {
      stars: [],
      dsos: [],
      background: null,
      ui: null,
    };
    
    // State
    this.isRunning = false;
    this.frameTime = 0;
    this.lastFrameTime = Date.now();
    this.fps = 60;
    this.stats = {
      starCount: 0,
      dsoCount: 0,
      fps: 60,
      frameTime: 0,
    };
    
    // UI elements
    this.infoPanel = options.infoPanel;
    this.reticle = options.reticle;
    
    // Callbacks
    this.onSelectionChanged = options.onSelectionChanged || (() => {});
    this.onCameraChanged = options.onCameraChanged || (() => {});
  }
  
  /**
   * Initialize 3D renderer (Three.js or Babylon.js)
   * For now, using abstract interface - framework agnostic
   */
  async initialize() {
    console.log('Initializing VoyageScene...');
    
    // In production, would initialize Three.js or Babylon.js here
    // For now, we provide an abstract interface
    
    if (!this.canvas) {
      throw new Error('Canvas element required');
    }
    
    // Set up gesture detection on canvas
    this._setupGestureHandling();
    
    // Set up interaction callbacks
    this._setupInteractionCallbacks();
    
    console.log('✓ VoyageScene initialized');
  }
  
  /**
   * Load star data for rendering
   */
  async loadStars(starData) {
    if (!this.starRenderer) {
      console.warn('Star renderer not initialized');
      return;
    }
    
    try {
      // Pass stars to renderer
      this.starRenderer.setStars(starData);
      this.stats.starCount = starData.length;
      
      console.log(`✓ Loaded ${starData.length} stars`);
    } catch (error) {
      console.error('Failed to load stars:', error);
    }
  }
  
  /**
   * Load DSO data for rendering
   */
  async loadDSOs(dsoData) {
    // Always update the stat count — even if the renderer doesn't have setDSOs yet
    this._dsoData = dsoData;
    this.stats.dsoCount = dsoData.length;

    if (this.dsoRenderer) {
      try {
        // setDSOs is optional; DSORender stores data internally
        if (typeof this.dsoRenderer.setDSOs === 'function') {
          this.dsoRenderer.setDSOs(dsoData);
        } else {
          // Fallback: store on renderer for use in renderFrame
          this.dsoRenderer.visibleDSOs = dsoData;
        }
      } catch (error) {
        console.error('Failed to pass DSOs to renderer:', error);
      }
    }

    console.log(`✓ Loaded ${dsoData.length} DSOs`);
  }
  
  /**
   * Main render loop
   */
  render() {
    if (!this.isRunning) return;
    
    // Calculate frame time
    const now = Date.now();
    this.frameTime = (now - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = now;
    
    // Update camera
    if (this.camera) {
      this.camera.update(this.frameTime);
    }
    
    // Render stars
    if (this.starRenderer) {
      try {
        const starRenderObjects = this.starRenderer.renderFrame(
          this.camera.distance,
          this.height
        );
        this._updateStarObjects(starRenderObjects);
      } catch (error) {
        console.error('Star rendering error:', error);
      }
    }
    
    // Render DSOs
    if (this.dsoRenderer) {
      try {
        const dsoRenderObjects = this.dsoRenderer.renderFrame(
          this.camera.distance,
          this.height
        );
        this._updateDSOObjects(dsoRenderObjects);
      } catch (error) {
        console.error('DSO rendering error:', error);
      }
    }
    
    // Update adaptive quality based on frame time
    if (this.starRenderer?.lodManager) {
      this.starRenderer.lodManager.updateFrameTiming(this.frameTime * 1000);
    }
    if (this.dsoRenderer?.lodManager) {
      this.dsoRenderer.lodManager.updateFrameTiming(this.frameTime * 1000);
    }
    
    // Update stats
    this.fps = this.frameTime > 0 ? 1 / this.frameTime : 0;
    this.stats.frameTime = this.frameTime * 1000; // ms
    this.stats.fps = Math.round(this.fps);
    
    // Schedule next frame
    requestAnimationFrame(() => this.render());
  }
  
  /**
   * Start rendering loop
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFrameTime = Date.now();
    this.render();
    
    console.log('✓ VoyageScene rendering started');
  }
  
  /**
   * Stop rendering loop
   */
  stop() {
    this.isRunning = false;
    console.log('✓ VoyageScene rendering stopped');
  }
  
  /**
   * Setup gesture handling
   */
  _setupGestureHandling() {
    if (!this.gestureDetector) return;
    
    // Pan gesture - camera pan
    this.gestureDetector.onPan = ({ deltaX, deltaY }) => {
      if (this.camera) {
        this.camera.pan(deltaX, deltaY);
      }
    };
    
    // Pinch gesture - camera zoom
    this.gestureDetector.onPinch = ({ scale }) => {
      if (this.camera) {
        this.camera.zoom(scale);
      }
    };
    
    // Tap gesture - select star/DSO
    this.gestureDetector.onTap = ({ x, y }) => {
      this._handleTapSelection(x, y);
    };
    
    // Double tap - zoom to selected
    this.gestureDetector.onDoubleTap = ({ x, y }) => {
      this._handleDoubleTapZoom(x, y);
    };
    
    // Long tap - context menu (future)
    this.gestureDetector.onLongTap = ({ x, y }) => {
      // Could open context menu or additional info
    };
  }
  
  /**
   * Setup interaction callbacks
   */
  _setupInteractionCallbacks() {
    // Star selection
    if (this.starInteraction) {
      this.starInteraction.setCallbacks({
        onSelect: (data) => {
          this._onStarSelected(data);
        },
        onHover: (data) => {
          this._onStarHovered(data);
        },
        onDeselect: () => {
          this._onDeselected();
        },
      });
    }
    
    // DSO selection
    if (this.dsoInteraction) {
      this.dsoInteraction.setCallbacks({
        onSelect: (data) => {
          this._onDSOSelected(data);
        },
        onHover: (data) => {
          this._onDSOHovered(data);
        },
        onDeselect: () => {
          this._onDeselected();
        },
      });
    }
  }
  
  /**
   * Handle tap selection (star or DSO)
   */
  _handleTapSelection(screenX, screenY) {
    // Try star first
    if (this.starInteraction) {
      this.starInteraction.onTap(screenX, screenY, this.width, this.height);
      const selected = this.starInteraction.getSelectedStar();
      if (selected) return;
    }
    
    // Then try DSO
    if (this.dsoInteraction) {
      this.dsoInteraction.onTap(screenX, screenY, this.width, this.height);
      const selected = this.dsoInteraction.getSelectedDSO();
      if (selected) return;
    }
  }
  
  /**
   * Handle double tap (zoom to selection)
   */
  _handleDoubleTapZoom(screenX, screenY) {
    let targetPosition = null;
    
    // Check if we have a selected star
    if (this.starInteraction) {
      const selected = this.starInteraction.getSelectedStar();
      if (selected && selected.voyageX !== undefined) {
        targetPosition = {
          x: selected.voyageX,
          y: selected.voyageY,
          z: selected.voyageZ,
        };
      }
    }
    
    // Check if we have a selected DSO
    if (!targetPosition && this.dsoInteraction) {
      const selected = this.dsoInteraction.getSelectedDSO();
      if (selected && selected.voyageX !== undefined) {
        targetPosition = {
          x: selected.voyageX,
          y: selected.voyageY,
          z: selected.voyageZ,
        };
      }
    }
    
    // Warp to target
    if (targetPosition && this.camera) {
      this.camera.warpToTarget(targetPosition, 50, () => {
        console.log('Warp complete');
      });
    }
  }
  
  /**
   * Handle star selection
   */
  _onStarSelected(data) {
    console.log('Star selected:', data.star.displayName);
    
    if (this.infoPanel) {
      this.infoPanel.showStar(data.star);
    }
    
    if (this.reticle) {
      this.reticle.show(0, 0); // Screen position would be from interaction
    }
    
    this.onSelectionChanged({
      type: 'star',
      object: data.star,
    });
  }
  
  /**
   * Handle DSO selection
   */
  _onDSOSelected(data) {
    console.log('DSO selected:', data.dso.commonName);
    
    if (this.infoPanel) {
      this.infoPanel.showDSO(data.dso);
    }
    
    if (this.reticle) {
      this.reticle.show(0, 0); // Screen position would be from interaction
    }
    
    this.onSelectionChanged({
      type: 'dso',
      object: data.dso,
    });
  }
  
  /**
   * Handle star hover
   */
  _onStarHovered(data) {
    if (data.star) {
      console.log('Star hovered:', data.star.displayName);
    }
  }
  
  /**
   * Handle DSO hover
   */
  _onDSOHovered(data) {
    if (data.dso) {
      console.log('DSO hovered:', data.dso.commonName);
    }
  }
  
  /**
   * Handle deselection
   */
  _onDeselected() {
    if (this.infoPanel) {
      this.infoPanel.hide();
    }
    
    if (this.reticle) {
      this.reticle.hide();
    }
    
    this.onSelectionChanged({
      type: null,
      object: null,
    });
  }
  
  /**
   * Update star 3D objects (Three.js/Babylon)
   */
  _updateStarObjects(starRenderObjects) {
    // In production, would map render objects to Three.js/Babylon meshes
    // For now, just track the objects
    this.sceneObjects.stars = starRenderObjects;
  }
  
  /**
   * Update DSO 3D objects (Three.js/Babylon)
   */
  _updateDSOObjects(dsoRenderObjects) {
    // In production, would map render objects to Three.js/Babylon meshes
    // For now, just track the objects
    this.sceneObjects.dsos = dsoRenderObjects;
  }
  
  /**
   * Get scene statistics
   */
  getStats() {
    return {
      ...this.stats,
      starRenderables: this.sceneObjects.stars.length,
      dsoRenderables: this.sceneObjects.dsos.length,
      cameraDistance: this.camera?.distance || 0,
      cameraPosition: this.camera?.position || { x: 0, y: 0, z: 0 },
    };
  }
  
  /**
   * Export camera state for framework integration
   */
  getCameraState() {
    if (!this.camera) return null;
    
    return {
      position: this.camera.position,
      target: this.camera.target,
      up: this.camera.up,
      fov: this.camera.fov,
      distance: this.camera.distance,
      yaw: this.camera.yaw,
      pitch: this.camera.pitch,
    };
  }
  
  /**
   * Resize handler
   */
  resize(width, height) {
    this.width = width;
    this.height = height;
    
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }
  
  /**
   * Cleanup
   */
  destroy() {
    this.stop();
    
    // Clean up resources
    this.sceneObjects.stars = [];
    this.sceneObjects.dsos = [];
    this.sceneObjects.background = null;
    
    console.log('✓ VoyageScene destroyed');
  }
}
