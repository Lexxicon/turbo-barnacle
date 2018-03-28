import {
  BufferAttribute,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Material,
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

const asBuffer = (a: Array<Vector2 | Vector3>, size: number) => {
  const ar = new Float32Array(size);
  ar.set(flatten(a));
  return ar;
};
const flatten = (a: Array<Vector2 | Vector3>) => {
  const mapped: number[][] = a.map((v) => v.toArray());
  return Array.prototype.concat.apply([], a.map((v) => v.toArray()));
};

export class Dude {

  private positions: Vector2[];
  private color: Vector3[];
  private bufferSize: number;
  private currentSize: number = 0;

  private geometry: InstancedBufferGeometry;
  private material: Material;

  private positionAttribute: InstancedBufferAttribute;
  private colorAttribute: InstancedBufferAttribute;

  private mesh: Mesh;

  private scratchVector: Vector2 = new THREE.Vector2(0, 0);

  private isPosDirty = true;
  private isColorDirty = true;

  constructor(count: number) {
    this.bufferSize = count;
    this.positions = [];
    this.color = [];

    const base = new THREE.PlaneBufferGeometry(1, 1, 1, 1);

    this.geometry = new THREE.InstancedBufferGeometry();
    this.geometry.maxInstancedCount = count;
    this.geometry.index = base.index;
    this.geometry.addAttribute("position", base.getAttribute("position"));
    this.geometry.addAttribute("uv", base.getAttribute("uv"));

    this.positionAttribute = new THREE.InstancedBufferAttribute(new Float32Array(count * 2), 2);
    this.positionAttribute.setDynamic(true);

    this.colorAttribute = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);

    this.geometry.addAttribute("offset", this.positionAttribute);
    this.geometry.addAttribute("color", this.colorAttribute);

    this.material = new THREE.RawShaderMaterial({
      vertexShader: vertSrc,
      fragmentShader: fragSrc
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
  }

  public getCurrentSize() {
    return this.currentSize;
  }

  public getCount() {
    return this.positions.length;
  }

  public getMesh() {
    return this.mesh;
  }

  public addDude(x: number, y: number) {
    this.positions.push(new THREE.Vector2(x, y));
    this.color.push(new THREE.Vector3(Math.random(), Math.random(), Math.random()));

    this.isPosDirty = true;
    this.isColorDirty = true;
  }

  public delete(i: number) {
    this.positions.splice(i, 1);
    this.color.splice(i, 1);

    this.isPosDirty = true;
    this.isColorDirty = true;
  }

  public rebuild() {
    if (this.isColorDirty || this.isPosDirty) {
      this.currentSize = this.positions.length;
      this.geometry.maxInstancedCount = this.currentSize;
    } else {
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

  public updatePosition(i: number, x: number, y: number) {
    this.positions[i].x = x;
    this.positions[i].y = y;

    this.isPosDirty = true;
  }

  public getPosition(i: number) {
    return this.positions[i];
  }

  public addPosition(i: number, x: number, y: number) {
    this.scratchVector.set(x, y);

    this.positions[i].add(this.scratchVector);

    this.isPosDirty = true;
  }
}
