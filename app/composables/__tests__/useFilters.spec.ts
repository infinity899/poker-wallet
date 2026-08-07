import type { Tournament, TournamentFilters } from '~/types';
import { describe, expect, it } from 'vitest';
import { DEFAULT_TOURNAMENT_FILTERS } from '~/types';
import { countActiveTournamentFilters, matchesTournamentFilters } from '../useFilters';

function createTournament(overrides: Partial<Tournament> = {}): Tournament {
  return {
    id: crypto.randomUUID(),
    date: '2024-01-15',
    type: 'live',
    currency: 'USD',
    name: 'Test Tournament',
    buyIn: 100,
    fee: 10,
    entries: 0,
    winnings: 0,
    tags: [],
    status: 'completed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function filters(overrides: Partial<TournamentFilters> = {}): TournamentFilters {
  return { ...DEFAULT_TOURNAMENT_FILTERS, ...overrides };
}

describe('matchesTournamentFilters', () => {
  it('passes everything through by default', () => {
    expect(matchesTournamentFilters(createTournament(), filters())).toBe(true);
  });

  it('filters by date range', () => {
    const t = createTournament({ date: '2024-06-01' });

    expect(matchesTournamentFilters(t, filters({
      dateRange: { start: '2024-01-01', end: '2024-12-31' },
    }))).toBe(true);
    expect(matchesTournamentFilters(t, filters({
      dateRange: { start: '2024-07-01', end: null },
    }))).toBe(false);
  });

  it('filters by play type and status', () => {
    const live = createTournament({ type: 'live', status: 'in_progress' });

    expect(matchesTournamentFilters(live, filters({ type: 'online' }))).toBe(false);
    expect(matchesTournamentFilters(live, filters({ type: 'live' }))).toBe(true);
    expect(matchesTournamentFilters(live, filters({ status: 'completed' }))).toBe(false);
    expect(matchesTournamentFilters(live, filters({ status: 'in_progress' }))).toBe(true);
  });

  it('matches the currency the entry was recorded in', () => {
    const t = createTournament({ currency: 'USD', originalCurrency: 'EUR' });

    expect(matchesTournamentFilters(t, filters({ currency: 'EUR' }))).toBe(true);
    expect(matchesTournamentFilters(t, filters({ currency: 'USD' }))).toBe(false);
  });

  it('bounds the buy-in on per-entry cost, fee included', () => {
    const t = createTournament({ buyIn: 100, fee: 10, entries: 5 });

    expect(matchesTournamentFilters(t, filters({ buyInMin: 110 }))).toBe(true);
    expect(matchesTournamentFilters(t, filters({ buyInMin: 111 }))).toBe(false);
    expect(matchesTournamentFilters(t, filters({ buyInMax: 110 }))).toBe(true);
    expect(matchesTournamentFilters(t, filters({ buyInMax: 109 }))).toBe(false);
  });

  it('matches a multi-site session on any of its sites', () => {
    const session = createTournament({
      type: 'online',
      isSession: true,
      site: 'GGPoker',
      sites: [{ name: 'GGPoker' }, { name: 'PokerStars' }],
    });

    expect(matchesTournamentFilters(session, filters({ venues: ['PokerStars'] }))).toBe(true);
    expect(matchesTournamentFilters(session, filters({ venues: ['888poker'] }))).toBe(false);
  });

  it('treats selected tags as OR', () => {
    const t = createTournament({ tags: ['Turbo'] });

    expect(matchesTournamentFilters(t, filters({ tags: ['Turbo', 'Deepstack'] }))).toBe(true);
    expect(matchesTournamentFilters(t, filters({ tags: ['Deepstack'] }))).toBe(false);
  });

  it('splits ITM from busted, respecting an explicit cashed flag', () => {
    const bountyCash = createTournament({ cashed: true, winnings: 0 });
    const busted = createTournament({ winnings: 0 });

    expect(matchesTournamentFilters(bountyCash, filters({ itm: 'itm' }))).toBe(true);
    expect(matchesTournamentFilters(bountyCash, filters({ itm: 'busted' }))).toBe(false);
    expect(matchesTournamentFilters(busted, filters({ itm: 'busted' }))).toBe(true);
    expect(matchesTournamentFilters(busted, filters({ itm: 'itm' }))).toBe(false);
  });

  it('searches name, notes, venues and tags case-insensitively', () => {
    const t = createTournament({
      name: 'Sunday Million',
      type: 'online',
      site: 'PokerStars',
      notes: 'Deep run',
      tags: ['Turbo'],
    });

    for (const query of ['sunday', 'pokerstars', 'deep', 'turbo']) {
      expect(matchesTournamentFilters(t, filters({ searchQuery: query }))).toBe(true);
    }
    expect(matchesTournamentFilters(t, filters({ searchQuery: 'bellagio' }))).toBe(false);
  });
});

describe('countActiveTournamentFilters', () => {
  it('counts nothing for the defaults', () => {
    expect(countActiveTournamentFilters(filters())).toBe(0);
  });

  it('counts a buy-in range once', () => {
    expect(countActiveTournamentFilters(filters({ buyInMin: 10, buyInMax: 100 }))).toBe(1);
  });

  it('counts each active group', () => {
    expect(countActiveTournamentFilters(filters({
      type: 'live',
      venues: ['Bellagio'],
      tags: ['Turbo'],
      itm: 'itm',
      searchQuery: 'main event',
    }))).toBe(5);
  });
});
