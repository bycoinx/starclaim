/**
 * P0.8.3 - Camera Controller
 * 
 * Manages camera movement, gestures, and warp mechanics
 * for 3D voyage scene.
 */

/**
 * Camera Controller for 3D Voyage
 * 
 * Handles:
 * - Free orbit (pan + zoom)
 * - Target lock (smooth approach)
 * - Warp jump (instant teleport + animation)
 * - Gesture input (touch, pinch)
 * - Smooth easing and inertia
 */
export class VoyageCamera {
  constructor(options = {}) {
    // Position in 3D space (parsecs)
    this.position = {
      x: options.initialX || 0,
      y: options.initialY || 0,
      z: options.initialZ || 50,
    };
    
    // Look-at point
    this.target = {
      x: options.targetX || 0,
      y: options.targetY || 0,
      z: options.targetZ || 0,
    };
    
    // Up vector (for rotation)
    this.up = { x: 0, y: 1, z: 0 };
    
    // Camera parameters
    this.fov = options.fov || 45; // Field of view (degrees)
    this.near = options.near || 0.1;
    this.far = options.far || 100000;
    
    // Movement constraints
    this.minDistance = options.minDistance || 0.5;  // Min distance to target
    this.maxDistance = options.maxDistance || 10000; // Max distance from target
    this.minZoom = options.minZoom || 0.1;
    this.maxZoom = options.maxZoom || 10;
    
    // Movement state
    this.mode = 'free'; // 'free', 'lock', 'warp'
    this.isMoving = false;
    this.velocity = { x: 0, y: 0, z: 0 };
    this.friction = options.friction || 0.98; // Inertia decay
    
    // Target lock state
    this.lockTarget = null;
    this.lockDistance = 50;
    this.lockSpeed = options.lockSpeed || 0.3; // Fraction per frame
    
    // Warp state
    this.warpTarget = null;
    this.warpProgress = 0;
    this.warpDuration = 1.5; // seconds
    this.warpCallback = null;
    
    // Performance tracking
    this.frameTimeMs = 16.67;
  }
  
  /**
   * Get current distance from camera to target
   */
  distanceToTarget() {
    const dx = this.target.x - this.position.x;
    const dy = this.target.y - this.position.y;
    const dz = this.target.z - this.position.z;
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
  }
  
  /**
   * Pan camera (move perpendicular to view direction)
   * 
   * Args: deltaX, deltaY in screen coordinates
   * Speed adapted to current distance
   */
  pan(deltaX, deltaY) {
    const distance = this.distanceToTarget();
    const speed = (distance / 100) * 0.5; // Scale by distance
    
    // Convert to world movement
    const viewVector = this.getViewVector();
    const rightVector = this.getRightVector();
    
    // Move in world space
    this.target.x += rightVector.x * deltaX * speed;
    this.target.y += rightVector.y * deltaX * speed;
    this.target.z += rightVector.z * deltaX * speed;
    
    this.target.x += this.up.x * deltaY * speed;
    this.target.y += this.up.y * deltaY * speed;
    this.target.z += this.up.z * deltaY * speed;
    
    this.position.x += this.target.x - this.target.x; // Keep same relative position
    this.position.y += this.target.y - this.target.y;
    this.position.z += this.target.z - this.target.z;
  }
  
  /**
   * Zoom camera (move toward/away from target)
   * 
   * Args: zoomFactor (> 1 = zoom in, < 1 = zoom out)
   */
  zoom(zoomFactor) {
    const distance = this.distanceToTarget();
    let newDistance = distance / zoomFactor;
    
    // Clamp to min/max
    newDistance = Math.max(this.minDistance, Math.min(this.maxDistance, newDistance));
    
    // Move camera toward target
    const viewVector = this.getViewVector();
    this.position.x = this.target.x - viewVector.x * newDistance;
    this.position.y = this.target.y - viewVector.y * newDistance;
    this.position.z = this.target.z - viewVector.z * newDistance;
  }
  
