import { Hash, Hashable } from "./hash";

export class Coordinates implements Hashable {
  constructor(public readonly row: number, public readonly col: number) {}

  public equals(other: Coordinates): boolean { return this.row === other.row && this.col === other.col; }
  public hashCode(): Hash { return JSON.stringify(this); }

  public stepUp(): Coordinates { return this.step(Direction.Up) }
  public stepDown(): Coordinates { return this.step(Direction.Down); }
  public stepRight(): Coordinates { return this.step(Direction.Right); }
  public stepLeft(): Coordinates { return this.step(Direction.Left); }
  public step(direction: Direction): Coordinates {
    return new Coordinates(this.row + direction.deltaRow, this.col + direction.deltaCol);
  }
}

export class Direction {
  public static Up: Direction = new Direction(-1, 0);
  public static Down: Direction = new Direction(+1, 0);
  public static Right: Direction = new Direction(0, +1);
  public static Left: Direction = new Direction(0, -1);

  private constructor(public readonly deltaRow: number, public readonly deltaCol: number) {}

  public invert(): Direction {
    if (this === Direction.Up) return Direction.Down;
    if (this === Direction.Down) return Direction.Up;
    if (this === Direction.Right) return Direction.Left;
    return Direction.Right;
  }

  public rotateCCW(): Direction {
    if (this === Direction.Up) return Direction.Left;
    if (this === Direction.Left) return Direction.Down;
    if (this === Direction.Down) return Direction.Right;
    return Direction.Up;
  }

  public rotateCW(): Direction {
    return this.rotateCCW().invert();
  }

  public equals(other: Direction): boolean {
    return this.deltaRow === other.deltaRow && this.deltaCol === other.deltaCol;
  }
}

export class Grid<T> {
  constructor(
    private readonly data: T[],
    public readonly rows: number,
    public readonly cols: number = data.length / rows
  ) {
    if (data.length != rows * cols)
      throw new Error("Invalid shape");
  }

  public get(pos: Coordinates): T {
    if (!this.isInBounds(pos))
      throw new Error("Coordinates out of bounds");
    return this.data[this.toIndex(pos.row, pos.col)];
  }

  public isInBounds(pos: Coordinates): boolean {
    return 0 <= pos.row && pos.row < this.rows && 0 <= pos.col && pos.col < this.cols;
  }

  public* coordinates(): Generator<Coordinates> {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        yield new Coordinates(row, col);
      }
    }
  }

  public stringify(): string {
    let result = "";
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        result += this.get(new Coordinates(row, col));
      }
      if (row != this.rows - 1)
        result += "\n";
    }
    return result;
  }

  private toIndex(row: number, col: number): number { return row * this.cols + col; }
}