import fs from "fs";
import Sequence, { asSequence, emptySequence, sequenceOf } from "sequency";

function main() {
  const data: string = fs.readFileSync('./rsrc/input.txt', 'utf8');
  const grid = parseInput(data);

  console.log(`Part 1: ${mainPart1(grid)}`);
  console.log(`Part 2: ${mainPart2(grid)}`);
}

function mainPart1(grid: Grid<number>): number {
  const trailheads: Sequence<[number, number]> =
    asSequence(grid.coordinates()).filter(([row, col]) => grid.get(row, col) === 0);
  return trailheads
    .map(([row, col]) => {
      return dfs([row, col], grid)
        .map(pos => JSON.stringify(pos))
        .toSet()
        .size;
    })
    .sum();
}

function mainPart2(grid: Grid<number>): number {
  const trailheads: Sequence<[number, number]> =
    asSequence(grid.coordinates()).filter(([row, col]) => grid.get(row, col) === 0);
  return trailheads
    .map(([row, col]) => {
      return dfs([row, col], grid)
        .map(pos => JSON.stringify(pos))
        .count();
    })
    .sum();
}

function parseInput(data: string): Grid<number> {
  const lines: string[] = data.split("\n").filter(l => l.length > 0);
  return new Grid<number>(
    asSequence(lines).flatMap(l => asSequence(l).map(e => Number(e))).toArray(),
    lines.length);
}

function dfs([row, col]: [number, number], grid: Grid<number>): Sequence<[number, number]> {
  if (!grid.isInBounds(row, col))
    return emptySequence();
  if (grid.get(row, col) === 9)
    return sequenceOf([row, col]);
  const neighbours: Sequence<[number, number]> =
    sequenceOf([row - 1, col], [row, col + 1], [row + 1, col], [row, col - 1]);
  return neighbours
    .filter(([r, c]) => grid.isInBounds(r, c))
    .filter(([r, c]) => grid.get(r, c) === grid.get(row, col) + 1)
    .flatMap(pos => dfs(pos, grid));
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

  public get(row: number, col: number): T {
    if (!this.isInBounds(row, col))
      throw new Error("Coordinates out of bounds");
    return this.data[this.toIndex(row, col)];
  }

  public isInBounds(row: number, col: number): boolean {
    return 0 <= row && row < this.rows && 0 <= col && col < this.cols;
  }

  public* coordinates(): Generator<[number, number]> {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        yield [row, col];
      }
    }
  }

  public stringify(): string {
    let result = "";
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        result += this.get(row, col);
      }
      if (row != this.rows - 1)
        result += "\n";
    }
    return result;
  }

  private toIndex(row: number, col: number): number { return row * this.cols + col; }
}

main();
