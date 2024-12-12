import fs from "fs";
import { asSequence } from "sequency";

function main() {
  const data: string = fs.readFileSync('./rsrc/input.txt', 'utf8');
  const expressions: Expression[] = parseInput(data);

  console.log(`Part 1: ${mainPart1(expressions)}`);
  console.log(`Part 2: ${mainPart2(expressions)}`);
}

function parseInput(data: string): Expression[] {
  const lines: string[] = data.split("\n").filter(l => l.length > 0);
  return lines.map(line => {
    const colonIdx = line.indexOf(":");
    const result = Number(line.substring(0, colonIdx).trim());
    const operands = line.substring(colonIdx + 1).trim().split(new RegExp("\\s+")).map(e => Number(e));
    return Expression.from(result, operands);
  });
}

function mainPart1(expressions: Expression[]): number {
  return asSequence(expressions)
    .filter(exp => canBeTrue(exp, [Operators.add, Operators.mult]))
    .map(exp => exp.result)
    .sum()
}

function mainPart2(expressions: Expression[]): number {
  return asSequence(expressions)
    .filter(exp => canBeTrue(exp, [Operators.add, Operators.mult, Operators.concat]))
    .map(exp => exp.result)
    .sum()

}

type Operator = (a: number, b: number) => number;

namespace Operators {
  export const add: Operator = (a, b) => a + b;
  export const mult: Operator = (a, b) => a * b;
  export const concat: Operator = (a, b) => Number(`${a}${b}`);
}

class Expression {
  private constructor(
    public readonly result: number,
    public readonly accumulator: number,
    public readonly pendingOperands: number[]
  ) {}

  public static from(result: number, operands: number[]): Expression {
    return new Expression(result, operands[0], operands.slice(1));
  }

  public addOperator(op: Operator): Expression {
    if (this.isComplete()) throw new Error("Complete expression");
    const [next, ...remaining] = this.pendingOperands;
    return new Expression(this.result, op(this.accumulator, next), remaining);    
  }

  public isComplete(): boolean { return this.pendingOperands.length === 0; }

  public isTrue(): boolean {
    if (!this.isComplete()) throw new Error("Incomplete expression");
    return this.accumulator === this.result;
  }
}

function canBeTrue(exp: Expression, ops: Operator[]): boolean {
  if (exp.isComplete()) return exp.isTrue();
  if (exp.accumulator > exp.result) return false;
  return asSequence(ops).fold(false, (acc, op) => acc || canBeTrue(exp.addOperator(op), ops));
}

main();
