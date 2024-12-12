import fs from "fs";
import { asSequence } from "sequency";

const data: string = fs.readFileSync('./rsrc/input.txt', 'utf8');
const reports: number[][] = parseInput(data);

console.log(`Part 1: ${mainPart1(reports)}`);
console.log(`Part 2: ${mainPart2(reports)}`);

function parseInput(data: string): number[][] {
  return asSequence(data.split("\n"))
    .filter(l => l.length > 0)
    .map(line => line.split(new RegExp("\\s+")).map(n => Number(n)))
    .toArray();
}

function mainPart1(reports: number[][]): number {
  return asSequence(reports)
    .filter(report => isAllIncreasing(report) || isAllDecreasing(report))
    .count();
}

function mainPart2(reports: number[][]): number {
  return asSequence(reports)
    .filter(report => {
      const result = isAllIncreasing(report, 1) || isAllDecreasing(report, 1);
      return result;
    })
    .count();
}

function isAllIncreasing(values: number[], tolerance: number = 0): boolean {
  return pairsConform(values, (a, b) => b - a >= 1 && b - a <= 3, tolerance);
}

function isAllDecreasing(values: number[], tolerance: number = 0): boolean {
  return pairsConform(values, (a, b) => a - b >= 1 && a - b <= 3, tolerance);
}

function pairsConform(values: number[], predicate: (a: number, b: number) => boolean, tolerance: number = 0): boolean {
  if (values.length == 0) return true;

  for (let i = 1; i < values.length - 1; i++) {
    const conformsLeft: boolean = predicate(values[i-1], values[i]);
    const conformsRight: boolean = predicate(values[i], values[i+1]);
    if (conformsLeft && conformsRight) continue;
    if (tolerance <= 0) return false;
    const [previous, current, next, ...tail] = values.slice(i-1);
    return pairsConform([current, next, ...tail], predicate, tolerance - 1)
      || pairsConform([previous, next, ...tail], predicate, tolerance - 1)
      || pairsConform([previous, current, ...tail], predicate, tolerance - 1);
  }

  return true;
}