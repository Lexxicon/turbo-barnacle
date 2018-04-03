import { Vector2 } from "three";
import * as THREE from "three";
import { QuadTree } from "util/quadTree";
import { Rectangle } from "util/rectangle";

interface BoidMemory {
  point: Vector2;
  velocity: Vector2;
  acceleration: Vector2;
}

interface NearResult {
  loc: { x: number, y: number };
  boid: BoidMemory;
  length: number;
}
const sensorSize = 5;
const wantedSeparation = 1.6;
const neighborSize = 5;
const maxSpeed = .1;
const maxForce = .05;

export class Flocking {

  private quadTree: QuadTree<BoidMemory>;
  private boids: BoidMemory[];

  private maxRot = Math.PI / 4;
  private maxAccel = 0.1;

  constructor(public worldSize: number) {
    this.quadTree = new QuadTree(new Rectangle(0, 0, this.worldSize, this.worldSize), 13, 4);
    this.boids = [];
  }

  private randomAngle() {
    return new THREE.Vector2((Math.random() + 0.1) * 2 - 1, (Math.random() + 0.1) * 2 - 1).normalize();
  }

  public add(point: Vector2) {
    const b = {
      point,
      velocity: this.randomAngle(),
      acceleration: this.randomAngle(),
    };

    this.boids.push(b);
    const add = this.quadTree.add(b);
  }

  private findAvg(points: Array<{ x: number, y: number }>) {
    const avg = points.reduce((a, b) => ({ x: a.x + b.x, y: a.y + b.y }), { x: 0, y: 0 });
    avg.x /= points.length;
    avg.y /= points.length;
    return avg;
  }

  private sub<T extends { loc: { x: number, y: number } }>(b: BoidMemory) {
    return (a: T) => {
      a.loc.x -= b.point.x;
      a.loc.y -= b.point.y;

      return a;
    };
  }

  private length(a: { x: number, y: number }) {
    return Math.sqrt(a.x * a.x + a.y * a.y);
  }

  private addLength<T>(a: T & { loc: { x: number, y: number }, length?: number }): T & { length: number } {
    a.length = this.length(a.loc);
    return a as T & { length: number };
  }

  private separateDir(boid: BoidMemory, nearBy: NearResult[]) {
    const result = new THREE.Vector2(0, 0);
    if (nearBy.length === 0) { return result; }

    const scratch = new THREE.Vector2(0, 0);

    for (const n of nearBy) {
      scratch.set(n.loc.x, n.loc.y);
      scratch.normalize().divideScalar(n.length * n.length);
      result.add(scratch);
    }

    result.normalize();
    result.multiplyScalar(-maxSpeed);
    result.clampLength(0, maxForce);

    return result;
  }

  private alignDir(boid: BoidMemory, nearBy: NearResult[]) {
    const result = new THREE.Vector2(0, 0);
    if (nearBy.length === 0) { return result; }

    nearBy.filter((p) => p.length < neighborSize).forEach((p) => result.add(p.boid.velocity));

    result.normalize();
    result.multiplyScalar(maxSpeed);
    result.sub(boid.velocity);
    result.clampLength(0, maxForce);
    return result;
  }

  private cohesion(boid: BoidMemory, nearBy: NearResult[]) {
    let result = new THREE.Vector2(0, 0);
    if (nearBy.length === 0) { return result; }

    const scratch = new THREE.Vector2(0, 0);
    nearBy.forEach((e) => {
      result.add(scratch.set(e.loc.x, e.loc.y));
    });

    result.divideScalar(nearBy.length);
    result = this.seek(boid.point, boid.velocity, result);
    return result;
  }

  public update(delta: number) {
    const halfSize = sensorSize / 2;
    const selectArea = new Rectangle(0, 0, sensorSize, sensorSize);

    for (const boid of this.boids) {
      selectArea.x = boid.point.x - halfSize;
      selectArea.y = boid.point.y - halfSize;

      const nearBy: NearResult[] = this.selectArea(selectArea)
        .map(this.sub(boid))
        .map((a) => this.addLength(a))
        .filter((a) => a.length <= sensorSize && a.length !== 0);

      const sepForce = this.separateDir(boid, nearBy.filter((a) => a.length < wantedSeparation));
      sepForce.multiplyScalar(1.1);
      const alignForce = this.alignDir(boid, nearBy);
      const cohesionForce = this.cohesion(boid, nearBy);

      boid.acceleration.add(sepForce);
      boid.acceleration.add(alignForce);
      boid.acceleration.add(cohesionForce);
    }

    this.apply(delta);

    // rebuild quad tree after we've moved everything
    const r = this.quadTree.validate();
    for (const boid of r) {
      this.quadTree.add(boid);
    }
  }

  private hasNans(t: Vector2) {
    return t.x !== t.x || t.y !== t.y;
  }

  public apply(delta: number) {
    const scratch = new THREE.Vector2(0.1, 0.1);
    for (const b of this.boids) {
      b.velocity.add(b.acceleration.multiplyScalar(0.05));
      b.acceleration.set(0, 0);
      b.velocity.clampLength(0, maxSpeed);
      b.point.add(b.velocity);
      this.wrapBoid(b);
    }
  }

  private seek(position: Vector2, velocity: Vector2, target: Vector2) {
    const result = new THREE.Vector2();
    result.copy(target);

    result.normalize();
    result.multiplyScalar(maxSpeed);
    result.sub(velocity);
    result.clampLength(0, maxForce);
    return result;
  }

  public selectArea(selectArea: Rectangle) {
    interface Wrapper { loc: { x: number, y: number }; boid: BoidMemory; }
    const nearBy: Wrapper[] = [];
    const origin = { x: selectArea.x, y: selectArea.y };
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const offsetX = this.worldSize * i;
        const offsetY = this.worldSize * j;
        selectArea.x = origin.x + offsetX;
        selectArea.y = origin.y + offsetY;
        const rslt = this.quadTree.select(selectArea)
          .map((b) => ({
            loc: { x: b.point.x - offsetX, y: b.point.y - offsetY },
            boid: b
          }));
        nearBy.push(...rslt);
      }
    }

    return nearBy;
  }

  private wrapBoid(boid: BoidMemory) {
    boid.point.x = (this.worldSize + boid.point.x) % this.worldSize;
    boid.point.y = (this.worldSize + boid.point.y) % this.worldSize;

  }
}
