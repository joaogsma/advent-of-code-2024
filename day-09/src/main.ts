import fs from "fs";
import { asSequence, emptySequence, generateSequence, range } from "sequency";

function main() {
  const data: string = fs.readFileSync('./rsrc/input.txt', 'utf8').replaceAll("\n", "");
  const memory: MemorySegment[] = parseInput(data);

  console.log(`Part 1: ${mainPart1(memory)}`);
  console.log(`Part 2: ${mainPart2(memory)}`);
}

function parseInput(data: string): MemorySegment[] {
  const segments: MemorySegment[] = [];
  let nextId: number = 0;
  let isFile: boolean = true;
  let begin: number = 0;
  for (let i = 0; i < data.length; i++, isFile = !isFile) {
    const length: number = Number(data[i]);
    const end: number = begin + length;
    const segment: MemorySegment = isFile ? new UsedMemory(begin, end, nextId++) : new FreeMemory(begin, end);
    if (length === 0) continue;
    segments.push(segment);
    begin = end;
  }
  return segments;
}

function mainPart1(memory: MemorySegment[]): number {
  return checksum(moveSegments([...memory], true));
}

function mainPart2(memory: MemorySegment[]): number {
  return checksum(moveSegments([...memory], false));
}

abstract class MemorySegment {
  public readonly length: number;

  constructor(public readonly begin: number, public readonly end: number) {
    this.length = this.end - this.begin;
  }

  public abstract isFree(): boolean;
}

class UsedMemory extends MemorySegment {
  constructor(begin: number, end: number, public readonly id: number) {
    super(begin, end);
  }

  public isFree(): boolean { return false; }
}

class FreeMemory extends MemorySegment {
  constructor(begin: number, end: number) {
    super(begin, end);
  }

  public isFree(): boolean { return true; }
}

function print(segments: MemorySegment[]): void {
  const str =
    asSequence(segments)
      .flatMap(seg => generateSequence(() => seg instanceof UsedMemory ? seg.id : ".").take(seg.end - seg.begin))
      .joinToString({ separator: "" });
  console.log(str);
}

function moveSegments(memory: MemorySegment[], fragmentation: boolean): MemorySegment[] {
  return fragmentation
    ? moveSegmentsFragmenting(memory)
    : moveSegmentsWholeFiles(memory);
}

function moveSegmentsFragmenting(memory: MemorySegment[]): MemorySegment[] {
  for (let i = 0, j = memory.length - 1; i < j;) {
    if (!memory[i].isFree()) {
      i++;
      continue;
    }
    if (memory[j].isFree()) {
      j--;
      continue;
    }

    const emptySpace: FreeMemory = memory[i] as FreeMemory;
    const lastFile: UsedMemory = memory[j] as UsedMemory;
    const moved: MemorySegment =
      new UsedMemory(
        emptySpace.begin,
        emptySpace.begin + Math.min(emptySpace.length, lastFile.length),
        lastFile.id)
    
    memory[i] = moved;
    if (emptySpace.length > moved.length) {
      memory.splice(i + 1, 0, new FreeMemory(moved.end, emptySpace.end));
      j++;
    }

    if (lastFile.length === moved.length) {
      memory[j] = new FreeMemory(lastFile.begin, lastFile.end);
      continue;
    }
    memory.splice(
      j,
      1,
      new UsedMemory(lastFile.begin, lastFile.end - moved.length, lastFile.id),
      new FreeMemory(lastFile.end - moved.length, lastFile.end));
  }

  mergeFreeSpaces(memory);
  return memory;
}

function moveSegmentsWholeFiles(memory: MemorySegment[]): MemorySegment[] {  
  for (let fileIndex = memory.length - 1; fileIndex > 0; fileIndex--) {
    if (memory[fileIndex].isFree())
      continue;
    const file = memory[fileIndex] as UsedMemory;

    for (let freeSpaceIndex = 0; freeSpaceIndex < fileIndex; freeSpaceIndex++) {
      const freeSpace: FreeMemory = memory[freeSpaceIndex];

      if (!freeSpace.isFree())
        continue;
      if (freeSpace.length < file.length)
        continue;

      memory[fileIndex] = new FreeMemory(file.begin, file.end);
      if (freeSpace.length === file.length) {
        memory[freeSpaceIndex] = new UsedMemory(freeSpace.begin, freeSpace.end, file.id);
      } else {
        memory.splice(
          freeSpaceIndex,
          1,
          new UsedMemory(freeSpace.begin, freeSpace.begin + file.length, file.id),
          new FreeMemory(freeSpace.begin + file.length, freeSpace.end));
        fileIndex++;
      }
      break;
    }
  }
  
  mergeFreeSpaces(memory);
  return memory;
}

function mergeFreeSpaces(memory: MemorySegment[], start: number = 0): void {
  for (let i = start; i < memory.length - 1; i++) {
    if (!memory[i].isFree() || !memory[i+1].isFree()) continue;
    memory[i] = new FreeMemory(memory[i].begin, memory[i+1].end);
    memory.splice(i+1, 1);
  }
}

function checksum(memory: MemorySegment[]): number {
  return asSequence(memory)
    .filter(segment => !segment.isFree())
    .flatMap(segment =>
      range(segment.begin, segment.end - 1)
        .map(index => index * (segment instanceof UsedMemory ? segment.id : 0)))
    .sum();
}

main();
