import type { CashSession, Tournament } from '~/types';
import { describe, expect, it } from 'vitest';
import {
  calculateCumulativeProfit,
  calculateHourlyRateTrend,
  calculateProfitDistribution,
  calculateROITrend,
  calculateSessionStats,
  calculateTournamentStats,
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
