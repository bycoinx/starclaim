/**
 * P0.8.4 - DSO Interaction & Selection
 * 
 * Ray casting, selection, and info display for DSOs
 */

export class DSOInteraction {
  constructor(options = {}) {
    this.camera = options.camera;
    this.dsos = [];
    this.selectedDSO = null;
    this.hoveredDSO = null;
    this.selectionCallback = options.onSelect || (() => {});
    this.hoverCallback = options.onHover || (() => {});
    this.deselectCallback = options.onDeselect || (() => {});
    
    this.lastRaycastTime = 0;
    this.raycastCooldown = 50;  // ms
  }
  
  /**
   * Set DSO data
   */
  setDSOs(dsoArray) {
    this.dsos = dsoArray || [];
  }
  
  /**
   * Screen coordinates to 3D ray
   */
  screenToRay(screenX, screenY, canvasWidth, canvasHeight) {
    const camera = this.camera;
    if (!camera) return null;
    
    // Normalized device coordinates
    const x = (screenX / canvasWidth) * 2 - 1;
    const y = -(screenY / canvasHeight) * 2 + 1;
    
    // Ray in camera space
    const vFOV = camera.fov * Math.PI / 180;
    const height = 2 * Math.tan(vFOV / 2) * 1;
    const width = height * (canvasWidth / canvasHeight);
    
    const cameraDir = camera.getViewVector();
    const cameraRight = camera.getRightVector();
    
    // Ray direction
    let rayDir = {
      x: cameraDir.x + cameraRight.x * (x * width / 2) + camera.up.x * (y * height / 2),
      y: cameraDir.y + cameraRight.y * (x * width / 2) + camera.up.y * (y * height / 2),
      z: cameraDir.z + cameraRight.z * (x * width / 2) + camera.up.z * (y * height / 2),
    };
    
    // Normalize
    const len = Math.sqrt(rayDir.x**2 + rayDir.y**2 + rayDir.z**2);
    rayDir = { x: rayDir.x/len, y: rayDir.y/len, z: rayDir.z/len };
    
    return {
      origin: { ...camera.position },
      direction: rayDir,
    };
  }
  
  /**
   * Find DSOs near ray
   */
  findDSOsNearRay(ray, maxDistance = 100, maxCount = 5) {
    if (!ray) return [];
    
    const results = [];
    
    for (const dso of this.dsos) {
      if (!dso.voyageX || !dso.voyageY || !dso.voyageZ) continue;
      
      const objPos = {
        x: dso.voyageX,
        y: dso.voyageY,
        z: dso.voyageZ,
      };
      
      // Vector from ray origin to DSO
      const toObj = {
        x: objPos.x - ray.origin.x,
        y: objPos.y - ray.origin.y,
        z: objPos.z - ray.origin.z,
      };
      
      // Project onto ray
      const projLength = toObj.x * ray.direction.x + 
                         toObj.y * ray.direction.y + 
                         toObj.z * ray.direction.z;
      
      if (projLength < 0 || projLength > maxDistance) continue;
      
      // Closest point on ray to DSO
      const closestPoint = {
        x: ray.origin.x + ray.direction.x * projLength,
        y: ray.origin.y + ray.direction.y * projLength,
        z: ray.origin.z + ray.direction.z * projLength,
      };
      
      // Distance from DSO to ray
      const distX = objPos.x - closestPoint.x;
      const distY = objPos.y - closestPoint.y;
      const distZ = objPos.z - closestPoint.z;
      const screenDist = Math.sqrt(distX**2 + distY**2 + distZ**2);
      
      // Accept if within 2x angular size (tolerance)
      const tolerance = (dso.sizeArcmin || 5) * 2;
      if (screenDist < tolerance) {
        results.push({
          dso,
          screenDistance: screenDist,
          distance3D: projLength,
        });
      }
    }
    
    // Sort by screen distance
    results.sort((a, b) => a.screenDistance - b.screenDistance);
    return results.slice(0, maxCount);
  }
  
  /**
   * Handle tap (DSO selection)
   */
  onTap(screenX, screenY, canvasWidth, canvasHeight) {
    // Throttle
    const now = Date.now();
    if (now - this.lastRaycastTime < this.raycastCooldown) return;
    this.lastRaycastTime = now;
    
    // Cast ray
    const ray = this.screenToRay(screenX, screenY, canvasWidth, canvasHeight);
    if (!ray) return;
    
    // Find nearby DSOs
    const nearbyDSOs = this.findDSOsNearRay(ray, 20, 5);
    
    if (nearbyDSOs.length === 0) {
      if (this.selectedDSO) {
        this.selectedDSO = null;
        this.deselectCallback();
      }
      return;
    }
    
    // Select closest
    const selected = nearbyDSOs[0].dso;
    this.selectedDSO = selected;
    this.selectionCallback({
      dso: selected,
      screenDistance: nearbyDSOs[0].screenDistance,
    });
  }
  
