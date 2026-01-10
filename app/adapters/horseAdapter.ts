import type { SupabaseClient } from '@supabase/supabase-js';
import type { Horse, HorseTransaction } from '~/types';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { SupabaseAdapter } from './SupabaseAdapter';

const STORAGE_KEY_HORSES = 'poker-wallet-horses';
const STORAGE_KEY_TRANSACTIONS = 'poker-wallet-horse-transactions';

// Database to frontend mapping for Horse
function dbHorseToHorse(db: any): Horse {
  return {
    id: db.id,
    name: db.name,
    avatar: db.avatar ?? undefined,
    currency: db.currency,
    notes: db.notes ?? undefined,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

// Frontend to database mapping for Horse
function horseToDbHorse(horse: Partial<Horse>): Record<string, any> {
  const result: Record<string, any> = {};

  if (horse.name !== undefined) {
    result.name = horse.name;
  }
  if (horse.avatar !== undefined) {
    result.avatar = horse.avatar;
  }
  if (horse.currency !== undefined) {
    result.currency = horse.currency;
  }
  if (horse.notes !== undefined) {
    result.notes = horse.notes;
  }

  return result;
}

// Database to frontend mapping for HorseTransaction
function dbTransactionToTransaction(db: any): HorseTransaction {
  return {
    id: db.id,
    horseId: db.horse_id,
    date: db.date,
    type: db.type,
    result: db.result,
    description: db.description ?? undefined,
    isSession: db.is_session ?? undefined,
    sessionCount: db.session_count ?? undefined,
    createdAt: db.created_at,
  };
}

// Frontend to database mapping for HorseTransaction
function transactionToDbTransaction(tx: Partial<HorseTransaction>): Record<string, any> {
  const result: Record<string, any> = {};

  if (tx.horseId !== undefined) {
    result.horse_id = tx.horseId;
  }
  if (tx.date !== undefined) {
    result.date = tx.date;
  }
  if (tx.type !== undefined) {
    result.type = tx.type;
  }
  if (tx.result !== undefined) {
    result.result = tx.result;
  }
  if (tx.description !== undefined) {
    result.description = tx.description;
  }
  if (tx.isSession !== undefined) {
    result.is_session = tx.isSession;
  }
  if (tx.sessionCount !== undefined) {
    result.session_count = tx.sessionCount;
  }

  return result;
}

/**
 * Create a horse adapter based on the current mode
 */
export function createHorseAdapter(
  isDemoMode: boolean,
  supabase?: SupabaseClient,
  userId?: string,
) {
  if (isDemoMode) {
    return new LocalStorageAdapter<Horse>(STORAGE_KEY_HORSES);
  }

  if (!supabase || !userId) {
    throw new Error('Supabase client and userId required for database mode');
  }

  return new SupabaseAdapter<Horse, any>(
    supabase,
    'horses',
    userId,
    dbHorseToHorse,
    horseToDbHorse,
  );
}

/**
 * Create a horse transaction adapter based on the current mode
 */
export function createHorseTransactionAdapter(
  isDemoMode: boolean,
  supabase?: SupabaseClient,
  userId?: string,
) {
  if (isDemoMode) {
    return new LocalStorageAdapter<HorseTransaction>(STORAGE_KEY_TRANSACTIONS);
  }

  if (!supabase || !userId) {
    throw new Error('Supabase client and userId required for database mode');
  }

  return new SupabaseAdapter<HorseTransaction, any>(
    supabase,
    'horse_transactions',
    userId,
    dbTransactionToTransaction,
    transactionToDbTransaction,
  );
}

export {
  STORAGE_KEY_HORSES,
  STORAGE_KEY_TRANSACTIONS,
};
