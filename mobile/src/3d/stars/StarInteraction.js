/**
 * P0.8.3 - Star Interaction (Selection & Targeting)
 * 
 * Handles ray casting, star selection, and information display
 */

/**
 * Star Interaction Manager
 * 
 * Manages:
 * - Ray casting from camera through screen point
 * - Star selection and highlighting
 * - Information panel updates
 * - Selection state
 */
export class StarInteraction {
  constructor(options = {}) {
    this.camera = options.camera;
    this.stars = []; // Array of star data from backend
    this.selectionRadius = options.selectionRadius || 20; // pixels
    
    // Selection state
    this.selectedStar = null;
    this.hoveredStar = null;
    this.selectionCallback = options.onSelect || (() => {});
    this.hoverCallback = options.onHover || (() => {});
    this.deselectCallback = options.onDeselect || (() => {});
    
    // Interaction state
    this.lastRaycastTime = 0;
    this.raycastCooldown = 50; // ms, prevent excessive raycasts
    this.rayCastDistance = 500; // max distance to check
  }
  
  /**
   * Set star data (from backend query)
   */
  setStars(starArray) {
    this.stars = starArray || [];
  }
  
  /**
   * Screen coordinates to 3D ray in world space
   * 
   * Args:
   *   screenX, screenY: 2D screen coordinates
   *   canvasWidth, canvasHeight: canvas dimensions
   *   
   * Returns: { origin, direction } ray in 3D space
   */
  screenToRay(screenX, screenY, canvasWidth, canvasHeight) {
    const camera = this.camera;
    if (!camera) return null;
    
    // Normalized device coordinates (-1 to +1)
    const x = (screenX / canvasWidth) * 2 - 1;
    const y = -(screenY / canvasHeight) * 2 + 1;
    
    // Ray in camera space
    const vFOV = camera.fov * Math.PI / 180; // Vertical FOV in radians
    const height = 2 * Math.tan(vFOV / 2) * 1; // At distance 1 from camera
    const width = height * (canvasWidth / canvasHeight);
    
    const cameraDir = camera.getViewVector();
    const cameraRight = camera.getRightVector();
    
    // Ray direction
    const rayX = cameraRight.x * (x * width / 2);
    const rayY = camera.up.y * (y * height / 2);
    const rayZ = cameraDir.z;
    
    let rayDir = {
      x: cameraDir.x + rayX + camera.up.x * (y * height / 2),
      y: cameraDir.y + rayY,
      z: cameraDir.z + rayZ + cameraRight.z * (x * width / 2),
    };
    
    // Normalize direction
    const len = Math.sqrt(rayDir.x**2 + rayDir.y**2 + rayDir.z**2);
    rayDir = { x: rayDir.x/len, y: rayDir.y/len, z: rayDir.z/len };
    
    return {
      origin: { ...camera.position },
      direction: rayDir,
    };
  }
  
  /**
   * Find stars near ray (within cone volume)
   * 
   * Args:
   *   ray: { origin, direction }
   *   maxDistance: search radius in parsecs
   *   maxCount: limit results
   *   
   * Returns: [ { star, screenDistance, distance3D }, ... ]
   */
  findStarsNearRay(ray, maxDistance = 100, maxCount = 10) {
    if (!ray) return [];
    
    const results = [];
    
    for (const star of this.stars) {
      if (!star.voyageX || !star.voyageY || !star.voyageZ) continue;
      
      const starPos = {
        x: star.voyageX,
        y: star.voyageY,
        z: star.voyageZ,
      };
      
      // Vector from ray origin to star
      const toStar = {
        x: starPos.x - ray.origin.x,
        y: starPos.y - ray.origin.y,
        z: starPos.z - ray.origin.z,
      };
      
      // Project onto ray
      const projLength = toStar.x * ray.direction.x + 
                         toStar.y * ray.direction.y + 
                         toStar.z * ray.direction.z;
      
      if (projLength < 0 || projLength > maxDistance) continue;
      
      // Find closest point on ray to star
      const closestPoint = {
        x: ray.origin.x + ray.direction.x * projLength,
        y: ray.origin.y + ray.direction.y * projLength,
        z: ray.origin.z + ray.direction.z * projLength,
      };
      
      // Distance from star to ray
      const distX = starPos.x - closestPoint.x;
      const distY = starPos.y - closestPoint.y;
      const distZ = starPos.z - closestPoint.z;
      const screenDist = Math.sqrt(distX**2 + distY**2 + distZ**2);
      
      if (screenDist > maxDistance) continue;
      
      results.push({
        star,
        screenDistance: screenDist,
        distance3D: projLength,
      });
    }
    
    // Sort by screen distance, limit
    results.sort((a, b) => a.screenDistance - b.screenDistance);
    return results.slice(0, maxCount);
  }
  
