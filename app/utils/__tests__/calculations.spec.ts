import type { CashSession, Expense, Tournament } from '~/types';
import { describe, expect, it } from 'vitest';
import {
  calculateBuyInBreakdown,
  calculateCumulativeProfit,
  calculateExpensesByCategory,
  calculateExpenseStats,
  calculateHourlyRateTrend,
  calculateITMTrend,
  calculateProfitDistribution,
  calculateROITrend,
  calculateSessionStats,
  calculateTournamentStats,
  calculateTripPnL,
  calculateTripsStats,
  calculateWinningsBySite,
  getTotalEntries,
  getTournamentEntryCount,
  getTournamentNetProfit,
  roundToCents,
} from '../calculations';

function createSession(overrides: Partial<CashSession> = {}): CashSession {
  return {
    id: crypto.randomUUID(),
    date: '2024-01-15',
    type: 'live',
    game: 'NLH',
    currency: 'USD',
    stake: '1/2',
    smallBlind: 1,
    bigBlind: 2,
    result: 0,
    duration: 120,
    tags: [],
    status: 'completed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

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

function createExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: crypto.randomUUID(),
    date: '2024-01-15',
    category: 'food',
    amount: 100,
    originalCurrency: 'USD',
    originalAmount: 100,
    exchangeRate: 1,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('roundToCents', () => {
  it('clears float artifacts from decimal arithmetic', () => {
    expect(roundToCents(120.2 - 100.1)).toBe(20.1);
    expect(roundToCents(0.1 + 0.2)).toBe(0.3);
  });

  it('leaves clean values untouched', () => {
    expect(roundToCents(20.2)).toBe(20.2);
    expect(roundToCents(100)).toBe(100);
    expect(roundToCents(-45.55)).toBe(-45.55);
  });

  it('rounds beyond two decimals', () => {
    expect(roundToCents(1.005)).toBe(1.01);
    expect(roundToCents(2.344)).toBe(2.34);
  });
});

describe('calculateSessionStats', () => {
  it('returns zero stats for empty array', () => {
    const stats = calculateSessionStats([]);
    expect(stats.totalSessions).toBe(0);
    expect(stats.totalProfit).toBe(0);
    expect(stats.totalHours).toBe(0);
    expect(stats.winRate).toBe(0);
    expect(stats.hourlyRate).toBe(0);
  });

  it('calculates total sessions correctly', () => {
    const sessions = [
      createSession({ result: 100 }),
      createSession({ result: -50 }),
      createSession({ result: 0 }),
    ];
    const stats = calculateSessionStats(sessions);
    expect(stats.totalSessions).toBe(3);
  });

  it('calculates total profit correctly', () => {
    const sessions = [
      createSession({ result: 100 }),
      createSession({ result: -50 }),
      createSession({ result: 200 }),
    ];
    const stats = calculateSessionStats(sessions);
    expect(stats.totalProfit).toBe(250);
  });

  it('calculates total hours correctly', () => {
    const sessions = [
      createSession({ duration: 60 }),
      createSession({ duration: 120 }),
      createSession({ duration: 90 }),
    ];
    const stats = calculateSessionStats(sessions);
    expect(stats.totalHours).toBe(4.5);
  });

  it('calculates win rate correctly', () => {
    const sessions = [
      createSession({ result: 100 }),
      createSession({ result: -50 }),
      createSession({ result: 200 }),
      createSession({ result: 0 }),
    ];
    const stats = calculateSessionStats(sessions);
    expect(stats.winRate).toBe(50); // 2 wins out of 4
  });

  it('calculates hourly rate correctly', () => {
    const sessions = [
      createSession({ result: 100, duration: 60 }),
      createSession({ result: 50, duration: 30 }),
    ];
    const stats = calculateSessionStats(sessions);
    expect(stats.hourlyRate).toBe(100); // 150 / 1.5 hours
  });

  it('calculates best and worst sessions', () => {
    const sessions = [
      createSession({ result: 500 }),
      createSession({ result: -200 }),
      createSession({ result: 100 }),
    ];
    const stats = calculateSessionStats(sessions);
    expect(stats.bestSession).toBe(500);
    expect(stats.worstSession).toBe(-200);
  });

  it('calculates winning streak correctly', () => {
    const sessions = [
      createSession({ date: '2024-01-01', result: 100 }),
      createSession({ date: '2024-01-02', result: 200 }),
      createSession({ date: '2024-01-03', result: 50 }),
    ];
    const stats = calculateSessionStats(sessions);
    expect(stats.currentStreak).toBe(3); // All wins, sorted by date desc
  });

  it('calculates losing streak correctly', () => {
    const sessions = [
      createSession({ date: '2024-01-01', result: 100 }),
      createSession({ date: '2024-01-02', result: -50 }),
      createSession({ date: '2024-01-03', result: -100 }),
    ];
    const stats = calculateSessionStats(sessions);
    expect(stats.currentStreak).toBe(-2); // 2 losses most recent
  });
});

describe('calculateTournamentStats', () => {
  it('returns zero stats for empty array', () => {
    const stats = calculateTournamentStats([]);
    expect(stats.totalTournaments).toBe(0);
    expect(stats.totalProfit).toBe(0);
    expect(stats.roi).toBe(0);
  });

  it('calculates total tournaments correctly', () => {
    const tournaments = [
      createTournament(),
      createTournament(),
      createTournament(),
    ];
    const stats = calculateTournamentStats(tournaments);
    expect(stats.totalTournaments).toBe(3);
  });

  it('calculates total buy-ins including fees and entries', () => {
    const tournaments = [
      createTournament({ buyIn: 100, fee: 10, entries: 0 }), // 110
      createTournament({ buyIn: 200, fee: 20, entries: 1 }), // 440 (2 entries)
    ];
    const stats = calculateTournamentStats(tournaments);
    expect(stats.totalBuyIns).toBe(550);
  });

  it('calculates ROI correctly', () => {
    const tournaments = [
      createTournament({ buyIn: 100, fee: 0, entries: 0, winnings: 220 }), // 120 profit
    ];
    const stats = calculateTournamentStats(tournaments);
    expect(stats.roi).toBe(120); // (220-100)/100 * 100
  });

  it('calculates ITM correctly', () => {
    const tournaments = [
      createTournament({ winnings: 500, cashed: true }),
      createTournament({ winnings: 0, cashed: false }),
      createTournament({ winnings: 200 }), // No explicit cashed, but winnings > 0
    ];
    const stats = calculateTournamentStats(tournaments);
    expect(stats.itm).toBe(2);
    expect(stats.itmPercentage).toBeCloseTo(66.67, 1);
  });

  it('calculates finish stats correctly', () => {
    const tournaments = [
      createTournament({ finishPosition: 1, fieldSize: 100 }),
      createTournament({ finishPosition: 10, fieldSize: 200 }),
      createTournament({ finishPosition: 5, fieldSize: 150 }),
    ];
    const stats = calculateTournamentStats(tournaments);
    expect(stats.avgFinish).toBeCloseTo(5.33, 1);
    expect(stats.bestFinish).toBe(1);
    expect(stats.avgFieldSize).toBe(150);
  });

  it('calculates avg cash multiple over cashed tournaments only', () => {
    const tournaments = [
      createTournament({ buyIn: 100, fee: 0, entries: 0, winnings: 200, cashed: true }), // 2.0x
      createTournament({ buyIn: 100, fee: 0, entries: 0, winnings: 150, cashed: true }), // 1.5x
      createTournament({ buyIn: 100, fee: 0, entries: 0, winnings: 0, cashed: false }), // excluded
    ];
    const stats = calculateTournamentStats(tournaments);
    expect(stats.avgCashMultiple).toBeCloseTo(1.75, 5);
    expect(stats.biggestCash).toBe(200);
  });

  it('returns zero avg cash multiple when nothing cashed', () => {
    const tournaments = [
      createTournament({ winnings: 0, cashed: false }),
      createTournament({ winnings: 0, cashed: false }),
    ];
    const stats = calculateTournamentStats(tournaments);
    expect(stats.avgCashMultiple).toBe(0);
    expect(stats.biggestCash).toBe(0);
  });
});

describe('calculateCumulativeProfit', () => {
  it('calculates cumulative profit correctly', () => {
    const sessions = [
      createSession({ date: '2024-01-01', result: 100 }),
      createSession({ date: '2024-01-02', result: -50 }),
      createSession({ date: '2024-01-03', result: 200 }),
    ];

    const result = calculateCumulativeProfit(sessions, s => (s as CashSession).result);

    expect(result).toHaveLength(3);
    expect(result[0]?.cumulative).toBe(100);
    expect(result[1]?.cumulative).toBe(50);
    expect(result[2]?.cumulative).toBe(250);
  });

  it('sorts by date ascending', () => {
    const sessions = [
      createSession({ date: '2024-01-03', result: 100 }),
      createSession({ date: '2024-01-01', result: 50 }),
      createSession({ date: '2024-01-02', result: 75 }),
    ];

    const result = calculateCumulativeProfit(sessions, s => (s as CashSession).result);

    expect(result[0]?.date).toBe('2024-01-01');
    expect(result[1]?.date).toBe('2024-01-02');
    expect(result[2]?.date).toBe('2024-01-03');
  });
});

describe('calculateHourlyRateTrend', () => {
  it('returns empty array if not enough sessions', () => {
    const sessions = [createSession({ result: 100, duration: 60 })];
    const result = calculateHourlyRateTrend(sessions, 10);
    expect(result).toHaveLength(0);
  });

  it('calculates rolling hourly rate', () => {
    const sessions = [
      createSession({ date: '2024-01-01', result: 60, duration: 60 }),
      createSession({ date: '2024-01-02', result: 60, duration: 60 }),
      createSession({ date: '2024-01-03', result: 60, duration: 60 }),
    ];

    const result = calculateHourlyRateTrend(sessions, 2);

    expect(result).toHaveLength(2);
    expect(result[0]?.hourlyRate).toBe(60);
    expect(result[1]?.hourlyRate).toBe(60);
  });
});

describe('calculateProfitDistribution', () => {
  it('returns empty array for no sessions', () => {
    const result = calculateProfitDistribution([]);
    expect(result).toHaveLength(0);
  });

  it('creates buckets for profit distribution', () => {
    const sessions = [
      createSession({ result: 50 }),
      createSession({ result: 75 }),
      createSession({ result: 150 }),
    ];

    const result = calculateProfitDistribution(sessions, 100);

    expect(result.length).toBeGreaterThan(0);
    const firstBucket = result.find(b => b.bucket.includes('0-100'));
    expect(firstBucket?.count).toBe(2);
  });
});

describe('calculateROITrend', () => {
  it('returns empty array if not enough tournaments', () => {
    const tournaments = [createTournament({ buyIn: 100, fee: 0, winnings: 200 })];
    const result = calculateROITrend(tournaments, 10);
    expect(result).toHaveLength(0);
  });

  it('calculates rolling ROI', () => {
    const tournaments = [
      createTournament({ date: '2024-01-01', buyIn: 100, fee: 0, entries: 0, winnings: 200 }),
      createTournament({ date: '2024-01-02', buyIn: 100, fee: 0, entries: 0, winnings: 200 }),
    ];

    const result = calculateROITrend(tournaments, 2);

    expect(result).toHaveLength(1);
    expect(result[0]?.roi).toBe(100); // (400-200)/200 * 100
  });
});

describe('getTournamentEntryCount', () => {
  it('counts the initial entry when there are no re-entries', () => {
    expect(getTournamentEntryCount({ entries: 0 })).toBe(1);
  });

  it('adds one per re-entry', () => {
    expect(getTournamentEntryCount({ entries: 2 })).toBe(3);
  });

  it('treats a missing entries value as a single entry', () => {
    expect(getTournamentEntryCount({ entries: undefined as unknown as number })).toBe(1);
  });
});

describe('getTotalEntries', () => {
  it('returns 0 for an empty list', () => {
    expect(getTotalEntries([])).toBe(0);
  });

  it('sums entries across tournaments, counting each at least once', () => {
    expect(getTotalEntries([{ entries: 0 }, { entries: 1 }, { entries: 3 }])).toBe(7);
  });
});

describe('getTournamentNetProfit', () => {
  it('uses winnings minus cost for a standard tournament', () => {
    const t = createTournament({ buyIn: 100, fee: 10, entries: 0, winnings: 300 });
    expect(getTournamentNetProfit(t)).toBe(190); // 300 - 110
  });

  it('accounts for re-entries in the cost', () => {
    const t = createTournament({ buyIn: 100, fee: 10, entries: 2, winnings: 0 });
    expect(getTournamentNetProfit(t)).toBe(-330); // -(110 * 3)
  });

  it('derives profit from bankroll deltas for multi-site sessions', () => {
    const t = createTournament({
      isSession: true,
      sites: [
        { name: 'A', bankrollInitial: 100, bankrollFinal: 250 },
        { name: 'B', bankrollInitial: 50, bankrollFinal: 0 },
      ],
    });
    expect(getTournamentNetProfit(t)).toBe(100); // (250 + 0) - (100 + 50)
  });

  it('falls back to the cost formula when a session has no sites', () => {
    const t = createTournament({ isSession: true, sites: [], buyIn: 100, fee: 0, entries: 0, winnings: 150 });
    expect(getTournamentNetProfit(t)).toBe(50); // 150 - 100
  });
});

describe('calculateITMTrend', () => {
  it('returns empty array if not enough tournaments', () => {
    const tournaments = [createTournament({ winnings: 100 })];
    expect(calculateITMTrend(tournaments, 10)).toHaveLength(0);
  });

  it('calculates rolling ITM percentage', () => {
    const tournaments = [
      createTournament({ date: '2024-01-01', winnings: 100 }), // itm
      createTournament({ date: '2024-01-02', winnings: 50 }), // itm
      createTournament({ date: '2024-01-03', winnings: 0 }), // miss
    ];

    const result = calculateITMTrend(tournaments, 2);

    expect(result).toHaveLength(2);
    expect(result[0]?.itmPercentage).toBe(100); // [t1, t2]
    expect(result[1]?.itmPercentage).toBe(50); // [t2, t3]
  });

  it('sorts by date before windowing', () => {
    const tournaments = [
      createTournament({ date: '2024-01-03', winnings: 0 }),
      createTournament({ date: '2024-01-01', winnings: 100 }),
      createTournament({ date: '2024-01-02', winnings: 50 }),
    ];

    const result = calculateITMTrend(tournaments, 2);

    expect(result[0]?.date).toBe('2024-01-02');
    expect(result[0]?.itmPercentage).toBe(100); // [t@01, t@02] both itm
    expect(result[1]?.date).toBe('2024-01-03');
  });
});

describe('calculateBuyInBreakdown', () => {
  it('returns empty array for no tournaments', () => {
    expect(calculateBuyInBreakdown([])).toHaveLength(0);
  });

  it('buckets by per-entry buy-in level with half-open ranges', () => {
    const tournaments = [
      createTournament({ buyIn: 5, fee: 0 }), // level 5 -> [0, 10)
      createTournament({ buyIn: 10, fee: 0 }), // level 10 -> [10, 25) (boundary)
      createTournament({ buyIn: 100, fee: 10 }), // level 110 -> [100, 250)
      createTournament({ buyIn: 600, fee: 0 }), // level 600 -> [500, null)
    ];

    const result = calculateBuyInBreakdown(tournaments);

    expect(result).toHaveLength(4);
    expect(result[0]).toMatchObject({ min: 0, max: 10, count: 1 });
    expect(result[1]).toMatchObject({ min: 10, max: 25, count: 1 });
    expect(result[3]).toMatchObject({ min: 500, max: null, count: 1 });
  });

  it('computes ROI and ITM percentage per bucket', () => {
    const tournaments = [
      createTournament({ buyIn: 100, fee: 10, entries: 0, winnings: 220 }), // level 110, cost 110, profit 110
    ];

    const result = calculateBuyInBreakdown(tournaments);
    const bucket = result.find(b => b.min === 100);

    expect(bucket?.roi).toBe(100); // 110 / 110 * 100
    expect(bucket?.itmPercentage).toBe(100); // winnings > 0
  });

  it('excludes session-type tournaments', () => {
    const tournaments = [
      createTournament({ buyIn: 100, fee: 10 }),
      createTournament({ isSession: true, buyIn: 100, fee: 10, sites: [{ name: 'A', bankrollInitial: 100, bankrollFinal: 200 }] }),
    ];

    const result = calculateBuyInBreakdown(tournaments);
    const totalCount = result.reduce((sum, b) => sum + b.count, 0);

    expect(totalCount).toBe(1);
  });
});

describe('calculateWinningsBySite', () => {
  it('returns empty array when there are no online winnings', () => {
    const tournaments = [
      createTournament({ type: 'live', venue: 'Casino', winnings: 500 }),
      createTournament({ type: 'online', site: 'PokerStars', winnings: 0 }),
    ];
    expect(calculateWinningsBySite(tournaments)).toHaveLength(0);
  });

  it('aggregates winnings per online site, sorted descending', () => {
    const tournaments = [
      createTournament({ type: 'online', site: 'PokerStars', winnings: 100 }),
      createTournament({ type: 'online', site: 'GGPoker', winnings: 400 }),
      createTournament({ type: 'online', site: 'PokerStars', winnings: 250 }),
    ];

    const result = calculateWinningsBySite(tournaments);

    expect(result).toEqual([
      { site: 'GGPoker', winnings: 400 },
      { site: 'PokerStars', winnings: 350 },
    ]);
  });

  it('excludes live tournaments and non-positive winnings', () => {
    const tournaments = [
      createTournament({ type: 'live', site: 'PokerStars', winnings: 999 }),
      createTournament({ type: 'online', site: 'GGPoker', winnings: 0 }),
      createTournament({ type: 'online', site: 'GGPoker', winnings: 300 }),
    ];

    const result = calculateWinningsBySite(tournaments);

    expect(result).toEqual([{ site: 'GGPoker', winnings: 300 }]);
  });

  it('folds sites beyond the slice limit into "Other"', () => {
    const tournaments = Array.from({ length: 5 }, (_, i) =>
      createTournament({ type: 'online', site: `Site${i}`, winnings: (5 - i) * 100 }));

    const result = calculateWinningsBySite(tournaments, 3);

    expect(result).toHaveLength(4);
    expect(result.slice(0, 3).map(s => s.site)).toEqual(['Site0', 'Site1', 'Site2']);
    const other = result[result.length - 1];
    expect(other?.site).toBe('Other');
    expect(other?.winnings).toBe(200 + 100); // Site3 (200) + Site4 (100)
  });
});

describe('calculateExpensesByCategory', () => {
  it('returns empty array for no expenses', () => {
    expect(calculateExpensesByCategory([])).toHaveLength(0);
  });

  it('aggregates per category, sorted desc with an alphabetical tiebreak', () => {
    const expenses = [
      createExpense({ category: 'food', amount: 100 }),
      createExpense({ category: 'food', amount: 50 }),
      createExpense({ category: 'travel', amount: 400 }),
      createExpense({ category: 'accommodation', amount: 400 }),
    ];

    const result = calculateExpensesByCategory(expenses);

    // accommodation and travel tie at 400 -> alphabetical tiebreak puts accommodation first
    expect(result.map(c => c.category)).toEqual(['accommodation', 'travel', 'food']);
    expect(result[2]?.amount).toBe(150);
  });

  it('includes the human label for each category', () => {
    const result = calculateExpensesByCategory([createExpense({ category: 'food', amount: 10 })]);
    expect(result[0]?.label).toBe('Food & Drink');
  });

  it('skips non-positive amounts', () => {
    const expenses = [
      createExpense({ category: 'food', amount: 0 }),
      createExpense({ category: 'travel', amount: -20 }),
      createExpense({ category: 'fees', amount: 30 }),
    ];

    const result = calculateExpensesByCategory(expenses);

    expect(result).toHaveLength(1);
    expect(result[0]?.category).toBe('fees');
  });

  it('folds overflow past maxSlices into a new "Other" bucket', () => {
    const expenses = [
      createExpense({ category: 'accommodation', amount: 400 }),
      createExpense({ category: 'travel', amount: 300 }),
      createExpense({ category: 'food', amount: 200 }),
      createExpense({ category: 'fees', amount: 100 }),
    ];

    const result = calculateExpensesByCategory(expenses, 2);

    expect(result).toHaveLength(3);
    expect(result[2]?.category).toBe('other');
    expect(result[2]?.amount).toBe(300); // food 200 + fees 100
  });

  it('merges overflow into an existing "Other" slice instead of duplicating it', () => {
    const expenses = [
      createExpense({ category: 'other', amount: 500 }),
      createExpense({ category: 'accommodation', amount: 400 }),
      createExpense({ category: 'travel', amount: 400 }),
      createExpense({ category: 'food', amount: 150 }),
    ];

    const result = calculateExpensesByCategory(expenses, 2);

    expect(result).toHaveLength(2);
    const other = result.find(c => c.category === 'other');
    expect(other?.amount).toBe(500 + 400 + 150); // other + overflow (travel, food)
  });
});

describe('calculateExpenseStats', () => {
  it('returns zero stats for empty array', () => {
    const stats = calculateExpenseStats([]);
    expect(stats.totalExpenses).toBe(0);
    expect(stats.expenseCount).toBe(0);
    expect(stats.avgExpense).toBe(0);
    expect(stats.biggestExpense).toBe(0);
    expect(stats.byCategory).toHaveLength(0);
  });

  it('calculates totals, average and biggest', () => {
    const expenses = [
      createExpense({ amount: 100, category: 'food' }),
      createExpense({ amount: 250, category: 'travel' }),
      createExpense({ amount: 50, category: 'food' }),
    ];

    const stats = calculateExpenseStats(expenses);

    expect(stats.totalExpenses).toBe(400);
    expect(stats.expenseCount).toBe(3);
    expect(stats.avgExpense).toBeCloseTo(133.33, 1);
    expect(stats.biggestExpense).toBe(250);
    expect(stats.byCategory).toHaveLength(2);
  });
});

describe('calculateTripPnL', () => {
  it('returns zeroed figures for an empty trip without NaN', () => {
    const pnl = calculateTripPnL([], []);

    expect(pnl.buyIns).toBe(0);
    expect(pnl.grossProfit).toBe(0);
    expect(pnl.netProfit).toBe(0);
    expect(pnl.roi).toBe(0);
    expect(pnl.netRoi).toBe(0);
    expect(Number.isNaN(pnl.roi)).toBe(false);
    expect(Number.isNaN(pnl.netRoi)).toBe(false);
  });

  it('computes gross and net figures', () => {
    const tournaments = [
      createTournament({ buyIn: 1000, fee: 100, entries: 0, winnings: 0 }),
      createTournament({ buyIn: 300, fee: 30, entries: 0, winnings: 3000 }),
    ];
    const expenses = [
      createExpense({ amount: 500 }),
      createExpense({ amount: 200 }),
    ];

    const pnl = calculateTripPnL(tournaments, expenses);

    expect(pnl.buyIns).toBe(1430);
    expect(pnl.cashes).toBe(3000);
    expect(pnl.grossProfit).toBe(1570);
    expect(pnl.totalExpenses).toBe(700);
    expect(pnl.netProfit).toBe(870);
    expect(pnl.roi).toBeCloseTo(109.79, 1); // 1570 / 1430
    expect(pnl.netRoi).toBeCloseTo(40.85, 1); // 870 / 2130
    expect(pnl.tournamentCount).toBe(2);
    expect(pnl.expenseCount).toBe(2);
  });

  it('guards ROI when a trip has expenses but no tournaments', () => {
    const pnl = calculateTripPnL([], [createExpense({ amount: 250 })]);

    expect(pnl.roi).toBe(0);
    expect(pnl.grossProfit).toBe(0);
    expect(pnl.netProfit).toBe(-250);
    expect(pnl.netRoi).toBe(-100);
  });

  it('excludes in-progress tournaments', () => {
    const tournaments = [
      createTournament({ buyIn: 100, fee: 0, entries: 0, winnings: 300 }),
      createTournament({ buyIn: 5000, fee: 0, entries: 0, winnings: 0, status: 'in_progress' }),
    ];

    const pnl = calculateTripPnL(tournaments, []);

    expect(pnl.tournamentCount).toBe(1);
    expect(pnl.buyIns).toBe(100);
    expect(pnl.grossProfit).toBe(200);
  });

  it('uses bankroll deltas for multi-site session tournaments', () => {
    const tournaments = [
      createTournament({
        isSession: true,
        sites: [{ name: 'PokerStars', bankrollInitial: 1000, bankrollFinal: 1400 }],
      }),
    ];

    const pnl = calculateTripPnL(tournaments, []);

    expect(pnl.grossProfit).toBe(400);
  });

  it('includes the per-category expense breakdown', () => {
    const pnl = calculateTripPnL([], [
      createExpense({ category: 'travel', amount: 300 }),
      createExpense({ category: 'food', amount: 100 }),
    ]);

    expect(pnl.expensesByCategory.map(c => c.category)).toEqual(['travel', 'food']);
  });
});

describe('calculateTripsStats', () => {
  it('sums totals and recomputes ROI from the sums', () => {
    const a = calculateTripPnL(
      [createTournament({ buyIn: 100, fee: 0, entries: 0, winnings: 300 })],
      [createExpense({ amount: 100, category: 'food' })],
    );
    const b = calculateTripPnL(
      [createTournament({ buyIn: 900, fee: 0, entries: 0, winnings: 0 })],
      [createExpense({ amount: 100, category: 'travel' })],
    );

    const stats = calculateTripsStats([a, b]);

    expect(stats.totalTrips).toBe(2);
    expect(stats.buyIns).toBe(1000);
    expect(stats.grossProfit).toBe(-700); // +200 and -900
    expect(stats.totalExpenses).toBe(200);
    expect(stats.netProfit).toBe(-900);
    expect(stats.roi).toBeCloseTo(-70, 5); // -700 / 1000, NOT the average of the two ROIs
    expect(stats.netRoi).toBeCloseTo(-75, 5); // -900 / 1200
    expect(stats.expensesByCategory).toHaveLength(2);
  });

  it('returns zeros for no trips', () => {
    const stats = calculateTripsStats([]);
    expect(stats.totalTrips).toBe(0);
    expect(stats.roi).toBe(0);
    expect(stats.netRoi).toBe(0);
  });
});
