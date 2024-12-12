import fs from "fs";
import Sequence, { asSequence, emptySequence, generateSequence } from "sequency";

function main() {
  const data: string = fs.readFileSync('./rsrc/input.txt', 'utf8');
  const [towers, bounds] = parseInput(data);

  console.log(`Part 1: ${mainPart1(towers, bounds)}`);
  console.log(`Part 2: ${mainPart2(towers, bounds)}`);
}

function parseInput(data: string): [Map<string, Point[]>, Bounds] {
  const lines: string[] = data.split("\n").filter(l => l.length > 0);

  const bounds = new Bounds(new Point(0, lines.length - 1), new Point(lines[0].length - 1, 0));
  const towers: Map<string, Point[]> = new Map();

  for (let y = 0; y < lines.length; y++) {
    for (let x = 0; x < lines[0].length; x++) {
      const lineIndex: number = lines.length - 1 - y;
      const char: string = lines[lineIndex][x];
      if (char === ".") continue;
      if (!towers.has(char))
        towers.set(char, []);
      towers.get(char)?.push(new Point(x, y));
    }
  }

  return [towers, bounds];
}

function mainPart1(towers: Map<string, Point[]>, bounds: Bounds): number {
  return asSequence(towers.values())
    .flatMap(locations => {
      const antinodes: Point[] = [];
      for (let i = 0; i < locations.length; i++) {
        for (let j = 0; j < locations.length; j++) {
          if (i === j) continue;
          const tower1: Point = locations[i];
          const tower2: Point = locations[j];
          const vec = tower1.minus(tower2);
          antinodes.push(tower2.plus(vec));
          antinodes.push(tower1.plus(vec.times(-1)));
        }
      }
      return asSequence(antinodes);
    })
    .filter(antinode => bounds.contains(antinode))
    .map(antinode => antinode.hash())
    .toSet()
    .size;
}

function mainPart2(towers: Map<string, Point[]>, bounds: Bounds): number {
  return asSequence(towers.values())
    .flatMap(locations => {
      const antinodes: Point[] = [];
      for (let i = 0; i < locations.length; i++) {
        for (let j = 0; j < locations.length; j++) {
          if (i === j) continue;
          const tower1: Point = locations[i];
          const tower2: Point = locations[j];
          const vec = tower1.minus(tower2);
          generateSequence(tower2, p => p.plus(vec))
            .takeWhile(antinode => bounds.contains(antinode))
            .forEach(antinode => antinodes.push(antinode));
          generateSequence(tower1, p => p.plus(vec.times(-1)))
            .takeWhile(antinode => bounds.contains(antinode))
            .forEach(antinode => antinodes.push(antinode));
        }
      }
      return asSequence(antinodes);
    })
    .map(antinode => antinode.hash())
    .toSet()
    .size;
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
