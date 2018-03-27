import * as THREE from "three";
import { OrthographicCamera, Scene, WebGLRenderer } from "three";
import { BlendIn } from "./blendIn";
import { Input } from "./input";

window.onload = function () {
  let container: HTMLElement | null;
  let camera: OrthographicCamera;
  let scene: Scene;
  let renderer: WebGLRenderer;
  let input: Input;

  let game: BlendIn;

  const frustumSize = 15;
  const SCREEN_WIDTH = window.innerWidth;
  const SCREEN_HEIGHT = window.innerHeight;

  init();
  animate();

  function init() {
    container = document.getElementById("container");
    if (container === null) {
      throw new Error("Failed to find container");
    }

    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.OrthographicCamera(
      frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 1, 2000);
    camera.position.set(3, 2.5, 15);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0, 0, 0);

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);

    container.appendChild(renderer.domElement);

    input = new Input();

    onWindowResize();
    window.addEventListener("resize", onWindowResize, false);

    game = new BlendIn(scene, input);

  }

  function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;

    camera.left = - frustumSize * aspect / 2;
    camera.right = frustumSize * aspect / 2;
    camera.top = frustumSize / 2;
    camera.bottom = - frustumSize / 2;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function animate(timestamp?: number) {
    requestAnimationFrame(animate);
    if (timestamp && !isNaN(timestamp)) {
      game.update(timestamp);
    }
    renderer.render(scene, camera);
  }

};
