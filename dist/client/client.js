(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('three'), require('keycode-js')) :
	typeof define === 'function' && define.amd ? define(['three', 'keycode-js'], factory) :
	(factory(global.THREE,global.KeyCode));
}(this, (function (THREE,KeyCodes) { 'use strict';

const loader = new THREE.FileLoader();
let fragSrc;
let vertSrc;
loader.load("./shaders/dude.frag", (d) => fragSrc = d);
loader.load("./shaders/dude.vert", (d) => vertSrc = d);
class Dude {
    constructor(count) {
        this.scratchVector = new THREE.Vector2(0, 0);
        const postionAtrbs = [];
        this.positions = [];
        this.colors = [];
        const base = new THREE.PlaneBufferGeometry(1, 1, 1, 1);
        this.geometry = new THREE.InstancedBufferGeometry();
        this.geometry.index = base.index;
        this.geometry.addAttribute("position", base.getAttribute("position"));
        this.geometry.addAttribute("uv", base.getAttribute("uv"));
        for (let i = 0; i < count; i++) {
            postionAtrbs.push(0, 0);
            this.positions.push(new THREE.Vector2(0, 0));
            this.colors.push(Math.random(), Math.random(), Math.random());
        }
        this.positionAttribute = new THREE.InstancedBufferAttribute(new Float32Array(postionAtrbs), 2).setDynamic(true);
        this.colorAttribute = new THREE.InstancedBufferAttribute(new Float32Array(this.colors), 3);
        this.geometry.addAttribute("offset", this.positionAttribute);
        this.geometry.addAttribute("color", this.colorAttribute);
        const material = new THREE.RawShaderMaterial({
            vertexShader: vertSrc,
            fragmentShader: fragSrc
        });
        this.mesh = new THREE.Mesh(this.geometry, material);
    }
    getMesh() {
        return this.mesh;
    }
    updatePosition(i, x, y) {
        this.positions[i].set(x, y);
        this.positionAttribute.setXY(i, x, y);
        this.positionAttribute.needsUpdate = true;
    }
    addPosition(i, x, y) {
        this.scratchVector.set(x, y);
        this.positions[i].add(this.scratchVector);
        this.positionAttribute.setXY(i, this.positions[i].x, this.positions[i].y);
        this.positionAttribute.needsUpdate = true;
    }
}
//# sourceMappingURL=dude.js.map

class BlendIn {
    constructor(scene, camera, input) {
        this.scene = scene;
        this.camera = camera;
        this.input = input;
        this.dir = new THREE.Vector2(0, 0);
        this.speed = 2;
        this.delta = 0;
        this.duder = new Dude(100);
        for (let i = 0; i < 100; i++) {
            this.duder.updatePosition(i, (i % 10) * 1.2, Math.floor(i / 10) * 1.2);
        }
        scene.add(this.duder.getMesh());
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
    move() {
        this.duder.addPosition(4, this.dir.x * this.speed * this.delta, this.dir.y * this.speed * this.delta);
    }
    update(time) {
        if (!this.pTime) {
            this.pTime = time;
            return;
        }
        this.delta = (time - this.pTime) / 1000;
        this.handleInput();
        this.move();
        for (let i = 0; i < 100; i++) {
            this.duder.addPosition(i, Math.cos(time / 1000 + i) * 0.01, Math.sin(time / 1000 + i) * 0.01);
        }
        this.pTime = time;
    }
}

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
//# sourceMappingURL=input.js.map

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
        game = new BlendIn(scene, camera, input);
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
