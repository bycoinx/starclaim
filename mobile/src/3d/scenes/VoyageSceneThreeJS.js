/**
 * P0.8.4b - Three.js Integration
 * 
 * Maps VoyageScene render objects to Three.js meshes
 * Framework-specific implementation for Three.js
 */

import * as THREE from 'three';

export class VoyageSceneThreeJS {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      45,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000000
    );
    this.renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: true,
      powerPreference: 'high-performance'
    });
    
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setClearColor(0x000000);
    
    // Material caches
    this.starMaterials = new Map();
    this.dsoMaterials = new Map();
    
    // Render object groups
    this.starGroup = new THREE.Group();
    this.dsoGroup = new THREE.Group();
    this.scene.add(this.starGroup);
    this.scene.add(this.dsoGroup);
    
    // Background
    this._setupBackground();
    
    // Lighting
    this._setupLighting();
  }
  
  /**
   * Setup background (starfield)
   */
  _setupBackground() {
    // Create a simple gradient background
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(256, 256, 100, 256, 256, 512);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#0f0f1e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    const texture = new THREE.CanvasTexture(canvas);
    const skyGeometry = new THREE.SphereGeometry(500000, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({ map: texture });
    const skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
    
    this.scene.add(skyMesh);
  }
  
  /**
   * Setup lighting (ambient + distant)
   */
  _setupLighting() {
    // Ambient light for general illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    // Distant light for depth
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight.position.set(1000, 1000, 1000);
    this.scene.add(directionalLight);
  }
  
  /**
   * Render star from VoyageScene render object
   */
  renderStar(renderObj) {
    if (!renderObj || renderObj.type !== 'star') return null;
    
    try {
      let mesh = null;
      
      switch (renderObj.type) {
        case 'star':
          mesh = this._createStarMesh(renderObj);
          break;
      }
      
      if (mesh) {
        mesh.position.set(renderObj.position.x, renderObj.position.y, renderObj.position.z);
        this.starGroup.add(mesh);
      }
      
      return mesh;
    } catch (error) {
      console.error('Error rendering star:', error);
      return null;
    }
  }
  
  /**
   * Render DSO from VoyageScene render object
   */
  renderDSO(renderObj) {
    if (!renderObj || renderObj.type === undefined) return null;
    
    try {
      let mesh = null;
      
      switch (renderObj.type) {
        case 'billboard':
          mesh = this._createBillboardMesh(renderObj);
          break;
        case 'point':
          mesh = this._createPointMesh(renderObj);
          break;
      }
      
      if (mesh) {
        mesh.position.set(renderObj.position.x, renderObj.position.y, renderObj.position.z);
        this.dsoGroup.add(mesh);
      }
      
      return mesh;
    } catch (error) {
      console.error('Error rendering DSO:', error);
      return null;
    }
  }
  
  /**
   * Create star mesh (colored point with glow)
   */
  _createStarMesh(renderObj) {
    // Create point sprite
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array([0, 0, 0]);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Get or create material
    const colorKey = renderObj.color.join(',');
    let material = this.starMaterials.get(colorKey);
    
    if (!material) {
      const [r, g, b] = renderObj.color;
      material = new THREE.PointsMaterial({
        color: new THREE.Color(r, g, b),
        size: renderObj.size || 1,
        sizeAttenuation: true,
      });
      this.starMaterials.set(colorKey, material);
    }
    
    const points = new THREE.Points(geometry, material);
    
    // Add glow if available
    if (renderObj.glow > 0) {
      this._addGlow(points, renderObj);
    }
    
    return points;
  }
  
  /**
   * Create billboard mesh (textured quad)
   */
  _createBillboardMesh(renderObj) {
    const size = renderObj.size || 1;
    
    // Create billboard geometry (always faces camera)
    const geometry = new THREE.PlaneGeometry(size, size);
    
    // Create material
    const [r, g, b] = renderObj.color;
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(r, g, b),
      transparent: true,
      opacity: renderObj.brightness,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Billboard shader would make it face camera
    // For now, use sprite which is camera-facing by default
    const spriteMap = new THREE.CanvasTexture(this._createDSOTexture(renderObj));
    const spriteMaterial = new THREE.SpriteMaterial({ 
      map: spriteMap,
      color: new THREE.Color(r, g, b),
      opacity: renderObj.brightness,
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(size, size, 1);
    
    return sprite;
  }
  
  /**
   * Create point mesh (small vertex)
   */
  _createPointMesh(renderObj) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array([0, 0, 0]);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const [r, g, b] = renderObj.color;
    const material = new THREE.PointsMaterial({
      color: new THREE.Color(r, g, b),
      size: renderObj.pointSize || 0.5,
      sizeAttenuation: true,
    });
    
    const points = new THREE.Points(geometry, material);
    return points;
  }
  
  /**
   * Create DSO texture (procedural)
   */
  _createDSOTexture(renderObj) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    
    const ctx = canvas.getContext('2d');
    const [r, g, b] = renderObj.color;
    const rgbColor = `rgb(${Math.round(r*255)},${Math.round(g*255)},${Math.round(b*255)})`;
    
    // Draw radial gradient (nebula-like)
    const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
    gradient.addColorStop(0, rgbColor);
    gradient.addColorStop(0.5, rgbColor + 'cc');
    gradient.addColorStop(1, rgbColor + '33');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    return canvas;
  }
  
  /**
   * Add glow effect
   */
  _addGlow(mesh, renderObj) {
    // Using post-processing bloom would be more efficient
    // For now, just scale up and add semi-transparent material
    
    const glowGeometry = mesh.geometry.clone();
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(...renderObj.color),
      transparent: true,
      opacity: renderObj.glow * 0.3,
      wireframe: false,
    });
    
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.scale.multiplyScalar(1.5);
    mesh.add(glowMesh);
  }
  
  /**
   * Update camera from VoyageCamera state
   */
  updateCamera(cameraState) {
    if (!cameraState) return;
    
    // Update Three.js camera
    this.camera.position.set(
      cameraState.position.x,
      cameraState.position.y,
      cameraState.position.z
    );
    
    this.camera.lookAt(
      cameraState.target.x,
      cameraState.target.y,
      cameraState.target.z
    );
    
    this.camera.up.set(
      cameraState.up.x,
      cameraState.up.y,
      cameraState.up.z
    );
    
    this.camera.fov = cameraState.fov;
    this.camera.updateProjectionMatrix();
  }
  
  /**
   * Render frame
   */
  render() {
    this.renderer.render(this.scene, this.camera);
  }
  
  /**
   * Clear scene
   */
  clearStars() {
    this.starGroup.clear();
  }
  
  clearDSOs() {
    this.dsoGroup.clear();
  }
  
  /**
   * Get render object from screen coordinates (raycasting)
   */
  getObjectAtScreenCoordinates(screenX, screenY) {
    const raycaster = new THREE.Raycaster();
    
    // Convert screen coordinates to normalized device coordinates
    const x = (screenX / this.canvas.clientWidth) * 2 - 1;
    const y = -(screenY / this.canvas.clientHeight) * 2 + 1;
    
    // Update raycaster with camera and coordinates
    raycaster.setFromCamera({ x, y }, this.camera);
    
    // Check intersection with all objects
    const allObjects = [...this.starGroup.children, ...this.dsoGroup.children];
    const intersects = raycaster.intersectObjects(allObjects);
    
    if (intersects.length > 0) {
      return intersects[0].object;
    }
    
    return null;
  }
  
  /**
   * Resize handler
   */
  resize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  
  /**
   * Cleanup
   */
  dispose() {
    this.starGroup.clear();
    this.dsoGroup.clear();
    this._disposeBatchedDSOs();
    this.starMaterials.forEach(mat => mat.dispose());
    this.dsoMaterials.forEach(mat => mat.dispose());
    this.renderer.dispose();
  }

  // -----------------------------------------------------------------------
  // P0.8.5b — Batched DSO Rendering
  // Replaces the per-frame clearDSOs()+renderDSO() loop with a single GPU
  // draw call using BufferGeometry. Dramatically reduces draw calls when
  // rendering 600+ DSOs simultaneously.
  // -----------------------------------------------------------------------

  /**
   * Load the full DSO catalog as a single batched Points object.
   * Call once after catalog is fetched — NOT on every frame.
   *
   * @param {Array} dsos - Array of DSO objects from /api/voyage/dsos/all
   */
  setBatchedDSOs(dsos) {
    // Remove previous batch
    this._disposeBatchedDSOs();

    if (!dsos || dsos.length === 0) return;

    const count = dsos.length;

    // Flat arrays for BufferGeometry attributes
    const positions = new Float32Array(count * 3);
    const colors    = new Float32Array(count * 3);
    const sizes     = new Float32Array(count);

    dsos.forEach((dso, i) => {
      // Position (voyageX/Y/Z are Cartesian parsecs)
      positions[i * 3]     = dso.voyageX || 0;
      positions[i * 3 + 1] = dso.voyageY || 0;
      positions[i * 3 + 2] = dso.voyageZ || 0;

      // Color  [r, g, b] each in 0-1
      const [r = 0.8, g = 0.8, b = 1.0] = dso.color || [];
      colors[i * 3]     = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;

      // Point size based on magnitude (brighter → larger)
      const mag = dso.magnitude ?? 10;
      sizes[i] = Math.max(1, Math.min(12, 14 - mag));
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color',    new THREE.BufferAttribute(colors,    3));
    geometry.setAttribute('size',     new THREE.BufferAttribute(sizes,     1));

    // Custom shader material for per-point size & color
    const material = new THREE.ShaderMaterial({
      uniforms: {
        opacity: { value: 0.9 },
      },
      vertexShader: /* glsl */`
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */`
        uniform float opacity;
        varying vec3 vColor;
        void main() {
          // Circular soft point
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = opacity * (1.0 - dist * 2.0);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this._batchedDSOPoints = new THREE.Points(geometry, material);
    this._batchedDSOCount  = count;
    this.scene.add(this._batchedDSOPoints);

    console.log(`✅ Batched DSO render: ${count} objects in 1 draw call`);
  }

  /**
   * Dispose the current batched DSO geometry (call before loading new catalog)
   * @private
   */
  _disposeBatchedDSOs() {
    if (this._batchedDSOPoints) {
      this._batchedDSOPoints.geometry.dispose();
      this._batchedDSOPoints.material.dispose();
      this.scene.remove(this._batchedDSOPoints);
      this._batchedDSOPoints = null;
      this._batchedDSOCount  = 0;
    }
  }

  /**
   * Returns the number of DSOs currently in the batched render.
   */
  getBatchedDSOCount() {
    return this._batchedDSOCount || 0;
  }
}
