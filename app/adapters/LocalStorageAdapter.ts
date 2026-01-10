import type { StorageAdapter } from './types';

/**
 * LocalStorage adapter for demo mode
 * Persists data to browser localStorage with optional seed data loading
 */
export class LocalStorageAdapter<T extends { id: string; createdAt?: string; updatedAt?: string }> implements StorageAdapter<T> {
  constructor(
    private storageKey: string,
    private seedDataPath?: string,
  ) {}

  async getAll(): Promise<T[]> {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      }
      catch {
        console.error(`Failed to parse localStorage data for ${this.storageKey}`);
        return [];
      }
    }

    // Load seed data if available and no stored data exists
    if (this.seedDataPath) {
      try {
        const response = await fetch(this.seedDataPath);
        if (response.ok) {
          const data = await response.json();
          this.saveAll(data);
          return data;
        }
      }
      catch (error) {
        console.error(`Failed to load seed data from ${this.seedDataPath}:`, error);
      }
    }

    return [];
  }

  async getById(id: string): Promise<T | null> {
    const items = await this.getAll();
    return items.find(item => item.id === id) || null;
  }

  async create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const items = await this.getAll();
    const now = new Date().toISOString();

    const newItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    } as T;

    items.push(newItem);
    this.saveAll(items);
    return newItem;
  }

  async update(id: string, updates: Partial<T>): Promise<T> {
    const items = await this.getAll();
    const index = items.findIndex(item => item.id === id);

    if (index === -1) {
      throw new Error(`Item with id ${id} not found`);
    }

    const updated = {
      ...items[index],
      ...updates,
      id, // Ensure ID cannot be changed
      updatedAt: new Date().toISOString(),
    } as T;

    items[index] = updated;
    this.saveAll(items);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const items = await this.getAll();
    const filtered = items.filter(item => item.id !== id);
    this.saveAll(filtered);
  }

  async deleteMany(ids: string[]): Promise<void> {
    const items = await this.getAll();
    const idSet = new Set(ids);
    const filtered = items.filter(item => !idSet.has(item.id));
    this.saveAll(filtered);
  }

  /**
   * Save all items to localStorage
   */
  private saveAll(items: T[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  /**
   * Clear all data from localStorage
   */
  clearAll(): void {
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Import data (replaces existing)
   */
  importData(items: T[]): void {
    this.saveAll(items);
  }

  /**
   * Merge imported data with existing
   */
  async mergeData(items: T[]): Promise<void> {
    const existing = await this.getAll();
    const existingIds = new Set(existing.map(item => item.id));
    const newItems = items.filter(item => !existingIds.has(item.id));
    this.saveAll([...existing, ...newItems]);
  }
}
