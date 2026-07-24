# Analytics Page Improvement — Tournament Metrics, Date Filter, Currency Fix

> Implementation plan, 2026-07-24. Intended to be executed step by step (commits 1–5).
> Verify each referenced file/line before editing — line numbers drift.

## Context

The Analytics page (`/analytics`) is thin and has a real bug. Confirmed by exploration:

1. **Bug — tournament cumulative chart**: `Analytics.vue:89-111` accumulates profit in `sortedTournaments` order, which sorts by `createdAt` (`app/stores/tournaments.ts:118`), not played `date`. Back-dated tournaments plot in insertion order with date labels → non-chronological x-axis and wrong running totals. The cash chart is safe only because `calculateCumulativeProfit` (`app/utils/calculations.ts:154`) re-sorts by date internally.
2. **Bug — in-progress entries counted as losses**: analytics includes `status === 'in_progress'` items (an unfinished tournament = full buy-in loss). `TournamentsProfitChart.vue:52` already excludes them; analytics doesn't.
3. Analytics has no filter UI and silently inherits store filters set on other pages.
4. All analytics charts/stats hardcode `$` via `~/utils/formatters.formatCurrency` instead of the display-currency composable `useCurrency()`.

Approved scope: fix the bugs, add **tournament-depth metrics** (user is primarily a tournament player), add an **analytics-local date-range filter**, and **fix display currency** on analytics.

Amounts are stored in USD (`originalCurrency`/`exchangeRate` are metadata), so aggregation math is correct today — only display formatting needs conversion.

## Conventions & guardrails (READ FIRST — project spec)

These follow `CLAUDE.md` and existing code; do not deviate:

- **Code style**: single quotes, 2-space indent, semicolons (match existing files). ESLint is @antfu config — run `npx eslint --fix <changed files>` after each commit-sized chunk; run `npx vue-tsc --noEmit` too.
- **Explicit return types on every exported function in `app/utils/`** (project rule). E.g. `export function calculateITMTrend(...): { date: string; itmPercentage: number }[] {`.
- **Component auto-import naming**: `components/analytics/AnalyticsRoiTrendChart.vue` → used as `<AnalyticsRoiTrendChart />`. Never double the folder name. No manual component imports needed in templates.
- **`defineProps` placement**: ESLint rule `vue/define-macros-order` requires `defineProps`/`defineEmits` immediately after imports/type definitions in `<script setup>` — before any other statements (including `ChartJS.register(...)` or composable calls).
- **Never destructure props** (`const { tournaments } = defineProps...` loses reactivity). Use `const props = defineProps<{...}>()` and `props.tournaments` inside `computed()`.
- **Derived state is always `computed()`**, never a method called in the template, never a `ref` updated by a `watch`.
- **Type-only imports** use `import type { ... } from '~/types'`. Add new types to `app/types/tournament.ts`; they flow through the barrel `app/types/index.ts`.
- **Composables/stores are auto-imported** by Nuxt (`useCurrency()`, `useSessionsStore()`, `computed`, `ref` — no imports needed). Plain named exports from composable files (e.g. `getDateRangeFromPreset`, `isDateInRange` from `~/composables/useFilters`) DO need an explicit import: `import { getDateRangeFromPreset, isDateInRange } from '~/composables/useFilters';` (the tournaments store already does this — see `app/stores/tournaments.ts:6`).
- **Chart colors**: cash = blue `rgb(59, 130, 246)`, tournaments = violet `rgb(139, 92, 246)` (fill `rgba(139, 92, 246, 0.1)`), sign-colored bars = `rgba(34, 197, 94, 0.8)` / `rgba(239, 68, 68, 0.8)`. Lines use `fill: true, tension: 0.3`.
- **Chart.js registration** is done once globally in `Analytics.vue:38-48` (includes `BarElement`) — new analytics subcomponents must NOT re-register.
- **Dark mode**: every new template needs `dark:` variants; copy class patterns from `AnalyticsTournamentCharts.vue` (e.g. `text-gray-900 dark:text-gray-100`, `text-gray-500 dark:text-gray-400`, card = `class="card p-6"`).
- **Dates are `YYYY-MM-DD` strings** — sort via `new Date(a.date).getTime()` to match the existing idiom (`calculations.ts:158-160`).
- **Empty states**: reuse the exact existing pattern — `<div v-else class="h-full flex items-center justify-center text-gray-400">No data available</div>` behind a `v-if` on data length.
- **Tests**: extend `app/utils/__tests__/calculations.spec.ts`; reuse its `createSession`/`createTournament` factory helpers and `describe`/`it` style. Run `npm run test:run`.
- **Do not touch** store getters' semantics (`filteredSessions`, `filteredTournaments`, `sortedTournaments`) — list pages depend on them. Analytics goes local instead.

