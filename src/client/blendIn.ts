import * as KeyCodes from "keycode-js";
import { Camera, Mesh, Scene, Vector2 } from "three";
import * as THREE from "three";
import { Dude } from "./dude";
import { Input } from "./input";

export class BlendIn {
  private dir: Vector2;
  private speed: number;
  private pTime: number | undefined;
  private delta: number;

  private duder: Dude;

  constructor(private scene: Scene, private camera: Camera, private input: Input) {
    this.dir = new THREE.Vector2(0, 0);
    this.speed = 30;
    this.delta = 0;

    this.duder = new Dude(100);
    for (let i = 0; i < 100; i++) {
      this.duder.updatePosition(i, i % 10, Math.floor(i / 10));
    }

    scene.add(this.duder.getMesh());
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
    this.duder.addPosition(4, this.dir.x * this.speed * this.delta, this.dir.y * this.speed * this.delta);
  }

  public update(time: number) {
    if (!this.pTime) {
      this.pTime = time;
      return;
    }
    this.delta = (time - this.pTime) / 1000;

    this.handleInput();
    this.move();

    this.pTime = time;
  }
}
