import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
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
let outerOutline: THREE.Group | null = null;
let innerOutline: THREE.Group | null = null;
let baseMeshes: THREE.Mesh[] = [];

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
      mesh.material = new THREE.MeshStandardMaterial({
        color: 0x111111, 
        roughness: 1,
        metalness: 0,
        side: THREE.DoubleSide,
      });
      baseMeshes.push(mesh);
    }
  });

  const outerOutline = model.clone();

  outerOutline.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const geometry = mesh.geometry.clone();
      geometry.computeVertexNormals();
      const position = geometry.attributes.position;
      const normal = geometry.attributes.normal;
      const offset = 0.1;
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
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      });
    }
  });

  const innerOutline = model.clone();
  innerOutline.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const geometry = mesh.geometry.clone();
      geometry.computeVertexNormals();
      const position = geometry.attributes.position;
      const normal = geometry.attributes.normal;
      const offset = -0.08;
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
        side: THREE.FrontSide,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      });
    }
  });

  const softGlow = model.clone();
  softGlow.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const geometry = mesh.geometry.clone();
      geometry.computeVertexNormals();
      const position = geometry.attributes.position;
      const normal = geometry.attributes.normal;
      const offset = 0.06;
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
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
    }
  });

  const group = new THREE.Group();
  group.position.y = 0.5;
  group.add(model);
  group.add(outerOutline);
  group.add(innerOutline);
  group.add(softGlow);
  scene.add(group);

  // камера
  const size = box.getSize(new THREE.Vector3()).length();
  camera.position.set(0, 2, size * 0.9);
  camera.lookAt(0, 0.5, 0);

  renderer.setClearColor(0x5a4a35);

  model = group;
});

let modeIndex = 0;