---

## Step 1 — Bug fixes (Commit 1)

### 1a. Shared per-tournament profit utils — `app/utils/calculations.ts`

Mirror `getTournamentProfit` from `app/stores/tournaments.ts:336-346` exactly:

```ts
export function getTournamentCost(t: Tournament): number {
  return (t.buyIn + t.fee) * (t.entries + 1);
}

export function getTournamentNetProfit(t: Tournament): number {
  if (t.isSession && t.sites && t.sites.length > 0) {
    return t.sites.reduce(
      (sum, s) => sum + ((s.bankrollFinal ?? 0) - (s.bankrollInitial ?? 0)),
      0,
    );
  }
  return t.winnings - getTournamentCost(t);
}
```

(Verify field names/null-handling against the store implementation before writing — copy its exact logic.) Then refactor the store's `getTournamentProfit` to delegate: `return getTournamentNetProfit(tournament);`.

### 1b. Fix cumulative chart + exclude in-progress — `app/components/analytics/Analytics.vue`

Add local base computeds and rebuild chart data on them:

```ts
const completedSessions = computed(() =>
  sessionsStore.sessions.filter(s => s.status !== 'in_progress'));
const completedTournaments = computed(() =>
  tournamentsStore.tournaments.filter(t => t.status !== 'in_progress'));
```

- `tournamentCumulativeData`: replace the hand-rolled loop with `calculateCumulativeProfit(analyticsTournaments.value, item => getTournamentNetProfit(item as Tournament))` — it re-sorts asc by `date`, fixing chronology. (Until Step 2 lands, `analyticsTournaments` can temporarily be `completedTournaments`.)
- `cashCumulativeData`: feed `analyticsSessions.value` (no `.slice().reverse()` needed — the util sorts).
- `sessionProfitData` (last-30 bars): sort locally asc by date, take the last 30:
  ```ts
  const sessions = [...analyticsSessions.value]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-30);
  ```

**Behavior change to flag in the commit message**: analytics stops inheriting Sessions/Tournaments page filters (venues/tags/search) and uses all completed data + its own date filter. Intended per scope.

### 1c. Tests
- `getTournamentNetProfit`: standard case, re-entries (`entries: 2`), `isSession` with `sites` bankroll deltas, `isSession` with empty `sites` → falls back to formula.
- Regression: `calculateCumulativeProfit` with items whose array order ≠ date order asserts date-ordered cumulative (pattern exists near `spec.ts:216`).

## Step 2 — Analytics-local date filter (Commit 2)

### 2a. New `app/components/analytics/AnalyticsDateFilter.vue`

```vue
<template>
  <div class="flex gap-2 overflow-x-auto">
    <button
      v-for="preset in presets"
      :key="preset.value"
      type="button"
      class="px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors"
      :class="modelValue === preset.value
        ? 'bg-primary-600 text-white'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'"
      @click="$emit('update:modelValue', preset.value)"
    >
      {{ preset.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { DateRangePreset } from '~/types';

defineProps<{ modelValue: Exclude<DateRangePreset, 'custom'> }>();
defineEmits<{ (e: 'update:modelValue', value: Exclude<DateRangePreset, 'custom'>): void }>();

const presets = [
  { value: '7d', label: '7D' }, { value: '30d', label: '30D' },
  { value: '90d', label: '90D' }, { value: 'ytd', label: 'YTD' },
  { value: '12m', label: '12M' }, { value: 'lifetime', label: 'All' },
] as const;
</script>
```

