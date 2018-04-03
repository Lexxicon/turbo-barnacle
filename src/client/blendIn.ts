import * as KeyCodes from "keycode-js";
import { Camera, Mesh, OrbitControls, Scene, Vector2 } from "three";
import * as THREE from "three";
import { QuadTree } from "util/quadTree";
import { Rectangle } from "util/rectangle";
import { Flocking } from "./flocking";
import { Input } from "./input";
import { Dots } from "./instancedDots";

export class BlendIn {
  private dir: Vector2;
  private speed: number;
  private pTime: number | undefined;
  private delta: number;

  private duder: Dots;
  private flock: Flocking;

  private keyBinds: { [code: number]: () => void } = {};

  private worldSize = 45;
  private target = 1000;

  private settingUp = true;
  private sqr: number;
  private count: number = 0;

  constructor(private scene: Scene, private camera: Camera, private input: Input) {
    this.camera.translateX(this.worldSize / 2);
    this.camera.translateY(this.worldSize / 2);
    this.camera.translateZ(75);
    this.camera.updateMatrix();
    this.camera.lookAt(this.worldSize / 2, this.worldSize / 2, 0);
    this.dir = new THREE.Vector2(0, 0);
    this.speed = 2;
    this.delta = 0;

    this.duder = new Dots(this.target);
    this.flock = new Flocking(this.worldSize);
    // this.createBackground(this.worldSize, 1);

    this.sqr = Math.floor(Math.sqrt(this.duder.getBufferSize()));

    scene.add(this.duder.getMesh());

    input.keyHandler = (code) => { if (this.keyBinds[code] !== undefined) { this.keyBinds[code](); } };

    // this.keyBinds[KeyCodes.KEY_SPACE] = () => this.flock.update(this.delta);
  }

  private createBackground(size: number, buffer: number) {
    const g = new THREE.PlaneGeometry(size + buffer, size + buffer);
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const p = new THREE.Mesh(g, m);
    p.position.z = -.01;
    p.position.x = size / 2;
    p.position.y = size / 2;
    this.scene.add(p);
  }

  public createCube = () => {
    this.duder.add(this.duder.getPosition(0).x, this.duder.getPosition(0).y);
  }

  public handleInput() {
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

  public update(time: number) {
    if (!this.pTime) {
      this.pTime = time;
      return;
    }
    if (this.settingUp) {
      for (let i = 0; i < 100 && this.count < this.target; i++) {
        this.duder.add(Math.random() * this.worldSize, Math.random() * this.worldSize);
        this.flock.add(this.duder.getPosition(this.count));
        this.count++;
      }
      this.settingUp = this.count < this.target;
    }
    this.delta = (time - this.pTime) / 1000;

    this.flock.update(this.delta);
    this.duder.isPosDirty = true;
    this.duder.update(this.delta);

    this.handleInput();

    this.pTime = time;
  }
}