  /**
   * Handle tap/click on screen (star selection)
   */
  onTap(screenX, screenY, canvasWidth, canvasHeight) {
    // Throttle raycasts
    const now = Date.now();
    if (now - this.lastRaycastTime < this.raycastCooldown) {
      return;
    }
    this.lastRaycastTime = now;
    
    // Cast ray from camera through screen point
    const ray = this.screenToRay(screenX, screenY, canvasWidth, canvasHeight);
    if (!ray) return;
    
    // Find nearby stars
    const nearbyStars = this.findStarsNearRay(ray, 20, 5); // 20 pc radius, top 5
    
    if (nearbyStars.length === 0) {
      // No star selected, deselect current
      if (this.selectedStar) {
        this.selectedStar = null;
        this.deselectCallback();
      }
      return;
    }
    
    // Select closest star
    const selected = nearbyStars[0].star;
    this.selectedStar = selected;
    this.selectionCallback({
      star: selected,
      screenDistance: nearbyStars[0].screenDistance,
    });
  }
  
  /**
   * Handle mouse move (star hover highlighting)
   */
  onMouseMove(screenX, screenY, canvasWidth, canvasHeight) {
    const ray = this.screenToRay(screenX, screenY, canvasWidth, canvasHeight);
    if (!ray) return;
    
    // Find nearby stars
    const nearbyStars = this.findStarsNearRay(ray, 20, 1);
    
    const newHovered = nearbyStars.length > 0 ? nearbyStars[0].star : null;
    
    if (newHovered !== this.hoveredStar) {
      this.hoveredStar = newHovered;
      this.hoverCallback({
        star: newHovered,
        nearbyCount: nearbyStars.length,
      });
    }
  }
  
  /**
   * Get selected star data
   */
  getSelectedStar() {
    return this.selectedStar;
  }
  
  /**
   * Get hovered star data
   */
  getHoveredStar() {
    return this.hoveredStar;
  }
  
  /**
   * Clear selection
   */
  clearSelection() {
    this.selectedStar = null;
    this.hoveredStar = null;
  }
  
  /**
   * Set selection/hover callbacks
   */
  setCallbacks(callbacks) {
    if (callbacks.onSelect) this.selectionCallback = callbacks.onSelect;
    if (callbacks.onHover) this.hoverCallback = callbacks.onHover;
    if (callbacks.onDeselect) this.deselectCallback = callbacks.onDeselect;
  }
}

/**
 * Star Information Panel
 * 
 * Displays:
 * - Star name, spectral type, magnitude
 * - Distance, coordinates
 * - Actions (warp, info, add to favorite)
 */
export class StarInfoPanel {
  constructor(options = {}) {
    this.visible = false;
    this.star = null;
    this.containerElement = options.container;
    this.onWarp = options.onWarp || (() => {});
    this.onInfo = options.onInfo || (() => {});
    this.onFavorite = options.onFavorite || (() => {});
  }
  
  /**
   * Show panel with star data
   */
  showStar(star) {
    this.star = star;
    this.visible = true;
    
    if (this.containerElement) {
      this.renderPanel();
    }
  }
  
  /**
   * Hide panel
   */
  hide() {
    this.visible = false;
    this.star = null;
    
    if (this.containerElement) {
      this.containerElement.style.display = 'none';
    }
  }
  
