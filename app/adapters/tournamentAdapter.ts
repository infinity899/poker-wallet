import type { SupabaseClient } from '@supabase/supabase-js';
import type { DbTournament, Tournament } from '~/types';
import { dbTournamentToTournament } from '~/composables/useDatabase';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { SupabaseAdapter } from './SupabaseAdapter';

const STORAGE_KEY = 'poker-wallet-tournaments';
const SEED_DATA_PATH = '/data/tournaments.json';

/**
 * Create a tournament adapter based on the current mode
 */
export function createTournamentAdapter(
  isDemoMode: boolean,
  supabase?: SupabaseClient,
  userId?: string,
) {
  if (isDemoMode) {
    return new LocalStorageAdapter<Tournament>(STORAGE_KEY, SEED_DATA_PATH);
  }

  if (!supabase || !userId) {
    throw new Error('Supabase client and userId required for database mode');
  }

  return new SupabaseAdapter<Tournament, DbTournament>(
    supabase,
    'tournaments',
    userId,
    dbTournamentToTournament,
    (tournament: Partial<Tournament>) => {
      const result: Record<string, any> = {};

      if (tournament.date !== undefined) {
        result.date = tournament.date;
      }
      if (tournament.type !== undefined) {
        result.type = tournament.type;
      }
      if (tournament.currency !== undefined) {
        result.currency = tournament.currency;
      }
      if (tournament.name !== undefined) {
        result.name = tournament.name;
      }
      if (tournament.buyIn !== undefined) {
        result.buy_in = tournament.buyIn;
      }
      if (tournament.fee !== undefined) {
        result.fee = tournament.fee;
      }
      if (tournament.entries !== undefined) {
        result.entries = tournament.entries;
      }
      if (tournament.winnings !== undefined) {
        result.winnings = tournament.winnings;
      }
      if (tournament.venue !== undefined) {
        result.venue = tournament.venue;
      }
      if (tournament.site !== undefined) {
        result.site = tournament.site;
      }
      if (tournament.fieldSize !== undefined) {
        result.field_size = tournament.fieldSize;
      }
      if (tournament.finishPosition !== undefined) {
        result.finish_position = tournament.finishPosition;
      }
      if (tournament.cashed !== undefined) {
        result.cashed = tournament.cashed;
      }
      if (tournament.notes !== undefined) {
        result.notes = tournament.notes;
      }
      if (tournament.tags !== undefined) {
        result.tags = tournament.tags;
      }
      if (tournament.status !== undefined) {
        result.status = tournament.status;
      }
      if (tournament.sites !== undefined) {
        result.sites = tournament.sites;
      }
      if (tournament.isSession !== undefined) {
        result.is_session = tournament.isSession;
      }
      if (tournament.sessionCount !== undefined) {
        result.session_count = tournament.sessionCount;
      }
      if (tournament.originalCurrency !== undefined) {
        result.original_currency = tournament.originalCurrency;
      }
      if (tournament.originalBuyIn !== undefined) {
        result.original_buy_in = tournament.originalBuyIn;
      }
      if (tournament.originalFee !== undefined) {
        result.original_fee = tournament.originalFee;
      }
      if (tournament.originalWinnings !== undefined) {
        result.original_winnings = tournament.originalWinnings;
      }
      if (tournament.exchangeRate !== undefined) {
        result.exchange_rate = tournament.exchangeRate;
      }
      if (tournament.externalId !== undefined) {
        result.external_id = tournament.externalId;
      }
      if (tournament.source !== undefined) {
        result.source = tournament.source;
      }

      return result as Partial<DbTournament>;
    },
  );
}

export { STORAGE_KEY as TOURNAMENT_STORAGE_KEY };
