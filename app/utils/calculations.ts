import type {
  BuyInLevelStats,
  CashSession,
  Expense,
  ExpenseCategory,
  ExpenseCategoryTotal,
  ExpenseStats,
  SessionStats,
  Tournament,
  TournamentStats,
  TripPnL,
  TripStats,
} from '~/types';
import { EXPENSE_CATEGORY_LABELS } from '~/types';

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

  const startTotalMinutes = startHours * 60 + startMinutes;
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

/**
 * Total cost of a tournament including fees and re-entries.
 */
export function getTournamentCost(t: Tournament): number {
  return (t.buyIn + t.fee) * (t.entries + 1);
}

/**
 * Net profit of a single tournament.
 * For multi-site sessions, derive profit from bankroll deltas across sites;
 * otherwise use winnings minus total cost.
 */
export function getTournamentNetProfit(t: Tournament): number {
  if (t.isSession && t.sites && t.sites.length > 0) {
    const totalInitial = t.sites.reduce((sum, s) => sum + (s.bankrollInitial ?? 0), 0);
    const totalFinal = t.sites.reduce((sum, s) => sum + (s.bankrollFinal ?? 0), 0);
    return totalFinal - totalInitial;
  }
  return t.winnings - getTournamentCost(t);
}

/**
 * Whether a tournament finished in the money.
 * Uses the explicit cashed flag when present, otherwise falls back to winnings > 0.
 */
export function isTournamentITM(t: Tournament): boolean {
  return t.cashed === true || (t.cashed === undefined && t.winnings > 0);
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
      avgCashMultiple: 0,
      biggestCash: 0,
    };
  }

  const totalBuyIns = tournaments.reduce((sum, t) => sum + getTournamentCost(t), 0);
  const totalWinnings = tournaments.reduce((sum, t) => sum + t.winnings, 0);
  const totalProfit = totalWinnings - totalBuyIns;

  // ITM: either explicit cashed flag or winnings > 0
  const itmTournaments = tournaments.filter(isTournamentITM).length;

  // Average cash multiple: winnings / cost across cashed tournaments with a real cost
  const cashMultiples = tournaments
    .filter(t => isTournamentITM(t) && getTournamentCost(t) > 0)
    .map(t => t.winnings / getTournamentCost(t));
  const avgCashMultiple = cashMultiples.length > 0
    ? cashMultiples.reduce((a, b) => a + b, 0) / cashMultiples.length
    : 0;

  const biggestCash = Math.max(...tournaments.map(t => t.winnings));

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
    avgCashMultiple,
    biggestCash,
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

export function calculateITMTrend(
  tournaments: Tournament[],
  windowSize: number = 10,
): { date: string; itmPercentage: number }[] {
  const sorted = [...tournaments].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const result: { date: string; itmPercentage: number }[] = [];

  for (let i = windowSize - 1; i < sorted.length; i++) {
    const window = sorted.slice(i - windowSize + 1, i + 1);
    const itmCount = window.filter(isTournamentITM).length;

    result.push({
      date: sorted[i]!.date,
      itmPercentage: (itmCount / windowSize) * 100,
    });
  }

  return result;
}

/**
 * Breakdown of tournament performance by buy-in level (per-entry cost `buyIn + fee`).
 * Session-type tournaments are excluded — they have no single meaningful buy-in.
 * Buckets are half-open `[min, max)`; the top bucket is open-ended (`max = null`).
 * Returns only non-empty buckets, ascending by `min`.
 */
