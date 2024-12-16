import fs from "fs";
import Sequence, { asSequence, sequenceOf } from "sequency";
import { Hash, Hashable, HashMap, HashSet } from "./hash";
import { Coordinates, Direction, Grid } from "./grid";


enum Cell { Empty, Wall }

function main() {
  const data: string = fs.readFileSync('./rsrc/input.txt', 'utf8');
  let [start, end, race] = parseInput(data);

  console.log(`Part 1: ${mainPart1(start, end, race)}`);
  console.log(`Part 2: ${mainPart2(start, end, race)}`);
}

function mainPart1(start: Coordinates, end: Coordinates, race: ReinDjeekstra): number {
  const shortestDistances: HashMap<Reindeer, [number, HashSet<Reindeer>]> = race.solve(start, end);

  const possibleEnds: Sequence<Reindeer> =
    sequenceOf(
      new Reindeer(end, Direction.Up),
      new Reindeer(end, Direction.Right),
      new Reindeer(end, Direction.Down),
      new Reindeer(end, Direction.Left));

  return possibleEnds
    .map(reindeer => shortestDistances.get(reindeer)![0])
    .min()!;
}

function mainPart2(start: Coordinates, end: Coordinates, race: ReinDjeekstra): number {
  const shortestDistances: HashMap<Reindeer, [number, HashSet<Reindeer>]> = race.solve(start, end);

  const seen: HashSet<Coordinates> = new HashSet();
  const queue: Reindeer[] = [];
  let headIdx: number = 0;

  const possibleEnds: Reindeer[] = [
    new Reindeer(end, Direction.Up),
    new Reindeer(end, Direction.Right),
    new Reindeer(end, Direction.Down),
    new Reindeer(end, Direction.Left)
  ];
  const bestPathCost = asSequence(possibleEnds).map(e => shortestDistances.get(e)![0]).min()!;
  possibleEnds.filter(e => shortestDistances.get(e)![0] === bestPathCost).forEach(e => queue.push(e));

  while (headIdx < queue.length) {
    const current: Reindeer = queue[headIdx++];
    seen.add(current.coordinates);
    const previous: HashSet<Reindeer> = shortestDistances.get(current)![1];
    queue.push(...previous);
  }

  // console.log(stringify(race.track, start, end, seen));

  return seen.size;
}

function parseInput(data: string): [Coordinates, Coordinates, ReinDjeekstra] {
  const lines: string[] = data.split("\n").map(l => l.trim()).filter(l => l.length > 0);

  const cells: Cell[] = [];
  let start: Coordinates;
  let end: Coordinates;

  for (let row = 0; row < lines.length; row++) {
    for (let col = 0; col < lines[0].length; col++) {
      const char: string = lines[row][col];
      if (char === "#") {
        cells.push(Cell.Wall);
        continue;
      }
      cells.push(Cell.Empty);
      if (char === "S")
        start = new Coordinates(row, col);
      else if (char === "E")
        end = new Coordinates(row, col);
    }
  }

  return [start!, end!, new ReinDjeekstra(new Grid(cells, lines.length))];
}

class Reindeer implements Hashable {
  constructor(public readonly coordinates: Coordinates, public readonly facing: Direction) {}

  public *neighbours(): Generator<Reindeer> {
    yield this.step();
    yield this.rotateCW();
    yield this.rotateCCW();
  }

  public step(): Reindeer { return new Reindeer(this.coordinates.step(this.facing), this.facing) }
  public rotateCW(): Reindeer { return new Reindeer(this.coordinates, this.facing.rotateCW()); }
  public rotateCCW(): Reindeer { return new Reindeer(this.coordinates, this.facing.rotateCCW()); }

  public equals(other: Reindeer): boolean {
    return this === other
      || (this.coordinates.equals(other.coordinates) && this.facing.equals(other.facing));
  }

  public hashCode(): Hash { return JSON.stringify(this); }
}

class ReinDjeekstra {
  constructor(
    public readonly track: Grid<Cell>) {}

  public solve(start: Coordinates, end: Coordinates): HashMap<Reindeer, [number, HashSet<Reindeer>]> {
    if (!this.track.isInBounds(start) || !this.track.isInBounds(end))
      throw new Error("Out of bounds start and/or end");

    const initReindeer = new Reindeer(start, Direction.Right);
    const visited: HashSet<Reindeer> = new HashSet();
    const shortestDistances: HashMap<Reindeer, [number, HashSet<Reindeer>]> =
      new HashMap<Reindeer, [number, HashSet<Reindeer>]>().set(initReindeer, [0, new HashSet()]);
    const queue: Reindeer[] = [initReindeer];
    let headIdx: number = 0;

    while (headIdx < queue.length) {
      const current = queue[headIdx++];
      if (visited.has(current)) continue;
      visited.add(current);
      const costToHere = shortestDistances.get(current)![0];

      for (const neighbour of current.neighbours()) {
        if (this.track.get(neighbour.coordinates) === Cell.Wall)
          continue;

        queue.push(neighbour);

        const costToNeighbour: number = costToHere + this.cost(current, neighbour);
        const [ previousCostToNeighbour, previousNeighbourOrigins ] =
          shortestDistances.get(neighbour) || [ Infinity, new HashSet() ];

        if (previousCostToNeighbour < costToNeighbour)
          continue;

        if (costToNeighbour === previousCostToNeighbour) {
          const updatedNeighbourOrigins = previousNeighbourOrigins.union(new HashSet([current]));
          shortestDistances.set(neighbour, [costToNeighbour, updatedNeighbourOrigins]);
          continue;
        }

        shortestDistances.set(neighbour, [costToNeighbour, new HashSet([current])]);
        visited.delete(neighbour);
      }
    }

    return shortestDistances;
  }

  public cost(from: Reindeer, to: Reindeer): number {
    if (from.step().equals(to))
      return 1;
    if (from.rotateCW().equals(to) || from.rotateCCW().equals(to))
      return 1000;
    throw new Error(`Cannot reach ${JSON.stringify(to)} from ${JSON.stringify(from)}`);
  }

  public costRoute(history: Reindeer[]): number {
    let cost = 0;
    for (let i = 0; i < history.length - 1; i++) {
      cost += this.cost(history[i], history[i+1]);
    }
    return cost;
  }
}

function stringify(grid: Grid<Cell>, start: Coordinates, end: Coordinates, bestPathPositions: Iterable<Coordinates>): string {
  let lines: string[] = grid.stringify().replaceAll("1", "#").replaceAll("0", ".").split("\n");
  const result: string[][] = asSequence(lines).map(s => asSequence(s).toArray()).toArray();

  for (const pos of bestPathPositions) {
    result[pos.row][pos.col] = "O";
  }

  result[start.row][start.col] = "S";
  result[end.row][end.col] = "E";
  
  return asSequence(result).map(chars => chars.join("")).joinToString({ separator: "\n" });
}

main();
