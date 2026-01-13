# Currency Exchange Feature Implementation Plan

## Overview
Add multi-currency support with exchange rate conversion. Users select a display currency; all amounts convert automatically. Data stored in USD with original currency preserved.

## Key Design Decisions
- **Storage**: Always USD in database, original currency/amount saved for reference
- **Rate timing**: Lock exchange rate at recording time (snapshot)
- **Rate refresh**: On login + auto-refresh every 4 hours
- **API**: exchangerate-api.com (free tier)

---

## Implementation Phases

### Phase 1: Exchange Rate Service

**New file: `app/composables/useExchangeRates.ts`**
- Fetch rates from `https://v6.exchangerate-api.com/v6/{API_KEY}/latest/USD`
- Cache to localStorage (`poker-wallet-exchange-rates`)
- Auto-refresh every 4 hours while app is open
- Functions: `toUSD(amount, currency)`, `fromUSD(amount, currency)`, `getRate(currency)`

**Modify: `nuxt.config.ts`**
- Add `runtimeConfig.public.exchangeRateApiKey`

**New file: `app/types/exchange.ts`**
```typescript
export interface ExchangeRates {
  base: 'USD';
  rates: Record<Currency, number>;
  updatedAt: string;
}
```

---

### Phase 2: Data Model Updates

**Modify: `app/types/session.ts`** - Add to CashSession:
```typescript
originalCurrency: Currency;  // Currency user entered
originalResult: number;       // Result in original currency
exchangeRate: number;         // Rate used for conversion
// result field now always stores USD
```

**Modify: `app/types/tournament.ts`** - Add to Tournament:
```typescript
originalCurrency: Currency;
originalBuyIn: number;
originalFee: number;
originalWinnings: number;
exchangeRate: number;
// buyIn, fee, winnings now always USD
```

---

### Phase 3: Currency Store

**New file: `app/stores/currency.ts`**
- `displayCurrency`: computed from `authStore.settings.default_currency`
- `toDisplayCurrency(usdAmount)`: convert USD to display currency
- `toUSD(amount, currency)`: convert input to USD for storage
- `getCurrentRate(currency)`: get rate for snapshot
- `setDisplayCurrency(currency)`: update user preference

**Modify: `app/stores/auth.ts`**
- Add `updateSettings(updates)` action for changing `default_currency`

**Modify: `app/plugins/stores.client.ts`**
- Initialize currency store after auth (needs rates for forms)

---

### Phase 4: Adapter Field Mapping

**Modify: `app/adapters/sessionAdapter.ts`**
- Add field mappings: `original_currency`, `original_result`, `exchange_rate`

**Modify: `app/adapters/tournamentAdapter.ts`**
- Add field mappings: `original_currency`, `original_buy_in`, `original_fee`, `original_winnings`, `exchange_rate`

**Modify: `app/composables/useDatabase.ts`**
- Update `dbSessionToSession` and `dbTournamentToTournament` with fallbacks:
```typescript
originalCurrency: db.original_currency ?? db.currency,
originalResult: db.original_result ?? db.result,
exchangeRate: db.exchange_rate ?? 1,
```

---

### Phase 5: Form Updates

**Modify: `app/pages/sessions/new.vue`**
```typescript
// On submit:
const exchangeRate = currencyStore.getCurrentRate(form.currency);
const usdResult = currencyStore.toUSD(form.result, form.currency);

await sessionsStore.addSession({
  ...formData,
  result: usdResult,
  originalCurrency: form.currency,
  originalResult: form.result,
  exchangeRate,
});
```

**Modify: `app/pages/tournaments/new.vue`**
- Same pattern: convert buyIn, fee, winnings to USD on save

**Modify: `app/pages/sessions/[id].vue`** and **`app/pages/tournaments/[id].vue`**
- Load original values into form, re-convert on save if currency changed

---

### Phase 6: Display Updates

**Modify: `app/composables/useCurrency.ts`**
- Connect to `useCurrencyStore()` for `displayCurrency`
- New formatters that auto-convert from USD:
  - `formatAmount(usdAmount)` → converts and formats
  - `formatProfit(usdAmount)` → converts with +/- sign
  - `formatHourly(usdAmount)` → converts with /hr suffix

**Modify: `app/utils/formatters.ts`**
- Fix `formatProfitShort(amount, currency)` - accept currency param instead of hardcoded `$`

**Update display components** (use new formatters):
- `app/components/dashboard/DashboardStats.vue`
- `app/components/sessions/SessionsStats.vue`
- `app/components/sessions/SessionsList.vue`
- `app/components/sessions/SessionsTable.vue`
- `app/components/tournaments/TournamentsStats.vue`
- `app/components/tournaments/TournamentsList.vue`

---

### Phase 7: Settings UI

**New file: `app/components/settings/SettingsCurrency.vue`**
- Currency selector (USD, EUR, GBP, CAD, RON) with radio-style buttons
- Show current exchange rates and last update time
- Manual refresh button
- Info text explaining that data is stored in USD

**Modify: `app/pages/settings.vue`** (or Settings component)
- Add `<SettingsCurrency />` between DataMode and Theme sections

---

### Phase 8: Database Migration (Supabase)

```sql
-- Sessions
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS original_currency VARCHAR(3),
ADD COLUMN IF NOT EXISTS original_result NUMERIC,
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC DEFAULT 1;

-- Tournaments
ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS original_currency VARCHAR(3),
ADD COLUMN IF NOT EXISTS original_buy_in NUMERIC,
ADD COLUMN IF NOT EXISTS original_fee NUMERIC,
ADD COLUMN IF NOT EXISTS original_winnings NUMERIC,
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC DEFAULT 1;
```

---

## Files Summary

| Action | File |
|--------|------|
| Create | `app/composables/useExchangeRates.ts` |
| Create | `app/types/exchange.ts` |
| Create | `app/stores/currency.ts` |
| Create | `app/components/settings/SettingsCurrency.vue` |
| Modify | `nuxt.config.ts` |
| Modify | `app/types/session.ts` |
| Modify | `app/types/tournament.ts` |
| Modify | `app/stores/auth.ts` |
| Modify | `app/plugins/stores.client.ts` |
| Modify | `app/adapters/sessionAdapter.ts` |
| Modify | `app/adapters/tournamentAdapter.ts` |
| Modify | `app/composables/useDatabase.ts` |
| Modify | `app/composables/useCurrency.ts` |
| Modify | `app/utils/formatters.ts` |
| Modify | `app/pages/sessions/new.vue` |
| Modify | `app/pages/tournaments/new.vue` |
| Modify | `app/pages/sessions/[id].vue` |
| Modify | `app/pages/tournaments/[id].vue` |
| Modify | `app/pages/settings.vue` |
| Modify | Dashboard/stats display components |

---

## Environment Setup

Add to `.env`:
```
EXCHANGE_RATE_API_KEY=your_api_key_here
```

---

## Verification

1. **Test rate fetching**: Check console for API response, verify rates cached in localStorage
2. **Test session creation**: Create session in EUR, verify DB stores USD value with original EUR preserved
3. **Test display conversion**: Change display currency in settings, verify all amounts update across dashboard/lists
4. **Test rate snapshot**: Create two sessions at different times, verify each uses its recorded rate
5. **Test offline**: Disconnect network, verify cached rates still work
6. **Run existing tests**: `npm run test:run` - ensure no regressions
7. **TypeScript check**: `npx vue-tsc --noEmit`
