import * as KeyCodes from "keycode-js";
import { Camera, Mesh, Scene, Vector2 } from "three";
import * as THREE from "three";
import { QuadTree } from "util/quadTree";
import { Rectangle } from "util/rectangle";
import { Dude } from "./dude";
import { Input } from "./input";

export class BlendIn {
  private dir: Vector2;
  private speed: number;
  private pTime: number | undefined;
  private delta: number;

  private duder: Dude;

  private keyBinds: { [code: number]: () => void } = {};

  constructor(private scene: Scene, private camera: Camera, private input: Input) {
    this.dir = new THREE.Vector2(0, 0);
    this.speed = 2;
    this.delta = 0;

    camera.position.x = 5;
    camera.position.y = 5;
    camera.position.z = 15;

    this.duder = new Dude(100);

    this.duder.addDude(0, 0);

    scene.add(this.duder.getMesh());

    input.keyHandler = (code) => { if (this.keyBinds[code] !== undefined) { this.keyBinds[code](); } };

    this.keyBinds[KeyCodes.KEY_SPACE] = this.createCube;
  }

  public createCube = () => {
    this.duder.addDude(this.duder.getPosition(0).x, this.duder.getPosition(0).y);
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

  public move() {
    this.duder.addPosition(0, this.dir.x * this.speed * this.delta, this.dir.y * this.speed * this.delta);
  }

  public update(time: number) {
    if (!this.pTime) {
      this.pTime = time;
      return;
    }
    this.duder.rebuild();
    this.delta = (time - this.pTime) / 1000;

    this.handleInput();
    this.move();
    for (let i = 1; i < this.duder.getCount(); i++) {
      this.duder.addPosition(i, Math.cos(time / 1000 + i) * 0.01, Math.sin(time / 1000 + i) * 0.01);
    }
    this.pTime = time;
  }
}
