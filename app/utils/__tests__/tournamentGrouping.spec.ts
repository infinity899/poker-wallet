import type { Tournament } from '~/types';
import { describe, expect, it } from 'vitest';
import {
  breakdownLabel,
  buildCumulativeSeries,
  buildTrendSeries,
  getTournamentBuyInLevel,
  getTournamentVenueNames,
  groupTournaments,
} from '../tournamentGrouping';

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

const usd = (amount: number) => `$${amount}`;

describe('getTournamentVenueNames', () => {
  it('collects the primary venue, site and every extra site entry', () => {
    const t = createTournament({
      venue: 'Bellagio',
      sites: [{ name: 'Bellagio' }, { name: 'Aria' }],
    });

    expect(getTournamentVenueNames(t)).toEqual(['Bellagio', 'Aria']);
  });

  it('returns nothing when no venue was recorded', () => {
    expect(getTournamentVenueNames(createTournament())).toEqual([]);
  });
});

describe('getTournamentBuyInLevel', () => {
  it('is the per-entry cost, fee included and re-entries excluded', () => {
    expect(getTournamentBuyInLevel(createTournament({ buyIn: 100, fee: 10, entries: 3 }))).toBe(110);
  });
});

describe('groupTournaments', () => {
  it('returns a single group when no breakdown is selected', () => {
    const groups = groupTournaments([createTournament(), createTournament()], 'none');

    expect(groups).toHaveLength(1);
    expect(groups[0]!.tournaments).toHaveLength(2);
  });

  it('returns no groups for an empty set', () => {
    expect(groupTournaments([], 'type')).toEqual([]);
  });

  it('splits live from online, live first', () => {
    const groups = groupTournaments([
      createTournament({ type: 'online' }),
      createTournament({ type: 'live' }),
      createTournament({ type: 'online' }),
    ], 'type');

    expect(groups.map(g => g.label)).toEqual(['Live', 'Online']);
    expect(groups[1]!.tournaments).toHaveLength(2);
  });

  it('groups by venue or site, ordered by size', () => {
    const groups = groupTournaments([
      createTournament({ type: 'online', site: 'GGPoker' }),
      createTournament({ type: 'online', site: 'PokerStars' }),
      createTournament({ type: 'online', site: 'PokerStars' }),
    ], 'venue');

    expect(groups.map(g => g.label)).toEqual(['PokerStars', 'GGPoker']);
  });

  it('keeps multi-site sessions out of the individual site groups', () => {
    const groups = groupTournaments([
      createTournament({
        type: 'online',
        isSession: true,
        site: 'GGPoker',
        sites: [{ name: 'GGPoker' }, { name: 'PokerStars' }],
      }),
    ], 'venue');

    expect(groups.map(g => g.label)).toEqual(['Multiple sites']);
  });

  it('labels tournaments with no venue as unspecified', () => {
    expect(groupTournaments([createTournament()], 'venue')[0]!.label).toBe('Unspecified');
  });

  it('buckets by per-entry cost, ascending, with sessions last', () => {
    const groups = groupTournaments([
      createTournament({ buyIn: 200, fee: 20 }), // 220 → 100–250
      createTournament({ buyIn: 20, fee: 2 }), // 22 → 10–25
      createTournament({ buyIn: 900, fee: 100 }), // 1000 → 500+
      createTournament({ isSession: true, buyIn: 50, fee: 5 }),
    ], 'buyIn', { formatAmount: usd });

    expect(groups.map(g => g.label)).toEqual(['$10–$25', '$100–$250', '$500+', 'Sessions']);
  });

  it('groups by the currency the entry was recorded in', () => {
    const groups = groupTournaments([
      createTournament({ currency: 'USD', originalCurrency: 'EUR' }),
      createTournament({ currency: 'USD' }),
    ], 'currency');

    expect(groups.map(g => g.label).sort()).toEqual(['EUR', 'USD']);
  });

  it('counts a multi-tag tournament once per tag and collects untagged last', () => {
    const groups = groupTournaments([
      createTournament({ tags: ['Turbo', 'Deepstack'] }),
      createTournament({ tags: ['Turbo'] }),
      createTournament({ tags: [] }),
    ], 'tag');

    expect(groups.map(g => g.label)).toEqual(['Turbo', 'Deepstack', 'Untagged']);
    expect(groups[0]!.tournaments).toHaveLength(2);
  });

  it('folds the smallest groups into Other past the cap', () => {
    const tournaments = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].flatMap((site, index) =>
      // Give earlier sites more tournaments so the tail is what gets folded.
      Array.from({ length: 8 - index }, () => createTournament({ type: 'online', site })));

    const groups = groupTournaments(tournaments, 'venue');

    expect(groups).toHaveLength(7); // 6 kept + Other
    expect(groups.at(-1)!.label).toBe('Other (2)');
    expect(groups.at(-1)!.tournaments).toHaveLength(3); // sites g (2) and h (1)
    expect(groups.flatMap(g => g.tournaments)).toHaveLength(tournaments.length);
  });
});

