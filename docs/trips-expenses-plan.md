# Poker Trips & Expenses — Implementation Plan

> Written 2026-07-25. Execute steps in order; each numbered step is one commit.
> Verify file/line references before editing — they drift.

## Context

The app tracks poker results only — cash sessions and tournaments, both **gross** of real-world cost. A player who flies to a festival, pays for two weeks of hotel and eats out daily can show a "profitable" run of tournaments while actually losing money on the trip.

This feature adds **Trips** (a festival/travel container) and **Expenses** logged against them, so the real question — *"was this festival actually profitable?"* — gets answered: tournament results **minus** travel costs.

### Locked product decisions (confirmed with the user)
- **Trip container**: name, venue, city, start + end date. Expenses belong to a trip; live tournaments are linked to it. The Trip detail page is the centerpiece: buy-ins, cashes, gross profit, expenses by category, **net profit**, ROI.
- **Gross and net side by side**: every existing profit figure stays gross/poker-only. Net-of-expenses is *additive*. Nothing the user already relies on changes meaning.
- **Naming**: "Trips" — routes `/trips`, components `app/components/trips/`.
- **Categories** (fixed 7-value union): `travel`, `accommodation`, `food`, `transport`, `fees`, `entertainment`, `other`.
- **No expense splitting in v1** — the user logs only their own share.
- **Mobile bottom nav goes 5 → 6 columns** to fit Trips.
- **Existing stats must not change scope.** Expenses are folded into Dashboard stats **only when the user ticks a checkbox**. Default OFF ⇒ every existing figure is byte-identical to today. There is *no* permanently-visible extra net tile — the toggle recomputes the existing Total Profit / ROI figures in place. Analytics untouched in v1.
- **ROI definition** (from the user-approved mock): `netRoi = netProfit / (buyIns + totalExpenses) × 100`. A separate gross `roi = grossProfit / buyIns × 100` is also exposed. Inside a Trip page net is inherent — the toggle applies to the global Dashboard stats only.

### Locked technical decisions
- **Trip→tournament linking via `tournamentIds: string[]` on the Trip** (Postgres `TEXT[]`), *not* a junction table. The `tournament_communities` junction pattern costs far more code (junction types, adapter methods, demo-mode array rewrites) for no benefit in a single-user app. Reads are `tournaments.filter(t => ids.includes(t.id))`; stale ids are filtered on read.
- **One store `useTripsStore`** owning both `trips[]` and `expenses[]`, mirroring the deleted `horses` store (parent + child, cascade delete). Reference it with `git show 14e3562^:app/stores/horses.ts`.
- `Expense.tripId` is **optional** — standalone expenses need no trip.

## Conventions & guardrails (READ FIRST)

These **correct `CLAUDE.md`**, which is stale. Verified against the code:

- **VeeValidate + Zod are NOT used.** `app/utils/validators.ts` is dead code. The real pattern is a `reactive()` form object + `reactive<Record<string,string>>({})` errors + a hand-written `validate()`. Copy `app/pages/tournaments/new.vue`.
- **Forms live inline in pages**, not in components.
- **There is no `primary-*` color.** The accent is emerald `accent-*`; `bg-primary-600` silently renders nothing.
- **`app/utils/caseMapping.ts` is dead code** — hand-write every adapter field mapping.
- **HARD CONSTRAINT**: `app/adapters/SupabaseAdapter.ts:25` hard-codes `.order('date')` in `getAll()` and `.lt('date', cursor)` in `getPaginated()` for *every* table. **Both new tables must have a `date` column.** → `Trip.date` is the *start* date, with a separate `endDate`. Renaming it to `startDate` would break Supabase mode only, while demo mode keeps working — the worst kind of bug.
- **Money is always stored in USD.** Forms capture in the chosen currency and convert at submit via `currencyStore.toUSD()` + `getCurrentRate()`, persisting `originalCurrency`/`originalAmount`/`exchangeRate`. Edit forms prefill from the `original*` values.
- **Display formatting** uses `useCurrency()` → `formatAmount(usd)` / `formatDisplayProfit(usd)`. Do *not* copy the communities components, which use raw `formatCurrency` and ignore the display-currency setting.
- **Toasts**: follow the documented idiom `if (result.success) toast.success(...) else toast.error(result.error.message)`, even though tournaments/sessions currently skip it.
- **Empty states**: use `.empty-state` / `.empty-state-title` / `.empty-state-description`.
- **Typecheck**: root `tsconfig.json` is a references-only stub, so plain `vue-tsc --noEmit` checks **nothing**. The only real check is `npx vue-tsc -p .nuxt/tsconfig.app.json --noEmit`.
- ESLint: `curly: ['error','all']` (braces on every `if`), one statement per line, semicolons, single quotes, 2-space indent. Explicit return types on exported functions in `app/utils/`. `defineProps` immediately after imports. Never destructure props.
- **SQL migrations are applied by hand** in the Supabase SQL editor — no CLI, no npm script. Naming: `supabase/migrations/YYYYMMDD_snake_description.sql`.
- **Do NOT touch** `LocalStorageAdapter.ts`, `SupabaseAdapter.ts`, `adapters/types.ts`, or `composables/useDatabase.ts` — entity-agnostic or legacy.

---

## Contract reconciliation (settle these BEFORE writing code)

The data-layer and UI-layer designs were produced independently and disagreed in three places. These are the binding resolutions — the UI adapts to the data layer, never the reverse:

