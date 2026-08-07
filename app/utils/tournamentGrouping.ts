import type { SessionType, Tournament, TournamentBreakdown } from '~/types';
import { getTournamentNetProfit } from './calculations';

/** A slice of tournaments that gets its own line/bar/row in the UI. */
export interface TournamentGroup {
  key: string;
  label: string;
  tournaments: Tournament[];
}

/**
 * Several groups plotted against one shared x-axis.
 * `data[i]` is the value of that series at `dates[i]`, or `null` where the
 * series has no value yet (Chart.js skips those points).
 */
export interface GroupedSeries {
  /** ISO dates (YYYY-MM-DD), ascending, shared by every series. */
  dates: string[];
  series: { key: string; label: string; data: (number | null)[] }[];
}

export const TOURNAMENT_BREAKDOWN_OPTIONS: { value: TournamentBreakdown; label: string; short: string }[] = [
  { value: 'none', label: 'No breakdown', short: 'Total' },
  { value: 'type', label: 'Live vs Online', short: 'Live/Online' },
  { value: 'venue', label: 'Venue / Site', short: 'Venue' },
  { value: 'buyIn', label: 'Buy-in level', short: 'Buy-in' },
  { value: 'currency', label: 'Currency', short: 'Currency' },
  { value: 'tag', label: 'Tag', short: 'Tag' },
];

export function breakdownLabel(breakdown: TournamentBreakdown): string {
  return TOURNAMENT_BREAKDOWN_OPTIONS.find(o => o.value === breakdown)?.label ?? 'No breakdown';
}

/** Bucket edges shared with `calculateBuyInBreakdown`, so both read the same. */
export const BUY_IN_BOUNDARIES = [10, 25, 50, 100, 250, 500];

/**
 * Cap per dimension. The categorical palette holds 7 colors; venue/tag/currency
 * are open-ended so they leave a slot for the "Other" fold, while type and
 * buy-in have a known, small number of groups and never overflow.
 */
const MAX_GROUPS: Record<TournamentBreakdown, number> = {
  none: 1,
  type: 2,
  venue: 6,
  buyIn: 8,
  currency: 6,
  tag: 6,
};

const OTHER_KEY = '__other__';
const UNTAGGED_KEY = '__untagged__';

/** Sort keys that force a group to the end regardless of size. */
const ORDER_LAST = Number.MAX_SAFE_INTEGER;
const ORDER_SESSIONS = ORDER_LAST - 1;

interface Bucket extends TournamentGroup {
  /** Primary sort key; ties break on size, then label. */
  order: number;
}

/**
 * Every venue/site a tournament touched — the primary one plus any extra
 * entries recorded on a multi-site session.
 */
export function getTournamentVenueNames(t: Tournament): string[] {
  const names = new Set<string>();
  if (t.venue) {
    names.add(t.venue);
  }
  if (t.site) {
    names.add(t.site);
  }
  for (const entry of t.sites ?? []) {
    if (entry.name) {
      names.add(entry.name);
    }
  }
  return Array.from(names);
}

/** The venue/site a tournament is attributed to when charting. */
function venueGroupLabel(t: Tournament): string {
  const names = getTournamentVenueNames(t);
  if (names.length > 1) {
    // A session spread over several sites has no single home; splitting its
    // profit per site would be a guess, so it gets its own group instead.
    return t.type === 'live' ? 'Multiple venues' : 'Multiple sites';
  }
  return names[0] ?? 'Unspecified';
}

/** Per-entry cost of a tournament — what "buy-in level" means everywhere. */
export function getTournamentBuyInLevel(t: Tournament): number {
  return t.buyIn + t.fee;
}

function buyInBucket(
  t: Tournament,
  formatAmount: (usd: number) => string,
): { key: string; label: string; order: number } {
  if (t.isSession) {
    // Multi-tournament sessions have no single buy-in (same exclusion as
    // calculateBuyInBreakdown), so they are kept visible in their own group.
    return { key: '__sessions__', label: 'Sessions', order: ORDER_SESSIONS };
  }

  const level = getTournamentBuyInLevel(t);
  let min = 0;
  for (const boundary of BUY_IN_BOUNDARIES) {
    if (level < boundary) {
      return {
        key: `buyin:${min}`,
        label: `${formatAmount(min)}–${formatAmount(boundary)}`,
        order: min,
      };
    }
    min = boundary;
  }
  return { key: `buyin:${min}`, label: `${formatAmount(min)}+`, order: min };
}

function typeLabel(type: SessionType): string {
  return type === 'live' ? 'Live' : 'Online';
}

/**
 * Fold everything past `max` into a single "Other" group, keeping the largest
 * groups. Applied after sorting so the surviving order is preserved.
 */
