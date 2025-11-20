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
controls.minDistance = 2;
controls.maxDistance = 15;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI;
controls.target.set(0, 0.5, 0);
controls.update();

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
        side: THREE.DoubleSide
      });
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      baseMeshes.push(mesh);
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
      geometry.setAttribute("position", new THREE.BufferAttribute(newPositions, 3));

      mesh.geometry = geometry;
      mesh.material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide, // теперь виден и снаружи, и изнутри
        transparent: true,
        opacity: 0.25, // слегка прозрачный, чтобы не перекрывал золото
        depthWrite: false
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

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();