describe('buildCumulativeSeries', () => {
  it('aligns every group on one date axis and carries totals forward', () => {
    const groups = groupTournaments([
      createTournament({ type: 'live', date: '2024-01-01', buyIn: 100, fee: 0, winnings: 300 }),
      createTournament({ type: 'online', date: '2024-01-02', buyIn: 50, fee: 0, winnings: 0 }),
      createTournament({ type: 'live', date: '2024-01-03', buyIn: 100, fee: 0, winnings: 0 }),
    ], 'type');

    const { dates, series } = buildCumulativeSeries(groups);

    expect(dates).toEqual(['2024-01-01', '2024-01-02', '2024-01-03']);
    // Live: +200 on day 1, held on day 2, −100 on day 3.
    expect(series[0]).toMatchObject({ label: 'Live', data: [200, 200, 100] });
    // Online has nothing before day 2, so its line starts there.
    expect(series[1]).toMatchObject({ label: 'Online', data: [null, -50, -50] });
  });

  it('sums several tournaments landing on the same date', () => {
    const { dates, series } = buildCumulativeSeries(groupTournaments([
      createTournament({ date: '2024-02-01', buyIn: 100, fee: 0, winnings: 250 }),
      createTournament({ date: '2024-02-01', buyIn: 100, fee: 0, winnings: 0 }),
    ], 'none'));

    expect(dates).toEqual(['2024-02-01']);
    expect(series[0]!.data).toEqual([50]);
  });

  it('handles an empty set', () => {
    expect(buildCumulativeSeries([])).toEqual({ dates: [], series: [] });
  });
});

describe('buildTrendSeries', () => {
  const pointsPerTournament = (tournaments: Tournament[]) =>
    tournaments.map(t => ({ date: t.date, value: t.winnings }));

  it('carries the last value forward and stays null before a group starts', () => {
    const groups = groupTournaments([
      createTournament({ type: 'live', date: '2024-01-01', winnings: 10 }),
      createTournament({ type: 'online', date: '2024-01-03', winnings: 50 }),
    ], 'type');

    const { dates, series } = buildTrendSeries(groups, pointsPerTournament);

    expect(dates).toEqual(['2024-01-01', '2024-01-03']);
    expect(series[0]).toMatchObject({ label: 'Live', data: [10, 10] });
    expect(series[1]).toMatchObject({ label: 'Online', data: [null, 50] });
  });

  it('drops groups whose window produced no points', () => {
    const groups = groupTournaments([
      createTournament({ type: 'live', date: '2024-01-01', winnings: 10 }),
      createTournament({ type: 'online', date: '2024-01-02', winnings: 20 }),
    ], 'type');

    // Stands in for a rolling window only the live group has enough entries for.
    const { series } = buildTrendSeries(groups, tournaments =>
      pointsPerTournament(tournaments.filter(t => t.type === 'live')));

    expect(series.map(s => s.label)).toEqual(['Live']);
  });
});

describe('breakdownLabel', () => {
  it('names each dimension', () => {
    expect(breakdownLabel('type')).toBe('Live vs Online');
    expect(breakdownLabel('none')).toBe('No breakdown');
  });
});
