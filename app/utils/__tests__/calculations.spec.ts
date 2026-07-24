import type { CashSession, Tournament } from '~/types';
import { describe, expect, it } from 'vitest';
import {
  calculateBuyInBreakdown,
  calculateCumulativeProfit,
  calculateHourlyRateTrend,
  calculateITMTrend,
  calculateProfitDistribution,
  calculateROITrend,
  calculateSessionStats,
  calculateTournamentStats,
  getTournamentNetProfit,
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
