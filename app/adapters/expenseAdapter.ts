import type { SupabaseClient } from '@supabase/supabase-js';
import type { DbExpense, Expense } from '~/types';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { SupabaseAdapter } from './SupabaseAdapter';

const STORAGE_KEY = 'poker-wallet-expenses';
const SEED_DATA_PATH = '/data/expenses.json';

/**
 * Database row -> frontend Expense
 */
function dbExpenseToExpense(db: DbExpense): Expense {
  return {
    id: db.id,
    userId: db.user_id,
    tripId: db.trip_id ?? undefined,
    date: db.date,
    category: db.category,
    description: db.description ?? undefined,
    amount: db.amount,
    // Defensive fallbacks: these are NOT NULL in SQL but coalesce anyway.
    originalCurrency: db.original_currency ?? 'USD',
    originalAmount: db.original_amount ?? db.amount,
    exchangeRate: db.exchange_rate ?? 1,
    notes: db.notes ?? undefined,
    tags: db.tags ?? [],
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

/**
 * Create an expense adapter based on the current mode
 */
export function createExpenseAdapter(
  isDemoMode: boolean,
  supabase?: SupabaseClient,
  userId?: string,
) {
  if (isDemoMode) {
    return new LocalStorageAdapter<Expense>(STORAGE_KEY, SEED_DATA_PATH);
  }

  if (!supabase || !userId) {
    throw new Error('Supabase client and userId required for database mode');
  }

  return new SupabaseAdapter<Expense, DbExpense>(
    supabase,
    'expenses',
    userId,
    dbExpenseToExpense,
    (expense: Partial<Expense>) => {
      // Never map id / userId / createdAt / updatedAt - the DB owns those.
      const result: Record<string, any> = {};

      // trip_id is the ONE field using an `in` check instead of `!== undefined`.
      // Unlinking an expense from a trip means writing SQL NULL. The usual
      // `!== undefined` chain would silently SKIP the field and the old trip_id
      // would survive. `updateExpense(id, { tripId: undefined })` keeps the key,
      // so `in` detects the intent and we write null.
      if ('tripId' in expense) {
        result.trip_id = expense.tripId ?? null;
      }
      if (expense.date !== undefined) {
        result.date = expense.date;
      }
      if (expense.category !== undefined) {
        result.category = expense.category;
      }
      if (expense.description !== undefined) {
        result.description = expense.description;
      }
      if (expense.amount !== undefined) {
        result.amount = expense.amount;
      }
      if (expense.originalCurrency !== undefined) {
        result.original_currency = expense.originalCurrency;
      }
      if (expense.originalAmount !== undefined) {
        result.original_amount = expense.originalAmount;
      }
      if (expense.exchangeRate !== undefined) {
        result.exchange_rate = expense.exchangeRate;
      }
      if (expense.notes !== undefined) {
        result.notes = expense.notes;
      }
      if (expense.tags !== undefined) {
        result.tags = expense.tags;
      }

      return result as Partial<DbExpense>;
    },
  );
}

export { STORAGE_KEY as EXPENSE_STORAGE_KEY };
