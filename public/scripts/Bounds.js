import * as THREE from '../build/three.module.js';
export class Bounds {
    constructor(width = 100, height = 100, depth = 100, color = 0xffffff) {
      const geometry = new THREE.BoxGeometry(width, height, depth, 10, 10, 10);
      const material = new THREE.MeshLambertMaterial({
        color: color,
        transparent: true,
        opacity: 0.2,
        wireframe: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending });
  
      this.mesh = new THREE.Mesh(geometry, material);
    }
}

