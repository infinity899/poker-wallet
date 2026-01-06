import type { CashSession, SessionStats, Tournament, TournamentStats } from '~/types';

/**
 * Calculate duration in minutes from start and end times
 * Handles sessions spanning midnight
 */
export function calculateDurationFromTimes(startTime: string, endTime: string, _date?: string): number {
  if (!startTime || !endTime) {
    return 0;
  }

  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);

  if (startHours === undefined || startMinutes === undefined || endHours === undefined || endMinutes === undefined) {
    return 0;
  }

  let startTotalMinutes = startHours * 60 + startMinutes;
  let endTotalMinutes = endHours * 60 + endMinutes;

  // Handle sessions spanning midnight
  if (endTotalMinutes < startTotalMinutes) {
    endTotalMinutes += 24 * 60; // Add 24 hours worth of minutes
  }

  return endTotalMinutes - startTotalMinutes;
}

export function calculateSessionStats(sessions: CashSession[]): SessionStats {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalProfit: 0,
      totalHours: 0,
      winRate: 0,
      avgProfit: 0,
      hourlyRate: 0,
      bestSession: 0,
      worstSession: 0,
      currentStreak: 0,
      winningSessions: 0,
      losingSessions: 0,
    };
  }

  const totalProfit = sessions.reduce((sum, s) => sum + s.result, 0);
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
  const totalHours = totalMinutes / 60;

  const winningSessions = sessions.filter(s => s.result > 0).length;
  const losingSessions = sessions.filter(s => s.result < 0).length;

  const results = sessions.map(s => s.result);
  const bestSession = Math.max(...results);
  const worstSession = Math.min(...results);

  // Calculate current streak (sort by date descending first)
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  let currentStreak = 0;
  if (sortedSessions.length > 0) {
    const firstResult = sortedSessions[0]!.result;
    const streakType = firstResult > 0 ? 'win' : firstResult < 0 ? 'loss' : 'even';

    for (const session of sortedSessions) {
      if (streakType === 'win' && session.result > 0) {
        currentStreak++;
      }
      else if (streakType === 'loss' && session.result < 0) {
        currentStreak--;
      }
      else {
        break;
      }
    }
  }

  return {
    totalSessions: sessions.length,
    totalProfit,
    totalHours,
    winRate: (winningSessions / sessions.length) * 100,
    avgProfit: totalProfit / sessions.length,
    hourlyRate: totalHours > 0 ? totalProfit / totalHours : 0,
    bestSession,
    worstSession,
    currentStreak,
    winningSessions,
    losingSessions,
  };
}

export function calculateTournamentStats(tournaments: Tournament[]): TournamentStats {
  if (tournaments.length === 0) {
    return {
      totalTournaments: 0,
      totalBuyIns: 0,
      totalWinnings: 0,
      totalProfit: 0,
      roi: 0,
      avgBuyIn: 0,
      avgPrize: 0,
      itm: 0,
      itmPercentage: 0,
      avgFinish: 0,
      bestFinish: 0,
      avgFieldSize: 0,
    };
  }

  const totalBuyIns = tournaments.reduce(
    (sum, t) => sum + (t.buyIn + t.fee) * (t.entries + 1),
    0,
  );
  const totalWinnings = tournaments.reduce((sum, t) => sum + t.winnings, 0);
  const totalProfit = totalWinnings - totalBuyIns;

  // ITM: either explicit cashed flag or winnings > 0
  const itmTournaments = tournaments.filter(
    t => t.cashed === true || (t.cashed === undefined && t.winnings > 0),
  ).length;

  const finishes = tournaments
    .filter(t => t.finishPosition !== undefined && t.finishPosition !== null)
    .map(t => t.finishPosition!);

  const fieldSizes = tournaments
    .filter(t => t.fieldSize !== undefined && t.fieldSize !== null)
    .map(t => t.fieldSize!);

  return {
    totalTournaments: tournaments.length,
    totalBuyIns,
    totalWinnings,
    totalProfit,
    roi: totalBuyIns > 0 ? (totalProfit / totalBuyIns) * 100 : 0,
    avgBuyIn: totalBuyIns / tournaments.length,
    avgPrize: totalWinnings / tournaments.length,
    itm: itmTournaments,
    itmPercentage: (itmTournaments / tournaments.length) * 100,
    avgFinish: finishes.length > 0
      ? finishes.reduce((a, b) => a + b, 0) / finishes.length
      : 0,
    bestFinish: finishes.length > 0 ? Math.min(...finishes) : 0,
    avgFieldSize: fieldSizes.length > 0
      ? fieldSizes.reduce((a, b) => a + b, 0) / fieldSizes.length
      : 0,
  };
}

