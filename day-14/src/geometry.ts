import { Hashable } from "./hash";

export class Point implements Hashable {
  constructor(public readonly x: number, public readonly y: number) {}

  public plus(v: Vector): Point { return new Point(this.x + v.x, this.y + v.y); }
  public minus(p: Point): Vector { return new Vector(p.x - this.x, p.y - this.y); }
  public equals(p: Point): boolean { return this.x === p.x &&  this.y === p.y; }
  public hashCode(): string { return JSON.stringify(this); }
}

export class Vector implements Hashable {
  static readonly Up: Vector = new Vector(0, +1);
  static readonly Down: Vector = new Vector(0, -1);
  static readonly Left: Vector = new Vector(-1, 0);
  static readonly Right: Vector = new Vector(+1, 0);

  constructor(public readonly x: number, public readonly y: number) {}
  
  public plus(v: Vector): Vector { return new Vector(this.x + v.x, this.y + v.y); }
  public times(n: number): Vector { return new Vector(this.x * n, this.y * n); }
  public dotProduct(v: Vector): number { return this.x * v.x + this.y * v.y; }
  public magnitude(): number { return Math.sqrt(this.dotProduct(this)); }
  public normalize(): Vector {
    const mag: number = this.magnitude();
    return new Vector(this.x / mag, this.y / mag);
  }
  public equals(v: Vector): boolean { return this.x === v.x &&  this.y === v.y; }
  public hashCode(): string { return JSON.stringify(this); }
}

export class Bounds {
  constructor(public readonly topLeft: Point, public readonly bottomRight: Point) {
    if (bottomRight.x <= topLeft.x || bottomRight.y >= topLeft.y)
      throw new Error("Invalid bounds");
  }
  
  public contains(p: Point): boolean {
    return this.topLeft.x <= p.x && p.x <= this.bottomRight.x
      && this.bottomRight.y <= p.y && p.y <= this.topLeft.y;
  }
}
  