import fs from "fs";


const data: string = fs.readFileSync('./rsrc/input.txt', 'utf8');
const [leftCol, rightCol] = splitCols(data);

console.log(`Part 1: ${mainPart1(leftCol, rightCol)}`);
console.log(`Part 2: ${mainPart2(leftCol, rightCol)}`);


function splitCols(data: string): [number[], number[]] {
  const leftCol = [];
  const rightCol = [];
  const lines: string[] = data.split("\n").filter(l => l.length > 0);
  for (const line of lines) {
    const [left, right] = line.split(new RegExp("\\s+")).map(e => Number(e));
    leftCol.push(left);
    rightCol.push(right);
  }
  return [leftCol, rightCol];
}

function mainPart1(leftCol: number[], rightCol: number[]): number {
  const sortedLeftCol: number[] = [...leftCol].sort();
  const sortedRightCol: number[] = [...rightCol].sort();
  let acc = 0;
  for (let i = 0; i < sortedLeftCol.length; i++) {
    acc += Math.abs(sortedLeftCol[i] - sortedRightCol[i]);
  }
  return acc;
}

function mainPart2(leftCol: number[], rightCol: number[]): number {
  const rightColHistogram: Map<number, number> = buildHistogram(rightCol);
  let acc = 0;
  for (const value of leftCol) {
    acc += value * (rightColHistogram.get(value) || 0)
  }
  return acc;
}

function buildHistogram(values: Iterable<number>): Map<number, number> {
  const histogram: Map<number, number> = new Map();
  for (const value of values) {
    histogram.set(value, (histogram.get(value) || 0) + 1)
  }
  return histogram;
}