Match active/inactive classes to `AnalyticsTabs.vue`'s actual pill styling (read it first; the above is the shape, not gospel).

### 2b. Wiring in `Analytics.vue`

Render on the same row as the tabs: `<div class="flex flex-wrap items-center justify-between gap-3"><AnalyticsTabs v-model="activeTab" /><AnalyticsDateFilter v-model="datePreset" /></div>`.

```ts
import { getDateRangeFromPreset, isDateInRange } from '~/composables/useFilters';

const datePreset = ref<Exclude<DateRangePreset, 'custom'>>('lifetime');
const dateRange = computed(() => getDateRangeFromPreset(datePreset.value));
const analyticsSessions = computed(() =>
  completedSessions.value.filter(s => isDateInRange(s.date, dateRange.value)));
const analyticsTournaments = computed(() =>
  completedTournaments.value.filter(t => isDateInRange(t.date, dateRange.value)));
```

### 2c. Local stats — stop using `store.stats` (it ignores the local filter)

```ts
const cashStats = computed(() => calculateSessionStats(analyticsSessions.value));
const tournamentStats = computed(() => calculateTournamentStats(analyticsTournaments.value));
```

Pass as the existing `:stats` props — child prop signatures unchanged.

## Step 3 — New calculations + types (Commit 3)

All in `app/utils/calculations.ts` with explicit return types + JSDoc; tests alongside existing ones.

### 3a. ITM helpers

```ts
export function isTournamentITM(t: Tournament): boolean {
  return t.cashed === true || (t.cashed === undefined && t.winnings > 0);
}
```
Replace the inline predicate inside `calculateTournamentStats` (calculations.ts:122-124) with this helper.

```ts
export function calculateITMTrend(
  tournaments: Tournament[],
  windowSize: number = 10,
): { date: string; itmPercentage: number }[]
```
Structural clone of `calculateROITrend` (calculations.ts:233): sort asc by date; return `[]` if `length < windowSize`; for each index `i >= windowSize - 1`, window = previous `windowSize` items, `itmPercentage = (window.filter(isTournamentITM).length / windowSize) * 100`.

### 3b. Buy-in level breakdown

Type in `app/types/tournament.ts`:
```ts
export interface BuyInLevelStats {
  min: number;
  max: number | null; // null = open-ended top bucket
  count: number;
  totalCost: number;
  totalProfit: number;
  roi: number; // percent
  itmPercentage: number; // percent
}
```

```ts
export function calculateBuyInBreakdown(
  tournaments: Tournament[],
  boundaries: number[] = [10, 25, 50, 100, 250, 500],
): BuyInLevelStats[]
```
- **Exclude `isSession` tournaments** (no meaningful single buy-in; cost ≈ 0 would poison ROI). Document in JSDoc.
- Bucket key = per-entry cost `t.buyIn + t.fee` (the stake level played — NOT multiplied by entries). Half-open buckets `[min, max)`; boundaries above produce `[0,10) [10,25) … [250,500) [500,∞)`.
- Per bucket: `totalCost` / `totalProfit` via `getTournamentCost` / `getTournamentNetProfit` (re-entries DO count here), `roi = totalCost > 0 ? totalProfit / totalCost * 100 : 0`, `itmPercentage` via `isTournamentITM`.
- Return only non-empty buckets, ascending by `min`. **No `label` field** — the component formats labels in display currency (Step 5).

### 3c. Extend `TournamentStats`
Add to the interface (`types/tournament.ts:46`) AND the zero-object (`calculations.ts:98-111`):
- `avgCashMultiple: number` — mean of `t.winnings / getTournamentCost(t)` over tournaments where `isTournamentITM(t) && getTournamentCost(t) > 0`; `0` if none qualify.
- `biggestCash: number` — `max(winnings)`, `0` for empty input.

