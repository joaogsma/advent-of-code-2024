import fs from "fs";
import Sequence, { asSequence, emptySequence } from "sequency";

function main() {
  const data: string = fs.readFileSync('./rsrc/input.txt', 'utf8');
  const [obstacles, guard, bounds] = parseInput(data);

  const obstaclesByXCoord: Map<number, Point[]> = asSequence(obstacles).groupBy(p => p.x);
  const obstaclesByYCoord: Map<number, Point[]> = asSequence(obstacles).groupBy(p => p.y);

  console.log(`Part 1: ${mainPart1(obstaclesByXCoord, obstaclesByYCoord, guard, bounds)}`);
  console.log(`Part 2: ${mainPart2(obstaclesByXCoord, obstaclesByYCoord, guard, bounds)}`);
}

function parseInput(data: string): [Set<Point>, Guard, Bounds] {
  const lines: string[] = data.split("\n").filter(l => l.length > 0);
  
  let obstacles: Set<Point> = new Set<Point>;
  let guard: Guard = new Guard(new Point(0, 0), Vector.Up);

  for (let y = 0; y < lines.length; y++) {
    for (let x = 0; x < lines[0].length; x++) {
      const lineIndex: number = lines.length - 1 - y;
      switch (lines[lineIndex][x]) {
        case ".": continue;
        case "#":
          obstacles.add(new Point(x, y));
          break;
        case "^":
          guard = new Guard(new Point(x, y), Vector.Up);
          break;
        default: throw new Error(`Unknown character ${lines[lineIndex][x]}`)
      }
    }
  }

  const bounds = new Bounds(new Point(0, lines.length - 1), new Point(lines[0].length - 1, 0));
  return [obstacles, guard, bounds];
}

function mainPart1(
  obstaclesByXCoord: Map<number, Point[]>,
  obstaclesByYCoord: Map<number, Point[]>,
  guard: Guard,
  bounds: Bounds
): number {
  return traverse(obstaclesByXCoord, obstaclesByYCoord, guard, bounds)
    .map(point => point.hash())
    .toSet()
    .size;
}

function mainPart2(
  obstaclesByXCoord: Map<number, Point[]>,
  obstaclesByYCoord: Map<number, Point[]>,
  guard: Guard,
  bounds: Bounds
): number {
  const candidatePositions: Point[] = [];
  const seenHashes: Set<string> = new Set<string>().add(guard.position.hash());
  traverse(obstaclesByXCoord, obstaclesByYCoord, guard, bounds)
    .filter(point => !seenHashes.has(point.hash()))
    .forEach(point => {
      seenHashes.add(point.hash());
      candidatePositions.push(point);
    });
  
  return asSequence(candidatePositions)
    .filter(pos => {
      const newObstaclesByXCoord = new Map(obstaclesByXCoord);
      const newObstaclesByYCoord = new Map(obstaclesByYCoord);
      newObstaclesByXCoord.set(pos.x, [pos, ...(obstaclesByXCoord.get(pos.x) || [])]);
      newObstaclesByYCoord.set(pos.y, [pos, ...(obstaclesByYCoord.get(pos.y) || [])]);
      return isCycle(newObstaclesByXCoord, newObstaclesByYCoord, guard, bounds);
    })
    .count();
}

function traverse(
  obstaclesByXCoord: Map<number, Point[]>,
  obstaclesByYCoord: Map<number, Point[]>,
  guard: Guard,
  bounds: Bounds
): Sequence<Point> {
  if (!bounds.contains(guard.position)) return emptySequence();
  const posAfterStep: Point = guard.position.plus(guard.direction);
  const isBlockedOnXCoord: boolean =
    obstaclesByXCoord.get(posAfterStep.x)?.some(p => p.equals(posAfterStep)) || false;
  const isBlockedOnYCoord: boolean =
    obstaclesByYCoord.get(posAfterStep.y)?.some(p => p.equals(posAfterStep)) || false;
  if (isBlockedOnXCoord || isBlockedOnYCoord)
    return traverse(obstaclesByXCoord, obstaclesByYCoord, guard.rotate(), bounds).plus(guard.position);
  return traverse(obstaclesByXCoord, obstaclesByYCoord, guard.step(), bounds).plus(guard.position);
}

function isCycle(
  obstaclesByXCoord: Map<number, Point[]>,
  obstaclesByYCoord: Map<number, Point[]>,
  guard: Guard,
  bounds: Bounds
): boolean {
  const history: Set<string> = new Set();
  let current: Guard = guard;

  while (bounds.contains(current.position) && !history.has(current.hash())) {
    history.add(current.hash());
    const posAfterStep: Point = current.position.plus(current.direction);
    const isBlockedOnXCoord: boolean =
      obstaclesByXCoord.get(posAfterStep.x)?.some(p => p.equals(posAfterStep)) || false;
    const isBlockedOnYCoord: boolean =
      obstaclesByYCoord.get(posAfterStep.y)?.some(p => p.equals(posAfterStep)) || false;
    if (isBlockedOnXCoord || isBlockedOnYCoord) {
      current = current.rotate();
    } else {
      current = current.step();
    }
  }

  return bounds.contains(current.position);
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

class Guard {
  public readonly direction: Vector;

  constructor(public readonly position: Point, direction: Vector) {
    this.direction = direction.normalize();
  }

  public step(): Guard {
    return new Guard(this.position.plus(this.direction), this.direction);
  }

  public rotate(): Guard {
    if (this.direction.equals(Vector.Up)) return new Guard(this.position, Vector.Right);
    if (this.direction.equals(Vector.Right)) return new Guard(this.position, Vector.Down);
    if (this.direction.equals(Vector.Down)) return new Guard(this.position, Vector.Left);
    if (this.direction.equals(Vector.Left)) return new Guard(this.position, Vector.Up);
    throw new Error("Non-unit direction");
  }

  public hash(): string { return JSON.stringify(this); }
}

class Bounds {
  constructor(private readonly topLeft: Point, private readonly bottomRight: Point) {
    if (bottomRight.x <= topLeft.x || bottomRight.y >= topLeft.y)
      throw new Error("Invalid bounds");
  }

  public contains(p: Point): boolean {
    return this.topLeft.x <= p.x && p.x <= this.bottomRight.x
      && this.bottomRight.y <= p.y && p.y <= this.topLeft.y;
  }
}

main();
