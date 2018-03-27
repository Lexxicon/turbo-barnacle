import {
  BufferAttribute,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  PlaneBufferGeometry,
  PlaneGeometry,
  Vector2,
  Vector3
} from "three";
import * as THREE from "three";

const loader = new THREE.FileLoader();

let fragSrc: string;
let vertSrc: string;

loader.load("./shaders/dude.frag", (d) => fragSrc = d);
loader.load("./shaders/dude.vert", (d) => vertSrc = d);

export class Dude {
  private positions: number[];
  private colors: number[];

  private geometry: InstancedBufferGeometry;

  private positionAttribute: BufferAttribute;
  private colorAttribute: BufferAttribute;

  private mesh: Mesh;

  constructor(count: number) {
    this.positions = [];
    this.colors = [];

    const base = new THREE.PlaneBufferGeometry(1, 1, 1, 1);

    this.geometry = new THREE.InstancedBufferGeometry();

    this.geometry.index = base.index;
    this.geometry.addAttribute("position", base.getAttribute("position"));
    this.geometry.addAttribute("uv", base.getAttribute("uv"));

    for (let i = 0; i < count; i++) {
      this.positions.push(0, 0);
      this.colors.push(Math.random(), Math.random(), Math.random());
    }

    this.positionAttribute = new THREE.InstancedBufferAttribute(new Float32Array(this.positions), 2).setDynamic(true);
    this.colorAttribute = new THREE.InstancedBufferAttribute(new Float32Array(this.colors), 3);

    this.geometry.addAttribute("offset", this.positionAttribute);
    this.geometry.addAttribute("color", this.colorAttribute);

    const material = new THREE.RawShaderMaterial({
      vertexShader: vertSrc,
      fragmentShader: fragSrc
    });

    this.mesh = new THREE.Mesh(this.geometry, material);
  }

  public getMesh() {
    return this.mesh;
  }

  public updatePosition(i: number, x: number, y: number) {
    this.positions[i * 2] = x;
    this.positions[i * 2 + 1] = y;
    this.positionAttribute.setXY(i, x, y);
    this.positionAttribute.needsUpdate = true;
  }

  public addPosition(i: number, x: number, y: number) {
    this.positions[i * 2] += x;
    this.positions[i * 2 + 1] += y;
    this.positionAttribute.setXY(i, this.positions[i * 2], this.positions[i * 2 + 1]);
    this.positionAttribute.needsUpdate = true;
  }
}
