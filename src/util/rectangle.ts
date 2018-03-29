import { Vector2, Vector3 } from "three";

export class Rectangle {

  constructor(public x: number, public y: number, public w: number, public h: number) { }

  public contains(tX: number | Vector2 | Vector3, tY?: number) {
    if (!(typeof tX === "number")) {
      tY = tX.y;
      tX = tX.x;
    }
    if (tY === undefined) {
      throw new Error("no Y value");
    }
    return tX >= this.x && tX <= this.x + this.w
      && tY >= this.y && tY <= this.y + this.h;
  }

  public intersects(test: Rectangle) {
    return this.x <= test.x + test.w &&
      this.x + this.w >= test.x &&
      this.y <= test.y + test.h &&
      this.h + this.y >= test.y;
  }
}
