import type { Currency } from './session';

export interface ExchangeRates {
  base: 'USD';
  rates: Record<Currency, number>;
  updatedAt: string;
}

export interface CachedExchangeRates extends ExchangeRates {
  cachedAt: string;
}
