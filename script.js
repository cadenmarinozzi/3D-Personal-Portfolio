import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import earthShaders from "./models/Earth/shaders.js";
import sunShaders from "./models/Sun/shaders.js";

const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer();

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

class Camera {
  constructor(fov = 40) {
    this.camera = new THREE.PerspectiveCamera(
      fov,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.camera.position.z = 50;

    this.controls = new OrbitControls(this.camera, renderer.domElement);

    this.controls.maxDistance = 200;
    this.controls.minDistance = 20;

    this.controls.enablePan = false;
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }
}

const camera = new Camera();

function resize() {
  camera.resize();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", resize);

let zoomToObject;

// Utils
function getCenterPoint(object) {
  const geometry = object.geometry;
  geometry.computeBoundingBox();

  const center = new THREE.Vector3();
  geometry.boundingBox.getCenter(center);
  object.localToWorld(center);

  return center;
}

function pointToScreen(point) {
  const vector = new THREE.Vector3();

  const halfWidth = 0.5 * window.innerWidth;
  const halfHeight = 0.5 * window.innerHeight;

  vector.copy(point);
  vector.project(camera.camera);

  vector.x = vector.x * halfWidth + halfWidth;
  vector.y = -(vector.y * halfHeight) + halfHeight;

  return vector;
}

function createObjectLabel(object) {
  const label = document.createElement("div");
  label.className = "label";
  label.innerText = object.page;

  document.body.appendChild(label);

  return label;
}

function addObjectClickListener(object) {
  object.label.addEventListener("click", () => {
    zoomToObject = object;

    if (camera.controls.minDistance > camera.controls.maxDistance) {
      camera.controls.maxDistance = camera.controls.minDistance;
    } else {
      camera.controls.minDistance = camera.controls.maxDistance;
    }
  });
}

// Load models
let objects = {
  Earth: {
    name: "Earth",
    page: "Home",
    heightOffset: 13,
    position: new THREE.Vector3(0, 0, 0),
  },
  Sun: {
    name: "Sun",
    page: "Projects",
    heightOffset: 90,
    position: new THREE.Vector3(200, 0, 0),
  },
  Moon: {
    name: "Moon",
    page: "About",
    heightOffset: 3,
    position: new THREE.Vector3(20, 0, 0),
  },
};

const modelLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

modelLoader.load("models/Moon/Moon.gltf", (gltf) => {
  const model = gltf.scene.children[0];
  model.position.set(
    objects.Moon.position.x,
    objects.Moon.position.y,
    objects.Moon.position.z
  );

  const mapTexture = textureLoader.load("models/Moon/textures/MoonMap.png");
  const bumpTexture = textureLoader.load("models/Moon/textures/MoonBump.png");

  const material = new THREE.MeshPhongMaterial({
    map: mapTexture,
    bumpMap: bumpTexture,
    bumpScale: 0.5,
  });

  model.material = material;

  scene.add(model);

  objects.Moon.models = model;

  const moonLabel = createObjectLabel(objects.Moon);
  objects.Moon.label = moonLabel;

  addObjectClickListener(objects.Moon);
});

modelLoader.load("models/Earth/Earth.gltf", (gltf) => {
  const model = gltf.scene.children[0];
  model.position.set(
    objects.Earth.position.x,
    objects.Earth.position.y,
    objects.Earth.position.z
  );

  const mapTexture = textureLoader.load("models/Earth/textures/EarthMap.jpg");
  const bumpTexture = textureLoader.load("models/Earth/textures/EarthBump.jpg");
  const emissiveTexture = textureLoader.load(
    "models/Earth/textures/EarthLights.png"
  );
  const specularTexture = textureLoader.load(
    "models/Earth/textures/EarthOceanMask.png"
  );

  const material = new THREE.MeshPhongMaterial({
    map: mapTexture,
    bumpMap: bumpTexture,
    emissiveMap: emissiveTexture,
    emissive: new THREE.Color(0xf5a442),
    emissiveIntensity: 0.5,
    specularMap: specularTexture,
    specular: new THREE.Color(0xf5a442),
    specularIntensity: 0.5,
    shininess: 0.5,
    bumpScale: 0.1,
  });

  model.material = material;

  scene.add(model);

  objects.Earth.models = { main: model };

  const cloudsModel = model.clone();

  const cloudsMapTexture = textureLoader.load(
    "models/Earth/textures/EarthClouds.png"
  );

  const cloudsMaterial = new THREE.MeshPhongMaterial({
    map: cloudsMapTexture,
    transparent: true,
    alphaMap: cloudsMapTexture,
  });

  cloudsModel.material = cloudsMaterial;
  cloudsModel.scale.set(10.2, 10.2, 10.2);

  scene.add(cloudsModel);

  objects.Earth.models.clouds = cloudsModel;

  const atmosphereModel = model.clone();
  atmosphereModel.scale.set(12, 12, 12);

  const uniforms = THREE.UniformsUtils.clone({});

  const atmosphereMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: earthShaders.atmosphere.vertexShader,
    fragmentShader: earthShaders.atmosphere.fragmentShader,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
  });

  atmosphereModel.material = atmosphereMaterial;

  scene.add(atmosphereModel);

  objects.Earth.models.atmosphere = atmosphereModel;

  const earthLabel = createObjectLabel(objects.Earth);

  objects.Earth.label = earthLabel;

  addObjectClickListener(objects.Earth);
});

