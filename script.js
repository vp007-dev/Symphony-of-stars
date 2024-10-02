var Mathutils = {
  normalize: function($value, $min, $max) {
      return ($value - $min) / ($max - $min);
  },
  interpolate: function($normValue, $min, $max) {
      return $min + ($max - $min) * $normValue;
  },
  map: function($value, $min1, $max1, $min2, $max2) {
      if ($value < $min1) {
          $value = $min1;
      }
      if ($value > $max1) {
          $value = $max1;
      }
      var res = this.interpolate(this.normalize($value, $min1, $max1), $min2, $max2);
      return res;
  }
};

var markers = [];

//Get window size
var ww = window.innerWidth,
  wh = window.innerHeight;

var composer,
  params = {
      exposure: 1.3,
      bloomStrength: .9,
      bloomThreshold: 0,
      bloomRadius: 0
  };

//Create a WebGL renderer
var renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("canvas"),
  antialias: true,
  shadowMapEnabled: true,
  shadowMapType: THREE.PCFSoftShadowMap
});
renderer.setSize(ww, wh);

//Create an empty scene
var scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x194794, 0, 300);

var clock = new THREE.Clock();

//Create a perspective camera
var cameraRotationProxyX = 3.14159;
var cameraRotationProxyY = 0;

var camera = new THREE.PerspectiveCamera(45, ww / wh, 0.001, 200);
camera.rotation.y = cameraRotationProxyX;
camera.rotation.z = cameraRotationProxyY;

var c = new THREE.Group();
c.position.z = 400;

c.add(camera);
scene.add(c);

//set up render pass
var renderScene = new THREE.RenderPass(scene, camera);
var bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.renderToScreen = true;
bloomPass.threshold = params.bloomThreshold;
bloomPass.strength = params.bloomStrength;
bloomPass.radius = params.bloomRadius;
composer = new THREE.EffectComposer(renderer);
composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass(renderScene);
composer.addPass(bloomPass);

//Array of points
var points = [
  [10, 89, 0],
  [50, 88, 10],
  [76, 139, 20],
  [126, 141, 12],
  [150, 112, 8],
  [157, 73, 0],
  [180, 44, 5],
  [207, 35, 10],
  [232, 36, 0]
];

var p1, p2;

//Convert the array of points into vertices
for (var i = 0; i < points.length; i++) {
  var x = points[i][0];
  var y = points[i][2];
  var z = points[i][1];
  points[i] = new THREE.Vector3(x, y, z);
}

//Create a path from the points
var path = new THREE.CatmullRomCurve3(points);
path.curveType = 'catmullrom';
path.tension = .5;

//Create a new geometry with a different radius
var geometry = new THREE.TubeGeometry(path, 300, 20, 64, false);

var texture = new THREE.TextureLoader().load('img1.jpg', function(texture) {
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.offset.set(0, 0);
  texture.repeat.set(15, 2);
});

var mapHeight = new THREE.TextureLoader().load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/68819/waveform-bump3.jpg', function(texture) {
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.offset.set(0, 0);
  texture.repeat.set(15, 2);
});

var material = new THREE.MeshPhongMaterial({
  side: THREE.BackSide,
  map: texture,
  shininess: 20,
  bumpMap: mapHeight,
  bumpScale: -.03,
  specular: 0x0b2349
});

//Create a mesh
var tube = new THREE.Mesh(geometry, material);
//Push the mesh into the scene
scene.add(tube);

//Create a point light in our scene
var light = new THREE.PointLight(0xffffff, .35, 4, 0);
light.castShadow = true;
scene.add(light);

function updateCameraPercentage(percentage) {
  p1 = path.getPointAt(percentage % 1);
  p2 = path.getPointAt((percentage + 0.03) % 3);
  p3 = path.getPointAt((percentage + 0.05) % 1);

  c.position.set(p1.x, p1.y, p1.z);
  c.lookAt(p2);
  light.position.set(p2.x, p2.y, p2.z);
}

var cameraTargetPercentage = 0;
var currentCameraPercentage = 0;

gsap.defaultEase = Linear.easeNone;

var tubePerc = {
  percent: 0
}

gsap.registerPlugin(ScrollTrigger);

var tl = gsap.timeline({
  scrollTrigger: {
      trigger: ".scrollTarget",
      start: "top top",
      end: "bottom 100%",
      scrub: 5,
      markers: { color: "white" }
  }
});
tl.to(tubePerc, {
  percent: .96,
  ease: Linear.easeNone,
  duration: 10,
  onUpdate: function() {
      cameraTargetPercentage = tubePerc.percent;
  }
});

