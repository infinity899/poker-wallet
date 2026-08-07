import type {
  DateRange,
  DateRangePreset,
  SessionFilters,
  Tournament,
  TournamentFilters,
} from '~/types';
import {
  DEFAULT_SESSION_FILTERS,
  DEFAULT_TOURNAMENT_FILTERS,
} from '~/types';
import { isTournamentITM } from '~/utils/calculations';
import { getTournamentBuyInLevel, getTournamentVenueNames } from '~/utils/tournamentGrouping';

export function getDateRangeFromPreset(preset: DateRangePreset): DateRange {
  const now = new Date();
  const today = now.toISOString().split('T')[0] as string;

  switch (preset) {
    case '7d': {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      const startStr = start.toISOString().split('T')[0] as string;
      return { start: startStr, end: today };
    }
    case '30d': {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      const startStr = start.toISOString().split('T')[0] as string;
      return { start: startStr, end: today };
    }
    case '90d': {
      const start = new Date(now);
      start.setDate(start.getDate() - 90);
      const startStr = start.toISOString().split('T')[0] as string;
      return { start: startStr, end: today };
    }
    case 'ytd': {
      const start = new Date(now.getFullYear(), 0, 1);
      const startStr = start.toISOString().split('T')[0] as string;
      return { start: startStr, end: today };
    }
    case '12m': {
      const start = new Date(now);
      start.setFullYear(start.getFullYear() - 1);
      const startStr = start.toISOString().split('T')[0] as string;
      return { start: startStr, end: today };
    }
    case 'lifetime':
    case 'custom':
    default:
      return { start: null, end: null };
  }
}

export function isDateInRange(dateString: string, range: DateRange): boolean {
  if (!range.start && !range.end) {
    return true;
  }

  const date = new Date(dateString);

  if (range.start && date < new Date(range.start)) {
    return false;
  }
  if (range.end && date > new Date(range.end)) {
    return false;
  }

  return true;
}

export function useSessionFilters() {
  const filters = ref<SessionFilters>({ ...DEFAULT_SESSION_FILTERS });

  const setDatePreset = (preset: DateRangePreset) => {
    filters.value.datePreset = preset;
    filters.value.dateRange = getDateRangeFromPreset(preset);
  };

  const setCustomDateRange = (range: DateRange) => {
    filters.value.datePreset = 'custom';
    filters.value.dateRange = range;
  };

  const resetFilters = () => {
    filters.value = { ...DEFAULT_SESSION_FILTERS };
  };

  const hasActiveFilters = computed(() => {
    const f = filters.value;
    return (
      f.datePreset !== 'lifetime'
      || f.type !== 'all'
      || f.game !== 'all'
      || f.currency !== 'all'
      || f.stakes.length > 0
      || f.venues.length > 0
      || f.tags.length > 0
      || f.minProfit !== undefined
      || f.maxProfit !== undefined
      || (f.searchQuery && f.searchQuery.length > 0)
    );
  });

  return {
    filters,
    setDatePreset,
    setCustomDateRange,
    resetFilters,
    hasActiveFilters,
  };
}

/**
 * Single source of truth for "does this tournament pass the filters?".
 *
 * Shared by the tournaments store and the analytics page, which filter the same
 * data through separate filter objects — the store's page-wide one and the
 * analytics-local one — and must agree on what every filter means.
 */
export function matchesTournamentFilters(t: Tournament, f: TournamentFilters): boolean {
  if (!isDateInRange(t.date, f.dateRange)) {
    return false;
  }

  if (f.type !== 'all' && t.type !== f.type) {
    return false;
  }

  if (f.status !== 'all' && t.status !== f.status) {
    return false;
  }

  // Match the currency the entry was recorded in, not the legacy display field.
  if (f.currency !== 'all' && (t.originalCurrency ?? t.currency) !== f.currency) {
    return false;
  }

  // Buy-in bounds are per-entry cost in USD, matching the buy-in level buckets.
  const buyInLevel = getTournamentBuyInLevel(t);
  if (f.buyInMin !== undefined && buyInLevel < f.buyInMin) {
    return false;
  }
  if (f.buyInMax !== undefined && buyInLevel > f.buyInMax) {
    return false;
  }

  // A multi-site session matches on any of the sites it touched.
  if (f.venues.length > 0 && !getTournamentVenueNames(t).some(name => f.venues.includes(name))) {
    return false;
  }

  if (f.tags.length > 0 && !f.tags.some(tag => t.tags.includes(tag))) {
    return false;
  }

  if (f.itm !== 'all') {
    const cashed = isTournamentITM(t);
    if (f.itm === 'itm' && !cashed) {
      return false;
    }
    if (f.itm === 'busted' && cashed) {
      return false;
    }
  }

  if (f.searchQuery && f.searchQuery.length > 0) {
    const query = f.searchQuery.toLowerCase();
    const searchableText = [t.name, t.notes, ...getTournamentVenueNames(t), ...t.tags]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (!searchableText.includes(query)) {
      return false;
    }
  }

  return true;
}

/**
 * How many filter groups are narrowing the tournament set — drives the badge on
 * the filter bar. Min/max buy-in count as one group, as they read as one control.
 */
export function countActiveTournamentFilters(f: TournamentFilters): number {
  let count = 0;

  if (f.datePreset !== 'lifetime') {
    count++;
  }
  if (f.type !== 'all') {
    count++;
  }
  if (f.currency !== 'all') {
    count++;
  }
  if (f.buyInMin !== undefined || f.buyInMax !== undefined) {
    count++;
  }
  if (f.venues.length > 0) {
    count++;
  }
  if (f.tags.length > 0) {
    count++;
  }
  if (f.itm !== 'all') {
    count++;
  }
  if (f.status !== 'all') {
    count++;
  }
  if (f.searchQuery && f.searchQuery.length > 0) {
    count++;
  }

  return count;
}

export function useTournamentFilters() {
  const filters = ref<TournamentFilters>({ ...DEFAULT_TOURNAMENT_FILTERS });

  const setDatePreset = (preset: DateRangePreset) => {
    filters.value.datePreset = preset;
    filters.value.dateRange = getDateRangeFromPreset(preset);
  };

  const setCustomDateRange = (range: DateRange) => {
    filters.value.datePreset = 'custom';
    filters.value.dateRange = range;
  };

  const resetFilters = () => {
    filters.value = { ...DEFAULT_TOURNAMENT_FILTERS };
  };

  const hasActiveFilters = computed(() => countActiveTournamentFilters(filters.value) > 0);

  return {
    filters,
    setDatePreset,
    setCustomDateRange,
    resetFilters,
    hasActiveFilters,
  };
}
