import fs from "fs";
import Sequence, { asSequence } from "sequency";

function main() {
  const data: string = fs.readFileSync('./rsrc/input.txt', 'utf8');

  const [rules, updates] = parseInput(data);
  
  console.log(`Part 1: ${mainPart1(rules, updates)}`);
  console.log(`Part 2: ${mainPart2(rules, updates)}`);
}

function parseInput(data: string): [PrecedenceRules, number[][]] {
  const lines: string[] = data.split("\n").filter(l => l.length > 0);
  
  const precedenceRules: Map<number, number[]> =
    asSequence(lines)
      .takeWhile(l => l.includes("|"))
      .map(l => l.trim().split("|").map(e => Number(e)))
      .fold(
        new Map<number, number[]>(),
        (acc, [first, second]) => {
          if (!acc.has(first))
            acc.set(first, []);
          acc.get(first)?.push(second);
          return acc;
        });

  const updates: number[][] =
    asSequence(lines)
      .dropWhile(l => l.includes("|"))
      .map(l => l.trim().split(",").map(e => Number(e)))
      .toArray();

  return [new PrecedenceRules(precedenceRules), updates];
}

function mainPart1(rules: PrecedenceRules, updates: number[][]): number {
  return asSequence(updates)
    .filter(e => rules.isSorted(e))
    .map(update => update[Math.floor(update.length / 2)])
    .sum();
}

function mainPart2(rules: PrecedenceRules, updates: number[][]): number {
  return asSequence(updates)
    .filter(e => !rules.isSorted(e))
    .map(update => update.sort((a, b) => rules.compare(a, b)))
    .map(update => update[Math.floor(update.length / 2)])
    .sum();
}

class PrecedenceRules {
  constructor(private readonly data: Map<number, number[]>) {}

  public isSorted(update: number[]): boolean {
    for (let i = 0; i < update.length - 1; i++)
      if (this.compare(update[i], update[i+1]) > 0)
        return false;
    return true;
  }

  public compare(a: number, b: number): number {
    const mustSucceedA: number[] = this.data.get(a) || [];
    const mustSucceedB: number[] = this.data.get(b) || [];
    if (mustSucceedA.includes(b)) return -1;
    if (mustSucceedB.includes(a)) return +1;
    return 0;
  }

}

main();