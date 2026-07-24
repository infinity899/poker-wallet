import type { SupabaseClient } from '@supabase/supabase-js';
import type { DbTrip, Trip } from '~/types';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { SupabaseAdapter } from './SupabaseAdapter';

const STORAGE_KEY = 'poker-wallet-trips';
const SEED_DATA_PATH = '/data/trips.json';

/**
 * Database row -> frontend Trip
 */
function dbTripToTrip(db: DbTrip): Trip {
  return {
    id: db.id,
    userId: db.user_id,
    name: db.name,
    venue: db.venue ?? undefined,
    location: db.location ?? undefined,
    date: db.date,
    endDate: db.end_date,
    currency: db.currency ?? undefined,
    tournamentIds: db.tournament_ids ?? [],
    notes: db.notes ?? undefined,
    tags: db.tags ?? [],
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

/**
 * Create a trip adapter based on the current mode
 */
export function createTripAdapter(
  isDemoMode: boolean,
  supabase?: SupabaseClient,
  userId?: string,
) {
  if (isDemoMode) {
    return new LocalStorageAdapter<Trip>(STORAGE_KEY, SEED_DATA_PATH);
  }

  if (!supabase || !userId) {
    throw new Error('Supabase client and userId required for database mode');
  }

  return new SupabaseAdapter<Trip, DbTrip>(
    supabase,
    'trips',
    userId,
    dbTripToTrip,
    (trip: Partial<Trip>) => {
      // Never map id / userId / createdAt / updatedAt - the DB owns those.
      const result: Record<string, any> = {};

      if (trip.name !== undefined) {
        result.name = trip.name;
      }
      if (trip.venue !== undefined) {
        result.venue = trip.venue;
      }
      if (trip.location !== undefined) {
        result.location = trip.location;
      }
      if (trip.date !== undefined) {
        result.date = trip.date;
      }
      if (trip.endDate !== undefined) {
        result.end_date = trip.endDate;
      }
      if (trip.currency !== undefined) {
        result.currency = trip.currency;
      }
      if (trip.tournamentIds !== undefined) {
        result.tournament_ids = trip.tournamentIds;
      }
      if (trip.notes !== undefined) {
        result.notes = trip.notes;
      }
      if (trip.tags !== undefined) {
        result.tags = trip.tags;
      }

      return result as Partial<DbTrip>;
    },
  );
}

export { STORAGE_KEY as TRIP_STORAGE_KEY };