  /**
   * Rotate camera around target (orbit)
   * 
   * Args: deltaYaw, deltaPitch in radians
   */
  orbit(deltaYaw, deltaPitch) {
    // Convert position to spherical coordinates relative to target
    let dx = this.position.x - this.target.x;
    let dy = this.position.y - this.target.y;
    let dz = this.position.z - this.target.z;
    
    let distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
    
    // Current angles
    let yaw = Math.atan2(dz, dx);
    let pitch = Math.asin(dy / distance);
    
    // Apply rotation
    yaw += deltaYaw;
    pitch += deltaPitch;
    
    // Clamp pitch to prevent gimbal lock
    pitch = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, pitch));
    
    // Convert back to Cartesian
    dx = distance * Math.cos(pitch) * Math.cos(yaw);
    dy = distance * Math.sin(pitch);
    dz = distance * Math.cos(pitch) * Math.sin(yaw);
    
    this.position.x = this.target.x + dx;
    this.position.y = this.target.y + dy;
    this.position.z = this.target.z + dz;
  }
  
  /**
   * Start target lock (smooth approach to star)
   */
  lockToTarget(starPosition, distance = 10) {
    this.mode = 'lock';
    this.lockTarget = starPosition;
    this.lockDistance = distance;
    this.isMoving = true;
  }
  
  /**
   * Start warp jump to target
   * 
   * Animation: camera pulls back, screen warp effect, zoom forward
   */
  warpToTarget(starPosition, distance = 10, onComplete = null) {
    this.mode = 'warp';
    this.warpTarget = starPosition;
    this.warpProgress = 0;
    this.warpDuration = 1.5; // seconds
    this.warpCallback = onComplete;
    this.isMoving = true;
  }
  
  /**
   * Update camera state (called each frame)
   * 
   * Args: deltaTime in seconds, frameTimeMs for adaptation
   */
  update(deltaTime, frameTimeMs = null) {
    if (frameTimeMs) {
      this.frameTimeMs = frameTimeMs;
    }
    
    if (this.mode === 'lock') {
      this.updateLockMode(deltaTime);
    } else if (this.mode === 'warp') {
      this.updateWarpMode(deltaTime);
    } else if (this.mode === 'free') {
      this.updateFreeMode(deltaTime);
    }
  }
  
  /**
   * Update free orbit mode (inertia + velocity)
   */
  updateFreeMode(deltaTime) {
    // Apply velocity-based movement
    if (Math.abs(this.velocity.x) > 0.01 || 
        Math.abs(this.velocity.y) > 0.01 || 
        Math.abs(this.velocity.z) > 0.01) {
      
      this.target.x += this.velocity.x * deltaTime;
      this.target.y += this.velocity.y * deltaTime;
      this.target.z += this.velocity.z * deltaTime;
      
      // Apply friction
      this.velocity.x *= this.friction;
      this.velocity.y *= this.friction;
      this.velocity.z *= this.friction;
      
      this.isMoving = true;
    } else {
      this.isMoving = false;
    }
  }
  
  /**
   * Update target lock mode (smooth approach)
   */
  updateLockMode(deltaTime) {
    if (!this.lockTarget) {
      this.mode = 'free';
      return;
    }
    
    // Move toward lock target
    const dx = this.lockTarget.x - this.target.x;
    const dy = this.lockTarget.y - this.target.y;
    const dz = this.lockTarget.z - this.target.z;
    const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
    
    if (distance < 0.1) {
      // Reached target
      this.target.x = this.lockTarget.x;
      this.target.y = this.lockTarget.y;
      this.target.z = this.lockTarget.z;
      this.mode = 'free';
      this.isMoving = false;
      return;
    }
    
    // Move camera toward target at lockSpeed fraction
    const moveDistance = distance * this.lockSpeed;
    const moveX = (dx / distance) * moveDistance;
    const moveY = (dy / distance) * moveDistance;
    const moveZ = (dz / distance) * moveDistance;
    
    this.target.x += moveX;
    this.target.y += moveY;
    this.target.z += moveZ;
    
    // Also zoom to final distance
    const currentDistance = this.distanceToTarget();
    if (currentDistance > this.lockDistance) {
      this.zoom(1.02); // Slight zoom each frame
    }
  }
  
  /**
   * Update warp mode (animated jump)
   * 
   * Animation phases:
   * 0-0.2: Camera pull-back
   * 0.2-0.8: Warp effect / screen flash
   * 0.8-1.0: Zoom forward to target
   */
  updateWarpMode(deltaTime) {
    if (!this.warpTarget) {
      this.mode = 'free';
      return;
    }
    
    // Update progress
    this.warpProgress += deltaTime / this.warpDuration;
    
    if (this.warpProgress >= 1.0) {
      // Warp complete
      this.target.x = this.warpTarget.x;
      this.target.y = this.warpTarget.y;
      this.target.z = this.warpTarget.z;
      
      // Position camera at lockDistance
      const viewVector = this.getViewVector();
      this.position.x = this.target.x - viewVector.x * 10;
      this.position.y = this.target.y - viewVector.y * 10;
      this.position.z = this.target.z - viewVector.z * 10;
      
      this.mode = 'free';
      this.isMoving = false;
      
      if (this.warpCallback) {
        this.warpCallback();
      }
      return;
    }
    
    // Warp animation
    const ease = this.easeInOutQuad(this.warpProgress);
    
    if (this.warpProgress < 0.2) {
      // Pull back phase
      const pullFactor = (this.warpProgress / 0.2) * 0.5; // Pull back 50%
      this.zoom(1.0 + pullFactor);
    } else if (this.warpProgress < 0.8) {
      // Warp phase (position update)
      const warpEase = (this.warpProgress - 0.2) / 0.6;
      this.target.x = this.warpTarget.x * warpEase + this.target.x * (1 - warpEase);
      this.target.y = this.warpTarget.y * warpEase + this.target.y * (1 - warpEase);
      this.target.z = this.warpTarget.z * warpEase + this.target.z * (1 - warpEase);
    } else {
      // Zoom forward phase
      const zoomFactor = 1.0 + ((this.warpProgress - 0.8) / 0.2) * 0.5;
      this.zoom(zoomFactor);
    }
  }
  
  /**
   * Get normalized view direction vector
   */
  getViewVector() {
    const dx = this.target.x - this.position.x;
    const dy = this.target.y - this.position.y;
    const dz = this.target.z - this.position.z;
    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
    
    return {
      x: dx / dist,
      y: dy / dist,
      z: dz / dist,
    };
  }
  
  /**
   * Get normalized right vector (perpendicular to view and up)
   */
  getRightVector() {
    const view = this.getViewVector();
    
    // Cross product: up × view
    const rx = this.up.y * view.z - this.up.z * view.y;
    const ry = this.up.z * view.x - this.up.x * view.z;
    const rz = this.up.x * view.y - this.up.y * view.x;
    
    const dist = Math.sqrt(rx*rx + ry*ry + rz*rz);
    return {
      x: rx / dist,
      y: ry / dist,
      z: rz / dist,
    };
  }
  
  /**
   * Easing function: ease-in-out quadratic
   */
  easeInOutQuad(t) {
    return t < 0.5 ? 2*t*t : -1 + (4-2*t)*t;
  }
  
  /**
   * Get camera state for Three.js/Babylon.js
   */
  getCameraState() {
    return {
      position: { ...this.position },
      target: { ...this.target },
      up: { ...this.up },
      fov: this.fov,
      near: this.near,
      far: this.far,
      mode: this.mode,
      isMoving: this.isMoving,
    };
  }
  
  /**
   * Set camera position directly
   */
  setPosition(x, y, z) {
    this.position = { x, y, z };
  }
  
  /**
   * Set camera target directly
   */
  setTarget(x, y, z) {
    this.target = { x, y, z };
  }
}

