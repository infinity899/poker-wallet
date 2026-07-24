import type { ExpenseCategoryTotal } from './expense';
import type { Currency } from './session';

/**
 * A Trip groups expenses AND links live tournaments for a festival / travel block.
 * e.g. "EPT Barcelona 2026" at Casino Barcelona, 2026-08-20 -> 2026-08-31.
 */
export interface Trip {
  id: string;
  userId?: string; // present on Supabase rows, unused in demo mode
  name: string; // "EPT Barcelona 2026"
  venue?: string; // "Casino Barcelona" — denormalized, matches Tournament.venue
  location?: string; // "Barcelona, Spain"
  /**
   * Trip START date, ISO YYYY-MM-DD.
   * The field MUST be named `date`: SupabaseAdapter.getAll() hard-codes
   * `.order('date', ...)` and getPaginated() uses `.lt('date', cursor)` for EVERY
   * table. Renaming this breaks Supabase mode only — demo mode keeps working.
   */
  date: string;
  endDate: string; // Trip END date, ISO YYYY-MM-DD, always >= date
  /**
   * Ids of tournaments played during this trip (denormalized, no junction table).
   * Ids CAN go stale when a tournament is deleted — never read this array directly
   * for display; go through useTripsStore().getTripTournaments(tripId), which
   * filters ids that no longer resolve.
   */
  tournamentIds: string[];
  /** Local currency of the trip. Only pre-fills the expense form; money is stored in USD. */
  currency?: Currency;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type NewTrip = Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Gross (poker-only) and net (after expenses) P&L for a single trip. All amounts USD.
 * Gross figures match what the tournaments screens already show — net is ADDITIVE.
 */
export interface TripPnL {
  buyIns: number; // POSITIVE magnitude: sum of (buyIn + fee) * (entries + 1)
  cashes: number; // POSITIVE magnitude: sum of winnings
  grossProfit: number; // signed, poker-only
  totalExpenses: number; // POSITIVE magnitude
  expensesByCategory: ExpenseCategoryTotal[]; // sorted desc, non-zero only
  netProfit: number; // grossProfit - totalExpenses
  roi: number; // GROSS roi %: grossProfit / buyIns * 100 (0 when buyIns === 0)
  netRoi: number; // NET roi %: netProfit / (buyIns + totalExpenses) * 100 (0 when denom === 0)
  tournamentCount: number; // completed linked tournaments only
  expenseCount: number;
}

/** Aggregate across every trip, for the trips index header. */
export interface TripStats extends TripPnL {
  totalTrips: number;
}
