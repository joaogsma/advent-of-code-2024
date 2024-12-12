import fs from "fs";
import Sequence, { asSequence, sequenceOf } from "sequency";

function main() {
  const data: string = fs.readFileSync('./rsrc/input.txt', 'utf8');
  const grid: Grid<string> = parseInput(data);
  const garden = new Garden(grid);

  console.log(`Part 1: ${mainPart1(garden)}`);
  console.log(`Part 2: ${mainPart2(garden)}`);
}

function mainPart1(garden: Garden): number {
  return asSequence(garden.regions)
    .map(region => region.area * region.perimeter)
    .sum();
}

function mainPart2(garden: Garden): number {
  return asSequence(garden.regions)
    .map(region => region.area * region.sides)
    .sum();
}

function parseInput(data: string): Grid<string> {
  const lines: string[] = data.split("\n").filter(l => l.length > 0);
  return new Grid<string>(
    asSequence(lines).flatten().toArray(),
    lines.length);

}

class Garden {
  public readonly regions: Region[];

  constructor(private readonly grid: Grid<string>) {
    this.regions = [];
    let remainingCoordinates: HashSet<Coordinates> = new HashSet(this.grid.coordinates());
    while (remainingCoordinates.size > 0) {
      const region = this.findRegion(asSequence(remainingCoordinates).first());
      this.regions.push(region);
      remainingCoordinates = remainingCoordinates.difference(region.coordinates);
    }
  }

  private findRegion(pos: Coordinates): Region {
    const coordinates: HashSet<Coordinates> = new HashSet();
    this.findRegionRec(pos, coordinates);
    return new Region(this.grid.get(pos), coordinates);
  }

  private findRegionRec(
    pos: Coordinates,
    visited: HashSet<Coordinates>
  ): void {
    if (visited.has(pos))
      return;
    visited.add(pos);
    sequenceOf(pos.stepUp(), pos.stepRight(), pos.stepDown(), pos.stepLeft())
      .filter(neighbour => this.grid.isInBounds(neighbour))
      .filter(neighbour => this.grid.get(pos) === this.grid.get(neighbour))
      .forEach(neighbour => this.findRegionRec(neighbour, visited));
  }
}

class Region {
  private readonly edge: HashSet<Coordinates>;
  public readonly perimeter: number;
  public readonly sides: number;

  constructor(public readonly plantType: string, public readonly coordinates: HashSet<Coordinates>) {
    if (coordinates.size === 0)
      throw new Error("Empty coordinates");

    this.edge = new HashSet();
    let perimeterCount: number = 0;
    let convexCornerCount: number = 0;
    let concaveCornerCount: number = 0;

    for (const pos of coordinates) {
      const topIsInside = coordinates.has(pos.stepUp());
      const rightIsInside = coordinates.has(pos.stepRight());
      const bottomIsInside = coordinates.has(pos.stepDown());
      const leftIsInside = coordinates.has(pos.stepLeft());

      const insideNeighbourCount: number =
        sequenceOf(topIsInside, rightIsInside, bottomIsInside, leftIsInside).filter(e => e).count();
      if (insideNeighbourCount === 4)
        continue;
      perimeterCount += 4 - insideNeighbourCount;
      this.edge.add(pos);

      const convexCornerRules: Sequence<boolean> =
        sequenceOf(
          !topIsInside && !rightIsInside,
          !rightIsInside && !bottomIsInside,
          !bottomIsInside && !leftIsInside,
          !leftIsInside && !topIsInside)
      convexCornerCount += convexCornerRules.filter(e => e).count();

      const topRightIsInside = coordinates.has(pos.stepUp().stepRight());
      const bottomRightIsInside = coordinates.has(pos.stepDown().stepRight());
      const bottomLeftIsInside = coordinates.has(pos.stepDown().stepLeft());
      const topLeftIsInside = coordinates.has(pos.stepUp().stepLeft());

      const concaveCornerRules: Sequence<boolean> =
        sequenceOf(
          !topIsInside && topLeftIsInside && leftIsInside,
          !topIsInside && topRightIsInside && rightIsInside,
          !rightIsInside && topRightIsInside && topIsInside,
          !rightIsInside && bottomRightIsInside && bottomIsInside,
          !bottomIsInside && bottomRightIsInside && rightIsInside,
          !bottomIsInside && bottomLeftIsInside && leftIsInside,
          !leftIsInside && bottomLeftIsInside && bottomIsInside,
          !leftIsInside && topLeftIsInside && topIsInside);
      concaveCornerCount += concaveCornerRules.filter(e => e).count();
    }

    this.perimeter = perimeterCount;
    this.sides = convexCornerCount + concaveCornerCount / 2;
  }

