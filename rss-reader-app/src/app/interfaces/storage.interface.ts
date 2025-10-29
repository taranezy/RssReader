// Interface Segregation Principle - separate interfaces for different concerns
export interface IStorageService<T> {
  save(key: string, data: T): void;
  load(key: string): T | null;
  remove(key: string): void;
  clear(): void;
}
