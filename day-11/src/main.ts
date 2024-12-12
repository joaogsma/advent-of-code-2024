import fs from "fs";
import { asSequence } from "sequency";

function main() {
  const data: string = fs.readFileSync('./rsrc/input.txt', 'utf8');
  const stones: number[] = parseInput(data);

  console.log(`Part 1: ${mainPart1(stones)}`);
  console.log(`Part 2: ${mainPart2(stones)}`);
}

function mainPart1(stones: number[]): number {
  const cache: Map<string, number> = new Map();
  return asSequence(stones)
    .map(e => countStones(e, 25, cache))
    .sum();
}

function mainPart2(stones: number[]): number {
  const cache: Map<string, number> = new Map();
  return asSequence(stones)
    .map(e => countStones(e, 75, cache))
    .sum();
}

function parseInput(data: string): number[] {
  const lines: string[] = data.split("\n").filter(l => l.length > 0);
  return lines[0].split(new RegExp(/\s+/gm)).map(e => Number(e));
}

function countStones(stone: number, iterations: number, cache: Map<string, number>): number {
  if (iterations === 0)
    return 1;

  const digits: string = `${stone}`;
  const key = `${digits},${iterations}`;
  const cached = cache.get(key);;
  if (cached !== undefined)
    return cached;

  let result: number;

  if (stone === 0) {
    result = countStones(1, iterations - 1, cache);
  } else if (digits.length % 2 === 0) {
    const leftStone = Number(digits.substring(0, digits.length / 2));
    const rigthStone = Number(digits.substring(digits.length / 2));
    result = countStones(leftStone, iterations - 1, cache) + countStones(rigthStone, iterations - 1, cache);
  } else {
    result = countStones(stone * 2024, iterations - 1, cache);
  }

  cache.set(key, result);
  return result;
}

main();
