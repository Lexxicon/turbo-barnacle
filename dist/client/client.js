(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('three'), require('keycode-js'), require('stats.js')) :
	typeof define === 'function' && define.amd ? define(['three', 'keycode-js', 'stats.js'], factory) :
	(factory(global.THREE,global.KeyCode,global.Stats));
}(this, (function (THREE,KeyCodes,Stats) { 'use strict';

class Rectangle {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
    contains(tX, tY) {
        if (!(typeof tX === "number")) {
            tY = tX.y;
            tX = tX.x;
        }
        if (tY === undefined) {
            throw new Error("no Y value");
        }
        return tX >= this.x && tX <= this.x + this.w
            && tY >= this.y && tY <= this.y + this.h;
    }
    intersects(test) {
        return this.x <= test.x + test.w &&
            this.x + this.w >= test.x &&
            this.y <= test.y + test.h &&
            this.h + this.y >= test.y;
    }
}
//# sourceMappingURL=rectangle.js.map

const merge = (a, b) => Array.prototype.push.apply(a, b);
class QuadTree {
    constructor(bounds, thresh, parent) {
        this.bounds = bounds;
        this.thresh = thresh;
        this.parent = parent;
        this.content = [];
        this.split = false;
        this.subTree = [];
    }
    validate() {
        let removed = [];
        this.evict(removed);
        let root = this;
        while (root.parent !== undefined) {
            root = root.parent;
        }
        removed = removed.filter((e) => !root.add(e));
        root.balance();
        return removed;
    }
    balance() {
        this.subTree.forEach((e) => e.balance());
        if (!this.split) {
            return;
        }
        const count = this.subTree.map((e) => e.content.length).reduce((a, b) => a + b, this.content.length);
        if (count > this.thresh) {
            return;
        }
        this.subTree.forEach((t) => merge(this.content, t.content));
        this.subTree = [];
        this.split = false;
    }
    evict(evicted) {
        merge(evicted, this.content.filter((e) => !this.bounds.contains(e.point)));
        this.content = this.content.filter((e) => this.bounds.contains(e.point));
        this.subTree.forEach((t) => t.evict(evicted));
    }
    select(area) {
        const result = [];
        if (!area.intersects(this.bounds)) {
            return result;
        }
        this.content.filter((e) => area.contains(e.point)).forEach((e) => result.push(e));
        this.subTree.map((tree) => tree.select(area)).forEach((e) => merge(result, e));
        return result;
    }
    size() {
        return this.subTree.map((e) => e.size()).reduce((a, b) => a + b, this.content.length);
    }
    add(item) {
        if (!this.bounds.contains(item.point)) {
            return false;
        }
        if (this.content.length < this.thresh) {
            this.content.push(item);
            return true;
        }
        if (!this.split) {
            this.subdivide();
        }
        for (const sub of this.subTree) {
            if (sub.add(item)) {
                return true;
            }
        }
        return false;
    }
    subdivide() {
        if (this.split) {
            return;
        }
        this.split = true;
        const x = this.bounds.x;
        const y = this.bounds.y;
        const halfW = this.bounds.w / 2;
        const halfH = this.bounds.h / 2;
        this.subTree.push(new QuadTree(new Rectangle(x, y, halfH, halfW), this.thresh, this));
        this.subTree.push(new QuadTree(new Rectangle(x + halfW, y, halfH, halfW), this.thresh, this));
        this.subTree.push(new QuadTree(new Rectangle(x + halfW, y + halfH, halfH, halfW), this.thresh, this));
        this.subTree.push(new QuadTree(new Rectangle(x, y + halfH, halfH, halfW), this.thresh, this));
    }
}
//# sourceMappingURL=quadTree.js.map

class Flocking {
    constructor(worldSize) {
        this.worldSize = worldSize;
        this.maxRot = Math.PI / 4;
        this.maxAccel = 0.1;
        this.quadTree = new QuadTree(new Rectangle(0, 0, this.worldSize, this.worldSize), 4);
        this.boids = [];
    }
    add(point) {
        const b = {
            point,
            direction: new THREE.Vector2(1, 0).rotateAround(new THREE.Vector2(0, 0), Math.random() * Math.PI * 2),
            targetDir: new THREE.Vector2(1, 0).rotateAround(new THREE.Vector2(0, 0), Math.random() * Math.PI * 2),
            velocity: 0,
            targetVel: .05
        };
        this.boids.push(b);
        const add = this.quadTree.add(b);
    }
    findAvg(points) {
        const avg = points.reduce((a, b) => ({ x: a.x + b.x, y: a.y + b.y }), { x: 0, y: 0 });
        avg.x /= points.length;
        avg.y /= points.length;
        return avg;
    }
    sub(b) {
        return (a) => {
            a.loc.x -= b.point.x;
            a.loc.y -= b.point.y;
            return a;
        };
    }
    widen(a) {
        return a;
    }
    length(a) {
        return Math.sqrt(a.x * a.x + a.y * a.y);
    }
    addLength(a) {
        a.length = this.length(a.loc);
        return a;
    }
    update(delta) {
        const sensorSize = 5;
        const halfSize = sensorSize / 2;
        const selectArea = new Rectangle(0, 0, sensorSize, sensorSize);
        for (const boid of this.boids) {
            selectArea.x = boid.point.x - halfSize;
            selectArea.y = boid.point.y - halfSize;
            let nearBy = this.selectArea(selectArea)
                .map(this.sub(boid))
                .map((a) => this.addLength(a));
            nearBy = nearBy.filter((a) => this.length(a.loc) <= sensorSize);
            const avgLoc = this.findAvg(nearBy.filter((b) => b.length > sensorSize / 2).map((b) => b.loc));
            const tooClose = this.findAvg(nearBy.filter((b) => b.length < sensorSize / 2).map((b) => b.loc));
            const avgDir = nearBy.map((e) => e.boid.direction)
                .reduce((a, b) => a.clone().add(b), new THREE.Vector2(0, 0))
                .normalize();
            const locVec = new THREE.Vector2(avgLoc.x, avgLoc.y).normalize();
            const tooCloseVec = new THREE.Vector2(tooClose.x, tooClose.y).normalize();
            const randomVec = new THREE.Vector2(Math.random() - 0.5, Math.random() - 0.5).normalize();
            avgDir.multiplyScalar(2);
            locVec.multiplyScalar(6);
            tooCloseVec.multiplyScalar(12).negate();
            randomVec.multiplyScalar(1);
            avgDir.add(locVec).add(tooCloseVec).add(randomVec);
            avgDir.normalize();
            if (avgDir.x === avgDir.x && avgDir.y === avgDir.y) {
                boid.targetDir = avgDir;
            }
        }
        this.apply(delta);
        const r = this.quadTree.validate();
        for (const boid of r) {
            this.quadTree.add(boid);
        }
    }
    selectArea(selectArea) {
        const nearBy = [];
        const merge = (target, arr) => Array.prototype.push.apply(target, arr);
        const origin = { x: selectArea.x, y: selectArea.y };
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const offsetX = this.worldSize * i;
                const offsetY = this.worldSize * j;
                selectArea.x = origin.x + offsetX;
                selectArea.y = origin.y + offsetY;
                const rslt = this.quadTree.select(selectArea)
                    .map((b) => ({ loc: { x: b.point.x - offsetX, y: b.point.y - offsetY }, boid: b }));
                merge(nearBy, rslt);
            }
        }
        return nearBy;
    }
    apply(delta) {
        const scratch = new THREE.Vector2(0.1, 0.1);
        for (const b of this.boids) {
            const rotDif = b.targetDir.angle() - b.direction.angle();
            const rot = Math.sign(rotDif) * Math.min(Math.abs(rotDif), this.maxRot * delta);
            const accelDif = b.targetVel - b.velocity;
            const accel = Math.sign(accelDif) * Math.min(Math.abs(accelDif), this.maxAccel * delta);
            b.direction.rotateAround(scratch.set(0, 0), rot);
            b.velocity += accel;
            scratch.set(b.direction.x, b.direction.y);
            b.point.add(scratch.multiplyScalar(b.velocity));
            this.clamp(b);
        }
    }
    clamp(boid) {
        boid.point.x = this.wrap(boid.point.x, this.worldSize);
        boid.point.y = this.wrap(boid.point.y, this.worldSize);
    }
    wrap(x, max) {
        if (x > max) {
            return x % max;
        }
        if (x < 0) {
            return max + (x % max);
        }
        return x;
    }
}

const loader = new THREE.FileLoader();
let fragSrc;
let vertSrc;
loader.load("./shaders/dude.frag", (d) => fragSrc = d);
loader.load("./shaders/dude.vert", (d) => vertSrc = d);
const flatten = (dest, a) => {
    if (a.length === 0) {
        return dest;
    }
    const mapped = a.map((v) => v.toArray());
    const size = mapped[0].length;
    for (let i = 0; i < mapped.length; i++) {
        dest.set(mapped[i], i * size);
    }
    return dest;
};
class Dots {
    constructor(count) {
        this.sizeOfPos = 2;
        this.sizeOfColor = 3;
        this.currentSize = 0;
        this.scratchVector = new THREE.Vector2(0, 0);
        this.isPosDirty = true;
        this.isColorDirty = true;
        this.bufferSize = count;
        this.positions = [];
        this.positionBuffer = new Float32Array(count * this.sizeOfPos);
        this.color = [];
        this.colorBuffer = new Float32Array(count * this.sizeOfColor);
        this.uniforms = { time: { value: 1.0 }, stime: { value: 1.0 } };
        const base = new THREE.PlaneBufferGeometry(.5, .5, 1, 1);
        this.geometry = new THREE.InstancedBufferGeometry();
        this.geometry.maxInstancedCount = count;
        this.geometry.index = base.index;
        this.geometry.addAttribute("position", base.getAttribute("position"));
        this.geometry.addAttribute("uv", base.getAttribute("uv"));
        this.positionAttribute = new THREE.InstancedBufferAttribute(this.positionBuffer, this.sizeOfPos);
        this.positionAttribute.setDynamic(true);
        this.colorAttribute = new THREE.InstancedBufferAttribute(this.colorBuffer, this.sizeOfColor);
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
    add(x, y) {
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
            this.positionAttribute.setArray(flatten(this.positionBuffer, this.positions));
            this.positionAttribute.needsUpdate = true;
        }
        if (this.isColorDirty) {
            this.isColorDirty = false;
            this.colorAttribute.setArray(flatten(this.colorBuffer, this.color));
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
//# sourceMappingURL=instancedDots.js.map

class BlendIn {
    constructor(scene, camera, input) {
        this.scene = scene;
        this.camera = camera;
        this.input = input;
        this.keyBinds = {};
        this.createCube = () => {
            this.duder.add(this.duder.getPosition(0).x, this.duder.getPosition(0).y);
        };
        this.dir = new THREE.Vector2(0, 0);
        this.speed = 2;
        this.delta = 0;
        this.duder = new Dots(100);
        this.flock = new Flocking(15);
        this.createBackground(15, 1);
        const sqr = Math.floor(Math.sqrt(this.duder.getBufferSize()));
        for (let i = 0; i < (sqr * sqr); i++) {
            this.duder.add((i % sqr) * 0.5, Math.floor(i / sqr) * 0.5);
            this.flock.add(this.duder.getPosition(i));
        }
        scene.add(this.duder.getMesh());
        input.keyHandler = (code) => { if (this.keyBinds[code] !== undefined) {
            this.keyBinds[code]();
        } };
        this.keyBinds[KeyCodes.KEY_SPACE] = this.createCube;
    }
    createBackground(size, buffer) {
        const g = new THREE.PlaneGeometry(size + buffer, size + buffer);
        const m = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
        const p = new THREE.Mesh(g, m);
        p.position.z = -.01;
        p.position.x = size / 2;
        p.position.y = size / 2;
        this.scene.add(p);
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
        if (!this.pTime) {
            this.pTime = time;
            return;
        }
        this.delta = (time - this.pTime) / 1000;
        this.flock.update(this.delta);
        this.duder.isPosDirty = true;
        this.duder.update(this.delta);
        this.handleInput();
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

const ortho = false;
window.onload = function () {
    let container;
    let camera;
    let controller;
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
        if (ortho) {
            camera = new THREE.OrthographicCamera(frustumSize * aspect / -2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / -2, 1, 2000);
        }
        else {
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
            camera.left = -frustumSize * aspect / 2;
            camera.right = frustumSize * aspect / 2;
            camera.top = frustumSize / 2;
            camera.bottom = -frustumSize / 2;
        }
        if (isPers(camera)) {
            camera.aspect = aspect;
        }
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    function isOrtho(cam) {
        return ortho;
    }
    function isPers(cam) {
        return !ortho;
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
//# sourceMappingURL=client.js.map

})));
//# sourceMappingURL=client.js.map
