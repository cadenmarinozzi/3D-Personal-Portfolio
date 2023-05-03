import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

const scene = new THREE.Scene();
// scene.background = new THREE.Color(0xffffff);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight.position.set(200, 0, 0);
scene.add(dirLight);


const camera = new THREE.PerspectiveCamera(
  40,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.z = 50;

const getTopPoint = (mesh, height) => {
  const geometry = mesh.geometry;
  geometry.computeBoundingBox();

  const center = new THREE.Vector3();
  geometry.boundingBox.getCenter(center);
  mesh.localToWorld(center);

  const top = center.add(new THREE.Vector3(0, height, 0));

  return top;
};

const centerPointToScreen = (center, camera) => {
  const vector = new THREE.Vector3();

  const halfWidth = 0.5 * window.innerWidth;
  const halfHeight = 0.5 * window.innerHeight;

  vector.copy(center);
  vector.project(camera);

  vector.x = vector.x * halfWidth + halfWidth;
  vector.y = -(vector.y * halfHeight) + halfHeight;

  return vector;
};

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

document.addEventListener("resize", resize);

const controls = new OrbitControls(camera, renderer.domElement);
controls.update();
controls.maxDistance = 200;
controls.minDistance = 20;
controls.enablePan = false;
const ambient = new THREE.AmbientLight(0x444444, 0.05);
scene.add(ambient);

const moonLoader = new GLTFLoader();
const moonMapLoader = new THREE.TextureLoader();
const moonDispLoader = new THREE.TextureLoader();
let moonModel;
let moonLabel;
moonLoader.load("models/Moon/Moon.gltf", (gltf) => {
  moonMapLoader.load("models/Moon/textures/MoonMap.png", (texture) => {
    moonDispLoader.load("models/Moon/textures/MoonBump.png", (dispTexture) => {
      const model = gltf.scene.children[0];
      model.position.set(20, 0, 0);

      const material = new THREE.MeshPhongMaterial({
        map: texture,
        bumpMap: dispTexture,
        bumpScale: 0.5,
        color: 0xffffff,
      });

      model.material = material;
      scene.add(model);

      moonLabel = document.createElement("div");
      moonLabel.className = "label";
      moonLabel.innerText = "About";
      moonModel = model;

      document.body.appendChild(moonLabel);
    });
  });
});

const loader = new GLTFLoader();
const mapLoader = new THREE.TextureLoader();
const bumpLoader = new THREE.TextureLoader();
const lightLoader = new THREE.TextureLoader();
const maskLoader = new THREE.TextureLoader();
const cloudLoader = new THREE.TextureLoader();

let vertexShader = `
  varying vec3 vNormal;,
  varying vec3 vPosition;,
  void main() {,
  vNormal = normalize( normalMatrix * normal );,

  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );,
  vPosition = gl_Position.xyz;,
  }`

let fragmentShader = `
  varying vec3 vNormal;,
  varying vec3 vPosition;,

  void main() {,
    vec3 lightPosition = vec3(-10.0, 10.0, 0.0);,
    vec3 lightDirection = normalize(lightPosition - vPosition);,
    float dotNL = clamp(dot(lightDirection, vNormal), 0.0, 1.0);,
    float intensity = min(1.0, pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 2.0 ));,
    gl_FragColor = vec4( 120.0 / 255.0, 120.0 / 255.0, 218.0 / 255.0, 1.0 ) * intensity * dotNL;,
  }`
let goHome = false;
let model3;
let earthLabel;
let earthModel;
loader.load("models/Earth/Earth.gltf", (gltf) => {
  mapLoader.load("models/Earth/textures/EarthMap.jpg", (texture) => {
    bumpLoader.load("models/Earth/textures/EarthBump.jpg", (bumpTexture) => {
      lightLoader.load(
        "models/Earth/textures/EarthLights.png",
        (lightTexture) => {
          maskLoader.load(
            "models/Earth/textures/EarthOceanMask.png",
            (maskTetxure) => {
              cloudLoader.load(
                "models/Earth/textures/EarthClouds.png",
                (cloudTexture) => {
                  const model = gltf.scene.children[0];
                  const material = new THREE.MeshPhongMaterial({
                    map: texture,
                  });

                  model.material = material;
                  material.bumpMap = bumpTexture;
                  material.bumpScale = 0.1;

                  material.emissiveMap = lightTexture;
                  material.emissive = new THREE.Color(0xf5a442);
                  material.emissiveIntensity = 0.5;
                  material.specularMap = maskTetxure;
                  material.specular = new THREE.Color(0xf5a442);
                  material.specularIntensity = 0.5;
                  material.shininess = 0.5;

                  scene.add(model);

                  let material2 = new THREE.ShaderMaterial({
                    uniforms: THREE.UniformsUtils.clone({}),
                    vertexShader: vertexShader,
                    fragmentShader: fragmentShader,
                    side: THREE.BackSide,
                    blending: THREE.AdditiveBlending,
                    transparent: true,
                  });

                  const model2 = model.clone();
                  model2.material = material2;
                  model2.scale.set(12, 12, 12);
                  scene.add(model2);

                  model3 = model.clone();
                  const material3 = new THREE.MeshPhongMaterial({
                    map: cloudTexture,
                    transparent: true,
                    alphaMap: cloudTexture,
                  });
                  model3.material = material3;
                  model3.scale.set(10.2, 10.2, 10.2);
                  scene.add(model3);

                  earthLabel = document.createElement("div");
                  earthLabel.className = "label";
                  earthLabel.innerText = "Home";
                  earthModel = model;

                  earthLabel.addEventListener("click", () => {
                    goHome = true;

                    if (controls.minDistance > controls.maxDistance) {
                      controls.minDistance = controls.maxDistance;
                    } else {
                      controls.maxDistance = controls.minDistance;
                    }
                  });

                  document.body.appendChild(earthLabel);
                }
              );
            }
          );
        }
      );
    });
  });
});

let fragment = `
varying vec2 vUv;
varying vec3 vPosition;
uniform float uTime;

vec3 random3(vec3 c) {
	float j = 4096.0*sin(dot(c,vec3(17.0, 59.4, 15.0)));
	vec3 r;
	r.z = fract(512.0*j);
	j *= .125;
	r.x = fract(512.0*j);
	j *= .125;
	r.y = fract(512.0*j);
	return r-0.5;
}

/* skew constants for 3d simplex functions */
const float F3 =  0.3333333;
const float G3 =  0.1666667;

/* 3d simplex noise */
float simplex3d(vec3 p) {
	 /* 1. find current tetrahedron T and it's four vertices */
	 /* s, s+i1, s+i2, s+1.0 - absolute skewed (integer) coordinates of T vertices */
	 /* x, x1, x2, x3 - unskewed coordinates of p relative to each of T vertices*/
	 
	 /* calculate s and x */
	 vec3 s = floor(p + dot(p, vec3(F3)));
	 vec3 x = p - s + dot(s, vec3(G3));
	 
	 /* calculate i1 and i2 */
	 vec3 e = step(vec3(0.0), x - x.yzx);
	 vec3 i1 = e*(1.0 - e.zxy);
	 vec3 i2 = 1.0 - e.zxy*(1.0 - e);
	 	
	 /* x1, x2, x3 */
	 vec3 x1 = x - i1 + G3;
	 vec3 x2 = x - i2 + 2.0*G3;
	 vec3 x3 = x - 1.0 + 3.0*G3;
	 
	 /* 2. find four surflets and store them in d */
	 vec4 w, d;
	 
	 /* calculate surflet weights */
	 w.x = dot(x, x);
	 w.y = dot(x1, x1);
	 w.z = dot(x2, x2);
	 w.w = dot(x3, x3);
	 
	 /* w fades from 0.6 at the center of the surflet to 0.0 at the margin */
	 w = max(0.6 - w, 0.0);
	 
	 /* calculate surflet components */
	 d.x = dot(random3(s), x);
	 d.y = dot(random3(s + i1), x1);
	 d.z = dot(random3(s + i2), x2);
	 d.w = dot(random3(s + 1.0), x3);
	 
	 /* multiply d by w^4 */
	 w *= w;
	 w *= w;
	 d *= w;
	 
	 /* 3. return the sum of the four surflets */
	 return dot(d, vec4(52.0));
}

void main() {
  vec3 color = vec3(255.0 / 255.0, 112.0 / 255.0, 34.0 / 255.0) * (1.0 - simplex3d(vec3(vUv * 500.0, uTime)));
  gl_FragColor = vec4(color / 4.0, 1.0);
}
`;
let vertex = `
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  vPosition = gl_Position.xyz;
}
  `;

let sunLabel;
let sunModel;

let sphere = new THREE.Mesh(
  new THREE.SphereGeometry(75, 32, 32),
  new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: vertex,
    fragmentShader: fragment,
  })
);