// переключение цветовых режимов
window.addEventListener("click", () => {
  modeIndex = (modeIndex + 1) % 3;

  if (ambientLight) scene.remove(ambientLight);
  if (directionalLight) scene.remove(directionalLight);
  if (innerLight) scene.remove(innerLight);

  if (modeIndex === 0) {
    baseMeshes.forEach((mesh) => {
      mesh.material = new THREE.MeshBasicMaterial({
        color: 0x000000,
        side: THREE.FrontSide,
      });
    });

    if (outerOutline && innerOutline) {
      (outerOutline as THREE.Object3D).visible = true;
      (innerOutline as THREE.Object3D).visible = true;
    }

    renderer.setClearColor(0x3a2f1d);
  } else if (modeIndex === 1) {
    if (ambientLight) scene.remove(ambientLight);
    if (directionalLight) scene.remove(directionalLight);
    if (innerLight) scene.remove(innerLight);

    ambientLight = new THREE.AmbientLight(0xfaf8f5, 0.15);
    scene.add(ambientLight);

    baseMeshes.forEach((mesh) => {
      mesh.material = new THREE.ShaderMaterial({
        uniforms: {
          colorTop: { value: new THREE.Color(0xe8e8e8) },
          colorBottom: { value: new THREE.Color(0xdedede) },
        },
        vertexShader: `
      varying vec3 vPosition;
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
        fragmentShader: `
      uniform vec3 colorTop;
      uniform vec3 colorBottom;
      varying vec3 vPosition;

      void main() {
        float vertical = smoothstep(-2.0, 4.0, vPosition.y);
        vec3 baseColor = mix(colorBottom, colorTop, vertical);

        float centerShadow = 1.0 - smoothstep(-0.4, 0.4, abs(vPosition.x));
        centerShadow = pow(centerShadow, 3.5);

        float bottomShadow = 1.0 - smoothstep(-1.5, 3.0, vPosition.y);

        float rightDark = smoothstep(0.5, 3.0, vPosition.x);
        float lowerDark = 1.8 - smoothstep(-1.0, 2.5, vPosition.y);
        float diagonalShadow = pow(rightDark * lowerDark, 2.3);

        float depthShadow = smoothstep(1.0, -3.0, vPosition.z);
        depthShadow = pow(depthShadow, 2.0);
        float frontDepth = smoothstep(2.0, -1.0, vPosition.z);
        frontDepth = pow(frontDepth, 1.8);

        float frontShadow = smoothstep(0.5, -1.0, vPosition.z);
        frontShadow = pow(frontShadow, 2.0);

        float shadowMix = clamp(
          centerShadow * 2.0 +
          bottomShadow * 0.7 +
          diagonalShadow * 1.6 +
          depthShadow * 1.8 +
          frontDepth * 1.3 +
          frontShadow * 1.5,
          0.0,
          2.5
        );

        vec3 finalColor = baseColor * (1.0 - 0.1 * shadowMix);

        finalColor = pow(finalColor, vec3(0.99));

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
        side: THREE.DoubleSide,
      });
    });

    if (outerOutline && innerOutline) {
      (outerOutline as THREE.Object3D).traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).material = new THREE.MeshBasicMaterial({
            color: 0x1e1e1e,
            side: THREE.BackSide,
            transparent: false,
            opacity: 1.0,
          });
        }
      });

      (innerOutline as THREE.Object3D).traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).material = new THREE.MeshBasicMaterial({
            color: 0x1e1e1e,
            side: THREE.FrontSide,
            transparent: false,
            opacity: 1.0,
          });
        }
      });
    }

    if (!outerOutline) return;
    const softOutline = (outerOutline as THREE.Object3D).clone();
    softOutline.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const geometry = mesh.geometry.clone();
        geometry.computeVertexNormals();
        const position = geometry.attributes.position;
        const normal = geometry.attributes.normal;
        const offset = 0.05;
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
          color: 0x1e1e1e,
          side: THREE.BackSide,
          transparent: false,
          opacity: 0.1,
          blending: THREE.NormalBlending,
          depthWrite: false,
        });
      }
    });

    if (model) model.add(softOutline);

    renderer.setClearColor(0xf5f4f2);
    scene.fog = new THREE.Fog(0xf5f4f2, 5, 25);

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
  } else if (modeIndex === 2) {
    ambientLight = new THREE.AmbientLight(0xfaf8f5, 0.15);
    scene.add(ambientLight);

    const baseColorTop = new THREE.Color(0xe6e8d6); 
    const baseColorBottom = new THREE.Color(0xe6e8d6);
    const shadowColor = new THREE.Color(0x6b4f2b);

    baseMeshes.forEach((mesh) => {
      mesh.material = new THREE.ShaderMaterial({
        uniforms: {
          colorTop: { value: baseColorTop },
          colorBottom: { value: baseColorBottom },
          shadowColor: { value: shadowColor },
        },
        vertexShader: `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
        fragmentShader: `
        uniform vec3 colorTop;
        uniform vec3 colorBottom;
        uniform vec3 shadowColor;
        varying vec3 vPosition;

        void main() {
          float vertical = smoothstep(-2.0, 4.0, vPosition.y);
          vec3 baseColor = mix(colorBottom, colorTop, vertical);

          float centerShadow = 1.0 - smoothstep(-0.4, 0.4, abs(vPosition.x));
          centerShadow = pow(centerShadow, 3.5);

          float bottomShadow = 1.0 - smoothstep(-1.5, 3.0, vPosition.y);

          float rightDark = smoothstep(0.5, 3.0, vPosition.x);
          float lowerDark = 1.8 - smoothstep(-1.0, 2.5, vPosition.y);
          float diagonalShadow = pow(rightDark * lowerDark, 2.3);

          float depthShadow = smoothstep(1.0, -3.0, vPosition.z);
          depthShadow = pow(depthShadow, 2.0);
          float frontDepth = smoothstep(2.0, -1.0, vPosition.z);
          frontDepth = pow(frontDepth, 1.8);

          float frontShadow = smoothstep(0.5, -1.0, vPosition.z);
          frontShadow = pow(frontShadow, 2.0);

          float shadowMix = clamp(
            centerShadow * 2.0 +
            bottomShadow * 0.7 +
            diagonalShadow * 1.6 +
            depthShadow * 1.8 +
            frontDepth * 1.3 +
            frontShadow * 1.5,
            0.0,
            2.5
          );

          vec3 finalColor = mix(baseColor, shadowColor, shadowMix * 0.22);
          finalColor = pow(finalColor, vec3(0.99));

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
        side: THREE.DoubleSide,
      });
    });

    if (outerOutline && innerOutline) {
      (outerOutline as THREE.Object3D).traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).material = new THREE.MeshBasicMaterial({
            color: 0x1e1e1e,
            side: THREE.BackSide,
            transparent: false,
            opacity: 1.0,
          });
        }
      });
      (innerOutline as THREE.Object3D).traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).material = new THREE.MeshBasicMaterial({
            color: 0x1e1e1e,
            side: THREE.FrontSide,
            transparent: false,
            opacity: 1.0,
          });
        }
      });
    }
  }
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  updateCameraRotation();
  renderer.render(scene, camera);
}
animate();
