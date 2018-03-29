import * as Stats from "stats.js";
import * as THREE from "three";
import { Camera, OrbitControls, OrthographicCamera, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { BlendIn } from "./blendIn";
import { Input } from "./input";
const ortho = false;
window.onload = function () {
  let container: HTMLElement | null;
  let camera: OrthographicCamera | PerspectiveCamera;
  let controller: OrbitControls;
  let scene: Scene;
  let renderer: WebGLRenderer;
  let input: Input;

  let game: BlendIn;

  const frustumSize = 160;
  const SCREEN_WIDTH = window.innerWidth;
  const SCREEN_HEIGHT = window.innerHeight;

  const stats: Stats = new Stats();

  init();
  animate();

  function init() {
    container = document.getElementById("container");
    if (container === null) {
      throw new Error("Failed to find container");
    }

    const aspect = window.innerWidth / window.innerHeight;
    if (ortho) {
      camera = new THREE.OrthographicCamera(
        frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 1, 2000);
    } else {
      camera = new THREE.PerspectiveCamera(30, SCREEN_WIDTH / SCREEN_HEIGHT, 0.01, 10000);
    }

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0, 0, 0);

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);

    controller = new THREE.OrbitControls(camera, renderer.domElement);
    camera.position.set(0, 0, 50);
    container.appendChild(renderer.domElement);

    input = new Input();

    onWindowResize();
    window.addEventListener("resize", onWindowResize, false);
    container.appendChild(stats.dom);
    game = new BlendIn(scene, camera, input);
  }

  function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    if (isOrtho(camera)) {
      camera.left = - frustumSize * aspect / 2;
      camera.right = frustumSize * aspect / 2;
      camera.top = frustumSize / 2;
      camera.bottom = - frustumSize / 2;
    }
    if (isPers(camera)) {
      camera.aspect = aspect;
    }
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function isOrtho(cam: Camera): cam is OrthographicCamera {
    return ortho;
  }
  function isPers(cam: Camera): cam is PerspectiveCamera {
    return !ortho;
  }
  function animate(timestamp?: number) {
    requestAnimationFrame(animate);
    if (timestamp && !isNaN(timestamp)) {
      game.update(timestamp);
    }
    renderer.render(scene, camera);

    stats.update();
  }

};
