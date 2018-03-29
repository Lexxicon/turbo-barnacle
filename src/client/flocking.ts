import { Vector2 } from "three";
import * as THREE from "three";
import { QuadTree } from "util/quadTree";
import { Rectangle } from "util/rectangle";

interface BoidMemory {
  point: Vector2;
  direction: Vector2;
  velocity: number;
}

export class Flocking {

  private worldSize = 15;
  private quadTree: QuadTree<BoidMemory>;
  private boids: BoidMemory[];

  constructor() {
    this.quadTree = new QuadTree(new Rectangle(0, 0, this.worldSize, this.worldSize), 4);
    this.boids = [];
  }

  public add(point: Vector2) {
    const b = {
      point,
      direction: new THREE.Vector2(1, 0),
      velocity: 0
    };

    this.boids.push(b);
    const add = this.quadTree.add(b);
  }

  public update(delta: number) {
    const sensorSize = 5;
    const halfSize = sensorSize / 2;
    const selectArea = new Rectangle(0, 0, sensorSize, sensorSize);

    for (const boid of this.boids) {
      selectArea.x = boid.point.x - halfSize;
      selectArea.y = boid.point.y - halfSize;

      const nearBy = this.selectArea(selectArea);
      const avgPoint = nearBy.map((b) => b.loc).reduce((a, b) => ({ x: a.x + b.x, y: a.y + b.y }), { x: 0, y: 0 });
      avgPoint.x /= nearBy.length;
      avgPoint.y /= nearBy.length;
      avgPoint.x -= boid.point.x;
      avgPoint.y -= boid.point.y;
      if (nearBy.length > 1 && avgPoint.x === avgPoint.x && avgPoint.y === avgPoint.y) {
        boid.direction.set(avgPoint.x, avgPoint.y).normalize().negate();
      }
      boid.velocity = delta;
    }

    this.apply();
    const r = this.quadTree.validate();
    if (r.length > 0) {
      console.log(r[0]);
    }
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

  public apply() {
    const scratch = new THREE.Vector2(0.1, 0.1);
    for (const b of this.boids) {
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