export function calculateBuyInBreakdown(
  tournaments: Tournament[],
  boundaries: number[] = [10, 25, 50, 100, 250, 500],
): BuyInLevelStats[] {
  const relevant = tournaments.filter(t => !t.isSession);

  // Build bucket ranges: [0, b0), [b0, b1), ..., [bn, null)
  const ranges: { min: number; max: number | null }[] = [];
  let prev = 0;
  for (const boundary of boundaries) {
    ranges.push({ min: prev, max: boundary });
    prev = boundary;
  }
  ranges.push({ min: prev, max: null });

  return ranges
    .map((range) => {
      const inBucket = relevant.filter((t) => {
        const level = t.buyIn + t.fee;
        return level >= range.min && (range.max === null || level < range.max);
      });

      const totalCost = inBucket.reduce((sum, t) => sum + getTournamentCost(t), 0);
      const totalProfit = inBucket.reduce((sum, t) => sum + getTournamentNetProfit(t), 0);
      const itmCount = inBucket.filter(isTournamentITM).length;

      return {
        min: range.min,
        max: range.max,
        count: inBucket.length,
        totalCost,
        totalProfit,
        roi: totalCost > 0 ? (totalProfit / totalCost) * 100 : 0,
        itmPercentage: inBucket.length > 0 ? (itmCount / inBucket.length) * 100 : 0,
      };
    })
    .filter(bucket => bucket.count > 0);
}

/**
 * Total winnings grouped by online poker site.
 * Considers only online tournaments that have a site and positive winnings.
 * Returns sites sorted by winnings desc; sites beyond `maxSlices` are folded into "Other".
 */
export function calculateWinningsBySite(
  tournaments: Tournament[],
  maxSlices: number = 7,
): { site: string; winnings: number }[] {
  const totals = new Map<string, number>();

  for (const t of tournaments) {
    if (t.type !== 'online' || !t.site || t.winnings <= 0) {
      continue;
    }
    totals.set(t.site, (totals.get(t.site) ?? 0) + t.winnings);
  }

  const sorted = Array.from(totals.entries())
    .map(([site, winnings]) => ({ site, winnings }))
    .sort((a, b) => b.winnings - a.winnings || a.site.localeCompare(b.site));

  if (sorted.length <= maxSlices) {
    return sorted;
  }

  const top = sorted.slice(0, maxSlices);
  const otherTotal = sorted.slice(maxSlices).reduce((sum, s) => sum + s.winnings, 0);
  top.push({ site: 'Other', winnings: otherTotal });
  return top;
}

/**
 * Total spend grouped by expense category (USD).
 * Mirrors calculateWinningsBySite: positive amounts only, sorted desc with an
 * alphabetical tiebreak, and categories past `maxSlices` folded into "Other".
 * Unlike sites, 'other' is itself a real category, so the overflow bucket MERGES
 * into an existing 'other' slice rather than duplicating it. With the fixed 7
 * categories and the default maxSlices of 7 the fold never triggers.
 */
export function calculateExpensesByCategory(
  expenses: Expense[],
  maxSlices: number = 7,
): ExpenseCategoryTotal[] {
  const totals = new Map<ExpenseCategory, number>();

  for (const e of expenses) {
    if (e.amount <= 0) {
      continue;
    }
    totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
  }

  const sorted = Array.from(totals.entries())
    .map(([category, amount]) => ({
      category,
      label: EXPENSE_CATEGORY_LABELS[category],
      amount,
    }))
    .sort((a, b) => b.amount - a.amount || a.category.localeCompare(b.category));

  if (sorted.length <= maxSlices) {
    return sorted;
  }

  const top = sorted.slice(0, maxSlices);
  const otherTotal = sorted.slice(maxSlices).reduce((sum, c) => sum + c.amount, 0);
  const existingOther = top.find(c => c.category === 'other');

  if (existingOther) {
    existingOther.amount += otherTotal;
  }
  else {
    top.push({
      category: 'other',
      label: EXPENSE_CATEGORY_LABELS.other,
      amount: otherTotal,
    });
  }

  return top;
}

/**
 * Headline expense numbers (USD) plus the per-category breakdown.
 */