Additive fields — existing consumers (`TournamentsStats.vue`, communities) keep compiling; confirm with `npx vue-tsc --noEmit`.

### 3d. Live vs online — no new util; component calls `calculateTournamentStats(props.tournaments.filter(t => t.type === 'live'))` etc.

### 3e. Tests
- `calculateITMTrend`: empty → `[]`; `< windowSize` → `[]`; rolling correctness with mixed `cashed: true` / `winnings > 0` / misses; input order independence.
- `calculateBuyInBreakdown`: empty → `[]`; cost exactly on a boundary (10) lands in the upper bucket (`[10,25)`); ROI/ITM% per bucket; `isSession` excluded; open-ended top bucket; empty buckets omitted.
- `calculateTournamentStats`: `avgCashMultiple` (no cashes → 0; correct mean), `biggestCash`; existing zero-object test updated for new fields.

## Step 4 — Tournament tab UI (Commit 4)

Refactor `AnalyticsTournamentCharts.vue` into a container: `defineProps<{ tournaments: Tournament[]; stats: TournamentStats }>()`. `Analytics.vue` passes `:tournaments="analyticsTournaments" :stats="tournamentStats"` and deletes its `tournamentCumulativeData` computed (moves into the container). Root layout `class="grid lg:grid-cols-2 gap-6"` (mobile-first single column):

| Order | Card | Span |
|---|---|---|
| 1 | Cumulative Profit line (existing, violet; now computed in-container via `calculateCumulativeProfit` + `getTournamentNetProfit`) | `lg:col-span-2` |
| 2 | `<AnalyticsRoiTrendChart :tournaments="tournaments" />` — Line, violet, % y-axis, `calculateROITrend(t, 10)` | 1 col |
| 3 | `<AnalyticsItmTrendChart :tournaments="tournaments" />` — Line, % y-axis with `min: 0, max: 100`, `calculateITMTrend(t, 10)` | 1 col |
| 4 | `<AnalyticsBuyInBreakdown :tournaments="tournaments" />` — Bar chart (profit per bucket, green/red by sign) + compact table below: Level, Count, Profit, ROI, ITM% | `lg:col-span-2` |
| 5 | `<AnalyticsTypeComparison :tournaments="tournaments" />` — no chart; two columns Live / Online with rows Count, Profit, ROI, ITM% | `lg:col-span-2` (or 1 col if it fits) |
| 6 | Tournament Statistics grid (existing) + two new tiles: Avg Cash Multiple (`{{ stats.avgCashMultiple.toFixed(1) }}x`), Biggest Cash (currency-formatted) | `lg:col-span-2` |

Subcomponent pattern (all four follow it): card wrapper `class="card p-6"`, `h3` title, `div class="h-64"` chart region, `computed` chartData from `props.tournaments`, empty state. Trend charts' empty-state text when the trend fn returns `[]`: `Log at least 10 tournaments to see trends`. % axis tick callback: ``callback: value => `${Number(value).toFixed(0)}%` ``.

## Step 5 — Display currency threading (Commit 5)

### 5a. New `app/composables/useChartOptions.ts`

```ts
import type { ChartOptions } from 'chart.js';

export function useCurrencyChartOptions() {
  const { formatAmount, displayCurrency } = useCurrency();

  const lineChartOptions = computed<ChartOptions<'line'>>(() => {
    void displayCurrency.value; // recompute when display currency changes
    return { /* copy the full dark-mode template from DashboardProfitChart.vue:45-125,
                replacing every formatCurrency(...) callback with formatAmount(...) */ };
  });
  const barChartOptions = computed<ChartOptions<'bar'>>(() => ({ /* same, bar variant */ }));
  const percentLineChartOptions = computed<ChartOptions<'line'>>(() => ({ /* same, ticks: `${v}%`, tooltip label `${v.toFixed(1)}%` */ }));

  return { lineChartOptions, barChartOptions, percentLineChartOptions };
}
```

