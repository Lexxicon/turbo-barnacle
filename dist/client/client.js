(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('three'), require('keycode-js'), require('stats.js')) :
	typeof define === 'function' && define.amd ? define(['three', 'keycode-js', 'stats.js'], factory) :
	(factory(global.THREE,global.KeyCode,global.Stats));
}(this, (function (THREE,KeyCodes,Stats) { 'use strict';

const loader = new THREE.FileLoader();
let fragSrc;
let vertSrc;
loader.load("./shaders/dude.frag", (d) => fragSrc = d);
loader.load("./shaders/dude.vert", (d) => vertSrc = d);
const asBuffer = (a, size) => {
    const ar = new Float32Array(size);
    ar.set(flatten(a));
    return ar;
};
const flatten = (a) => {
    const mapped = a.map((v) => v.toArray());
    const rslt = [];
    const ln = mapped[0].length;
    let j = 0;
    for (let i = 0; i < mapped.length; i++) {
        for (j = 0; j < ln; j++) {
            rslt.push(mapped[i][j]);
        }
    }
    return rslt;
};
class Dude {
    constructor(count) {
        this.currentSize = 0;
        this.scratchVector = new THREE.Vector2(0, 0);
        this.isPosDirty = true;
        this.isColorDirty = true;
        this.bufferSize = count;
        this.positions = [];
        this.color = [];
        this.uniforms = { time: { value: 1.0 }, stime: { value: 1.0 } };
        const base = new THREE.PlaneBufferGeometry(.3, .3, 1, 1);
        this.geometry = new THREE.InstancedBufferGeometry();
        this.geometry.maxInstancedCount = count;
        this.geometry.index = base.index;
        this.geometry.addAttribute("position", base.getAttribute("position"));
        this.geometry.addAttribute("uv", base.getAttribute("uv"));
        this.positionAttribute = new THREE.InstancedBufferAttribute(new Float32Array(count * 2), 2);
        this.positionAttribute.setDynamic(true);
        this.colorAttribute = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
        const ids = [];
        for (let i = 0; i < count; i++) {
            ids.push(i);
        }
        this.idAttribute = new THREE.InstancedBufferAttribute(new Float32Array(ids), 1);
        this.geometry.addAttribute("id", this.idAttribute);
        this.geometry.addAttribute("offset", this.positionAttribute);
        this.geometry.addAttribute("color", this.colorAttribute);
        this.material = new THREE.RawShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: vertSrc,
            fragmentShader: fragSrc
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
    }
    getCurrentSize() {
        return this.currentSize;
    }
    getBufferSize() {
        return this.bufferSize;
    }
    getMesh() {
        return this.mesh;
    }
    addDude(x, y) {
        this.positions.push(new THREE.Vector2(x, y));
        this.color.push(new THREE.Vector3(Math.random(), Math.random(), Math.random()));
        this.isPosDirty = true;
        this.isColorDirty = true;
    }
    delete(i) {
        this.positions.splice(i, 1);
        this.color.splice(i, 1);
        this.isPosDirty = true;
        this.isColorDirty = true;
    }
    update(time) {
        this.uniforms.time.value += time;
        this.uniforms.stime.value = Math.sin(this.uniforms.time.value);
        this.rebuild();
    }
    rebuild() {
        if (this.isColorDirty || this.isPosDirty) {
            this.currentSize = this.positions.length;
            this.geometry.maxInstancedCount = this.currentSize;
        }
        else {
            return;
        }
        if (this.isPosDirty) {
            this.isPosDirty = false;
            this.positionAttribute.setArray(asBuffer(this.positions, this.bufferSize * 2));
            this.positionAttribute.needsUpdate = true;
        }
        if (this.isColorDirty) {
            this.isColorDirty = false;
            this.colorAttribute.setArray(asBuffer(this.color, this.bufferSize * 3));
            this.colorAttribute.needsUpdate = true;
        }
    }
    updatePosition(i, x, y) {
        this.positions[i].x = x;
        this.positions[i].y = y;
        this.isPosDirty = true;
    }
    getPosition(i) {
        return this.positions[i];
    }
    addPosition(i, x, y) {
        this.scratchVector.set(x, y);
        this.positions[i].add(this.scratchVector);
        this.isPosDirty = true;
    }
}
//# sourceMappingURL=dude.js.map

class BlendIn {
    constructor(scene, camera, input) {
        this.scene = scene;
        this.camera = camera;
        this.input = input;
        this.keyBinds = {};
        this.createCube = () => {
            this.duder.addDude(this.duder.getPosition(0).x, this.duder.getPosition(0).y);
        };
        this.dir = new THREE.Vector2(0, 0);
        this.speed = 2;
        this.delta = 0;
        camera.position.x = 10;
        camera.position.y = 15;
        this.duder = new Dude(1000000);
        // this.duder.addDude(0, 0);
        const sqr = Math.floor(Math.sqrt(this.duder.getBufferSize()));
        for (let i = 0; i < (sqr * sqr); i++) {
            this.duder.addDude((i % sqr) * 0.1, Math.floor(i / sqr) * 0.1);
        }
        camera.position.x = sqr * 0.05;
        camera.position.y = sqr * 0.05;
        scene.add(this.duder.getMesh());
        input.keyHandler = (code) => { if (this.keyBinds[code] !== undefined) {
            this.keyBinds[code]();
        } };
        this.keyBinds[KeyCodes.KEY_SPACE] = this.createCube;
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
        this.duder.addPosition(0, this.dir.x * this.speed * this.delta, this.dir.y * this.speed * this.delta);
    }
    update(time) {
        if (!this.pTime) {
            this.pTime = time;
            return;
        }
        this.delta = (time - this.pTime) / 1000;
        this.duder.update(this.delta);
        this.handleInput();
        // this.move();
        // for (let i = 1; i < this.duder.getCurrentSize(); i++) {
        //   this.duder.addPosition(i, Math.cos(time / 1000 + i) * 0.01, Math.sin(time / 1000 + i) * 0.01);
        // }
        this.pTime = time;
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
//# sourceMappingURL=input.js.map

window.onload = function () {
    let container;
    let camera;
    let scene;
    let renderer;
    let input;
    let game;
    const frustumSize = 160;
    const SCREEN_WIDTH = window.innerWidth;
    const SCREEN_HEIGHT = window.innerHeight;
    const stats = new Stats();
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
        container.appendChild(stats.dom);
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
        stats.update();
    }
};

})));
//# sourceMappingURL=client.js.map
