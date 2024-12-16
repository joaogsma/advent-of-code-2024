import fs from "fs";
import Sequence, { asSequence, sequenceOf } from "sequency";
import { Bounds, Point, Vector } from "./geometry";
import { HashMap, HashSet } from "./hash";

const PRINT: boolean = false;
const SKIP: number = 0;
let ITERATION: number = 0;

async function main() {
  const data: string = fs.readFileSync('./rsrc/input.txt', 'utf8');
  const walls: HashSet<Point> = new HashSet();
  const boxes: HashMap<Point, HashSet<Point>> = new HashMap();
  let [robotPos, bounds, commands] = parseInput(data, walls, boxes);

  console.log(`Part 1: ${await mainPart1(robotPos, commands, walls, boxes, bounds)}`);
  console.log(`Part 2: ${await mainPart2(robotPos, commands, walls, boxes, bounds)}`);
}

async function mainPart1(
  robotPos: Point,
  commands:  Vector[],
  walls: HashSet<Point>,
  boxes: HashMap<Point, HashSet<Point>>,
  bounds: Bounds
): Promise<number> {
  const boxesCopy: HashMap<Point, HashSet<Point>> = new HashMap(boxes);

  if (PRINT) {
    console.log("Initial state:");
    console.log(stringify(bounds, walls, boxesCopy, robotPos));
  }

  runCommands(walls, boxesCopy, robotPos, commands, bounds);
  const uniqueGps =
    asSequence(boxesCopy)
      .map(([_, box]) => toGPS(box, bounds.topLeft.y))
      .toSet();
  return asSequence(uniqueGps).sum();
}

async function mainPart2(
  robotPos: Point,
  commands:  Vector[],
  walls: HashSet<Point>,
  boxes: HashMap<Point, HashSet<Point>>,
  bounds: Bounds
): Promise<number> {
  const wideWalls: HashSet<Point> = widenWalls(walls);
  const wideBoxes: HashMap<Point, HashSet<Point>> = widenBoxes(boxes);
  const wideRobotPos: Point = widenPoint(robotPos).first();
  const wideBounds: Bounds = new Bounds(bounds.topLeft, new Point(bounds.bottomRight.x * 2 + 1, bounds.bottomRight.y));

  if (PRINT) {
    console.log("Initial state:");
    console.log(stringify(wideBounds, wideWalls, wideBoxes, wideRobotPos));
  }

  runCommands(wideWalls, wideBoxes, wideRobotPos, commands, wideBounds);
  const uniqueGps =
    asSequence(wideBoxes)
      .map(([_, box]) => toGPS(box, bounds.topLeft.y))
      .toSet();
  return asSequence(uniqueGps).sum();
}

function widenPoint(p: Point): Sequence<Point> {
  return sequenceOf(new Point(2 * p.x, p.y), new Point(2 * p.x + 1, p.y));
}

function widenWalls(walls: HashSet<Point>): HashSet<Point> {
  return asSequence(walls)
    .flatMap(pos => widenPoint(pos))
    .fold(new HashSet<Point>(), (acc, pos) => acc.add(pos));
}

function widenBoxes(boxes: HashMap<Point, HashSet<Point>>): HashMap<Point, HashSet<Point>> {
  return asSequence(boxes.values())
    .map(positions => {
      const widePositions: HashSet<Point> = new HashSet();
      asSequence(positions)
        .flatMap(pos => widenPoint(pos))
        .forEach(pos => widePositions.add(pos));
      return widePositions;
    })
    .fold(
      new HashMap<Point, HashSet<Point>>(),
      (acc, positions) => {
        for (const pos of positions)
          acc.set(pos, positions);
        return acc;
      });
}

function toGPS(box: HashSet<Point>, maxY: number): number {
  const leftmost: Point = asSequence(box).minBy(p => p.x) as Point;
  return 100 * (maxY - leftmost.y) + leftmost.x;
}

function parseInput(data: string, walls: HashSet<Point>, boxes: HashMap<Point, HashSet<Point>>): [Point, Bounds, Vector[]] {
  const lines: string[] = data.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  const commandsBegin: number = lines.findIndex(line => !line.startsWith("#"));
  const mapHeight: number = commandsBegin;
  const bounds = new Bounds(new Point(0, mapHeight - 1), new Point(lines[0].length - 1, 0));

  walls.clear();
  boxes.clear();

  let robotPos: Point = new Point(NaN, NaN);
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < lines[0].length; x++) {
      const lineIndex: number = mapHeight - 1 - y;
      const char: string = lines[lineIndex][x];
      if (char === ".") continue;
      const pos = new Point(x, y);
      if (char === "@")
        robotPos = pos;
      else if (char === "O")
        boxes.set(pos, new HashSet([pos]));
      else
        walls.add(pos);
    }
  }

  const commands: Vector[] =
    asSequence(lines)
      .drop(commandsBegin)
      .flatten()
      .map(c => {
        if (c === "^") return Vector.Up
        if (c === ">") return Vector.Right
        if (c === "v") return Vector.Down
        return Vector.Left
      })
      .toArray();

  return [robotPos, bounds, commands];
}

