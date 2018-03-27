import * as KeyCodes from "keycode-js";
import { Mesh, Scene, Vector2 } from "three";
import * as THREE from "three";
import { Input } from "./input";

export class BlendIn {
  private dude: Mesh;
  private dir: Vector2;
  private speed: number;

  constructor(private scene: Scene, private input: Input) {
    const geo = new THREE.PlaneGeometry(1, 1, 1, 1);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
    this.dude = new THREE.Mesh(geo, mat);
    this.dir = new THREE.Vector2(0, 0);
    this.speed = 0.5;
    scene.add(this.dude);

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
    this.handleInput();
    this.dude.position.x += this.dir.x * this.speed;
    this.dude.position.y += this.dir.y * this.speed;
    //
  }
}
