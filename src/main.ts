import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 4);
camera.lookAt(0, 0.5, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x3a2f1d);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.enableZoom = false;
controls.target.set(0, 0.5, 0);
controls.update();

let targetRotationX = 0;
let targetRotationY = 0;
const rotationSpeed = 0.003;
const baseRadius = 4;

window.addEventListener("mousemove", (e) => {
  const deltaX = e.movementX || 0;
  const deltaY = e.movementY || 0;
  targetRotationY -= deltaX * rotationSpeed;
  targetRotationX -= deltaY * rotationSpeed;
  targetRotationX = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2, targetRotationX));
});

function updateCameraRotation() {
  const radius = baseRadius;
  const x = radius * Math.sin(targetRotationY) * Math.cos(targetRotationX);
  const y = radius * Math.sin(targetRotationX);
  const z = radius * Math.cos(targetRotationY) * Math.cos(targetRotationX);
  camera.position.set(x, y + 1, z);
  camera.lookAt(controls.target);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshBasicMaterial({ color: 0x2a2115 })
);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -0.5;
scene.add(plane);

let model: THREE.Object3D | null = null;
let outerOutline: THREE.Object3D | null = null;
let innerOutline: THREE.Object3D | null = null;
let baseMeshes: THREE.Mesh[] = [];
let isGraphicMode = true;

// источники света
let ambientLight: THREE.AmbientLight | null = null;
let directionalLight: THREE.DirectionalLight | null = null;
let innerLight: THREE.PointLight | null = null;

const loader = new FBXLoader();
loader.load("/model.fbx", (object) => {
  model = object;
  model.scale.set(0.05, 0.05, 0.05);

  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center);

  model.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.material = new THREE.MeshBasicMaterial({
        color: 0x000000,
        side: THREE.FrontSide
      });
      baseMeshes.push(mesh);
    }
  });

  // контуры
  outerOutline = model.clone();
  outerOutline.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const geometry = mesh.geometry.clone();
      geometry.computeVertexNormals();
      const position = geometry.attributes.position;
      const normal = geometry.attributes.normal;
      const offset = 0.12;
      const newPositions = new Float32Array(position.count * 3);
      for (let i = 0; i < position.count; i++) {
        newPositions[i * 3] = position.getX(i) + normal.getX(i) * offset;
        newPositions[i * 3 + 1] = position.getY(i) + normal.getY(i) * offset;
        newPositions[i * 3 + 2] = position.getZ(i) + normal.getZ(i) * offset;
      }
      geometry.setAttribute("position", new THREE.BufferAttribute(newPositions, 3));
      mesh.geometry = geometry;
      mesh.material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide });
    }
  });

  innerOutline = model.clone();
  innerOutline.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const geometry = mesh.geometry.clone();
      geometry.computeVertexNormals();
      const position = geometry.attributes.position;
      const normal = geometry.attributes.normal;
      const offset = -0.09;
      const newPositions = new Float32Array(position.count * 3);
      for (let i = 0; i < position.count; i++) {
        newPositions[i * 3] = position.getX(i) + normal.getX(i) * offset;
        newPositions[i * 3 + 1] = position.getY(i) + normal.getY(i) * offset;
        newPositions[i * 3 + 2] = position.getZ(i) + normal.getZ(i) * offset;
      }
      geometry.setAttribute("position", new THREE.BufferAttribute(newPositions, 3));
      mesh.geometry = geometry;
      mesh.material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.FrontSide });
    }
  });

  const group = new THREE.Group();
  group.position.y = 0.5;
  group.add(model);
  group.add(outerOutline);
  group.add(innerOutline);
  scene.add(group);

  const size = box.getSize(new THREE.Vector3()).length();
  camera.position.set(0, 2, size * 0.9);
  camera.lookAt(0, 0.5, 0);

  model = group;
});

// переключение режимов
window.addEventListener("click", () => {
  isGraphicMode = !isGraphicMode;

  baseMeshes.forEach((mesh) => {
    if (isGraphicMode) {
      mesh.material = new THREE.MeshBasicMaterial({
        color: 0x000000,
        side: THREE.FrontSide
      });
    } else {
      mesh.material = new THREE.MeshPhysicalMaterial({
        color: 0xd4af37,
        metalness: 0.8,
        roughness: 0.3,
        reflectivity: 0.6,
        clearcoat: 0.4,
        clearcoatRoughness: 0.2,
        side: THREE.DoubleSide
      });
    }
  });

  if (isGraphicMode) {
    if (ambientLight) scene.remove(ambientLight);
    if (directionalLight) scene.remove(directionalLight);
    if (innerLight) scene.remove(innerLight);
    if (outerOutline && innerOutline) {
      outerOutline.visible = true;
      innerOutline.visible = true;
    }
    renderer.setClearColor(0x3a2f1d);
  } else {
    ambientLight = new THREE.AmbientLight(0xffe6cc, 0.6);
    directionalLight = new THREE.DirectionalLight(0xfff2cc, 1.2);
    directionalLight.position.set(3, 5, 4);
    innerLight = new THREE.PointLight(0xffddaa, 0.4, 10);
    innerLight.position.set(0, 1, 0);
    scene.add(ambientLight);
    scene.add(directionalLight);
    scene.add(innerLight);
    if (outerOutline && innerOutline) {
      outerOutline.visible = false;
      innerOutline.visible = false;
    }
    renderer.setClearColor(0x1a1208);
  }
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  updateCameraRotation();
  renderer.render(scene, camera);
}
animate();