  /**
   * Handle mouse move (hover)
   */
  onMouseMove(screenX, screenY, canvasWidth, canvasHeight) {
    const ray = this.screenToRay(screenX, screenY, canvasWidth, canvasHeight);
    if (!ray) return;
    
    const nearbyDSOs = this.findDSOsNearRay(ray, 20, 1);
    const newHovered = nearbyDSOs.length > 0 ? nearbyDSOs[0].dso : null;
    
    if (newHovered !== this.hoveredDSO) {
      this.hoveredDSO = newHovered;
      this.hoverCallback({
        dso: newHovered,
        nearbyCount: nearbyDSOs.length,
      });
    }
  }
  
  /**
   * Get selected DSO
   */
  getSelectedDSO() {
    return this.selectedDSO;
  }
  
  /**
   * Get hovered DSO
   */
  getHoveredDSO() {
    return this.hoveredDSO;
  }
  
  /**
   * Clear selection
   */
  clearSelection() {
    this.selectedDSO = null;
    this.hoveredDSO = null;
  }
  
  /**
   * Set callbacks
   */
  setCallbacks(callbacks) {
    if (callbacks.onSelect) this.selectionCallback = callbacks.onSelect;
    if (callbacks.onHover) this.hoverCallback = callbacks.onHover;
    if (callbacks.onDeselect) this.deselectCallback = callbacks.onDeselect;
  }
}

/**
 * DSO Info Panel
 * 
 * Displays DSO information in UI
 */
export class DSOInfoPanel {
  constructor(options = {}) {
    this.visible = false;
    this.dso = null;
    this.containerElement = options.container;
    this.onWarp = options.onWarp || (() => {});
    this.onInfo = options.onInfo || (() => {});
    this.onFavorite = options.onFavorite || (() => {});
  }
  
  /**
   * Show DSO in panel
   */
  showDSO(dso) {
    this.dso = dso;
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
    this.dso = null;
    
    if (this.containerElement) {
      this.containerElement.style.display = 'none';
    }
  }
  
  /**
   * Render panel HTML
   */
  renderPanel() {
    if (!this.containerElement || !this.dso) return;
    
    const dso = this.dso;
    const designation = this.getDesignation(dso);
    
    // Format distance
    let distanceText = '';
    if (dso.distanceParsec) {
      const dist = dso.distanceParsec;
      if (dist < 1000) {
        distanceText = `${dist.toFixed(0)} pc`;
      } else if (dist < 1000000) {
        distanceText = `${(dist/1000).toFixed(2)} kpc`;
      } else {
        distanceText = `${(dist/1000000).toFixed(2)} Mpc`;
      }
    }
    
    // Format size
    let sizeText = '';
    if (dso.sizeArcmin) {
      sizeText = `${dso.sizeArcmin.toFixed(1)}'`;
    }
    
    const html = `
      <div class="dso-info-panel">
        <h3>${designation}</h3>
        
        <div class="dso-details">
          <div class="detail-row">
            <span class="label">Type:</span>
            <span class="value">${dso.type || 'N/A'}</span>
          </div>
          
          <div class="detail-row">
            <span class="label">Magnitude:</span>
            <span class="value">${(dso.magnitude || 0).toFixed(1)}</span>
          </div>
          
          <div class="detail-row">
            <span class="label">Distance:</span>
            <span class="value">${distanceText || 'Unknown'}</span>
          </div>
          
          ${sizeText ? `
          <div class="detail-row">
            <span class="label">Size:</span>
            <span class="value">${sizeText}</span>
          </div>
          ` : ''}
          
          <div class="detail-row">
            <span class="label">RA / Dec:</span>
            <span class="value">${(dso.raDegrees || 0).toFixed(2)}° / ${(dso.decDegrees || 0).toFixed(2)}°</span>
          </div>
          
          ${dso.constellation ? `
          <div class="detail-row">
            <span class="label">Constellation:</span>
            <span class="value">${dso.constellation}</span>
          </div>
          ` : ''}
          
          ${dso.discovered ? `
          <div class="detail-row">
            <span class="label">Discovered:</span>
            <span class="value">${dso.discovered}${dso.discoverer ? ` (${dso.discoverer})` : ''}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="dso-actions">
          <button class="btn-warp" data-action="warp">Warp</button>
          <button class="btn-info" data-action="info">Info</button>
          <button class="btn-favorite" data-action="favorite">★ Favorite</button>
        </div>
      </div>
    `;
    
    this.containerElement.innerHTML = html;
    this.containerElement.style.display = 'block';
    
    // Event listeners
    this.containerElement.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.handleAction(action);
      });
    });
  }
  
  /**
   * Get DSO designation (M1, NGC 224, etc.)
   */
  getDesignation(dso) {
    if (dso.messierNumber) {
      return `M${dso.messierNumber} - ${dso.commonName || ''}`.trim();
    } else if (dso.ngcNumber) {
      return `NGC ${dso.ngcNumber} - ${dso.commonName || ''}`.trim();
    }
    return dso.commonName || 'Unknown';
  }
  
  /**
   * Handle button clicks
   */
  handleAction(action) {
    if (!this.dso) return;
    
    switch (action) {
      case 'warp':
        this.onWarp(this.dso);
        break;
      case 'info':
        this.onInfo(this.dso);
        break;
      case 'favorite':
        this.onFavorite(this.dso);
        break;
    }
  }
}
