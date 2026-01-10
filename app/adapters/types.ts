/**
 * Storage Adapter Interface
 * Provides a unified interface for data persistence regardless of backend
 */
export interface StorageAdapter<T extends { id: string }> {
  /**
   * Retrieve all items from storage
   */
  getAll: () => Promise<T[]>;

  /**
   * Retrieve a single item by ID
   */
  getById: (id: string) => Promise<T | null>;

  /**
   * Create a new item
   */
  create: (item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => Promise<T>;

  /**
   * Update an existing item
   */
  update: (id: string, updates: Partial<T>) => Promise<T>;

  /**
   * Delete a single item
   */
  delete: (id: string) => Promise<void>;

  /**
   * Delete multiple items
   */
  deleteMany: (ids: string[]) => Promise<void>;
}

/**
 * Paginated result for large datasets
 */
export interface PaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

/**
 * Options for paginated queries
 */
export interface PaginationOptions {
  cursor?: string;
  limit?: number;
}