/**
 * Gesture Detector for touch input
 * 
 * Detects:
 * - Pan (1-finger drag)
 * - Pinch (2-finger zoom)
 * - Rotate (2-finger twist, optional)
 * - Tap (selection)
 * - Long-tap (context menu)
 * - Double-tap (warp)
 */
export class GestureDetector {
  constructor(options = {}) {
    this.tapThreshold = options.tapThreshold || 10; // px
    this.longTapDelay = options.longTapDelay || 500; // ms
    this.doubleTapDelay = options.doubleTapDelay || 300; // ms
    this.minPinchDistance = options.minPinchDistance || 20; // px
    
    // State
    this.touches = {};
    this.lastTap = 0;
    this.tapCount = 0;
    this.longTapTimer = null;
    this.isPinching = false;
    this.lastPinchDistance = 0;
    
    // Callbacks
    this.onPan = options.onPan || (() => {});
    this.onPinch = options.onPinch || (() => {});
    this.onRotate = options.onRotate || (() => {});
    this.onTap = options.onTap || (() => {});
    this.onLongTap = options.onLongTap || (() => {});
    this.onDoubleTap = options.onDoubleTap || (() => {});
  }
  
  /**
   * Handle touch start
   */
  handleTouchStart(event) {
    const touch = event.touches[0];
    
    // Store touch position
    this.touches.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    
    // Detect long tap
    this.longTapTimer = setTimeout(() => {
      this.onLongTap({
        x: touch.clientX,
        y: touch.clientY,
      });
    }, this.longTapDelay);
    
    // Multi-touch
    if (event.touches.length === 2) {
      const touch2 = event.touches[1];
      this.touches.touch2 = {
        x: touch2.clientX,
        y: touch2.clientY,
      };
      
      // Calculate initial pinch distance
      const dx = touch2.clientX - touch.clientX;
      const dy = touch2.clientY - touch.clientY;
      this.lastPinchDistance = Math.sqrt(dx*dx + dy*dy);
      this.isPinching = true;
    }
  }
  