sunModel = sphere;

sphere.position.set(200, 0, 0);

scene.add(sphere);

sunLabel = document.createElement("div");
sunLabel.className = "label";
sunLabel.innerText = "Projects";

document.body.appendChild(sunLabel);

const objects = [
  {
    name: "Earth",
    page: "Home",
    position: new THREE.Vector3(0, 0, 0),
  },
  {
    name: "Sun",
    page: "Projects",
    position: new THREE.Vector3(200, 0, 0),
  },
  {
    name: "Moon",
    page: "About",
    position: new THREE.Vector3(20, 0, 0),
  },
];

for (const object of objects) {
  let label = document.createElement("div");
  label.className = "label";
  label.innerText = object.page;

  document.body.appendChild(label);

  object.label = label;
}

const renderScene = new RenderPass(scene, camera);
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
let lerpValue = 0;
let lastClose;
function animate(t = 0) {
  requestAnimationFrame(animate);

  controls.update();

  sphere.material.uniforms.uTime.value = t / 1000;

  bloomComposer.render();

  if (!model3) return;
  model3.rotation.y += 0.0001;

  if (!earthLabel || !moonLabel || !sunLabel) return;

  let center = getTopPoint(earthModel, 13);
  let vec = centerPointToScreen(center, camera);

  earthLabel.style.left = vec.x + "px";
  earthLabel.style.top = vec.y + "px";

  center = getTopPoint(moonModel, 3);
  vec = centerPointToScreen(center, camera);

  moonLabel.style.left = vec.x + "px";
  moonLabel.style.top = vec.y + "px";

  center = getTopPoint(sunModel, 90);
  vec = centerPointToScreen(center, camera);

  sunLabel.style.left = vec.x + "px";
  sunLabel.style.top = vec.y + "px";

  // sphere.position.x = Math.sin(t / 1000) * 200;
  // sphere.position.z = Math.cos(t / 1000) * 200;

  // dirLight.position.x = Math.sin(t / 1000) * 200;
  // dirLight.position.z = Math.cos(t / 1000) * 200;

  if (!goHome) {
    if (!mouseDown) {
      controls.autoRotate = true;
    } else {
      let closest = 0;
      let closestVector = new THREE.Vector3(0, 0, 0);

      let earthDistance = camera.position.distanceTo(earthModel.position);
      let moonDistance = camera.position.distanceTo(moonModel.position);
      let sunDistance = camera.position.distanceTo(sunModel.position);

      if (earthDistance < moonDistance && earthDistance < sunDistance) {
        closest = earthDistance;
        closestVector = earthModel.position;
      } else if (moonDistance < earthDistance && moonDistance < sunDistance) {
        closest = moonDistance;
        closestVector = moonModel.position;
      } else {
        closest = sunDistance;
        closestVector = sunModel.position;
      }

      if (lastClose !== closestVector) {
        lerpValue = 0;
      }

      lastClose = closestVector;

      controls.target = controls.target.lerp(closestVector, lerpValue);
      lerpValue += 0.01;
      if (lerpValue >= 1) {
        lerpValue = 0;
      }
    }
  } else {
    controls.autoRotateSpeed += 1;
    controls.autoRotate = true;
    controls.target = controls.target.lerp(earthModel.position, lerpValue);

    controls.minDistance -= 1;
    controls.maxDistance -= 1;
    lerpValue += 0.02;

    if (controls.minDistance <= 10.5) {
      controls.autoRotate = false;
      controls.autoRotateSpeed = 0.5;
      controls.minDistance = 200;
      controls.maxDistance = 400;
      goHome = false;
    }
  }
}

animate();
