import type { ExpenseCategory } from './expense';
import type { Currency, GameType, SessionType } from './session';

export interface DateRange {
  start: string | null; // ISO date string
  end: string | null;
}

export type DateRangePreset = '7d' | '30d' | '90d' | 'ytd' | '12m' | 'lifetime' | 'custom';

export interface SessionFilters {
  dateRange: DateRange;
  datePreset: DateRangePreset;
  type: SessionType | 'all';
  game: GameType | 'all';
  currency: Currency | 'all';
  stakes: string[]; // empty = all stakes
  venues: string[]; // venue/site IDs, empty = all
  tags: string[]; // tag IDs, empty = all
  minProfit?: number;
  maxProfit?: number;
  searchQuery?: string;
}

/** In-the-money outcome filter. */
export type TournamentItmFilter = 'all' | 'itm' | 'busted';

/** Completion state filter. */
export type TournamentStatusFilter = 'all' | 'completed' | 'in_progress';

export interface TournamentFilters {
  dateRange: DateRange;
  datePreset: DateRangePreset;
  type: SessionType | 'all';
  currency: Currency | 'all';
  /** Per-entry cost (buy-in + fee), in USD. */
  buyInMin?: number;
  buyInMax?: number;
  venues: string[]; // live venue and online site names, empty = all
  tags: string[]; // tag names, empty = all
  itm: TournamentItmFilter;
  status: TournamentStatusFilter;
  searchQuery?: string;
}

export const DEFAULT_SESSION_FILTERS: SessionFilters = {
  dateRange: { start: null, end: null },
  datePreset: 'lifetime',
  type: 'all',
  game: 'all',
  currency: 'all',
  stakes: [],
  venues: [],
  tags: [],
};

export const DEFAULT_TOURNAMENT_FILTERS: TournamentFilters = {
  dateRange: { start: null, end: null },
  datePreset: 'lifetime',
  type: 'all',
  currency: 'all',
  venues: [],
  tags: [],
  itm: 'all',
  status: 'all',
};

export interface ExpenseFilters {
  dateRange: DateRange;
  datePreset: DateRangePreset;
  categories: ExpenseCategory[]; // empty = all categories
  tripId: string | 'all' | 'none'; // 'all' = every expense, 'none' = standalone only
  searchQuery?: string;
}

export const DEFAULT_EXPENSE_FILTERS: ExpenseFilters = {
  dateRange: { start: null, end: null },
  datePreset: 'lifetime',
  categories: [],
  tripId: 'all',
};

// Dashboard filter for combined view
export interface DashboardFilters {
  includeCash: boolean;
  includeTournaments: boolean;
  type: SessionType | 'all'; // live/online/all
  datePreset: DateRangePreset;
  dateRange: DateRange;
}

export const DEFAULT_DASHBOARD_FILTERS: DashboardFilters = {
  includeCash: true,
  includeTournaments: true,
  type: 'all',
  datePreset: 'lifetime',
  dateRange: { start: null, end: null },
};
