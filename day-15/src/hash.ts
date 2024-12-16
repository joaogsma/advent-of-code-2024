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
    if (other.size < this.size)
      return other.intersection(this);
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

export class HashMap<K extends Hashable, V>  {
  private readonly data: Map<Hash, [K, V]> = new Map();
  
  constructor(iterable: Iterable<[K, V]> = []) {
    this.data = new Map();
    for (const [key, value] of iterable) {
      this.set(key, value);
    }
  }
  
  public get size(): number { return this.data.size; }
  
  public set(key: K, value: V): this {
    this.data.set(key.hashCode(), [key, value]);  
    return this;
  }
  
  public setAll(items: Iterable<[K, V]>): this {
    for (const [key, value] of items)
      this.set(key, value);
    return this;
  }
  
  public get(key: K): V | undefined {
    return this.data.get(key.hashCode())?.[1];
  }

  public has(key: K): boolean {
    return this.data.has(key.hashCode());
  }
  
  public delete(key: K): this {
    this.data.delete(key.hashCode());
    return this;
  }
  
  public deleteAll(keys: Iterable<K>): this {
    for (const key of keys)
      this.delete(key);
    return this;
  }
  
  public clear(): void { this.data.clear(); }
  
  public keys(): Iterator<K> & Iterable<K> {
    const it = this.data.values();
    return function* () {
      for (const [key, _] of it)
        yield key;
    }();
  } 
  
  public values(): Iterator<V> & Iterable<V> {
    const it = this.data.values();
    return function* () {
      for (const [_, value] of it)
        yield value;
    }();
  }
  
  [Symbol.iterator](): Iterator<[K, V]> { return this.data.values(); }
  
  public toJSON(): string {
    return asSequence(this).map(e => JSON.stringify(e)).joinTo({ prefix: "{ ", postfix: " }", separator: ", " });
  }
};
  
