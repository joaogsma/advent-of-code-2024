import fs from "fs";
import { asSequence } from "sequency";

function main() {
  const data: string = fs.readFileSync('./rsrc/input.txt', 'utf8');
  const clawMachines: [Vector, Vector, Point][] = parseInput(data);

  console.log(`Part 1: ${mainPart1(clawMachines)}`);
  console.log(`Part 2: ${mainPart2(clawMachines)}`);
}

function mainPart1(clawMachines: [Vector, Vector, Point][]): number {
  return asSequence(clawMachines)
    .map(([v1, v2, target]) => solveSystem(v1, v2, target))
    .filter(([a, b]) => 0 <= a && a <= 100 && 0 <= b && b <= 100)
    .filter(([a, b]) => Number.isInteger(a) && Number.isInteger(b))
    .map(([a, b]) => a * 3 + b * 1)
    .sum();
}

function mainPart2(clawMachines: [Vector, Vector, Point][]): number {
  const displacement = new Vector(10000000000000, 10000000000000);
  return asSequence(clawMachines)
    .map(([v1, v2, target]) => [v1, v2, target.plus(displacement)] as [Vector, Vector, Point])
    .map(([v1, v2, target]) => solveSystem(v1, v2, target))
    .filter(([a, b]) => 0 <= a && 0 <= b)
    .filter(([a, b]) => Number.isInteger(a) && Number.isInteger(b))
    .map(([a, b]) => a * 3 + b * 1)
    .sum();
}

function parseInput(data: string): [Vector, Vector, Point][] {
  const regex = new RegExp(/Button A: X(?<x1>(\+|-)\d+), Y(?<y1>(\+|-)\d+)\s+Button B: X(?<x2>(\+|-)\d+), Y(?<y2>(\+|-)\d+)\s+Prize: X=(?<x>(\+|-)?\d+), Y=(?<y>(\+|-)?\d+)\s*/gm);
  const result: [Vector, Vector, Point][] = [];
  for (const match of data.matchAll(regex)) {
    const v1 = new Vector(Number(match.groups?.["x1"]), Number(match.groups?.["y1"]));
    const v2 = new Vector(Number(match.groups?.["x2"]), Number(match.groups?.["y2"]));
    const target = new Point(Number(match.groups?.["x"]), Number(match.groups?.["y"]));
    result.push([v1, v2, target]);
  }
  return result;
}

/*
 * We want a and b for the following equation:
 * [x, y] = a*[x1, y1] + b*[x2, y2]
 * And to find them, we solving the following system of equations:
 * x = a*x1 + b*x2
 * y = a*y1 + b*y2
 **/
function solveSystem(v1: Vector, v2: Vector, target: Point): [number, number] {
  const { x: x1, y: y1 } = v1;
  const { x: x2, y: y2 } = v2;
  const { x, y } = target;

  const a = (x*y2 - y*x2) / (x1*y2 - y1*x2);
  const b = (x - a*x1) / x2;
  return [a, b];
}

class Point {
  constructor(public readonly x: number, public readonly y: number) {}

  public plus(v: Vector): Point { return new Point(this.x + v.x, this.y + v.y); }
  public minus(p: Point): Vector { return new Vector(p.x - this.x, p.y - this.y); }
  public equals(p: Point): boolean { return this.x === p.x &&  this.y === p.y; }
  public hash(): string { return JSON.stringify(this); }
}

class Vector {
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
  public hash(): string { return JSON.stringify(this); }
}

main();