function foldOverflow(buckets: Bucket[], max: number): Bucket[] {
  if (buckets.length <= max) {
    return buckets;
  }

  const keep = new Set(
    [...buckets]
      .sort((a, b) => b.tournaments.length - a.tournaments.length)
      .slice(0, max)
      .map(b => b.key),
  );

  const kept = buckets.filter(b => keep.has(b.key));
  const folded = buckets.filter(b => !keep.has(b.key));

  kept.push({
    key: OTHER_KEY,
    label: `Other (${folded.length})`,
    order: ORDER_LAST,
    tournaments: folded.flatMap(b => b.tournaments),
  });

  return kept;
}

/**
 * Split tournaments into the groups a breakdown asks for.
 *
 * Groups are disjoint except under `tag`, where a tournament carrying several
 * tags contributes to each of them — so per-tag lines are read individually,
 * not as parts of a whole.
 *
 * `formatAmount` renders buy-in bucket labels; pass the display-currency
 * formatter so the labels match the rest of the page.
 */
export function groupTournaments(
  tournaments: Tournament[],
  breakdown: TournamentBreakdown,
  options: { formatAmount?: (usd: number) => string } = {},
): TournamentGroup[] {
  if (tournaments.length === 0) {
    return [];
  }

  if (breakdown === 'none') {
    return [{ key: 'all', label: 'All tournaments', tournaments: [...tournaments] }];
  }

  const formatAmount = options.formatAmount ?? (usd => `$${usd}`);
  const buckets = new Map<string, Bucket>();

  const push = (key: string, label: string, order: number, t: Tournament) => {
    const bucket = buckets.get(key) ?? { key, label, order, tournaments: [] };
    bucket.tournaments.push(t);
    buckets.set(key, bucket);
  };

  for (const t of tournaments) {
    switch (breakdown) {
      case 'type':
        push(t.type, typeLabel(t.type), t.type === 'live' ? 0 : 1, t);
        break;

      case 'venue': {
        const label = venueGroupLabel(t);
        push(`venue:${label}`, label, 0, t);
        break;
      }

      case 'buyIn': {
        const bucket = buyInBucket(t, formatAmount);
        push(bucket.key, bucket.label, bucket.order, t);
        break;
      }

      case 'currency': {
        const currency = t.originalCurrency ?? t.currency;
        push(`currency:${currency}`, currency, 0, t);
        break;
      }

      case 'tag': {
        if (t.tags.length === 0) {
          push(UNTAGGED_KEY, 'Untagged', ORDER_LAST, t);
        }
        else {
          for (const tag of t.tags) {
            push(`tag:${tag}`, tag, 0, t);
          }
        }
        break;
      }
    }
  }

  const sorted = Array.from(buckets.values()).sort((a, b) =>
    a.order - b.order
    || b.tournaments.length - a.tournaments.length
    || a.label.localeCompare(b.label),
  );

  return foldOverflow(sorted, MAX_GROUPS[breakdown]).map(({ key, label, tournaments: items }) => ({
    key,
    label,
    tournaments: items,
  }));
}

/** Union of the dates present across every group, ascending. */
function unionDates(dateLists: string[][]): string[] {
  return Array.from(new Set(dateLists.flat())).sort();
}

/**
 * Cumulative profit per group on a shared date axis.
 *
 * A series stays `null` until its first tournament, then carries its running
 * total forward across dates where it has no entries — otherwise lines would
 * be plotted against different x positions and could not be compared.
 */
export function buildCumulativeSeries(groups: TournamentGroup[]): GroupedSeries {
  const dates = unionDates(groups.map(g => g.tournaments.map(t => t.date)));

  const series = groups.map((group) => {
    const profitByDate = new Map<string, number>();
    for (const t of group.tournaments) {
      profitByDate.set(t.date, (profitByDate.get(t.date) ?? 0) + getTournamentNetProfit(t));
    }

    let started = false;
    let cumulative = 0;
    const data = dates.map((date) => {
      const profit = profitByDate.get(date);
      if (profit !== undefined) {
        started = true;
        cumulative += profit;
      }
      return started ? cumulative : null;
    });

    return { key: group.key, label: group.label, data };
  });

  return { dates, series };
}

/**
 * Any per-group trend (rolling ROI, ITM %, …) on a shared date axis.
 *
 * `compute` runs independently per group, so each line gets its own rolling
 * window. Groups that produce no points (too few tournaments for the window)
 * are dropped rather than drawn flat at zero.
 */
export function buildTrendSeries(
  groups: TournamentGroup[],
  compute: (tournaments: Tournament[]) => { date: string; value: number }[],
): GroupedSeries {
  const computed = groups
    .map(group => ({ ...group, points: compute(group.tournaments) }))
    .filter(group => group.points.length > 0);

  const dates = unionDates(computed.map(g => g.points.map(p => p.date)));

  const series = computed.map((group) => {
    const valueByDate = new Map<string, number>();
    for (const point of group.points) {
      valueByDate.set(point.date, point.value); // last point of a day wins
    }

    let last: number | null = null;
    const data = dates.map((date) => {
      const value = valueByDate.get(date);
      if (value !== undefined) {
        last = value;
      }
      return last;
    });

    return { key: group.key, label: group.label, data };
  });

  return { dates, series };
}
