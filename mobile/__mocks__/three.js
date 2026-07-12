// __mocks__/three.js — minimal Three.js stub for Jest (no WebGL required)

class Vector3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
  clone() { return new Vector3(this.x, this.y, this.z); }
}

class Color {
  constructor(r, g, b) { this.r = r; this.g = g; this.b = b; }
}

class BufferAttribute {
  constructor(array, itemSize) { this.array = array; this.itemSize = itemSize; }
}

class BufferGeometry {
  constructor() { this.attributes = {}; }
  setAttribute(name, attr) { this.attributes[name] = attr; return this; }
  clone() { return new BufferGeometry(); }
  dispose() {}
}

class Material { dispose() {} }
class MeshBasicMaterial extends Material { constructor(o) { super(); Object.assign(this, o); } }
class PointsMaterial   extends Material { constructor(o) { super(); Object.assign(this, o); } }
class SpriteMaterial   extends Material { constructor(o) { super(); Object.assign(this, o); } }
class ShaderMaterial   extends Material {
  constructor(o) { super(); Object.assign(this, o); this.uniforms = o.uniforms || {}; }
}

class Object3D {
  constructor() {
    this.children = [];
    this.position = new Vector3();
    this.scale = new Vector3(1, 1, 1);
  }
  add(child) { this.children.push(child); return this; }
  remove(child) { this.children = this.children.filter(c => c !== child); }
  clear() { this.children = []; }
}

class Mesh extends Object3D { constructor(geo, mat) { super(); this.geometry = geo; this.material = mat; } }
class Points extends Object3D { constructor(geo, mat) { super(); this.geometry = geo; this.material = mat; } }
class Sprite extends Object3D { constructor(mat) { super(); this.material = mat; } }
class Group extends Object3D {}

class Scene extends Object3D {}

class PerspectiveCamera extends Object3D {
  constructor(fov, aspect, near, far) {
    super();
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
    this.up = new Vector3(0, 1, 0);
  }
  updateProjectionMatrix() {}
  lookAt() {}
}

class WebGLRenderer {
  constructor() { this.domElement = document.createElement('canvas'); }
  setSize() {}
  setClearColor() {}
  setPixelRatio() {}
  render() {}
  dispose() {}
}

class CanvasTexture { constructor(canvas) { this.image = canvas; } dispose() {} }
class SphereGeometry extends BufferGeometry {}
class PlaneGeometry  extends BufferGeometry {}
class AmbientLight     extends Object3D { constructor(color, intensity) { super(); } }
class DirectionalLight extends Object3D { constructor(color, intensity) { super(); } }

class Raycaster {
  setFromCamera() {}
  intersectObjects() { return []; }
}

const AdditiveBlending = 2;
const NormalBlending   = 1;

module.exports = {
  Vector3, Color,
  BufferAttribute, BufferGeometry,
  Material, MeshBasicMaterial, PointsMaterial, SpriteMaterial, ShaderMaterial,
  Object3D, Mesh, Points, Sprite, Group, Scene,
  PerspectiveCamera, WebGLRenderer,
  CanvasTexture, SphereGeometry, PlaneGeometry,
  AmbientLight, DirectionalLight,
  Raycaster,
  AdditiveBlending, NormalBlending,
};