  /**
   * Render panel content (simple HTML structure)
   */
  renderPanel() {
    if (!this.containerElement || !this.star) return;
    
    const star = this.star;
    
    const html = `
      <div class="star-info-panel">
        <h3>${star.properName || star.displayName || 'Unknown'}</h3>
        
        <div class="star-details">
          <div class="detail-row">
            <span class="label">Type:</span>
            <span class="value">${star.spectralType || 'N/A'}</span>
          </div>
          
          <div class="detail-row">
            <span class="label">Magnitude:</span>
            <span class="value">${(star.magnitude || 0).toFixed(2)}</span>
          </div>
          
          <div class="detail-row">
            <span class="label">Distance:</span>
            <span class="value">${(star.distanceParsec || 0).toFixed(2)} pc</span>
          </div>
          
          <div class="detail-row">
            <span class="label">RA / Dec:</span>
            <span class="value">${(star.raDegrees || 0).toFixed(2)}° / ${(star.decDegrees || 0).toFixed(2)}°</span>
          </div>
          
          ${star.constellation ? `
          <div class="detail-row">
            <span class="label">Constellation:</span>
            <span class="value">${star.constellation}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="star-actions">
          <button class="btn-warp" data-action="warp">Warp</button>
          <button class="btn-info" data-action="info">Info</button>
          <button class="btn-favorite" data-action="favorite">★ Favorite</button>
        </div>
      </div>
    `;
    
    this.containerElement.innerHTML = html;
    this.containerElement.style.display = 'block';
    
    // Attach event listeners
    this.containerElement.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.handleAction(action);
      });
    });
  }
  
  /**
   * Handle panel button clicks
   */
  handleAction(action) {
    if (!this.star) return;
    
    switch (action) {
      case 'warp':
        this.onWarp(this.star);
        break;
      case 'info':
        this.onInfo(this.star);
        break;
      case 'favorite':
        this.onFavorite(this.star);
        break;
    }
  }
  
  /**
   * Format star display name
   */
  formatStarName(star) {
    if (star.properName) return star.properName;
    if (star.displayName) return star.displayName;
    return `${star.source}:${star.sourceId}`;
  }
}

/**
 * Reticle UI (crosshair for selected star)
 */
export class StarReticle {
  constructor(options = {}) {
    this.containerElement = options.container;
    this.visible = false;
    this.position = { x: 0, y: 0 };
    this.color = options.color || '#00f3ff';
  }
  
  /**
   * Show reticle at position
   */
  show(x, y) {
    this.position = { x, y };
    this.visible = true;
    this.render();
  }
  
  /**
   * Hide reticle
   */
  hide() {
    this.visible = false;
    if (this.containerElement) {
      this.containerElement.style.display = 'none';
    }
  }
  
  /**
   * Update position
   */
  updatePosition(x, y) {
    this.position = { x, y };
    if (this.visible) {
      this.render();
    }
  }
  
  /**
   * Render reticle (SVG crosshair)
   */
  render() {
    if (!this.containerElement) return;
    
    const size = 30;
    const thickness = 2;
    const { x, y } = this.position;
    
    const svg = `
      <svg width="100" height="100" style="position: absolute; left: ${x-50}px; top: ${y-50}px; pointer-events: none;">
        <!-- Horizontal line -->
        <line x1="25" y1="50" x2="75" y2="50" stroke="${this.color}" stroke-width="${thickness}" opacity="0.8"/>
        
        <!-- Vertical line -->
        <line x1="50" y1="25" x2="50" y2="75" stroke="${this.color}" stroke-width="${thickness}" opacity="0.8"/>
        
        <!-- Corners -->
        <line x1="35" y1="35" x2="40" y2="35" stroke="${this.color}" stroke-width="${thickness}" opacity="0.6"/>
        <line x1="35" y1="35" x2="35" y2="40" stroke="${this.color}" stroke-width="${thickness}" opacity="0.6"/>
        
        <line x1="65" y1="35" x2="60" y2="35" stroke="${this.color}" stroke-width="${thickness}" opacity="0.6"/>
        <line x1="65" y1="35" x2="65" y2="40" stroke="${this.color}" stroke-width="${thickness}" opacity="0.6"/>
        
        <line x1="35" y1="65" x2="40" y2="65" stroke="${this.color}" stroke-width="${thickness}" opacity="0.6"/>
        <line x1="35" y1="65" x2="35" y2="60" stroke="${this.color}" stroke-width="${thickness}" opacity="0.6"/>
        
        <line x1="65" y1="65" x2="60" y2="65" stroke="${this.color}" stroke-width="${thickness}" opacity="0.6"/>
        <line x1="65" y1="65" x2="65" y2="60" stroke="${this.color}" stroke-width="${thickness}" opacity="0.6"/>
      </svg>
    `;
    
    this.containerElement.innerHTML = svg;
    this.containerElement.style.display = 'block';
  }
}
