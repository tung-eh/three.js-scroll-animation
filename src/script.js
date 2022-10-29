import "./style.css";
import * as THREE from "three";
import * as dat from "lil-gui";
import gsap from "gsap";

/**
 * Debug
 */
const gui = new dat.GUI();

const parameters = {
  materialColor: "#ffeded",
};

gui.addColor(parameters, "materialColor").onChange(() => {
  material.color.set(parameters.materialColor);
  particlesMaterial.color.set(parameters.materialColor);
});

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/*
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);
*/

/**
 * Objects
 */
// Texture
const textureLoader = new THREE.TextureLoader();
const gradientTexture = textureLoader.load("textures/gradients/3.jpg");
gradientTexture.magFilter = THREE.NearestFilter;

// Material
const material = new THREE.MeshToonMaterial({
  color: parameters.materialColor,
  gradientMap: gradientTexture,
});

// Meshes
const meshes = [
  new THREE.Mesh(new THREE.TorusGeometry(1, 0.4, 16, 60), material),
  new THREE.Mesh(new THREE.ConeGeometry(1, 2, 32), material),
  new THREE.Mesh(new THREE.TorusKnotGeometry(0.8, 0.35, 100, 16), material),
];

const objectGap = 4;
meshes.forEach((mesh, index) => {
  mesh.position.y = -index * objectGap;
  mesh.position.x = 2 * (index % 2 === 0 ? 1 : -1);
});

scene.add(...meshes);

/**
 * Particles
 */
// Geometry
const particleCount = 200;
const positions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 10;
  positions[i * 3 + 1] =
    objectGap * 0.5 - Math.random() * objectGap * meshes.length;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
}

const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positions, 3)
);

// Material
const particlesMaterial = new THREE.PointsMaterial({
  color: parameters.materialColor,
  sizeAttenuation: true,
  size: 0.03,
});

// Points
const particles = new THREE.Points(particlesGeometry, particlesMaterial);

scene.add(particles);

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight("#fff", 1);
directionalLight.position.set(1, 1, 0);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// cameraGroup
const cameraGroup = new THREE.Group();
scene.add(cameraGroup);

// Base camera
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.z = 6;
cameraGroup.add(camera);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Scroll
 */
let currentSection = 0;
window.addEventListener("scroll", () => {
  const nextSection = Math.round(window.scrollY / sizes.height);

  if (currentSection !== nextSection) {
    currentSection = nextSection;

    gsap.to(meshes[currentSection].rotation, {
      duration: 1.5,
      ease: "power2.inOut",
      x: "+=6",
      y: "+=3",
      z: "+=1.5",
    });
  }
});

/**
 * Cursor
 */
const cursor = {
  x: 0,
  y: 0,
};
window.addEventListener("mousemove", (event) => {
  cursor.x = event.clientX / sizes.width - 0.5;
  cursor.y = event.clientY / sizes.height - 0.5;
});

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const calculateMove = (current, destination) => {
  const delta = destination - current;

  return current + 0.05 * delta;
};

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  // Animate camera
  camera.position.y = window.scrollY * -(objectGap / sizes.height);

  const parallaxX = cursor.x * 0.5;
  const parallaxY = -cursor.y * 0.5;

  cameraGroup.position.x +=
    (parallaxX - cameraGroup.position.x) * deltaTime * 5;
  cameraGroup.position.y +=
    (parallaxY - cameraGroup.position.y) * deltaTime * 5;

  // Animate meshes
  for (const mesh of meshes) {
    mesh.rotation.x += deltaTime * 0.2;
    mesh.rotation.y += deltaTime * 0.15;
  }

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
