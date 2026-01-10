# Poker Wallet - Architecture Guide

## Overview

Mobile-first SPA poker tracker for recording cash game sessions and tournament results. No backend - uses localStorage for persistence with mock JSON data for initial seeding.

## Tech Stack

- **Framework**: Nuxt 4.2.2 (SPA mode, `ssr: false`)
- **UI**: Vue 3.5, Tailwind CSS, Headless UI
- **State**: Pinia stores with localStorage persistence
- **Charts**: Chart.js + vue-chartjs
- **Forms**: VeeValidate + Zod validation
- **Testing**: Vitest + @vue/test-utils
- **Linting**: @antfu/eslint-config

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix lint errors
npm run test         # Run tests (watch mode)
npm run test:run     # Run tests once
npx vue-tsc --noEmit # TypeScript check
```

## Directory Structure

```
app/
├── adapters/                  # Storage adapters (Adapter Pattern)
│   ├── types.ts               # StorageAdapter interface
│   ├── LocalStorageAdapter.ts # Demo mode adapter
│   ├── SupabaseAdapter.ts     # Production mode adapter
│   ├── sessionAdapter.ts      # Session factory + field mapping
│   ├── tournamentAdapter.ts   # Tournament factory + field mapping
│   ├── horseAdapter.ts        # Horse/transaction factories
│   └── index.ts               # Barrel exports
├── assets/css/tailwind.css    # Tailwind entry with custom styles
├── components/
│   ├── analytics/             # Charts and analytics UI
│   ├── dashboard/             # Dashboard widgets and charts
│   ├── layout/                # AppSidebar, AppHeader, AppBottomNav, AppFAB
│   ├── sessions/              # Session list, table, forms
│   ├── settings/              # Settings sections
│   ├── shared/                # Shared components (ToastContainer)
│   └── tournaments/           # Tournament list, table, forms
├── composables/               # useBreakpoint, useFilters, useCurrency, useExport, useToast
├── layouts/default.vue        # Main layout (sidebar + bottom nav + ToastContainer)
├── pages/                     # File-based routing
├── plugins/
│   ├── stores.client.ts       # Initialize stores on app load
│   └── theme.client.ts        # Dark mode initialization
├── stores/                    # Pinia stores (use adapters + Result type)
├── types/                     # TypeScript interfaces (includes Result type)
└── utils/                     # calculations, formatters, validators, caseMapping
public/data/                   # Mock JSON: sessions.json, tournaments.json, reference.json
```

## Component Naming Convention

Nuxt 4 auto-imports components. The naming convention is based on path:
- `components/dashboard/Dashboard.vue` → `<Dashboard />`
- `components/dashboard/DashboardStats.vue` → `<DashboardStats />`
- `components/sessions/SessionsList.vue` → `<SessionsList />`

**Important**: Component names do NOT double the folder name. Use `<Dashboard />`, not `<DashboardDashboard />`.

## Data Models

### CashSession
```typescript
interface CashSession {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'live' | 'online';
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'RON';
  stake: string; // "1/2", "2/5"
  smallBlind: number;
  bigBlind: number;
  game: 'NLH' | 'PLO' | 'PLO5' | 'Mixed';
  result: number; // profit/loss (signed)
  duration: number; // minutes
  location?: string; // live venue
  site?: string; // online site
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
```

### Tournament
```typescript
interface Tournament {
  id: string;
  date: string;
  type: 'live' | 'online';
  currency: Currency;
  buyIn: number;
  fee: number; // rake separate from buy-in
  entries: number; // 0 = single, 1+ = re-entries
  winnings: number; // prize won (0 if busted)
  name: string;
  venue?: string;
  site?: string;
  fieldSize?: number;
  finishPosition?: number;
  cashed?: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Tournament profit = winnings - (buyIn + fee) * (entries + 1)
```

## Pinia Stores

All data stores use the Adapter Pattern and return `Result<T>` from actions.

### useSessionsStore
- **State**: `sessions`, `loading`, `initialized`, `filters`, `error`
- **Getters**: `filteredSessions`, `sortedSessions`, `inProgressSessions`, `stats`
- **Actions** (all return `Promise<Result<T>>`):
  - `initialize()`, `reload()`
  - `addSession()`, `updateSession()`, `deleteSession()`, `deleteSessions()`
  - `importSessions()`, `clearAll()`

### useTournamentsStore
- Same pattern as sessions store
- Additional: `inProgressTournaments` getter

### useHorsesStore
- Manages both horses and horse transactions
- **State**: `horses`, `transactions`, `loading`, `initialized`, `error`
- **Getters**: `sortedHorses`, `allHorsesStats`, `getHorseStats()`, `getCumulativeProfitData()`

### useReferenceStore
- `venues`: Live venues list
- `sites`: Online sites list
- `tags`: Available tags

### useThemeStore
- `isDark`: Current theme state
- `toggle()`: Switch theme

### useAuthStore
- `isDemoMode`: Computed based on user settings
- `waitForSettings()`: Promise for other stores to await initialization

## Data Persistence

1. On app load: `stores.client.ts` plugin initializes all stores
2. Stores use adapters to abstract storage (localStorage vs Supabase)
3. Demo mode uses `LocalStorageAdapter` with seed data from `public/data/*.json`
4. Authenticated mode uses `SupabaseAdapter` for database persistence
5. Export/Import available in Settings for JSON backup

## Architecture Patterns

### Adapter Pattern

Storage is abstracted through adapters in `app/adapters/`:

```typescript
// StorageAdapter interface (types.ts)
interface StorageAdapter<T extends { id: string }> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: string, updates: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  deleteMany(ids: string[]): Promise<void>;
}

// Factory function creates appropriate adapter
function createSessionAdapter(isDemoMode: boolean, supabase?, userId?) {
  if (isDemoMode) {
    return new LocalStorageAdapter<CashSession>(STORAGE_KEY, SEED_DATA_PATH);
  }
  return new SupabaseAdapter<CashSession, DbSession>(...);
}
```

Adapters available:
- `LocalStorageAdapter` - Demo mode, persists to browser localStorage
- `SupabaseAdapter` - Production mode, persists to Supabase database

### Result Type Pattern

All store actions return `Result<T>` for consistent error handling:

```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// Usage in stores
async function addSession(data: NewCashSession): Promise<Result<CashSession>> {
  try {
    const adapter = getAdapter();
    const session = await adapter.create(data);
    sessions.value.push(session);
    return { success: true, data: session };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to add session';
    return { success: false, error: new Error(message) };
  }
}

// Usage in components
const result = await store.addSession(data);
if (result.success) {
  toast.success('Session added');
} else {
  toast.error(result.error.message);
}
```

### Toast Notifications

Global toast system via `useToast()` composable:

```typescript
const toast = useToast();
toast.success('Session saved');
toast.error('Failed to delete');
toast.info('Processing...');
```

`ToastContainer` component is mounted in `layouts/default.vue`.

## Responsive Breakpoints

- Mobile: < 768px (bottom nav, card lists)
- Tablet: 768px - 1023px (hybrid)
- Desktop: >= 1024px (sidebar, tables)

Use `useBreakpoint()` composable: `isMobile`, `isTablet`, `isDesktop`

## Chart.js Setup

Register Chart.js components before use:
```typescript
import { Chart as ChartJS, CategoryScale, LinearScale, ... } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, ...);
```

## Dark Mode

- Uses Tailwind `darkMode: 'class'`
- Theme stored in localStorage and `useThemeStore`
- Toggle in Settings page
- Use `dark:` prefix for dark mode styles

## Testing

Tests located in `__tests__` folders alongside source:
- `app/utils/__tests__/*.spec.ts`
- `app/stores/__tests__/*.spec.ts`

Run with: `npm run test`

## Code Style

- ESLint with @antfu/eslint-config
- Single quotes
- 2-space indentation
- Explicit function return types in utils
- Use `computed()` for derived state in components