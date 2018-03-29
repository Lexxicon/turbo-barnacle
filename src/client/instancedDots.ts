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
  flatten(ar, a);
  return ar;
};

const flatten = (dest: Float32Array, a: Array<Vector2 | Vector3>) => {
  if (a.length === 0) {
    return dest;
  }
  const mapped: number[][] = a.map((v) => v.toArray());
  const size = mapped[0].length;
  for (let i = 0; i < mapped.length; i++) {
    dest.set(mapped[i], i * size);
  }
  return dest;
};

export class Dots {

  private positions: Vector2[];
  private positionBuffer: Float32Array;
  private sizeOfPos = 2;

  private color: Vector3[];
  private colorBuffer: Float32Array;
  private sizeOfColor = 3;

  private bufferSize: number;
  private currentSize: number = 0;

  private geometry: InstancedBufferGeometry;
  private material: Material;

  private positionAttribute: InstancedBufferAttribute;
  private colorAttribute: InstancedBufferAttribute;
  private idAttribute: InstancedBufferAttribute;

  private mesh: Mesh;

  private scratchVector: Vector2 = new THREE.Vector2(0, 0);

  public isPosDirty = true;
  public isColorDirty = true;

  private uniforms: { time: { value: number }, stime: { value: number } };

  constructor(count: number) {
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
    const ids: number[] = [];
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

  public getCurrentSize() {
    return this.currentSize;
  }

  public getBufferSize() {
    return this.bufferSize;
  }

  public getMesh() {
    return this.mesh;
  }

  public add(x: number, y: number) {
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

  public update(time: number) {
    this.rebuild();
  }

  private rebuild() {
    if (this.isColorDirty || this.isPosDirty) {
      this.currentSize = this.positions.length;
      this.geometry.maxInstancedCount = this.currentSize;
    } else {
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