export function calculateExpenseStats(expenses: Expense[]): ExpenseStats {
  if (expenses.length === 0) {
    return {
      totalExpenses: 0,
      expenseCount: 0,
      avgExpense: 0,
      biggestExpense: 0,
      byCategory: [],
    };
  }

  const amounts = expenses.map(e => e.amount);
  const totalExpenses = amounts.reduce((a, b) => a + b, 0);

  return {
    totalExpenses,
    expenseCount: expenses.length,
    avgExpense: totalExpenses / expenses.length,
    biggestExpense: Math.max(...amounts),
    byCategory: calculateExpensesByCategory(expenses),
  };
}

/**
 * Gross (poker-only) and net (after expenses) P&L for one trip. All amounts USD.
 *
 * Tournaments with status 'in_progress' are EXCLUDED - they have no result yet and
 * would drag the trip profit down; `tournamentCount` therefore counts completed
 * tournaments only. Pass already-resolved tournaments (stale ids filtered) - this
 * function does no lookups.
 *
 * `grossProfit` uses getTournamentNetProfit(), so for multi-site session rows it is
 * a bankroll delta and will NOT equal `cashes - buyIns`. That is intentional and
 * matches every other profit figure in the app.
 *
 * Both ROI figures return 0 when nothing was invested (trip with zero tournaments
 * and zero expenses) - no divide-by-zero, no NaN, no Infinity.
 */
export function calculateTripPnL(tournaments: Tournament[], expenses: Expense[]): TripPnL {
  const completed = tournaments.filter(t => t.status !== 'in_progress');

  const buyIns = completed.reduce((sum, t) => sum + getTournamentCost(t), 0);
  const cashes = completed.reduce((sum, t) => sum + t.winnings, 0);
  const grossProfit = completed.reduce((sum, t) => sum + getTournamentNetProfit(t), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;
  const netInvestment = buyIns + totalExpenses;

  return {
    buyIns,
    cashes,
    grossProfit,
    totalExpenses,
    expensesByCategory: calculateExpensesByCategory(expenses),
    netProfit,
    roi: buyIns > 0 ? (grossProfit / buyIns) * 100 : 0,
    netRoi: netInvestment > 0 ? (netProfit / netInvestment) * 100 : 0,
    tournamentCount: completed.length,
    expenseCount: expenses.length,
  };
}

/**
 * Roll several trip P&Ls into one aggregate. ROI figures are recomputed from the
 * summed totals (never averaged), so they stay correct.
 */
export function calculateTripsStats(pnls: TripPnL[]): TripStats {
  const buyIns = pnls.reduce((sum, p) => sum + p.buyIns, 0);
  const cashes = pnls.reduce((sum, p) => sum + p.cashes, 0);
  const grossProfit = pnls.reduce((sum, p) => sum + p.grossProfit, 0);
  const totalExpenses = pnls.reduce((sum, p) => sum + p.totalExpenses, 0);
  const netProfit = grossProfit - totalExpenses;
  const netInvestment = buyIns + totalExpenses;

  // Merge the per-trip category breakdowns into one aggregate list.
  const merged = new Map<ExpenseCategory, number>();
  for (const pnl of pnls) {
    for (const entry of pnl.expensesByCategory) {
      merged.set(entry.category, (merged.get(entry.category) ?? 0) + entry.amount);
    }
  }
  const expensesByCategory = Array.from(merged.entries())
    .map(([category, amount]) => ({
      category,
      label: EXPENSE_CATEGORY_LABELS[category],
      amount,
    }))
    .sort((a, b) => b.amount - a.amount || a.category.localeCompare(b.category));

  return {
    totalTrips: pnls.length,
    buyIns,
    cashes,
    grossProfit,
    totalExpenses,
    expensesByCategory,
    netProfit,
    roi: buyIns > 0 ? (grossProfit / buyIns) * 100 : 0,
    netRoi: netInvestment > 0 ? (netProfit / netInvestment) * 100 : 0,
    tournamentCount: pnls.reduce((sum, p) => sum + p.tournamentCount, 0),
    expenseCount: pnls.reduce((sum, p) => sum + p.expenseCount, 0),
  };
}