  /**
   * Handle touch move
   */
  handleTouchMove(event) {
    const touch = event.touches[0];
    
    if (!this.touches.current) return;
    
    const deltaX = touch.clientX - this.touches.current.x;
    const deltaY = touch.clientY - this.touches.current.y;
    const distance = Math.sqrt(deltaX*deltaX + deltaY*deltaY);
    
    // Cancel long tap if moved too much
    if (distance > this.tapThreshold) {
      clearTimeout(this.longTapTimer);
    }
    
    if (event.touches.length === 1) {
      // Pan with single finger
      this.onPan({ deltaX, deltaY });
      
      this.touches.current = {
        x: touch.clientX,
        y: touch.clientY,
      };
    } else if (event.touches.length === 2 && this.isPinching) {
      // Pinch with two fingers
      const touch2 = event.touches[1];
      const dx = touch2.clientX - touch.clientX;
      const dy = touch2.clientY - touch.clientY;
      const pinchDistance = Math.sqrt(dx*dx + dy*dy);
      
      if (Math.abs(pinchDistance - this.lastPinchDistance) > this.minPinchDistance) {
        const scale = pinchDistance / this.lastPinchDistance;
        this.onPinch({ scale });
        this.lastPinchDistance = pinchDistance;
      }
    }
  }
  
  /**
   * Handle touch end
   */
  handleTouchEnd(event) {
    clearTimeout(this.longTapTimer);
    
    const now = Date.now();
    const deltaTime = now - (this.touches.current?.time || 0);
    
    if (this.touches.current && deltaTime < 300) {
      // Quick tap detected
      const tapInterval = now - this.lastTap;
      
      if (tapInterval < this.doubleTapDelay) {
        // Double tap
        this.onDoubleTap({
          x: this.touches.current.x,
          y: this.touches.current.y,
        });
        this.tapCount = 0;
      } else {
        // Single tap
        this.onTap({
          x: this.touches.current.x,
          y: this.touches.current.y,
        });
        this.tapCount = 1;
      }
      
      this.lastTap = now;
    }
    
    this.touches = {};
    this.isPinching = false;
  }
  
  /**
   * Set callbacks
   */
  setCallbacks(callbacks) {
    Object.assign(this, callbacks);
  }
}
