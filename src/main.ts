import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const scene = new THREE.Scene();

// камера
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 2, 6);
camera.lookAt(0, 0.5, 0);

// рендерер
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x3a2f1d);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// управление камерой
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.enableZoom = false;
controls.target.set(0, 0.5, 0);
controls.update();

let targetRotationX = 0;
let targetRotationY = 0;
let rotationSpeed = 0.003;
let baseRadius = 4;

window.addEventListener("mousemove", (e) => {
  const deltaX = e.movementX || 0;
  const deltaY = e.movementY || 0;

  targetRotationY -= deltaX * rotationSpeed;
  targetRotationX -= deltaY * rotationSpeed;

  targetRotationX = Math.max(
    -Math.PI / 2.5,
    Math.min(Math.PI / 2, targetRotationX)
  );
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
  const aspect = window.innerWidth / window.innerHeight;
  camera.aspect = aspect;
  camera.fov = 60 * (aspect < 1 ? 1.1 : 1);
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// освещение
const ambientLight = new THREE.AmbientLight(0xffe6cc, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xfff2cc, 1.2);
directionalLight.position.set(3, 5, 4);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.bias = -0.0005;
scene.add(directionalLight);

// внутренний свет
const innerLight = new THREE.PointLight(0xffddaa, 0.4, 10);
innerLight.position.set(0, 1, 0);
scene.add(innerLight);

// плоскость
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshStandardMaterial({ color: 0x2a2115, roughness: 0.8 })
);

plane.rotation.x = -Math.PI / 2;
plane.position.y = -0.5;
plane.receiveShadow = true;
scene.add(plane);

let model: THREE.Object3D | null = null;
let baseMeshes: THREE.Mesh[] = [];

const loader = new FBXLoader();
loader.load("/model.fbx", (object) => {
  model = object;
  model.scale.set(0.05, 0.05, 0.05);

  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center);

  // основной материал
  model.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.material = new THREE.MeshPhysicalMaterial({
        color: 0xd4af37,
        metalness: 0.8,
        roughness: 0.3,
        reflectivity: 0.6,
        clearcoat: 0.4,
        clearcoatRoughness: 0.2,
        side: THREE.DoubleSide,
      });
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      baseMeshes.push(mesh);

      const goldColors = [0xb76e79, 0xd4af37, 0xa8c7d8, 0x3a3a3a];
      let currentColorIndex = 1;

      window.addEventListener("click", () => {
        if (!baseMeshes.length) return;

        currentColorIndex = (currentColorIndex + 1) % goldColors.length;
        const newColor = goldColors[currentColorIndex];

        baseMeshes.forEach((mesh) => {
          const mat = mesh.material as THREE.MeshPhysicalMaterial;
          mat.color.setHex(newColor);
        });
      });
    }
  });

  // контур
  const outline = model.clone();
  outline.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const geometry = mesh.geometry.clone();
      geometry.computeVertexNormals();

      const position = geometry.attributes.position;
      const normal = geometry.attributes.normal;
      const offset = 0.03;

      const newPositions = new Float32Array(position.count * 3);
      for (let i = 0; i < position.count; i++) {
        newPositions[i * 3] = position.getX(i) + normal.getX(i) * offset;
        newPositions[i * 3 + 1] = position.getY(i) + normal.getY(i) * offset;
        newPositions[i * 3 + 2] = position.getZ(i) + normal.getZ(i) * offset;
      }
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(newPositions, 3)
      );

      mesh.geometry = geometry;
      mesh.material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
      });
      mesh.renderOrder = 1;
    }
  });

  const group = new THREE.Group();
  group.position.y = 0.5;
  group.add(model);
  group.add(outline);
  scene.add(group);

  const size = box.getSize(new THREE.Vector3()).length();
  camera.position.set(0, 2, size * 0.8);
  camera.lookAt(0, 0.5, 0);

  model = group;
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  updateCameraRotation();
  renderer.render(scene, camera);
}
animate();