export function calculateCumulativeProfit(
  items: (CashSession | Tournament)[],
  getResult: (item: CashSession | Tournament) => number,
): { date: string; profit: number; cumulative: number }[] {
  const sorted = [...items].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  let cumulative = 0;
  return sorted.map((item) => {
    const profit = getResult(item);
    cumulative += profit;
    return {
      date: item.date,
      profit,
      cumulative,
    };
  });
}

export function calculateHourlyRateTrend(
  sessions: CashSession[],
  windowSize: number = 10,
): { date: string; hourlyRate: number }[] {
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const result: { date: string; hourlyRate: number }[] = [];

  for (let i = windowSize - 1; i < sorted.length; i++) {
    const window = sorted.slice(i - windowSize + 1, i + 1);
    const totalProfit = window.reduce((sum, s) => sum + s.result, 0);
    const totalHours = window.reduce((sum, s) => sum + s.duration, 0) / 60;

    result.push({
      date: sorted[i]!.date,
      hourlyRate: totalHours > 0 ? totalProfit / totalHours : 0,
    });
  }

  return result;
}

export function calculateProfitDistribution(
  sessions: CashSession[],
  bucketSize: number = 100,
): { bucket: string; count: number }[] {
  if (sessions.length === 0) {
    return [];
  }

  const results = sessions.map(s => s.result);
  const min = Math.min(...results);
  const max = Math.max(...results);

  // Create buckets
  const bucketStart = Math.floor(min / bucketSize) * bucketSize;
  const bucketEnd = Math.ceil(max / bucketSize) * bucketSize;

  const buckets: Map<string, number> = new Map();

  for (let i = bucketStart; i < bucketEnd; i += bucketSize) {
    const label = i >= 0 ? `$${i}-${i + bucketSize}` : `$${i} to $${i + bucketSize}`;
    buckets.set(label, 0);
  }

  // Fill buckets
  for (const result of results) {
    const bucketIndex = Math.floor(result / bucketSize) * bucketSize;
    const label = bucketIndex >= 0
      ? `$${bucketIndex}-${bucketIndex + bucketSize}`
      : `$${bucketIndex} to $${bucketIndex + bucketSize}`;
    buckets.set(label, (buckets.get(label) || 0) + 1);
  }

  return Array.from(buckets.entries()).map(([bucket, count]) => ({ bucket, count }));
}

export function calculateROITrend(
  tournaments: Tournament[],
  windowSize: number = 10,
): { date: string; roi: number }[] {
  const sorted = [...tournaments].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const result: { date: string; roi: number }[] = [];

  for (let i = windowSize - 1; i < sorted.length; i++) {
    const window = sorted.slice(i - windowSize + 1, i + 1);
    const totalBuyIns = window.reduce(
      (sum, t) => sum + (t.buyIn + t.fee) * (t.entries + 1),
      0,
    );
    const totalWinnings = window.reduce((sum, t) => sum + t.winnings, 0);
    const roi = totalBuyIns > 0 ? ((totalWinnings - totalBuyIns) / totalBuyIns) * 100 : 0;

    result.push({
      date: sorted[i]!.date,
      roi,
    });
  }

  return result;
}
