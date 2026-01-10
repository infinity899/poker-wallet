import type { SupabaseClient } from '@supabase/supabase-js';
import type { Tag, Venue } from '~/types';
import type { DbReferenceData } from '~/types/database.types';
import { DEFAULT_TAGS, DEFAULT_VENUES } from '~/types';

const STORAGE_KEY = 'poker-wallet-reference';
const SEED_DATA_PATH = '/data/reference.json';

export interface ReferenceData {
  venues: Venue[];
  tags: Tag[];
}

/**
 * Convert database format (string arrays) to client format (Venue/Tag objects)
 */
function dbToClient(db: DbReferenceData): ReferenceData {
  const venues: Venue[] = [];

  // Convert live venue strings to Venue objects
  for (const name of db.venues || []) {
    venues.push({
      id: crypto.randomUUID(),
      name,
      type: 'live',
    });
  }

  // Convert online site strings to Venue objects with type='online'
  for (const name of db.sites || []) {
    venues.push({
      id: crypto.randomUUID(),
      name,
      type: 'online',
    });
  }

  // Convert tag strings to Tag objects
  const tags: Tag[] = (db.tags || []).map(name => ({
    id: crypto.randomUUID(),
    name,
    color: '#6B7280', // Default gray color
  }));

  return { venues, tags };
}

/**
 * Convert client format (Venue/Tag objects) to database format (string arrays)
 */
function clientToDb(data: ReferenceData): Partial<DbReferenceData> {
  return {
    venues: data.venues.filter(v => v.type === 'live').map(v => v.name),
    sites: data.venues.filter(v => v.type === 'online').map(v => v.name),
    tags: data.tags.map(t => t.name),
  };
}

/**
 * LocalStorage adapter for reference data (demo mode)
 */
export class LocalStorageReferenceAdapter {
  async getAll(): Promise<ReferenceData> {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      }
      catch {
        console.error('Failed to parse localStorage reference data');
      }
    }

    // Try to load seed data
    try {
      const response = await fetch(SEED_DATA_PATH);
      if (response.ok) {
        const data = await response.json();
        const result: ReferenceData = {
          venues: data.venues || DEFAULT_VENUES,
          tags: data.tags || DEFAULT_TAGS,
        };
        this.saveAll(result);
        return result;
      }
    }
    catch (error) {
      console.error('Failed to load seed data:', error);
    }

    // Fall back to defaults
    const defaults: ReferenceData = {
      venues: [...DEFAULT_VENUES],
      tags: [...DEFAULT_TAGS],
    };
    this.saveAll(defaults);
    return defaults;
  }

  saveAll(data: ReferenceData): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Supabase adapter for reference data (production mode)
 */
export class SupabaseReferenceAdapter {
  constructor(
    private supabase: SupabaseClient,
    private userId: string,
  ) {}

  async getAll(): Promise<ReferenceData> {
    const { data, error } = await this.supabase
      .from('reference_data')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found - create default reference data
        return this.createDefault();
      }
      throw new Error(`Failed to load reference data: ${error.message}`);
    }

    return dbToClient(data as DbReferenceData);
  }

  async saveAll(data: ReferenceData): Promise<void> {
    const dbData = clientToDb(data);

    const { error } = await this.supabase
      .from('reference_data')
      .upsert({
        user_id: this.userId,
        ...dbData,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      throw new Error(`Failed to save reference data: ${error.message}`);
    }
  }

  private async createDefault(): Promise<ReferenceData> {
    const defaults: ReferenceData = {
      venues: [...DEFAULT_VENUES],
      tags: [...DEFAULT_TAGS],
    };

    const dbData = clientToDb(defaults);

    const { error } = await this.supabase
      .from('reference_data')
      .insert({
        user_id: this.userId,
        ...dbData,
      });

    if (error) {
      console.error('Failed to create default reference data:', error);
    }

    return defaults;
  }
}

/**
 * Create a reference adapter based on the current mode
 */
export function createReferenceAdapter(
  isDemoMode: boolean,
  supabase?: SupabaseClient,
  userId?: string,
): LocalStorageReferenceAdapter | SupabaseReferenceAdapter {
  if (isDemoMode) {
    return new LocalStorageReferenceAdapter();
  }

  if (!supabase || !userId) {
    throw new Error('Supabase client and userId required for database mode');
  }

  return new SupabaseReferenceAdapter(supabase, userId);
}

export { STORAGE_KEY as REFERENCE_STORAGE_KEY };