  public get area(): number { return this.coordinates.size; }
}

type Hash = string | number;

interface Hashable {
  hashCode(): Hash;
}

class Coordinates implements Hashable {
  constructor(public readonly row: number, public readonly col: number) {}

  public equals(other: Coordinates): boolean { return this.row === other.row && this.col === other.col; }
  public hashCode(): Hash { return JSON.stringify(this); }

  public stepUp(): Coordinates { return this.step(Direction.Up) }
  public stepDown(): Coordinates { return this.step(Direction.Down); }
  public stepRight(): Coordinates { return this.step(Direction.Right); }
  public stepLeft(): Coordinates { return this.step(Direction.Left); }
  public step(direction: Direction): Coordinates {
    return new Coordinates(this.row + direction.deltaRow, this.col + direction.deltaCol);
  }
}

class Direction {
  public static Up: Direction = new Direction(-1, 0);
  public static Down: Direction = new Direction(+1, 0);
  public static Right: Direction = new Direction(0, +1);
  public static Left: Direction = new Direction(0, -1);

  private constructor(public readonly deltaRow: number, public readonly deltaCol: number) {}

  public equals(other: Direction): boolean {
    return this.deltaRow === other.deltaRow && this.deltaCol === other.deltaCol;
  }
}

class Grid<T> {
  constructor(
    private readonly data: T[],
    public readonly rows: number,
    public readonly cols: number = data.length / rows
  ) {
    if (data.length != rows * cols)
      throw new Error("Invalid shape");
  }

  public get(pos: Coordinates): T {
    if (!this.isInBounds(pos))
      throw new Error("Coordinates out of bounds");
    return this.data[this.toIndex(pos.row, pos.col)];
  }

  public isInBounds(pos: Coordinates): boolean {
    return 0 <= pos.row && pos.row < this.rows && 0 <= pos.col && pos.col < this.cols;
  }

  public* coordinates(): Generator<Coordinates> {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        yield new Coordinates(row, col);
      }
    }
  }

  public stringify(): string {
    let result = "";
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        result += this.get(new Coordinates(row, col));
      }
      if (row != this.rows - 1)
        result += "\n";
    }
    return result;
  }

  private toIndex(row: number, col: number): number { return row * this.cols + col; }
}

class HashSet<V extends Hashable>  {
  private readonly data: Map<Hash, V> = new Map();

  constructor(iterable: Iterable<V> = []) {
    this.data = new Map();
    for (const item of iterable) {
      this.add(item);
    }
  }

  public get size(): number { return this.data.size; }
  
  public add(value: V): this {
    this.data.set(value.hashCode(), value);  
    return this;
  }
  
  public has(value: V): boolean {
    return this.data.has(value.hashCode());
  }
  
  delete(value: V): boolean { return this.data.delete(value.hashCode()); }
  
  clear(): void { this.data.clear(); }
    
  values() { return this.data.values(); }
  
  forEach(callbackFn: (value: V) => void): void {
    this.data.values().forEach(value => callbackFn(value));
  }

  union(other: HashSet<V>): HashSet<V> {
    const result = new HashSet(this);
    other.values().forEach(e => result.add(e));
    return result;
  }

  intersection(other: HashSet<V>): HashSet<V> {
    const result: HashSet<V> = new HashSet();
    asSequence(this.values())
      .filter(e => other.has(e))
      .forEach(e => result.add(e));
    return result;
  }

  difference(other: HashSet<V>): HashSet<V> {
    const result: HashSet<V> = new HashSet();
    asSequence(this.values())
      .filter(e => !other.has(e))
      .forEach(e => result.add(e));
    return result;
  }

  symmetricDifference(other: HashSet<V>): HashSet<V> {
    return this.difference(other).union(other.difference(this));
  }

  isSubsetOf(other: HashSet<V>): boolean {
    return asSequence(this.values()).all(e => other.has(e));
  }

  isSupersetOf(other: HashSet<V>): boolean {
    return other.isSubsetOf(this);
  }

  isDisjointFrom(other: HashSet<V>): boolean {
    return this.intersection(other).size === 0;
  }

  [Symbol.iterator]() { return this.data.values(); }

  public toJSON(): string {
    return asSequence(this).map(e => JSON.stringify(e)).joinTo({ prefix: "{ ", postfix: " }", separator: ", " });
  }
};


main();