const sunModel = new THREE.Mesh(
  new THREE.SphereGeometry(75, 32, 32),
  new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: sunShaders.main.vertexShader,
    fragmentShader: sunShaders.main.fragmentShader,
  })
);

sunModel.position.set(
  objects.Sun.position.x,
  objects.Sun.position.y,
  objects.Sun.position.z
);

const sunLight = new THREE.DirectionalLight(0xffffff, 0.5);

sunLight.position.set(
  objects.Sun.position.x,
  objects.Sun.position.y,
  objects.Sun.position.z
);

scene.add(sunLight);
scene.add(sunModel);

objects.Sun.models = sunModel;
objects.Sun.lights = sunLight;

const sunLabel = createObjectLabel(objects.Sun);

objects.Sun.label = sunLabel;

addObjectClickListener(objects.Sun);

const renderScene = new RenderPass(scene, camera.camera);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight)
);
bloomPass.threshold = 0.1;
bloomPass.strength = 1;
bloomPass.radius = 0.1;

const bloomComposer = new EffectComposer(renderer);
bloomComposer.setSize(window.innerWidth, window.innerHeight);
bloomComposer.addPass(renderScene);
bloomComposer.addPass(bloomPass);
bloomComposer.renderToScreen = true;

let mouseDown = false;

document.addEventListener("pointerdown", () => {
  mouseDown = true;
});

document.addEventListener("pointerup", () => {
  mouseDown = false;
});

let lastClosestVector;
let cameraLerpValue = 0;

function animate(time = 0) {
  requestAnimationFrame(animate);

  camera.controls.update();

  objects.Sun.models.material.uniforms.uTime.value = time / 1000;

  bloomComposer.render();

  if (objects.Earth.models) {
    objects.Earth.models.clouds.rotation.y += 0.0001;
  }

  let closest = Infinity;
  let closestVector = new THREE.Vector3(0, 0, 0);

  Object.values(objects).forEach((object) => {
    if (!object.label || !object.models) return;

    const model = object.models.main || object.models;
    let objectCenter = getCenterPoint(model);

    if (!objectCenter) return;

    objectCenter = objectCenter.add(
      new THREE.Vector3(0, object.heightOffset, 0)
    );

    const screenPosition = pointToScreen(objectCenter);

    object.label.style.left = `${screenPosition.x}px`;
    object.label.style.top = `${screenPosition.y}px`;

    const distance = camera.camera.position.distanceTo(model.position);

    if (distance < closest) {
      closest = distance;
      closestVector = model.position;
    }
  });

  if (zoomToObject) {
    const model = zoomToObject.models.main || zoomToObject.models;
    camera.controls.autoRotateSpeed += 0.1;
    camera.controls.autoRotate = true;
    camera.controls.target = camera.controls.target.lerp(
      model.position,
      cameraLerpValue
    );

    camera.controls.minDistance -= 1;
    camera.controls.maxDistance -= 1;
    cameraLerpValue += 0.02;
  } else {
    if (mouseDown && closestVector) {
      if (lastClosestVector !== closestVector) {
        cameraLerpValue = 0;
      }

      lastClosestVector = closestVector;

      camera.controls.target = camera.controls.target.lerp(
        closestVector,
        cameraLerpValue
      );

      cameraLerpValue += 0.01;

      if (cameraLerpValue >= 1) {
        cameraLerpValue = 0;
      }
    } else {
      camera.controls.autoRotate = true;
    }
  }
}

animate();