Key rules:
- MUST be `computed` (not module-level consts) and must read `displayCurrency.value` so vue-chartjs receives a fresh options object and re-renders axis ticks when the user switches currency. (If `formatAmount` already reads the store reactively inside the computed, the explicit `void` read is still the safe way to guarantee the dependency.)
- Chart **data stays in stored USD** — only tick/tooltip **labels** convert via `formatAmount`. Never convert the data points.
- Verify the exact names exported by `useCurrency()` (read `app/composables/useCurrency.ts` first): use `formatAmount(usd)` for plain amounts and `formatDisplayProfit(usd)` for signed +/- values. `displayCurrency` may need to come from `useCurrencyStore()` if the composable doesn't re-export it.
- Bind with `:options="lineChartOptions"` (unwrap happens in template).

### 5b. Adoption
- `AnalyticsCashCharts.vue`, `AnalyticsTournamentCharts.vue` + the four new subcomponents: delete `import { formatCurrency } from '~/utils/formatters'`; use `useCurrencyChartOptions()` for chart options and `useCurrency()`'s `formatAmount` / `formatDisplayProfit` in stat-grid templates.
- Buy-in bucket labels: format in the component as `` `${formatAmount(b.min)}–${formatAmount(b.max)}` `` / `` `${formatAmount(b.min)}+` `` for the open bucket.

### 5c. Optional separate commit
Apply `useCurrencyChartOptions()` + `formatAmount` to `DashboardProfitChart.vue` and `TournamentsProfitChart.vue` (both hardcode USD). Keep isolated so it can be dropped independently.

## Commit order

1. Bug fixes: profit utils + store delegation + `Analytics.vue` cumulative fix + in-progress exclusion + tests
2. Date filter: `AnalyticsDateFilter.vue` + local filtering/stats in `Analytics.vue`
3. Calculations: `isTournamentITM`, `calculateITMTrend`, `calculateBuyInBreakdown`, `BuyInLevelStats`, stats fields + tests
4. Tournament tab UI: container refactor + 4 subcomponents
5. Currency: `useChartOptions.ts` + analytics adoption (optional follow-up: dashboard/tournaments charts)

After EVERY commit-sized chunk: `npx eslint --fix <files>` then `npx eslint <files>`, `npx vue-tsc --noEmit`, `npm run test:run`.

## Verification

- Unit: all new tests above pass; existing suite stays green (`npm run test:run`).
- Manual (`npm run dev` → `http://localhost:3000/analytics`):
  1. Back-date a tournament before existing ones → cumulative line chronological, shape matches Tournaments-page chart.
  2. Add an in-progress tournament (buy-in only) → analytics profit/ROI/counts unchanged.
  3. Toggle 7D/30D/90D/YTD/12M/All → every chart, trend, breakdown, and both stat grids update together; Sessions/Tournaments list pages unaffected.
  4. Settings → change display currency → analytics axis ticks, tooltips, and stat grids convert immediately, no reload.
  5. Fewer than 10 tournaments in range → trend charts show the hint, no crash; 0 tournaments → empty states everywhere (zero-object path).
  6. `isSession` tournament present → cumulative uses bankroll delta; absent from buy-in breakdown.
  7. Mobile viewport (<768px): single column, filter pills horizontally scrollable, tabs+filter row wraps.

## Risks

- `isSession` tournaments still distort `totalBuyIns`/`roi`/`avgBuyIn` inside `calculateTournamentStats` (naive cost formula there) — matches current behavior, NOT a regression; they are excluded from the buy-in breakdown; note in PR, don't fix here.
- Analytics no longer inherits list-page filters — intended, user-visible; call out in PR.
- Duplicate x-axis date labels are fine (Chart.js category scale + `interaction.mode: 'index'` tooltips); don't de-duplicate.
- `isDateInRange` parses `YYYY-MM-DD` as UTC midnight and includes today — same semantics as list pages; don't "fix".
