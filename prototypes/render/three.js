import * as THREE from 'three';
import { buildScene, VOXEL, PITCH, YAW, PALETTE, STAR, faceAO, shade } from './voxels.js';

const data = buildScene();
const width = 1280, height = 800;
const renderer = new THREE.WebGLRenderer({
  antialias: true, alpha: true, preserveDrawingBuffer: true
});
renderer.setSize(width, height);
renderer.setPixelRatio(1);
renderer.setClearColor(0, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.querySelector('#stage').append(renderer.domElement);

const scene = new THREE.Scene();
// Shared projection: 5.8 pixels per voxel, looking at this voxel-space target.
const target = new THREE.Vector3(39.5, 7, 39.5).multiplyScalar(VOXEL);
const verticalWorld = height / (5.8 / VOXEL);
const camera = new THREE.OrthographicCamera(
  -verticalWorld * width / height / 2, verticalWorld * width / height / 2,
  verticalWorld / 2, -verticalWorld / 2, 0.1, 100
);
camera.position.copy(target).add(new THREE.Vector3(
  Math.sin(YAW) * Math.cos(PITCH),
  Math.sin(PITCH),
  Math.cos(YAW) * Math.cos(PITCH)
).multiplyScalar(18));
camera.lookAt(target);

// Voxels are unlit (MeshBasicMaterial), so this light only drives the shadow map
// consumed by the ShadowMaterial receivers below. Its colour/intensity do not
// affect voxel colours, so there is no double shading.
const light = new THREE.DirectionalLight(PALETTE.key, 1);
light.position.set(-3, 9, 7);
light.target.position.set(2.5, 0, 2.5);
light.castShadow = true;
light.shadow.mapSize.set(2048, 2048);
Object.assign(light.shadow.camera, {
  left: -4.6, right: 4.6, top: 4.6, bottom: -4.6, near: 0.5, far: 20
});
light.shadow.normalBias = 0.025;
light.shadow.bias = -0.00015;
light.shadow.radius = 3;
scene.add(light, light.target);

// Explicit face factors, defined in sRGB like the Canvas renderer, then converted
// to linear because three multiplies vertex colours in linear space.
// Top gets a faint warm key tint; sides get a faint cool fill tint.
// +Z is screen-left; +X is screen-right at the specified camera yaw.
const KEY = new THREE.Color('#FFF1D6');   // warm key (upper-left)
const FILL = new THREE.Color('#CBBBF0');  // cool fill
const WHITE = new THREE.Color(1, 1, 1);
function faceTint(factor, tint, amount) {
  // Work in sRGB so 0.8 / 0.6 mean "80% / 60% of palette" exactly as in Canvas.
  const t = WHITE.clone().lerp(tint.clone().convertLinearToSRGB(), amount);
  return new THREE.Color().setRGB(
    t.r * factor, t.g * factor, t.b * factor, THREE.SRGBColorSpace
  ); // stored as linear working-space values
}
const TOP = faceTint(1.0, KEY, 0.2);
const LEFT = faceTint(0.8, FILL, 0.15);
const RIGHT = faceTint(0.6, FILL, 0.3);

const geometry = new THREE.BoxGeometry(VOXEL, VOXEL, VOXEL);
const normals = geometry.getAttribute('normal');
const colors = new Float32Array(normals.count * 3);
for (let i = 0; i < normals.count; i++) {
  const c = normals.getY(i) > 0 ? TOP : normals.getZ(i) > 0 ? LEFT : RIGHT;
  colors.set([c.r, c.g, c.b], i * 3);
}
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
const material = new THREE.MeshBasicMaterial({ vertexColors: true });
const mesh = new THREE.InstancedMesh(geometry, material, data.voxels.length);
mesh.castShadow = true;
mesh.receiveShadow = false; // unlit material ignores it; shadows come from receivers
const matrix = new THREE.Matrix4();
const color = new THREE.Color();
for (let i = 0; i < data.voxels.length; i++) {
  const v = data.voxels[i];
  matrix.makeTranslation(v.x * VOXEL, v.y * VOXEL, v.z * VOXEL);
  mesh.setMatrixAt(i, matrix);
  const ao = Math.max(...[[0, 1, 0], [1, 0, 0], [0, 0, 1]]
    .map(n => faceAO(v, n, data.occupancy)));
  color.setHex(shade(v.color, 1, ao)); // sRGB hex -> linear (ColorManagement)
  mesh.setColorAt(i, color);
}
mesh.instanceMatrix.needsUpdate = true;
mesh.instanceColor.needsUpdate = true;
mesh.computeBoundingSphere();
scene.add(mesh);

// A tinted, translucent receiver makes soft shadows lavender rather than black.
// It lies just above the grass, and is clipped out of the sunken path.
const shadowGeometry = new THREE.PlaneGeometry(1, 1);
const shadowMaterial = new THREE.ShadowMaterial({
  color: PALETTE.shadow, opacity: 0.35, depthWrite: false
});
const pathTiles = new Set(['0,1', '1,1', '2,1', '2,2', '2,3', '2,4']);
for (let tx = 0; tx < 5; tx++) for (let tz = 0; tz < 5; tz++) {
  const path = pathTiles.has(`${tx},${tz}`);
  const receiver = new THREE.Mesh(shadowGeometry, shadowMaterial);
  receiver.rotation.x = -Math.PI / 2;
  receiver.position.set((tx * 16 + 7.5) * VOXEL,
    (path ? -1.48 : 0.52) * VOXEL, (tz * 16 + 7.5) * VOXEL);
  receiver.receiveShadow = true;
  scene.add(receiver);
}

function world(p) {
  return new THREE.Vector3(p.x, p.y, p.z).multiplyScalar(VOXEL);
}
function haloTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, '#e5e9ff');
  gradient.addColorStop(0.18, '#7c8cffcc');
  gradient.addColorStop(1, '#7c8cff00');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
