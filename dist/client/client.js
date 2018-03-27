(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('keycode-js'), require('three')) :
	typeof define === 'function' && define.amd ? define(['keycode-js', 'three'], factory) :
	(factory(global.KeyCode,global.THREE));
}(this, (function (KeyCodes,THREE) { 'use strict';

class BlendIn {
    constructor(scene, input) {
        this.scene = scene;
        this.input = input;
        const geo = new THREE.PlaneGeometry(1, 1, 1, 1);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
        this.dude = new THREE.Mesh(geo, mat);
        this.dir = new THREE.Vector2(0, 0);
        this.speed = 0.5;
        scene.add(this.dude);
    }
    handleInput() {
        this.dir.set(0, 0);
        if (this.input.pressed[KeyCodes.KEY_W]) {
            this.dir.y = 1;
        }
        if (this.input.pressed[KeyCodes.KEY_S]) {
            this.dir.y = -1;
        }
        if (this.input.pressed[KeyCodes.KEY_A]) {
            this.dir.x = -1;
        }
        if (this.input.pressed[KeyCodes.KEY_D]) {
            this.dir.x = 1;
        }
        if (this.dir.x !== 0 || this.dir.y !== 0) {
            this.dir.normalize();
        }
    }
    update(time) {
        this.handleInput();
        this.dude.position.x += this.dir.x * this.speed;
        this.dude.position.y += this.dir.y * this.speed;
        //
    }
}
//# sourceMappingURL=blendIn.js.map

class Input {
    constructor() {
        this.pressed = {};
        this.onKeyDown = (e) => {
            if (!this.pressed[e.keyCode]) {
                this.keyHandler(e.keyCode);
            }
            this.pressed[e.keyCode] = true;
        };
        this.onKeyUp = (e) => {
            this.pressed[e.keyCode] = false;
        };
        this.contextMenu = (e) => {
            e.preventDefault();
        };
        this.dispose = () => {
            document.removeEventListener("contextmenu", this.contextMenu);
            window.removeEventListener("keydown", this.onKeyDown);
            window.removeEventListener("keyup", this.onKeyUp);
        };
        document.addEventListener("contextmenu", this.contextMenu, false);
        window.addEventListener("keydown", this.onKeyDown, false);
        window.addEventListener("keyup", this.onKeyUp, false);
    }
    onKeyDown(e) {
        if (!this.pressed[e.keyCode]) {
            this.keyHandler(e.keyCode);
        }
        this.pressed[e.keyCode] = true;
    }
    keyHandler(key) {
        //
    }
}

window.onload = function () {
    let container;
    let camera;
    let scene;
    let renderer;
    let input;
    let game;
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
        camera = new THREE.OrthographicCamera(frustumSize * aspect / -2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / -2, 1, 2000);
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
        camera.left = -frustumSize * aspect / 2;
        camera.right = frustumSize * aspect / 2;
        camera.top = frustumSize / 2;
        camera.bottom = -frustumSize / 2;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    function animate(timestamp) {
        requestAnimationFrame(animate);
        if (timestamp && !isNaN(timestamp)) {
            game.update(timestamp);
        }
        renderer.render(scene, camera);
    }
};
//# sourceMappingURL=client.js.map

})));
//# sourceMappingURL=client.js.map
