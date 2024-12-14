import { asSequence } from "sequency";

export type Hash = string | number;

export interface Hashable {
  hashCode(): Hash;
}

export class HashSet<V extends Hashable>  {
    private readonly data: Map<Hash, V> = new Map();
  
    constructor(iterable: Iterable<V> = []) {
      this.data = new Map();
      for (const item of iterable) {
        this.add(item);
      }
    }
  
    public get size(): number { return this.data.size; }
  
    public add(value: V): this {
      this.data.set(value.hashCode(), value);  
      return this;
    }
  
    public addAll(values: Iterable<V>): this {
      for (const e of values)
        this.add(e);
      return this;
    }
  
    public has(value: V): boolean {
      return this.data.has(value.hashCode());
    }
  
    public delete(value: V): this {
      this.data.delete(value.hashCode());
      return this;
    }
  
    public deleteAll(values: Iterable<V>): this {
      for (const value of values)
        this.delete(value);
      return this;
    }
  
    public clear(): void { this.data.clear(); }
  
    public values(): SetIterator<V> { return this.data.values(); }
  
    public union(other: HashSet<V>): HashSet<V> {
      const result = new HashSet(this);
      other.values().forEach(e => result.add(e));
      return result;
    }
  
    public intersection(other: HashSet<V>): HashSet<V> {
      const result: HashSet<V> = new HashSet();
      asSequence(this.values())
        .filter(e => other.has(e))
        .forEach(e => result.add(e));
      return result;
    }
  
    public difference(other: HashSet<V>): HashSet<V> {
      const result: HashSet<V> = new HashSet();
      asSequence(this.values())
        .filter(e => !other.has(e))
        .forEach(e => result.add(e));
      return result;
    }
  
    public symmetricDifference(other: HashSet<V>): HashSet<V> {
      return this.difference(other).union(other.difference(this));
    }
  
    public isSubsetOf(other: HashSet<V>): boolean {
      return asSequence(this.values()).all(e => other.has(e));
    }
  
    public isSupersetOf(other: HashSet<V>): boolean {
      return other.isSubsetOf(this);
    }
  
    public isDisjointFrom(other: HashSet<V>): boolean {
      return this.intersection(other).size === 0;
    }
  
    [Symbol.iterator]() { return this.data.values(); }
  
    public toJSON(): string {
      return asSequence(this).map(e => JSON.stringify(e)).joinTo({ prefix: "{ ", postfix: " }", separator: ", " });
    }
  };
  
