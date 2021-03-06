import { Vector2 } from "three";
import { Rectangle } from "./rectangle";

interface Entry {
  point: Vector2;
}

const merge = (a: any[], b: any[]) => Array.prototype.push.apply(a, b);

export class QuadTree<T extends Entry> {
  public content: T[] = [];

  private split: boolean = false;
  private subTree: Array<QuadTree<T>> = [];

  constructor(
    public bounds: Rectangle,
    public thresh: number,
    private maxDepth: number,
    private parent?: QuadTree<T>) { }

  public validate(): T[] {
    let removed: T[] = [];
    this.evict(removed);
    let root: QuadTree<T> = this;
    while (root.parent !== undefined) {
      root = root.parent;
    }
    removed = removed.filter((e) => !root.add(e));
    root.balance();
    return removed;
  }

  public balance() {
    this.subTree.forEach((e) => e.balance());
    if (!this.split) { return; }

    const count = this.subTree.map((e) => e.content.length).reduce((a, b) => a + b, this.content.length);
    if (count > this.thresh) { return; }

    this.subTree.forEach((t) => merge(this.content, t.content));
    this.subTree = [];
    this.split = false;
  }

  private evict(evicted: T[]) {
    merge(evicted, this.content.filter((e) => !this.bounds.contains(e.point)));
    this.content = this.content.filter((e) => this.bounds.contains(e.point));
    this.subTree.forEach((t) => t.evict(evicted));
  }

  public select(area: Rectangle): T[] {
    const result: T[] = [];
    if (!area.intersects(this.bounds)) {
      return result;
    }

    // this.content.filter((e) => area.contains(e.point)).forEach((e) => result.push(e));
    for (let i = 0; i < this.content.length; i++) {
      if (area.contains(this.content[i].point)) {
        result.push(this.content[i]);
      }
    }

    // this.subTree.map((tree) => tree.select(area)).forEach((e) => merge(result, e));
    for (let i = 0; i < this.subTree.length; i++) {
      merge(result, this.subTree[i].select(area));
    }

    return result;
  }

  public size(): number {
    return this.subTree.map((e) => e.size()).reduce((a, b) => a + b, this.content.length);
  }

  public add(item: T) {
    if (!this.bounds.contains(item.point)) {
      return false;
    }

    if (this.content.length < this.thresh || this.maxDepth === 0) {
      this.content.push(item);
      return true;
    }

    if (!this.split) {
      this.subdivide();
    }

    for (const sub of this.subTree) {
      if (sub.add(item)) {
        return true;
      }
    }

    return false;
  }

  private subdivide() {
    if (this.split) { return; }
    this.split = true;

    const x = this.bounds.x;
    const y = this.bounds.y;
    const halfW = this.bounds.w / 2;
    const halfH = this.bounds.h / 2;
    this.subTree.push(
      new QuadTree<T>(
        new Rectangle(x, y, halfH, halfW),
        this.thresh, this.maxDepth - 1, this));
    this.subTree.push(
      new QuadTree<T>(
        new Rectangle(x + halfW, y, halfH, halfW),
        this.thresh, this.maxDepth - 1, this));
    this.subTree.push(
      new QuadTree<T>(
        new Rectangle(x + halfW, y + halfH, halfH, halfW),
        this.thresh, this.maxDepth - 1, this));
    this.subTree.push(
      new QuadTree<T>(
        new Rectangle(x, y + halfH, halfH, halfW),
        this.thresh, this.maxDepth - 1, this));
  }
}
