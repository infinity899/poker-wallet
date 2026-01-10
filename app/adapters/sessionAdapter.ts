import type { SupabaseClient } from '@supabase/supabase-js';
import type { CashSession, DbSession } from '~/types';
import { dbSessionToSession } from '~/composables/useDatabase';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { SupabaseAdapter } from './SupabaseAdapter';

const STORAGE_KEY = 'poker-wallet-sessions';
const SEED_DATA_PATH = '/data/sessions.json';

/**
 * Create a session adapter based on the current mode
 */
export function createSessionAdapter(
  isDemoMode: boolean,
  supabase?: SupabaseClient,
  userId?: string,
) {
  if (isDemoMode) {
    return new LocalStorageAdapter<CashSession>(STORAGE_KEY, SEED_DATA_PATH);
  }

  if (!supabase || !userId) {
    throw new Error('Supabase client and userId required for database mode');
  }

  return new SupabaseAdapter<CashSession, DbSession>(
    supabase,
    'sessions',
    userId,
    dbSessionToSession,
    (session: Partial<CashSession>) => {
      // Convert frontend session to database format
      const result: Record<string, any> = {};

      if (session.date !== undefined) {
        result.date = session.date;
      }
      if (session.startTime !== undefined) {
        result.start_time = session.startTime;
      }
      if (session.endTime !== undefined) {
        result.end_time = session.endTime;
      }
      if (session.type !== undefined) {
        result.type = session.type;
      }
      if (session.currency !== undefined) {
        result.currency = session.currency;
      }
      if (session.stake !== undefined) {
        result.stake = session.stake;
      }
      if (session.smallBlind !== undefined) {
        result.small_blind = session.smallBlind;
      }
      if (session.bigBlind !== undefined) {
        result.big_blind = session.bigBlind;
      }
      if (session.game !== undefined) {
        result.game = session.game;
      }
      if (session.result !== undefined) {
        result.result = session.result;
      }
      if (session.duration !== undefined) {
        result.duration = session.duration;
      }
      if (session.location !== undefined) {
        result.location = session.location;
      }
      if (session.site !== undefined) {
        result.site = session.site;
      }
      if (session.tableCount !== undefined) {
        result.table_count = session.tableCount;
      }
      if (session.buyInTotal !== undefined) {
        result.buy_in_total = session.buyInTotal;
      }
      if (session.cashOutTotal !== undefined) {
        result.cash_out_total = session.cashOutTotal;
      }
      if (session.rakeFees !== undefined) {
        result.rake_fees = session.rakeFees;
      }
      if (session.notes !== undefined) {
        result.notes = session.notes;
      }
      if (session.tags !== undefined) {
        result.tags = session.tags;
      }
      if (session.sites !== undefined) {
        result.sites = session.sites;
      }
      if (session.status !== undefined) {
        result.status = session.status;
      }

      return result as Partial<DbSession>;
    },
  );
}

export { STORAGE_KEY as SESSION_STORAGE_KEY };
