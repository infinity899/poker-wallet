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
├── assets/css/tailwind.css    # Tailwind entry with custom styles
├── components/
│   ├── analytics/             # Charts and analytics UI
│   ├── dashboard/             # Dashboard widgets and charts
│   ├── layout/                # AppSidebar, AppHeader, AppBottomNav, AppFAB
│   ├── sessions/              # Session list, table, forms
│   ├── settings/              # Settings sections
│   └── tournaments/           # Tournament list, table, forms
├── composables/               # useBreakpoint, useFilters, useCurrency, useExport
├── layouts/default.vue        # Main layout (sidebar + bottom nav)
├── pages/                     # File-based routing
├── plugins/
│   ├── stores.client.ts       # Initialize stores on app load
│   └── theme.client.ts        # Dark mode initialization
├── stores/                    # Pinia stores
├── types/                     # TypeScript interfaces
└── utils/                     # calculations, formatters, validators
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

### useSessionsStore
- `sessions`: All cash sessions
- `filteredSessions`: Sessions matching current filters
- `sortedSessions`: Filtered sessions sorted by date desc
- `stats`: Computed SessionStats
- Actions: `initialize()`, `addSession()`, `updateSession()`, `deleteSession()`

### useTournamentsStore
- Same pattern as sessions store

### useReferenceStore
- `venues`: Live venues list
- `sites`: Online sites list
- `tags`: Available tags

### useThemeStore
- `isDark`: Current theme state
- `toggle()`: Switch theme

## Data Persistence

1. On app load: `stores.client.ts` plugin initializes all stores
2. Stores check localStorage first, fallback to `public/data/*.json`
3. All mutations auto-save to localStorage
4. Export/Import available in Settings for JSON backup

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