1. **Trip start date is `trip.date`, NOT `trip.startDate`.** Forced by the `SupabaseAdapter` ordering constraint above. Every UI reference (`formatDateRange(trip.date, trip.endDate)`, overlap checks, the picker's date range, the form field) uses `date`. Label it "Start Date" in the UI.
2. **`TripPnL` canonical shape** — merge of both designs; `expensesByCategory` is the pre-sorted array so the P&L card and the pie chart consume one identical source and can never disagree:
   ```ts
   export interface TripPnL {
     buyIns: number;            // POSITIVE magnitude, USD
     cashes: number;            // POSITIVE magnitude, USD
     grossProfit: number;       // signed
     totalExpenses: number;     // POSITIVE magnitude
     expensesByCategory: ExpenseCategoryTotal[]; // sorted desc, non-zero only
     netProfit: number;         // signed
     roi: number;               // GROSS: grossProfit / buyIns × 100 (0 when buyIns === 0)
     netRoi: number;            // NET: netProfit / (buyIns + totalExpenses) × 100
     tournamentCount: number;   // completed only
     expenseCount: number;
   }
   ```
   `calculateTripPnL` therefore also calls `calculateExpensesByCategory(expenses)` and returns it in the object.
3. **`Expense.tripId` stays optional in the model (nullable column), but the v1 UI always sets it.** Nothing in v1 can create a trip-less expense, so none can become invisible. Consequently **drop the standalone entry from `expenses.json` seed data** — seeded data the UI cannot display or edit is worse than no data. The optional field is retained purely so a future `/expenses` page needs no migration.

Additionally: the Dashboard's expense total intentionally reads **all** expenses regardless of the cash/tournament/live/online toggles — an expense belongs to a trip, not to an individual entry.

---

## STEP 1 — Types

### 1a. `app/types/trip.ts` (new)

```ts
import type { Currency } from './session';

export interface Trip {
  id: string;
  userId?: string;
  name: string;              // "EPT Barcelona 2026"
  venue?: string;            // "Casino Barcelona" — matches Tournament.venue (denormalized name)
  location?: string;         // "Barcelona, Spain"
  /**
   * Trip START date, ISO YYYY-MM-DD.
   * MUST be named `date`: SupabaseAdapter.getAll() hard-codes .order('date') for every table.
   */
  date: string;
  endDate: string;           // inclusive, always >= date
  /**
   * Denormalized tournament links (no junction table). Ids CAN go stale when a
   * tournament is deleted — never read this directly for display; go through
   * useTripsStore().getTripTournaments(tripId), which filters unresolvable ids.
   */
  tournamentIds: string[];
  currency?: Currency;       // trip's local currency; pre-fills the expense form only
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type NewTrip = Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>;

/** Gross (poker-only) and net (after expenses) P&L for one trip. All amounts USD. */
export interface TripPnL {
  buyIns: number;          // Σ getTournamentCost over COMPLETED linked tournaments
  cashes: number;          // Σ winnings
  grossProfit: number;     // Σ getTournamentNetProfit (respects isSession bankroll math)
  totalExpenses: number;
  netProfit: number;       // grossProfit − totalExpenses
  roi: number;             // GROSS: grossProfit / buyIns × 100 (0 when buyIns === 0)
  netRoi: number;          // NET: netProfit / (buyIns + totalExpenses) × 100 (0 when denom === 0)
  tournamentCount: number; // completed only
  expenseCount: number;
}

export interface TripStats extends TripPnL {
  totalTrips: number;
}
```

### 1b. `app/types/expense.ts` (new)

```ts
import type { Currency } from './session';

export const EXPENSE_CATEGORIES = [
  'travel', 'accommodation', 'food', 'transport', 'fees', 'entertainment', 'other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  travel: 'Travel',
  accommodation: 'Accommodation',
  food: 'Food & Drink',
  transport: 'Local Transport',
  fees: 'Fees & Visas',
  entertainment: 'Entertainment',
  other: 'Other',
};

export interface Expense {
  id: string;
  userId?: string;
  tripId?: string;              // optional — no tripId means a standalone expense
  date: string;                 // YYYY-MM-DD (required by the SupabaseAdapter ordering)
  category: ExpenseCategory;
  description?: string;
  amount: number;               // ALWAYS USD
  originalCurrency: Currency;   // REQUIRED (new entity, no legacy rows)
  originalAmount: number;
  exchangeRate: number;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type NewExpense = Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>;

export interface ExpenseCategoryTotal {
  category: ExpenseCategory;
  label: string;   // denormalized for charts
  amount: number;  // USD
}

export interface ExpenseStats {
  totalExpenses: number;
  expenseCount: number;
  avgExpense: number;
  biggestExpense: number;
  byCategory: ExpenseCategoryTotal[]; // sorted desc
}
```

> The three currency fields are **required** on `Expense` (unlike `Tournament`, where they're optional for back-compat). If a form writes only `amount`, TypeScript rejects it — deliberate.

### 1c. `app/types/filters.ts` — append

```ts
export interface ExpenseFilters {
  dateRange: DateRange;
  datePreset: DateRangePreset;
  categories: ExpenseCategory[];      // empty = all
  tripId: string | 'all' | 'none';    // 'none' = standalone only
  searchQuery?: string;
}

export const DEFAULT_EXPENSE_FILTERS: ExpenseFilters = {
  dateRange: { start: null, end: null },
  datePreset: 'lifetime',
  categories: [],
  tripId: 'all',
};
```
(Add `import type { ExpenseCategory } from './expense';`.) No `TripFilters` in v1 — the trip list is small.

### 1d. `app/types/index.ts` — add `export * from './expense';` and `export * from './trip';` (keep alphabetical).

---

## STEP 2 — Database types + SQL

### 2a. `app/types/database.types.ts`

Add `DbTrip` and `DbExpense` (snake_case, nullable columns typed `| null`, enums as inline literal unions) after `DbTournament`, then register both in `Database.public.Tables` with the standard shape:
```ts
trips: {
  Row: DbTrip;
  Insert: Omit<DbTrip, 'id' | 'created_at' | 'updated_at'>;
  Update: Partial<Omit<DbTrip, 'id' | 'user_id' | 'created_at'>>;
  Relationships: [];
};
// expenses: same shape
```
Key columns: `trips.date` (start), `trips.end_date`, `trips.tournament_ids: string[]`; `expenses.trip_id: string | null`, `expenses.amount` (USD), `expenses.original_currency/original_amount/exchange_rate`.

### 2b. `supabase/migrations/20260725_add_trips_expenses.sql` (new)

Mirror the `tournaments` table style from `supabase/schema.sql:45-71`. Full contents:

```sql
-- Trips & Expenses Feature Migration
-- APPLY MANUALLY in the Supabase SQL editor — this project has no CLI migration runner.

CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  venue TEXT,
  location TEXT,
  -- `date` is the trip START date. The column MUST be named `date`: SupabaseAdapter
  -- hard-codes .order('date') in getAll() and .lt('date', cursor) in getPaginated().
  date DATE NOT NULL,
  end_date DATE NOT NULL,
  currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD','EUR','GBP','CAD','RON')),
  -- Denormalized link. TEXT[] not UUID[]: demo-mode ids are not always valid UUIDs
  -- and a bad cast would hard-fail the INSERT. Stale ids are filtered client-side.
  tournament_ids TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT trips_end_date_after_start CHECK (end_date >= date)
);

CREATE INDEX IF NOT EXISTS trips_user_id_idx ON trips(user_id);
CREATE INDEX IF NOT EXISTS trips_date_idx ON trips(date DESC);
CREATE INDEX IF NOT EXISTS trips_tournament_ids_idx ON trips USING GIN (tournament_ids);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  -- NULLABLE on purpose: standalone expenses are supported.
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'travel','accommodation','food','transport','fees','entertainment','other'
  )),
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0, -- ALWAYS USD
  original_currency TEXT NOT NULL DEFAULT 'USD' CHECK (original_currency IN ('USD','EUR','GBP','CAD','RON')),
  original_amount NUMERIC NOT NULL DEFAULT 0,
  exchange_rate NUMERIC NOT NULL DEFAULT 1,
  notes TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON expenses(user_id);
CREATE INDEX IF NOT EXISTS expenses_date_idx ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS expenses_trip_id_idx ON expenses(trip_id);

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 4 policies per table, named "Users can {view|insert|update|delete} own {trips|expenses}"
-- SELECT/UPDATE/DELETE: USING (auth.uid() = user_id);  INSERT: WITH CHECK (auth.uid() = user_id)
CREATE POLICY "Users can view own trips"   ON trips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trips" ON trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trips" ON trips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trips" ON trips FOR DELETE USING (auth.uid() = user_id);
-- (repeat the four for `expenses`)

-- Reuse the existing update_updated_at_column() from schema.sql
CREATE TRIGGER update_trips_updated_at    BEFORE UPDATE ON trips    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2c. `supabase/schema.sql` — mirror both tables, the RLS enables, the 8 policies and 2 triggers into their respective banner sections (schema.sql is the fresh-install file).

---

## STEP 3 — Adapters

Two files, each a 1:1 copy of `app/adapters/tournamentAdapter.ts`'s shape: `STORAGE_KEY` + `SEED_DATA_PATH` consts, a `dbXToX` mapper, `createXAdapter(isDemoMode, supabase?, userId?)` returning `LocalStorageAdapter` in demo mode / `SupabaseAdapter` otherwise, an inline `toDb` chain, and `export { STORAGE_KEY as X_STORAGE_KEY }`.

- `app/adapters/tripAdapter.ts` — key: `poker-wallet-trips`, seed `/data/trips.json`, table `trips`. Map `endDate ↔ end_date`, `tournamentIds ↔ tournament_ids`, `tournamentIds: db.tournament_ids ?? []`.
- `app/adapters/expenseAdapter.ts` — key: `poker-wallet-expenses`, seed `/data/expenses.json`, table `expenses`.

**The one non-obvious trap** — `trip_id` must use an `in` check, not `!== undefined`:
```ts
// Unlinking an expense means writing SQL NULL. The usual `!== undefined` chain would
// SKIP the field and the old trip_id would survive. `updateExpense(id, { tripId: undefined })`
// keeps the key, so `in` detects the intent. Do not "clean this up".
if ('tripId' in expense) {
  result.trip_id = expense.tripId ?? null;
}
```
Demo mode gets the same behaviour free: `LocalStorageAdapter.update` spreads `{...item, ...updates}` and `JSON.stringify` drops undefined keys.

`toDb` must **never** emit `id`, `user_id`, `created_at`, `updated_at`.

Then re-export both factories + storage keys from `app/adapters/index.ts` (alphabetical).

---

## STEP 4 — `app/utils/calculations.ts` additions

Append four functions (explicit return types + JSDoc). Reuse the existing `getTournamentCost`, `getTournamentNetProfit`, and clone the `calculateWinningsBySite` shape for the category grouping.

```ts
/**
 * Gross and net P&L for one trip. All amounts USD.
 * Tournaments with status 'in_progress' are EXCLUDED — they have no result yet and
 * would wrongly show a trip as a big loser. Pass already-resolved tournaments.
 * grossProfit uses getTournamentNetProfit(), so for multi-site session rows it is a
 * bankroll delta and will NOT equal cashes - buyIns. Intentional.
 * Both ROI figures return 0 when nothing was invested — no NaN/Infinity.
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
    buyIns, cashes, grossProfit, totalExpenses, netProfit,
    roi: buyIns > 0 ? (grossProfit / buyIns) * 100 : 0,
    netRoi: netInvestment > 0 ? (netProfit / netInvestment) * 100 : 0,
    tournamentCount: completed.length,
    expenseCount: expenses.length,
  };
}

/** Roll several trip P&Ls into one aggregate. ROI is recomputed from sums, never averaged. */
export function calculateTripsStats(pnls: TripPnL[]): TripStats { /* sum each field; recompute roi/netRoi */ }

/**
 * Total spend by category (USD). Mirrors calculateWinningsBySite: positive amounts only,
 * sorted desc with a localeCompare tiebreak, overflow past maxSlices folded into "Other".
 * Unlike sites, 'other' is itself a real category — the overflow MERGES into an existing
 * 'other' slice rather than duplicating it. With 7 fixed categories the fold never triggers.
 */
export function calculateExpensesByCategory(expenses: Expense[], maxSlices = 7): ExpenseCategoryTotal[] { }

/** Headline expense numbers + the per-category breakdown. Zeroed object for empty input. */
export function calculateExpenseStats(expenses: Expense[]): ExpenseStats { }
```

---

## STEP 5 — `app/stores/trips.ts` (new — the core)

Setup-style store owning **both** collections. Mirror `app/stores/tournaments.ts` exactly for structure and `git show 14e3562^:app/stores/horses.ts` for the parent/child + cascade shape.

- **State**: `trips`, `expenses`, `loading`, `initialized`, `expenseFilters`, `error`.
- Lazy `const getAuthStore = () => useAuthStore()` (circular-dep dodge); `isDemoMode` computed.
- **Two adapters**: `getTripAdapter(): StorageAdapter<Trip>` and `getExpenseAdapter(): StorageAdapter<Expense>`, both passing `user.value?.sub` (the JWT `sub`, not `id`).
- **`initialize()`** must `await authStore.waitForSettings()` **before** creating adapters, then `Promise.all([tripAdapter.getAll(), expenseAdapter.getAll()])`, defaulting `tournamentIds ?? []` and `tags ?? []`.
- **Getters**: `sortedTrips` (by start `date` desc), `filteredExpenses` (date range via `isDateInRange`, categories, `tripId` incl. `'none'`, search), `sortedExpenses`, `standaloneExpenses`, `allExpensesStats`, `allTripsStats`. Parameterized getters are plain **functions**: `getTripExpenses(tripId)`, `getTripTournaments(tripId)`, `getTripPnL(tripId)`, `getTripById`, `getExpenseById`.
- **`getTripTournaments(tripId)` is the single place stale ids are handled** — it reads `useTournamentsStore()` (Pinia auto-imports stores, no import needed) and filters ids that no longer resolve:
  ```ts
  const linkedIds = new Set(trip.tournamentIds);
  return (tournamentsStore.tournaments as Tournament[])
    .filter(t => linkedIds.has(t.id))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  ```
  The `as Tournament[]` cast strips `readonly()` — precedent at `app/components/analytics/Analytics.vue`.
- **CRUD** (all `Promise<Result<T>>`, literal `{success,data}` / `{success,error}` objects): `addTrip`, `updateTrip`, `deleteTrip` (**cascade — delete child expenses first**, "FK constraint" comment, so demo matches Supabase's `ON DELETE CASCADE`), `addExpense`, `updateExpense`, `setExpenseTrip(id, tripId | undefined)`, `deleteExpense`, `deleteExpenses`.
- **Linking**: `setTripTournaments(tripId, ids)` (dedupes via `Set`), `addTournamentToTrip`, `removeTournamentFromTrip`, `removeTournamentFromAllTrips(tournamentId)` (optional housekeeping after a tournament delete; correctness doesn't depend on it).
- **`importData({trips, expenses}, replace)`** — demo branch dedupes by id-Set; Supabase branch deletes children first, then recreates trips while building a `Map<oldId, newId>` so `expense.tripId` stays attached. `trip.tournamentIds` **cannot** be remapped (tournaments are imported by a different store) — accepted v1 limitation, harmless thanks to stale-id filtering.
- **`clearAll()`** — expenses before trips.
- **Return object**: state wrapped in `readonly()` **except `expenseFilters`**, then getters, then actions.

---

## STEP 6 — Seed data

- `public/data/trips.json` — flat camelCase array. Two entries: one Vegas trip with **real tournament ids copied from `public/data/tournaments.json`** (verify they exist), and one EPT Barcelona trip with `tournamentIds: []` so the zero-tournament ROI guard and the "nothing linked yet" empty state are both visible in demo mode.
- `public/data/expenses.json` — ~8 entries, **every one carrying a `tripId`** (see reconciliation #3: v1 has no UI that can display or edit a trip-less expense, so seeding one would create invisible data). The Barcelona ones use `originalCurrency: "EUR"` with `exchangeRate: 1.09` — keep `amount === originalAmount * exchangeRate` (2dp) consistent, since the expense list renders both figures. Cover at least 4 different categories so the pie and the P&L breakdown have something to show.

---

## STEP 7 — Unit tests (`app/utils/__tests__/calculations.spec.ts`)

Add a `createExpense(overrides)` factory next to `createTournament`, then:

- **`calculateTripPnL`**: empty → all zeros with `roi === 0` and `netRoi === 0` (assert not `NaN`); a gross-vs-net case with exact expected numbers; **zero tournaments** → `roi 0`, `netProfit === -expenses`, `netRoi -100`; `in_progress` excluded from `tournamentCount` and `buyIns`; an `isSession` tournament with `sites` bankroll deltas → proves `getTournamentNetProfit` is used rather than `cashes - buyIns`.
- **`calculateExpensesByCategory`**: aggregates per category, sorts desc with the `localeCompare` tiebreak on equal amounts; skips amounts `<= 0`; includes the human `label`; folds overflow past `maxSlices`; **merges** overflow into an existing `other` slice instead of duplicating it.
- **`calculateExpenseStats`**: empty → zeros + `byCategory: []`; a 3-expense case for `total`/`avg`/`biggest`.
- **`calculateTripsStats`**: totals summed and ROI recomputed from the sums, not averaged.

---

## STEP 8 — Registration / wiring

| File | Change |
|---|---|
| `app/plugins/stores.client.ts` | import + `const tripsStore = useTripsStore();` + `tripsStore.initialize(),` in the `Promise.all` |
| `app/stores/auth.ts` (`clearMockData`, ~:178) | `localStorage.removeItem('poker-wallet-trips')` and `...-expenses` — keys must match the adapter consts |
| `app/layouts/default.vue` (`switchToRealData`, ~:96) | add `tripsStore.reload(),` |
| `app/components/settings/SettingsDataMode.vue` (~:65, `setDataMode` ~:90) | same two additions |
| `app/components/settings/SettingsDataManagement.vue` | *(optional)* add trips/expenses to backup export + the import branch |
| `CLAUDE.md` | *(optional)* document `useTripsStore`, the two adapters, and the Trip/Expense models |

---

---

# UI LAYER

## STEP 9 — Shared primitives

### `app/composables/useExpenseCategoryStyle.ts` (new)

Category colors must be **hex bound via `:style`**, never dynamic Tailwind classes. `tailwind.config.js` `content` globs don't cover `./utils` or `./stores` and rely on the Nuxt module's injected defaults — a category→class map is one purge away from rendering colorless. Binding hex is exactly what `CommunitiesCard.vue:10` already does.

```ts
import type { ExpenseCategory } from '~/types';

/**
 * Fixed categorical palette (600-level, CVD-validated light & dark) — same values as
 * AnalyticsWinningsBySite. Keyed BY CATEGORY, not by slice index, so "Food" is amber
 * whether it is the biggest slice or the smallest.
 */
export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  travel: '#2563eb',        // blue
  accommodation: '#059669', // emerald
  food: '#d97706',          // amber
  transport: '#7c3aed',     // violet
  fees: '#db2777',          // pink
  entertainment: '#0891b2', // cyan
  other: '#64748b',         // neutral slate — matches the existing "Other" convention
};

/** Fixed order for the category <select>. Breakdowns render sorted by amount instead. */
export const EXPENSE_CATEGORY_ORDER: ExpenseCategory[] = [
  'travel', 'accommodation', 'food', 'transport', 'fees', 'entertainment', 'other',
];
```

### `app/utils/formatters.ts` — add `formatDateRange(startDate, endDate)`

Returns `"Aug 12 – 24, 2026"` (same month), `"Aug 28 – Sep 3, 2026"` (same year), full dates across years, and a single `formatDate` when start === end. Needed in 4 places. Add tests to `formatters.spec.ts` for all four branches.

> **Known pre-existing defect, deliberately inherited**: `new Date('2026-08-12')` parses as UTC midnight and `formatDate` renders in local time, so users west of UTC already see dates one day early app-wide. Use the identical `Intl` call with no `timeZone` so trip headers agree with the rest of the app. Do **not** fix it here — that's a separate app-wide change.

## STEP 10 — Trips list

- **`app/pages/trips/index.vue`** — 3 lines: `<TripsList />`. No `definePageMeta`.
- **`app/components/trips/TripsList.vue`** (container) — mirrors `TournamentsList.vue`: store + `useBreakpoint()` + `<TripsMobileList v-if="isMobile">` / `<TripsTable v-else>` + `deleteConfirmId` ref + `TripsDeleteModal`. Adds:
  - `searchQuery` over name/venue/city.
  - **Paging**: `visibleCount` starting at 20 with a `Show N more (x of y)` button; `watch(searchQuery, () => visibleCount = 20)`.
  - **`pnlById = computed(() => new Map(visibleTrips.map(t => [t.id, tripsStore.getTripPnL(t.id)])))`** — computed once for the *visible* slice and passed down as a prop, so a 300-trip account never calls `getTripPnL` 300× per render. `totals` still spans the full filtered set so the stat tiles stay honest.
  - Two distinct empty states: no trips at all (with a "Create your first trip" CTA) vs. search miss (with "Clear search").
  - Delete handler follows the documented toast idiom.
- **`TripsHeader.vue`** — `{ count, search }` props, `update:search` emit (parent uses `v-model:search`). Title + count + search input + `NuxtLink.btn-primary` to `/trips/new`.
- **`TripsStats.vue`** — four `.stat-card` tiles (Trips / Gross Profit / Expenses / Net Profit). Copy `SessionsStats.vue`, **not** `TournamentsStats.vue` (which still uses raw `text-gray-*`).
- **`TripsCard.vue`** (mobile unit) + **`TripsMobileList.vue`** — card with `NuxtLink` body + bordered action strip, per `TournamentsMobileList.vue`.
- **`TripsTable.vue`** (desktop) — `.card` > `.table-container` > `.table`. Columns: Trip (name + city sub-line) · Dates · Venue · MTTs · Gross · Expenses · Net · ROI · Actions. Row click routes to detail; actions cell uses `@click.stop`. Money cells get `data-value`.
- **`TripsDeleteModal.vue`** — modern modal idiom (`Teleport` + `Transition` + `.overlay` + `.modal`), **not** `TournamentsDeleteModal.vue`'s raw `bg-white dark:bg-gray-800`. Copy must state plainly that **linked tournaments are NOT deleted** — only the trip and its N expenses.

## STEP 11 — Trip form

**`app/components/trips/TripsForm.vue`** — extracted as a component (not duplicated across `new.vue`/`[id].vue`) because trip editing happens in a modal; `trips/[id]/edit.vue` would force `[id].vue` to become a `<NuxtPage/>` parent and break the detail page. This deliberately avoids the ~80% duplication between `tournaments/new.vue` and `tournaments/[id].vue`, which is a known wart.

Internals follow `pages/tournaments/new.vue` exactly: `reactive()` form + `reactive<Record<string,string>>({})` errors + hand-written `validate()`. Props `{ trip?: Trip | null; submitLabel: string }`, emits `submit` / `cancel`.

Fields: Name (required) · Venue (optional, with a `<datalist>` of `referenceStore.liveVenues` and the hint *"Matching this to your tournaments' venue lets us suggest which ones to link"*) · City · Start/End date · Notes.

```ts
function validate(): boolean {
  errors.name = '';
  errors.date = '';
  errors.endDate = '';
  if (!form.name.trim()) { errors.name = 'Trip name is required'; }
  if (!form.date) { errors.date = 'Start date is required'; }
  if (!form.endDate) { errors.endDate = 'End date is required'; }
  if (form.date && form.endDate && form.endDate < form.date) {
    errors.endDate = 'End date must be on or after the start date';
  }
  return !errors.name && !errors.date && !errors.endDate;
}

// ISO YYYY-MM-DD strings compare correctly with < / > — no Date construction needed.
const overlappingTrips = computed(() => tripsStore.trips.filter(t =>
  t.id !== props.trip?.id && t.date <= form.endDate && t.endDate >= form.date));
```
Show an amber warning card when `overlappingTrips.length > 0`: *"These dates overlap X. That's fine — just be careful not to link the same tournament to both trips."*

**No currency field on the Trip** unless the data layer's optional `Trip.currency` is kept; if it is, it only seeds the expense modal's default.

- **`app/pages/trips/new.vue`** — header block copied from `tournaments/new.vue:2-14`, renders `TripsForm`, and on success **routes to `/trips/${result.data.id}`** (the detail page) with a success toast.
- **`TripsFormModal.vue`** — thin `Teleport` wrapper around `TripsForm` for the edit path. Because `TripsForm` seeds `reactive()` once at setup, force a remount: `const formKey = ref(0); watch(() => props.isOpen, o => { if (o) formKey.value++; }, { immediate: true })` and bind `:key="formKey"`.

## STEP 12 — Trip detail page (`app/pages/trips/[id].vue`)

Modelled on `pages/communities/[id].vue` **minus the loading state** — `stores.client.ts` is an awaited async plugin, so stores are fully populated before any page renders (this is why `tournaments/[id].vue:341` can guard synchronously).

Layout: back-link header (name + `formatDateRange` + venue · city) with Edit/Delete buttons → not-found `.empty-state` when `!trip` → otherwise:
1. `<TripsPnLCard>` — the centerpiece.
2. Stale-link banner (see below).
3. **Tournaments section** — count + "Link tournaments" button; `.empty-state` when none (copy: *"Link the live tournaments you played here to see gross profit and ROI. Expenses alone only show what you spent."*); otherwise a `.card` list of rows: name + date + venue, profit, and an unlink button. Rows whose date falls outside the trip get a muted "· outside trip dates" note.
4. **Expenses section** — `grid lg:grid-cols-2` of `<TripsExpenseList>` + `<TripsCategoryChart>`; `.empty-state` when none.
5. Modals: `TripsFormModal`, `TripsExpenseModal`, `TripsTournamentPicker`, `TripsDeleteModal`.

```ts
const trip = computed(() => tripsStore.trips.find(t => t.id === tripId.value) ?? null);
const pnl = computed(() => tripsStore.getTripPnL(tripId.value));
const expenses = computed(() => tripsStore.getTripExpenses(tripId.value));

// getTripTournaments already drops unresolvable ids; filter(Boolean) is belt-and-braces.
const linkedTournaments = computed<Tournament[]>(() =>
  (tripsStore.getTripTournaments(tripId.value) ?? []).filter(Boolean) as Tournament[]);

// Difference between stored ids and resolvable ones = tournaments deleted elsewhere.
const staleLinkCount = computed(() =>
  Math.max(0, (trip.value?.tournamentIds.length ?? 0) - linkedTournaments.value.length));

const hasMixedCurrencies = computed(() => {
  const set = new Set(expenses.value.map(e => e.originalCurrency ?? 'USD'));
  return set.size > 1 || (set.size === 1 && !set.has(displayCurrency.value));
});
```

**Stale-link banner** (amber card, shown when `staleLinkCount > 0`): *"N linked tournaments have been deleted. They no longer count toward this trip's P&L."* + a **Remove them** button that rewrites `tournamentIds` to the surviving set. Never silently repair — the user needs to know why the number moved.

All handlers use `if (result.success) toast.success(...) else toast.error(result.error.message)`.

## STEP 13 — `TripsPnLCard.vue` (the centerpiece)

Props `{ pnl: TripPnL; hasMixedCurrencies: boolean }`. Five bands inside one `.card-elevated overflow-hidden`:

| Band | Content |
|---|---|
| A | 3-col divided grid: **Tournaments** (count) · **Buy-ins** (`-{{ formatAmount(pnl.buyIns) }}`, danger) · **Cashes** (`+{{ formatAmount(pnl.cashes) }}`, success) |
| B | **Gross profit** row — `formatDisplayProfit(pnl.grossProfit)`, conditional color |
| C | **Expenses** — one row per non-zero category: a 2×2 dot `:style="{ backgroundColor: line.color }"` + label + `-{{ formatAmount(line.amount) }}`; then a bordered **Total expenses** row |
| D | **NET PROFIT** band — `:class="pnl.netProfit >= 0 ? 'profit-bg' : 'loss-bg'"`, `text-2xl sm:text-3xl` figure + `ROI {{ roiLabel }}` |
| E | Mixed-currency footnote, only when `hasMixedCurrencies` |

```ts
// Render the pre-sorted breakdown from TripPnL so card and chart can never disagree.
const expenseLines = computed(() => props.pnl.expensesByCategory.map(c => ({
  ...c,
  color: EXPENSE_CATEGORY_COLORS[c.category],
})));

// ROI is meaningless with no invested capital — an em dash, not "0.0%".
const roiLabel = computed(() =>
  props.pnl.buyIns + props.pnl.totalExpenses === 0 ? '—' : formatPercentage(props.pnl.netRoi));
```

Notes:
- `.profit-bg` / `.loss-bg` (`tailwind.css:179-187`) already supply the light+dark background and text color, so the whole NET band tints together. Don't hand-roll those colors.
- Every money figure carries `data-value` (`font-mono tabular-nums`) so digits align down the right edge.
- Sign convention: buy-ins/expenses are stored as **positive magnitudes** rendered with a literal `-`; cashes with `+`; gross/net go through `formatDisplayProfit`, which emits its own sign.
- **The mock's "Flights / Hotel" are illustrative, not category names.** Render `EXPENSE_CATEGORY_LABELS[category]` → "Travel −$680", "Accommodation −$2,340".

## STEP 14 — Expense modal + list

**`TripsExpenseModal.vue`** — props `{ isOpen, tripId, tripStartDate, tripEndDate, expense? }`, emits `close` / `save`. Fields: Category `<select>` · Amount + Currency (side by side) · Date · Description · Notes.

**Currency conversion happens inside the modal** (the currency `<select>` lives here), so it emits a ready-to-persist payload and the page stays a thin `addExpense`/`updateExpense` + toast.

```ts
// Reset on open AND when the target expense changes (edit → edit another).
watch(() => [props.isOpen, props.expense?.id] as const, ([open]) => {
  if (!open) { return; }
  const e = props.expense;
  form.category = e?.category ?? 'food';
  form.currency = e?.originalCurrency ?? displayCurrency.value; // PREFILL FROM ORIGINAL, not USD
  form.amount = e?.originalAmount ?? 0;
  form.date = e?.date ?? defaultDate();  // today, clamped into the trip range
  /* … */
}, { immediate: true });

function handleSubmit() {
  if (!validate()) { return; }
  // On edit with an UNCHANGED currency, preserve the ORIGINAL rate. Re-fetching today's
  // rate would silently re-value a six-month-old hotel bill and move an old trip's P&L.
  const exchangeRate = props.expense && props.expense.originalCurrency === form.currency
    ? (props.expense.exchangeRate ?? currencyStore.getCurrentRate(form.currency))
    : currencyStore.getCurrentRate(form.currency);
  const usdAmount = form.amount * exchangeRate;
  emit('save', { tripId: props.tripId, category: form.category, amount: usdAmount, date: form.date,
    originalCurrency: form.currency, originalAmount: form.amount, exchangeRate, /* … */ });
}
```
An expense dated outside the trip is **allowed** (a June flight for an August festival) with an inline amber note; it still counts toward the trip.

**`TripsExpenseList.vue`** — props `{ expenses }`, emits `edit` / `delete`. Each row: category dot · description (falling back to the category label) · date · `-{{ formatAmount(e.amount) }}` · and a `text-2xs` muted sub-line with the **original** amount, shown **only when its currency differs from the display currency**:
```ts
function showsOriginal(e: Expense): boolean {
  return !!e.originalCurrency && e.originalCurrency !== displayCurrency.value;
}
```
`formatCurrency(amount, currency)` imported raw from `~/utils/formatters` is correct **here and only here** — it renders the original amount in its own currency with no conversion. Everywhere else, use `useCurrency()`. Edit/delete buttons are always visible (not hover-only) since this list is primarily used on mobile.

## STEP 15 — `TripsCategoryChart.vue`

Props `{ expensesByCategory: ExpenseCategoryTotal[] }` — taking the **pre-aggregated array from `TripPnL`** (not raw expenses) guarantees the chart and the P&L card can never disagree.

Register Chart.js modules per-component (the codebase convention): `ChartJS.register(ArcElement, PieController, Tooltip, Legend)`. Use `useCurrencyChartOptions().pieChartOptions` — it already renders a bottom legend and a `label: amount (pct%)` tooltip in the display currency. Colors come from `EXPENSE_CATEGORY_COLORS[category]`; `borderColor` matches the card surface (`themeStore.isDark ? '#1e293b' : '#ffffff'`) with `borderWidth: 2` so slices read as separated.

## STEP 16 — `TripsTournamentPicker.vue`

Props `{ isOpen, trip }`, emits `close` / `save: [ids: string[]]`. Three ranked, labelled buckets over **live, non-session** tournaments:

```ts
const suggested  = computed(() => candidates.value.filter(t => dateMatches(t) && venueMatches(t)).sort(byDateDesc));
const dateOnly   = computed(() => candidates.value.filter(t => dateMatches(t) && !venueMatches(t)).sort(byDateDesc));
const everything = computed(() => candidates.value.filter(t => !dateMatches(t)).sort(byDateDesc).slice(0, 50));
```
Headings: *"Suggested — venue & dates match (n)"* / *"Same dates, different venue (n)"* / *"All other live tournaments"*, with a **Select all** action on the suggested group.

```ts
// Which OTHER trip already claims each tournament.
const claimedBy = computed(() => {
  const map = new Map<string, string>();
  for (const t of tripsStore.trips) {
    if (t.id === props.trip.id) { continue; }
    for (const id of t.tournamentIds) { map.set(id, t.name); }
  }
  return map;
});

function toggle(id: string) {
  const next = new Set(selected.value);
  next.has(id) ? next.delete(id) : next.add(id);
  selected.value = next; // reassign — Set mutation is not reactive (TournamentsTable.vue:297)
}

// Claimed tournaments are EXCLUDED from "Select all" — double-linking must be deliberate.
function selectAllSuggested() {
  const next = new Set(selected.value);
  for (const t of suggested.value) {
    if (!claimedBy.value.has(t.id)) { next.add(t.id); }
  }
  selected.value = next;
}
```
Claimed rows get a `badge-warning` reading "In {trip name}". An amber banner appears when the trip's dates overlap another trip.

**Verified**: `isDateInRange` (`useFilters.ts:53-68`) parses both sides with `new Date()`, so bare `YYYY-MM-DD` strings land on UTC midnight and the range is **inclusive at both ends** — a tournament on the trip's final day is suggested. This holds only while trip dates carry no time component.

Layout: `.modal p-0 max-h-[85vh] flex flex-col` — sticky header (title + search), scrollable body, sticky footer (`{{ selected.size }} selected` + Cancel/Save).

## STEP 17 — Navigation (4 files)

- **`AppSidebar.vue`** — import `MapIcon` from `@heroicons/vue/24/outline`; add `{ path: '/trips', label: 'Trips', icon: MapIcon }` after Tournaments. `isActive` uses `startsWith`, so sub-routes highlight with no change.
- **`AppBottomNav.vue`** — **line 2: `grid-cols-5` → `grid-cols-6`**. Import `MapIcon` (outline) and `MapIcon as MapIconSolid` (solid); add `{ path: '/trips', label: 'Trips', icon: MapIcon, iconActive: MapIconSolid }`.
  > **Required in the same commit**: at 6 columns a 320px viewport gives ~53px per cell. `text-2xs` renders "Trips" at ~28px but **"Communities" at ~66px — it already overflows.** Shorten that label to **"Groups"** or the row wraps. This is a visible regression otherwise.
- **`AppFAB.vue`** — add `{ id: 'trip', label: 'Trip', path: '/trips/new', color: 'bg-sky-500' }` (stock Tailwind color in a `.vue` file, purge-safe).
- **`AppHeader.vue`** — add to the `pageTitle` map, most-specific first: `/trips/new` → "New Trip", `/trips/` → "Trip", `/trips` → "Trips".

## STEP 18 — Dashboard expense toggle (NOT a permanent tile)

**Per the user's explicit instruction: existing stats must not change scope. Expenses fold in only when a checkbox is ticked.**

The Dashboard already drives four toggles as `v-model`s into `DashboardHeader` (`Dashboard.vue:4-8`) — this is a fifth, following the identical pattern.

**`DashboardHeader.vue`** — add an "Include trip expenses" checkbox alongside the existing toggles, `v-model:include-expenses`.

**`Dashboard.vue`**:
```ts
const tripsStore = useTripsStore();
const includeExpenses = ref(false); // DEFAULT OFF — every existing figure is unchanged

// All logged trip expenses in USD. Deliberately NOT filtered by the cash/tournament/
// live/online toggles — an expense belongs to a trip, not to an individual entry.
const totalTripExpenses = computed(() =>
  includeExpenses.value ? tripsStore.expenses.reduce((sum, e) => sum + e.amount, 0) : 0);

// The EXISTING computed keeps its name and its consumers; it simply nets out
// expenses when the toggle is on. With the toggle off this is byte-identical to today.
const totalProfit = computed(() => grossProfit.value - totalTripExpenses.value);
```
Rename the current body of `totalProfit` to `grossProfit` and leave its math untouched.

**`DashboardStats.vue`** — **no new tile and no grid change.** The existing "Total Profit" tile shows the toggled figure. Add only a `text-2xs` caption under it that switches with the toggle: `"Before expenses"` → `"After trip expenses"`, so the number is never ambiguous. Pass `includeExpenses` down as a prop for that caption.

With zero expenses logged, ticking the box changes nothing — correct, no special case needed.

## STEP 19 (deferred to v2, do not build now)

Standalone `/expenses` page; Analytics net rows; a global "log expense" FAB action with a trip picker. All are additive; `TripsExpenseList` already takes a plain `expenses` prop so a future `/expenses` page is ~40 lines.

---

## File manifest

**New (21)**: `app/types/{trip,expense}.ts` · `app/adapters/{tripAdapter,expenseAdapter}.ts` · `app/stores/trips.ts` · `app/composables/useExpenseCategoryStyle.ts` · `app/pages/trips/{index,new,[id]}.vue` · `app/components/trips/{TripsList,TripsHeader,TripsStats,TripsCard,TripsMobileList,TripsTable,TripsDeleteModal,TripsForm,TripsFormModal,TripsPnLCard,TripsExpenseModal,TripsExpenseList,TripsCategoryChart,TripsTournamentPicker}.vue` · `supabase/migrations/20260725_add_trips_expenses.sql` · `public/data/{trips,expenses}.json`

**Modified (13)**: `app/types/{index,filters,database.types}.ts` · `app/utils/calculations.ts` · `app/utils/formatters.ts` · `app/utils/__tests__/{calculations,formatters}.spec.ts` · `app/plugins/stores.client.ts` · `app/stores/auth.ts` · `app/layouts/default.vue` · `app/components/layout/{AppSidebar,AppBottomNav,AppFAB,AppHeader}.vue` · `app/components/dashboard/{Dashboard,DashboardHeader,DashboardStats}.vue` · `app/components/settings/SettingsDataMode.vue` · `supabase/schema.sql`

Auto-import naming is path-based: `components/trips/TripsList.vue` → `<TripsList />`. **Always PascalCase in templates** — the kebab form of `TripsPnLCard` would be `trips-pn-l-card`.

## Verification

Per commit:
```bash
npx eslint app/types app/adapters app/stores/trips.ts app/utils app/components/trips app/pages/trips \
           app/components/layout app/components/dashboard app/composables/useExpenseCategoryStyle.ts
npx vue-tsc -p .nuxt/tsconfig.app.json --noEmit   # the ONLY real typecheck — root tsconfig is a stub
npm run test:run
```

Manual (`npm run dev`, demo mode first):
1. `/trips` lists the two seeded trips; Barcelona shows a net loss (expenses, no tournaments) and **ROI as "—", not 0.0%**.
2. Open the Vegas trip → P&L card shows buy-ins, cashes, gross, per-category expense lines, **net** and ROI; the pie totals match the card exactly.
3. Add an expense in EUR → stored USD, shown in the display currency with the original "€480" sub-line; trip net updates.
4. Edit that expense without changing its currency → the P&L must **not** move (the original rate is preserved).
5. Link/unlink a tournament → gross and net both change. The picker's "Suggested" bucket populates when venue + dates match, **including the exact end date**.
6. Delete a trip → its expenses go too; linked tournaments still exist in `/tournaments`.
7. Delete a linked tournament from `/tournaments`, return to the trip → stale-link banner appears; "Remove them" clears it; the page never crashes.
8. Change display currency in Settings → every trip figure and both chart tooltips re-render.
9. **Dashboard with the toggle OFF: every figure identical to before the feature** (diff against `main` if unsure). Tick "Include trip expenses" → Total Profit drops by the expense total and the caption switches to "After trip expenses".
10. Mobile <768px: table→cards swap; bottom nav shows 6 items **without wrapping** (verify the Communities→Groups rename); modals usable.
11. Dark mode on every new surface.
12. Then apply the SQL migration by hand, switch to real-data mode, and repeat 2–7 to prove the Supabase path.

## Risks & edge cases

1. **The `date`-column constraint** — both tables must keep a `date` column (trip start / expense date), or every Supabase read throws. Demo mode would keep working, hiding the break.
2. **Stale `tournamentIds`** — Postgres can't FK an array element. Mitigated in exactly one place: `getTripTournaments()` filters against the live store, so `calculateTripPnL` never sees a ghost.
3. **ROI divide-by-zero** — every new trip has `buyIns === 0`. Both ROI figures are guarded to `0` and unit-tested. The UI should render `—` rather than `0%` when `tournamentCount === 0`.
4. **Unlinking an expense from a trip** — needs the `'tripId' in expense` mapper check to write SQL `NULL`; a plain `!== undefined` chain silently keeps the old `trip_id`.
5. **Demo vs Supabase divergence** — (a) demo ids aren't valid UUIDs, hence `TEXT[]`; (b) Postgres cascades on trip delete, localStorage doesn't, so `deleteTrip` deletes children explicitly; (c) `importData` mints new ids in Supabase mode and remaps `expense.tripId`, but cannot remap `tournamentIds`.
6. **Existing stats are untouched by default** — nothing here modifies `calculateTournamentStats`, `getTournamentNetProfit`, or any existing store getter. The Dashboard's expense toggle defaults OFF, so every current figure is byte-identical until the user opts in. Verify this by diffing the Dashboard against `main` with the box unticked.
9. **Editing an expense must not re-value it** — `getCurrentRate()` returns *today's* rate, so naively re-converting on edit would silently move an old trip's P&L. Preserve the recorded `exchangeRate` when the currency is unchanged (`tournaments/[id].vue:472` has this bug; do not copy it).
10. **Mobile nav overflow** — going to 6 columns leaves ~53px per cell at 320px; the existing "Communities" label overflows and must be shortened in the same commit.
7. **`in_progress` exclusion lives inside `calculateTripPnL`**, unlike `calculateTournamentStats` where the caller filters. Deliberate and documented.
8. **`getTripTournaments` is a function, not a computed** — components must call it inside a `computed()` or template expression so Vue tracks the dependency; calling it once in `setup()` won't update when tournaments load.