const halo = new THREE.Sprite(new THREE.SpriteMaterial({
  map: haloTexture(), blending: THREE.AdditiveBlending,
  depthWrite: false, transparent: true, opacity: 0.85
}));
halo.position.copy(world(data.bulb));
halo.scale.setScalar(13 * VOXEL);
scene.add(halo);

const arcMaterial = new THREE.MeshBasicMaterial({ color: 0xAEB7FF });
const glowMaterial = new THREE.MeshBasicMaterial({
  color: PALETTE.glow, transparent: true, opacity: 0.24,
  blending: THREE.AdditiveBlending, depthWrite: false
});
const unitBox = new THREE.BoxGeometry(1, 1, 1);
for (let i = 1; i < data.arc.length; i++) {
  const a = world(data.arc[i - 1]), b = world(data.arc[i]);
  const direction = b.clone().sub(a);
  for (const [thickness, mat] of [[0.65, arcMaterial], [2.2, glowMaterial]]) {
    const segment = new THREE.Mesh(unitBox, mat);
    segment.position.copy(a).add(b).multiplyScalar(0.5);
    segment.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
    segment.scale.set(thickness * VOXEL, direction.length(), thickness * VOXEL);
    scene.add(segment);
  }
}

const starCanvas = document.createElement('canvas');
starCanvas.width = starCanvas.height = 7;
const starContext = starCanvas.getContext('2d');
for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
  if (STAR[y][x] !== '#') continue;
  starContext.fillStyle = '#2B2338';
  starContext.fillRect(x, y, 3, 3);
}
starContext.fillStyle = '#3FD0F5';
for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
  if (STAR[y][x] === '#') starContext.fillRect(x + 1, y + 1, 1, 1);
}
const starTexture = new THREE.CanvasTexture(starCanvas);
starTexture.magFilter = starTexture.minFilter = THREE.NearestFilter;
starTexture.colorSpace = THREE.SRGBColorSpace;
for (const position of data.stars) {
  const star = new THREE.Sprite(new THREE.SpriteMaterial({
    map: starTexture, transparent: true, alphaTest: 0.5, depthWrite: false
  }));
  star.position.copy(world(position));
  star.scale.setScalar(7 * VOXEL);
  scene.add(star);
}

requestAnimationFrame(() => {
  renderer.render(scene, camera);
  document.querySelector('#status').textContent =
    `${data.voxels.length.toLocaleString()} surface voxels · 1280×800 · 35° pitch / 45° yaw`;
  window.__ready = true;
});