function render() {
  currentCameraPercentage = cameraTargetPercentage;

  camera.rotation.y += (cameraRotationProxyX - camera.rotation.y) / 15;
  camera.rotation.x += (cameraRotationProxyY - camera.rotation.x) / 15;

  updateCameraPercentage(currentCameraPercentage);

  particleSystem1.rotation.y += 0.00002;
  particleSystem2.rotation.x += 0.00005;
  particleSystem3.rotation.z += 0.00001;

  composer.render();

  requestAnimationFrame(render);
}
requestAnimationFrame(render);

$('canvas').click(function() {
  console.clear();
  markers.push(p1);
  console.log(JSON.stringify(markers));
});

window.addEventListener('resize', function() {
  var width = window.innerWidth;
  var height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  composer.setSize(width, height);

}, false);

//particle system
var spikeyTexture = new THREE.TextureLoader().load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/68819/spikey.png');

var particleCount = 6800,
  particles1 = new THREE.Geometry(),
  particles2 = new THREE.Geometry(),
  particles3 = new THREE.Geometry(),
  pMaterial = new THREE.ParticleBasicMaterial({
      color: 0xFFFFFF,
      size: .5,
      map: spikeyTexture,
      transparent: true,
      blending: THREE.AdditiveBlending
  });

// now create the individual particles
for (var p = 0; p < particleCount; p++) {
  var pX = Math.random() * 500 - 250,
      pY = Math.random() * 50 - 25,
      pZ = Math.random() * 500 - 250,
      particle = new THREE.Vector3(pX, pY, pZ);

  particles1.vertices.push(particle);
}

for (var p = 0; p < particleCount; p++) {
  var pX = Math.random() * 500,
      pY = Math.random() * 10 - 5,
      pZ = Math.random() * 500,
      particle = new THREE.Vector3(pX, pY, pZ);

  particles2.vertices.push(particle);
}

for (var p = 0; p < particleCount; p++) {
  var pX = Math.random() * 500,
      pY = Math.random() * 10 - 5,
      pZ = Math.random() * 500,
      particle = new THREE.Vector3(pX, pY, pZ);

  particles3.vertices.push(particle);
}
// Load the nebula image
// Load texture with debugging
var nebulaTexture = new THREE.TextureLoader().load(
  'img.jpg',
  function(texture) {
      console.log("Texture loaded successfully", texture);

      // Create material with loaded texture
      var nebulaMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: false, // Test with false first
          side: THREE.DoubleSide // Render both sides
      });

      // Create the nebula plane
      var nebulaGeometry = new THREE.PlaneGeometry(1000, 1000); // Large enough size
      var nebulaPlane = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
      const nebulaWidth = 6;  // Shrink the width even more
      const nebulaHeight = 4;  // Shrink the height proportionally
      nebulaPlane.lookAt(camera.position);
      nebulaPlane.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);

      // nebulaPlane.scale.set(nebulaWidth, nebulaHeight, 1);
      // Set position of the nebula
      // nebulaPlane.scale.set(0.70, 0.70, 1)
      nebulaPlane.position.set(40, 0, -50); // Adjust position along the z-axis
      // nebulaPlane.scale.set(6, 4, 1); // Scale the nebula appropriately // Adjust Z position to see it in view
      // nebulaPlane.rotation.set(0, Math.PI / 5, 0); 
      // Add the nebula to the scene
      scene.add(nebulaPlane);

      // Log the visibility and position
      nebulaPlane.visible = true;
      console.log("Nebula Position:", nebulaPlane.position);
  },
  undefined,
  function(err) {
      console.error("An error occurred loading the texture", err);
  }
);

// Set camera position
// camera.position.set(0, 0, 500); // Adjust camera position as needed
// camera.updateProjectionMatrix(); // Update projection matrix
var particleSystem1 = new THREE.ParticleSystem(particles1, pMaterial);
var particleSystem2 = new THREE.ParticleSystem(particles2, pMaterial);
var particleSystem3 = new THREE.ParticleSystem(particles3, pMaterial);

scene.add(particleSystem1);
scene.add(particleSystem2);
scene.add(particleSystem3);

$(document).mousemove(function(evt) {
  cameraRotationProxyX = Mathutils.map(evt.clientX, 0, window.innerWidth, 3.24, 3.04);
  cameraRotationProxyY = Mathutils.map(evt.clientY, 0, window.innerHeight, -.1, .1);
});
