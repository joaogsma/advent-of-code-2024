import fs from "fs";
import { asSequence } from "sequency";

function main() {
  const data: string = fs.readFileSync('./rsrc/input.txt', 'utf8');
  const grid: Grid = parseInput(data);

  console.log(`Part 1: ${mainPart1(grid)}`);
  console.log(`Part 2: ${mainPart2(grid)}`);
}

function parseInput(data: string): Grid {
  const lines: string[] = data.split("\n").filter(l => l.length > 0);
  return new Grid(
    asSequence(lines).flatMap(l => asSequence(l)).toArray(),
    lines.length);
}

function mainPart1(grid: Grid): number {
  return asSequence(grid.coordinates())
    .map(start => countXmasMatches(grid, start))
    .sum();
}

function mainPart2(grid: Grid): number {
  return asSequence(grid.coordinates())
    .filter(start => isCenterAInXShapedMas(grid, start))
    .count();
}

function countXmasMatches(grid: Grid, start: [number, number]): number {
  const word = "XMAS";
  return (matchesUp(word, grid, start) ? 1 : 0)
    + (matchesUpRight(word, grid, start) ? 1 : 0)
    + (matchesRight(word, grid, start) ? 1 : 0)
    + (matchesDownRight(word, grid, start) ? 1 : 0)
    + (matchesDown(word, grid, start) ? 1 : 0)
    + (matchesDownLeft(word, grid, start) ? 1 : 0)
    + (matchesLeft(word, grid, start) ? 1 : 0)
    + (matchesUpLeft(word, grid, start) ? 1 : 0);
}

function isCenterAInXShapedMas(grid: Grid, start: [number, number]): boolean {
  const word = "MAS";
  const topLeft: [number, number] = [start[0] - 1, start[1] - 1];
  const bottomRight: [number, number] = [start[0] + 1, start[1] + 1];
  const topRight: [number, number] = [start[0] - 1, start[1] + 1];
  const bottomLeft: [number, number] = [start[0] + 1, start[1] - 1];

  const diagonal1Matches: boolean = matchesDownRight(word, grid, topLeft) || matchesUpLeft(word, grid, bottomRight);
  const diagonal2Matches: boolean = matchesDownLeft(word, grid, topRight) || matchesUpRight(word, grid, bottomLeft);

  return diagonal1Matches && diagonal2Matches;
}

function matchesUp(word: string, grid: Grid, start: [number, number]): boolean {
  return matches(word, grid, start, (r, c) => [r - 1, c]);
}

function matchesUpRight(word: string, grid: Grid, start: [number, number]): boolean {
  return matches(word, grid, start, (r, c) => [r - 1, c + 1]);
}

function matchesRight(word: string, grid: Grid, start: [number, number]): boolean {
  return matches(word, grid, start, (r, c) => [r, c + 1]);
}

function matchesDownRight(word: string, grid: Grid, start: [number, number]): boolean {
  return matches(word, grid, start, (r, c) => [r + 1, c + 1]);
}

function matchesDown(word: string, grid: Grid, start: [number, number]): boolean {
  return matches(word, grid, start, (r, c) => [r + 1, c]);
}

function matchesDownLeft(word: string, grid: Grid, start: [number, number]): boolean {
  return matches(word, grid, start, (r, c) => [r + 1, c - 1]);
}

function matchesLeft(word: string, grid: Grid, start: [number, number]): boolean {
  return matches(word, grid, start, (r, c) => [r, c - 1]);
}

function matchesUpLeft(word: string, grid: Grid, start: [number, number]): boolean { 
  return matches(word, grid, start, (r, c) => [r - 1, c - 1]);
}

function matches(
  word: string,
  grid: Grid,
  start: [number, number],
  move: (r: number, c: number) => [number, number]
): boolean {
  let [row, col] = start;
  for (let i: number = 0; i < word.length; i++) {
    if (!grid.isInBounds(row, col) || grid.get(row, col) != word[i])
      return false;
    [row, col] = move(row, col);
  }
  return true;
}


class Grid {
  constructor(
    private readonly data: string[],
    public readonly rows: number,
    public readonly cols: number = data.length / rows
  ) {
    if (data.length != rows * cols)
      throw new Error("Invalid shape");
  }

  public get(row: number, col: number): string {
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
