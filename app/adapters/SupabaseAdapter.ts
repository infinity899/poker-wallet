import type { SupabaseClient } from '@supabase/supabase-js';
import type { PaginatedResult, PaginationOptions, StorageAdapter } from './types';

/**
 * Supabase adapter for production mode
 * Handles database operations with automatic case conversion
 */
export class SupabaseAdapter<
  T extends { id: string },
  DbT extends Record<string, any> = Record<string, any>,
> implements StorageAdapter<T> {
  constructor(
    private supabase: SupabaseClient,
    private tableName: string,
    private userId: string,
    private toFrontend: (db: DbT) => T,
    private toDatabase: (item: Partial<T>) => Partial<DbT>,
  ) {}

  async getAll(): Promise<T[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', this.userId)
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch ${this.tableName}: ${error.message}`);
    }

    return (data || []).map(item => this.toFrontend(item as DbT));
  }

  async getById(id: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .eq('user_id', this.userId)
      .single();

    // PGRST116 = no rows returned, which is not an error for getById
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch ${this.tableName} by id: ${error.message}`);
    }

    return data ? this.toFrontend(data as DbT) : null;
  }

  async create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const dbItem = {
      ...this.toDatabase(item as Partial<T>),
      user_id: this.userId,
    };

    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(dbItem)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create ${this.tableName}: ${error.message}`);
    }

    return this.toFrontend(data as DbT);
  }

  async update(id: string, updates: Partial<T>): Promise<T> {
    const dbUpdates = this.toDatabase(updates);

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', this.userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update ${this.tableName}: ${error.message}`);
    }

    return this.toFrontend(data as DbT);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)
      .eq('user_id', this.userId);

    if (error) {
      throw new Error(`Failed to delete ${this.tableName}: ${error.message}`);
    }
  }

  async deleteMany(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .in('id', ids)
      .eq('user_id', this.userId);

    if (error) {
      throw new Error(`Failed to delete multiple ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Get paginated results for large datasets
   */
  async getPaginated(options: PaginationOptions = {}): Promise<PaginatedResult<T>> {
    const { limit = 50, cursor } = options;

    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .eq('user_id', this.userId)
      .order('date', { ascending: false })
      .limit(limit + 1); // Fetch one extra to check if there are more

    if (cursor) {
      query = query.lt('date', cursor);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch paginated ${this.tableName}: ${error.message}`);
    }

    const hasMore = (data?.length || 0) > limit;
    const items = (data || []).slice(0, limit).map(item => this.toFrontend(item as DbT));

    return {
      data: items,
      nextCursor: hasMore && data && data.length > 0 ? data[limit - 1].date : null,
      hasMore,
      total: count || undefined,
    };
  }
}
