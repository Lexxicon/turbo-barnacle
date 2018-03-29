import { Vector2 } from "three";
import * as THREE from "three";
import { QuadTree } from "util/quadTree";
import { Rectangle } from "util/rectangle";

interface BoidMemory {
  point: Vector2;
  direction: Vector2;
  targetDir: Vector2;
  velocity: number;
  targetVel: number;
}

export class Flocking {

  private quadTree: QuadTree<BoidMemory>;
  private boids: BoidMemory[];

  private maxRot = Math.PI / 4;
  private maxAccel = 0.1;

  constructor(public worldSize: number) {
    this.quadTree = new QuadTree(new Rectangle(0, 0, this.worldSize, this.worldSize), 4);
    this.boids = [];
  }

  public add(point: Vector2) {
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

  private widen<T extends { a: any, b: any }, K extends T>(a: T): T & { a: any } {
    return a;
  }

  private length(a: { x: number, y: number }) {
    return Math.sqrt(a.x * a.x + a.y * a.y);
  }

  private addLength<T>(a: T & { loc: { x: number, y: number }, length?: number }): T & { length: number } {
    a.length = this.length(a.loc);
    return a as T & { length: number };
  }

  public update(delta: number) {
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

  public selectArea(selectArea: Rectangle) {
    interface Wrapper { loc: { x: number, y: number }; boid: BoidMemory; }
    const nearBy: Wrapper[] = [];
    const merge = (target: Wrapper[], arr: Wrapper[]) => Array.prototype.push.apply(target, arr);
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

  public apply(delta: number) {
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

  private clamp(boid: BoidMemory) {
    boid.point.x = this.wrap(boid.point.x, this.worldSize);
    boid.point.y = this.wrap(boid.point.y, this.worldSize);

  }

  private wrap(x: number, max: number) {
    if (x > max) {
      return x % max;
    }

    if (x < 0) {
      return max + (x % max);
    }

    return x;
  }
}