function stringify(
  bounds: Bounds,
  walls: HashSet<Point>,
  boxes: HashMap<Point, HashSet<Point>>,
  robot: Point,
  blocker?: Point): string {
  let result = "";
  for (let y = bounds.topLeft.y; y >= bounds.bottomRight.y; y--) {
    for (let x = bounds.topLeft.x; x <= bounds.bottomRight.x; x++) {
      const pos = new Point(x, y);
      if (blocker && pos.equals(blocker))
        result += "x";
      else if (walls.has(pos))
        result += "#";
      else if (boxes.has(pos) && boxes.get(pos)?.size === 1)
        result += "O"
      else if (boxes.has(pos) && boxes.get(pos)?.size === 2) {
        const leftmost: Point = asSequence((boxes.get(pos) as HashSet<Point>).values()).minBy(p => p.x) as Point;
        result += pos.equals(leftmost) ? "[" : "]";
      } else if (robot.equals(pos))
        result += "@";
      else
        result += ".";
    }
    result += "\n";
  }
  
  return result;
}

async function runCommands(
  walls: HashSet<Point>,
  boxes: HashMap<Point, HashSet<Point>>,
  robotPos: Point,
  commands: Vector[], bounds: Bounds
): Promise<Point> {
  let currentRobotPos: Point = robotPos;

  for (const direction of commands) {
    const boxStack: HashSet<Point>[] =  [];

    if (!canMove(new HashSet([currentRobotPos]), direction, walls, boxes, boxStack)) {
      if (PRINT) {
        if (++ITERATION > SKIP) {
          console.clear();
          console.log(`Move ${toString(direction)} - Iteration ${ITERATION} - Remaining ${commands.length - ITERATION}:`);
          console.log(stringify(bounds, walls, boxes, currentRobotPos, currentRobotPos.plus(direction)));
          await (sleep(100));
        }
      }
      continue;
    }

    for (const boxPositions of boxStack) {
      for (const pos of boxPositions)
        boxes.delete(pos)
    }
    for (const boxPositions of boxStack) {
      const newBoxPositions: HashSet<Point> = new HashSet();
      for (const pos of boxPositions)
        newBoxPositions.add(pos.plus(direction));
      for (const pos of newBoxPositions)
        boxes.set(pos, newBoxPositions);
    }

    currentRobotPos = currentRobotPos.plus(direction);

    if (PRINT) {
      if (++ITERATION > SKIP) {
        console.clear();
        console.log(`Move ${toString(direction)} - Iteration ${ITERATION} - Remaining ${commands.length - ITERATION}:`);
        console.log(stringify(bounds, walls, boxes, currentRobotPos));
        await (sleep(100));
      }
    }
  }

  return currentRobotPos;
}

async function sleep(ms: number): Promise<void> { return new Promise(resolve => setTimeout(resolve, ms)); }

function toString(vec: Vector): string {
  if (vec === Vector.Up) return "^";
  if (vec === Vector.Right) return ">";
  if (vec === Vector.Down) return "v";
  return "<";
}

function canMove(currents: HashSet<Point>, direction: Vector, walls: HashSet<Point>, boxes: HashMap<Point, HashSet<Point>>, boxesToMove: HashSet<Point>[]): boolean {
  const targets: HashSet<Point> =
    asSequence(currents).map(p => p.plus(direction)).fold(new HashSet(), (acc, p) => acc.add(p));
  if (walls.intersection(targets).size > 0) return false;

  const touchedBoxes: HashSet<Point>[] = [];
  for (const pos of targets) {
    if (currents.has(pos)) continue;  // Avoid intersecting itself
    const boxHit: HashSet<Point> | undefined = boxes.get(pos);
    if (boxHit === undefined) continue;
    touchedBoxes.push(boxHit);
    boxesToMove.push(boxHit);
  }

  return touchedBoxes.every(box => canMove(box, direction, walls, boxes, boxesToMove));
}

main();
