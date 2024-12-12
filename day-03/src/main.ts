import fs from "fs";
import { asSequence } from "sequency";

function main() {
  const data: string = fs.readFileSync('./rsrc/input.txt', 'utf8');
  const operations: Mult[] = parseMult(data);
  const doPositions: number[] = parseDoPositions(data);
  const dontPositions: number[] = parseDontPositions(data);
  
  console.log(`Part 1: ${mainPart1(operations)}`);
  console.log(`Part 2: ${mainPart2(operations, doPositions, dontPositions)}`);
}

class Mult {
  constructor(public readonly left: number, public readonly right: number, public readonly pos: number) {}
  public eval(): number { return this.left * this.right; }
}

function parseMult(data: string): Mult[] {
  const multMatches = data.matchAll(/mul\((?<left>\d{1,3}),(?<right>\d{1,3})\)/gm);
  return asSequence(multMatches)
    .map(match => {
      const left: number = Number(match.groups?.["left"]);
      const right: number = Number(match.groups?.["right"]);
      return new Mult(left, right, match.index);
    })
    .toArray();
}

function parseDoPositions(data: string): number[] {
  return asSequence(data.matchAll(/do\(\)/gm))
    .map(m => m.index)
    .toArray();
}

function parseDontPositions(data: string): number[] {
  return asSequence(data.matchAll(/don't\(\)/gm))
    .map(m => m.index)
    .toArray();
}

function mainPart1(operations: Mult[]): number {
  return asSequence(operations).map(m => m.eval()).sum();
}

function mainPart2(operations: Mult[], doPositions: number[], dontPositions: number[]): number {
  return asSequence(operations)
    .filter(e => {
      const previousDoIdx: number = binarySearchPrevious(e.pos, doPositions) || -1;
      const previousDontIdx: number | null = binarySearchPrevious(e.pos, dontPositions);
      return previousDontIdx == null || previousDoIdx > previousDontIdx;
    })
    .map(e => e.eval())
    .sum();
}

function binarySearchPrevious(query: number, values: number[]): number | null {
  let begin: number = 0;
  let end: number = values.length;
  while (end - begin > 1) {
    const middle: number = Math.floor(begin + (end - begin) / 2);
    if (values[middle] <= query) {
      begin = middle;
    } else {
      end = middle;
    }
  }
  return values[begin] <= query ? values[begin] : null;
}

main();