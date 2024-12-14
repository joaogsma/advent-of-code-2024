import fs from "fs";
import Sequence, { asSequence, sequenceOf } from "sequency";
import { Bounds, Point, Vector } from "./geometry";
import { Hash, Hashable, HashSet } from "./hash";

function main() {
  const data: string = fs.readFileSync('./rsrc/input.txt', 'utf8');
  // const bounds = new Bounds(new Point(0, 6), new Point(10, 0));  // Bounds for sample input
  const bounds: Bounds = new Bounds(new Point(0, 102), new Point(100, 0));  // Bounds for real input
  const robots: Robot[] = parseInput(data, bounds);

  console.log(`Part 1: ${mainPart1(robots, bounds, 100)}`);
  console.log(`Part 2: ${mainPart2(robots, bounds)}`);
}

function mainPart1(robots: Robot[], bounds: Bounds, steps: number): number {
  const quadrants: Bounds[] = [
    topLeftQuadrant(bounds),
    topRightQuadrant(bounds),
    bottomRightQuadrant(bounds),
    bottomLeftQuadrant(bounds)
  ];
  const robotsByQuadrant =
    asSequence(robots)
      .map(robot => robot.step(steps))
      .groupBy(robot => quadrants.find(q => q.contains(robot.position)));

  return asSequence(quadrants)
    .map(e => robotsByQuadrant.get(e)?.length || 0)
    .reduce<number, number>((a, b) => a * b);
}

function mainPart2(robots: Robot[], bounds: Bounds): number {
  for (let i = 0; true; i++) {
    const current = robots.map(r => r.step(i));
    if (isTree(current)) {
      console.log(stringify(bounds, current));
      return i;
    }
  }
}

function isTree(robots: Iterable<Robot>): boolean {
  const robotPositions: HashSet<Point> = new HashSet();
  asSequence(robots).forEach(r => robotPositions.add(r.position));

  const downLeft = new Vector(-1, -1);
  const downRight = new Vector(+1, -1);

  const result: Point | null =
    asSequence(robotPositions)
      .find(pos => {
        for (let i = 1; i <= 3; i++) {
          if (!robotPositions.has(pos.plus(downLeft.times(i))))
            return false;
        }
        for (let i = 1; i <= 3; i++) {
          if (!robotPositions.has(pos.plus(downRight.times(i))))
            return false;
        }
        return true;
      });
  return result !== null;
}

function parseInput(data: string, bounds: Bounds): Robot[] {
  const lines: string[] = data.split("\n").filter(l => l.length > 0);
  const regex = new RegExp(/^p=(?<px>(\+|-)?\d+),(?<py>(\+|-)?\d+) v=(?<vx>(\+|-)?\d+),(?<vy>(\+|-)?\d+)$/gm);

  return asSequence(lines)
    .map(line => {
      const match = asSequence(line.matchAll(regex)).first();
      const px = Number(match.groups?.["px"]);
      const py = Number(match.groups?.["py"]);
      const vx = Number(match.groups?.["vx"]);
      const vy = Number(match.groups?.["vy"]);
      // The input does not follow the cartesian plane conventions of origin on the bottom left and a Y axis that
      // increases up. Here we shift the Y coordinates of the position and velocity to fix that.
      const position = new Point(px, bounds.topLeft.y - py);
      const velocity = new Vector(vx, -vy);
      return new Robot(position, velocity, bounds);
    })
    .toArray()
}

function topLeftQuadrant(bounds: Bounds): Bounds {
  const topLeft = bounds.topLeft;
  const bottomRight = new Point(bounds.bottomRight.x / 2 - 1, bounds.topLeft.y / 2 + 1);
  return new Bounds(topLeft, bottomRight);
}

function topRightQuadrant(bounds: Bounds): Bounds {
  const topLeft = new Point(bounds.bottomRight.x / 2 + 1, bounds.topLeft.y);
  const bottomRight = new Point(bounds.bottomRight.x, bounds.topLeft.y / 2 + 1);
  return new Bounds(topLeft, bottomRight);
}

function bottomRightQuadrant(bounds: Bounds): Bounds {
  const topLeft = new Point(bounds.bottomRight.x / 2 + 1, bounds.topLeft.y / 2 - 1);
  const bottomRight = bounds.bottomRight;
  return new Bounds(topLeft, bottomRight);
}

function bottomLeftQuadrant(bounds: Bounds): Bounds {
  const topLeft = new Point(bounds.topLeft.x, bounds.topLeft.y / 2 - 1);
  const bottomRight = new Point(bounds.bottomRight.x / 2 - 1, bounds.bottomRight.y);
  return new Bounds(topLeft, bottomRight);
}

class Robot implements Hashable {
  constructor(public readonly position: Point, public readonly velocity: Vector, private readonly bounds: Bounds) {}

  public step(times: number): Robot {
    if (times < 0) throw new Error ("Step has to be non-zero");
    if (times === 0) return this;
    let { x, y } = this.position.plus(this.velocity.times(times));
    x = this.truncateToBounds(this.bounds.topLeft.x, this.bounds.bottomRight.x, x);
    y = this.truncateToBounds(this.bounds.bottomRight.y, this.bounds.topLeft.y, y);
    return new Robot(new Point(x, y), this.velocity, this.bounds);
  }

  private truncateToBounds(boundBegin: number, boundEndInclusive: number, value: number): number {
    if (boundBegin <= value && value <= boundEndInclusive) return value;

    // Value is to the right - we can use modulo operation
    if (boundEndInclusive < value) {
      const length = boundEndInclusive + 1 - boundBegin;
      const relativeCoord = value - boundBegin;
      return (relativeCoord % length) + boundBegin;
    }

    // Value is to the left of the bounds - we transform the space to make it on the right
    // and undo the transformations after
    const shiftTransform: (x: number) => number = x => x - boundEndInclusive;
    const invShiftTransform: (x: number) => number = x => x + boundEndInclusive;
    const flipTransform: (x: number) => number = x => -x;

    const transformedResult: number =
      this.truncateToBounds(
        flipTransform(shiftTransform(boundEndInclusive)),
        flipTransform(shiftTransform(boundBegin)),
        flipTransform(shiftTransform(value)))
    return invShiftTransform(flipTransform(transformedResult));
  }

  public hashCode(): Hash {
    return JSON.stringify(this);
  }
}

function stringify(bounds: Bounds, robots: Robot[]): string {
  const robotsPerPos: Map<string, Robot[]> = asSequence(robots).groupBy(robot => robot.position.hashCode());
  let result = "";
  for (let y = bounds.topLeft.y; y >= bounds.bottomRight.y; y--) {
    for (let x = bounds.topLeft.x; x <= bounds.bottomRight.x; x++) {
      const hash = new Point(x, y).hashCode();
      result += robotsPerPos.get(hash)?.length || ".";
    }
    result += "\n";
  }
  return result;
}

main();
