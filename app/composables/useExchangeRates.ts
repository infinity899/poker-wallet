import type { CachedExchangeRates, ExchangeRates } from '~/types/exchange';
import type { Currency } from '~/types/session';

const STORAGE_KEY = 'poker-wallet-exchange-rates';
const CACHE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours

// Default rates (fallback when offline or API fails)
const DEFAULT_RATES: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  RON: 4.57,
};

// Singleton state
const rates = ref<ExchangeRates | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const lastFetch = ref<Date | null>(null);

let refreshInterval: ReturnType<typeof setInterval> | null = null;

export function useExchangeRates() {
  const config = useRuntimeConfig();

  /**
   * Load cached rates from localStorage
   */
  function loadCachedRates(): CachedExchangeRates | null {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (!cached) {
        return null;
      }
      return JSON.parse(cached) as CachedExchangeRates;
    }
    catch {
      return null;
    }
  }

  /**
   * Save rates to localStorage
   */
  function cacheRates(exchangeRates: ExchangeRates): void {
    try {
      const cached: CachedExchangeRates = {
        ...exchangeRates,
        cachedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
    }
    catch {
      // Ignore storage errors
    }
  }

  /**
   * Check if cached rates are still valid
   */
  function isCacheValid(cached: CachedExchangeRates): boolean {
    const cachedTime = new Date(cached.cachedAt).getTime();
    const now = Date.now();
    return (now - cachedTime) < CACHE_DURATION_MS;
  }

  /**
   * Fetch fresh rates from API
   */
  async function fetchRates(): Promise<ExchangeRates | null> {
    const apiKey = config.public.exchangeRateApiKey;

    if (!apiKey) {
      console.warn('Exchange rate API key not configured, using default rates');
      return null;
    }

    try {
      const response = await fetch(
        `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`,
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.result !== 'success') {
        throw new Error(data['error-type'] || 'API returned error');
      }

      // Extract only the currencies we support
      const supportedRates: Record<Currency, number> = {
        USD: 1,
        EUR: data.conversion_rates.EUR,
        GBP: data.conversion_rates.GBP,
        CAD: data.conversion_rates.CAD,
        RON: data.conversion_rates.RON,
      };

      return {
        base: 'USD',
        rates: supportedRates,
        updatedAt: data.time_last_update_utc,
      };
    }
    catch (e) {
      console.error('Failed to fetch exchange rates:', e);
      return null;
    }
  }

  /**
   * Initialize or refresh exchange rates
   */
  async function refreshRates(force = false): Promise<void> {
    if (loading.value) {
      return;
    }

    // Check cache first
    const cached = loadCachedRates();
    if (cached && !force) {
      if (isCacheValid(cached)) {
        rates.value = cached;
        lastFetch.value = new Date(cached.cachedAt);
        return;
      }
      // Use stale cache while fetching
      rates.value = cached;
    }

    // Fetch fresh rates
    loading.value = true;
    error.value = null;

    try {
      const freshRates = await fetchRates();

      if (freshRates) {
        rates.value = freshRates;
        cacheRates(freshRates);
        lastFetch.value = new Date();
        error.value = null;
      }
      else if (!rates.value) {
        // No cached rates and fetch failed, use defaults
        rates.value = {
          base: 'USD',
          rates: DEFAULT_RATES,
          updatedAt: new Date().toISOString(),
        };
        error.value = 'Using default exchange rates';
      }
    }
    catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch rates';
      if (!rates.value) {
        rates.value = {
          base: 'USD',
          rates: DEFAULT_RATES,
          updatedAt: new Date().toISOString(),
        };
      }
    }
    finally {
      loading.value = false;
    }
  }

  /**
   * Get the exchange rate for a currency (rate to convert 1 USD to that currency)
   */
  function getRate(currency: Currency): number {
    return rates.value?.rates[currency] ?? DEFAULT_RATES[currency];
  }

  /**
   * Convert an amount from a currency to USD
   */
  function toUSD(amount: number, currency: Currency): number {
    if (currency === 'USD') {
      return amount;
    }
    const rate = getRate(currency);
    return amount / rate;
  }

  /**
   * Convert an amount from USD to a currency
   */
  function fromUSD(amount: number, currency: Currency): number {
    if (currency === 'USD') {
      return amount;
    }
    const rate = getRate(currency);
    return amount * rate;
  }

  /**
   * Start auto-refresh interval
   */
  function startAutoRefresh(): void {
    if (refreshInterval) {
      return;
    }

    refreshInterval = setInterval(() => {
      refreshRates(true);
    }, CACHE_DURATION_MS);
  }

  /**
   * Stop auto-refresh interval
   */
  function stopAutoRefresh(): void {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  }

  /**
   * Initialize rates on first use
   */
  async function initialize(): Promise<void> {
    await refreshRates();
    startAutoRefresh();
  }

  // Computed properties
  const isReady = computed(() => rates.value !== null);
  const isStale = computed(() => {
    if (!lastFetch.value) {
      return true;
    }
    return (Date.now() - lastFetch.value.getTime()) > CACHE_DURATION_MS;
  });

  return {
    // State
    rates: readonly(rates),
    loading: readonly(loading),
    error: readonly(error),
    lastFetch: readonly(lastFetch),

    // Computed
    isReady,
    isStale,

    // Actions
    initialize,
    refreshRates,
    getRate,
    toUSD,
    fromUSD,
    startAutoRefresh,
    stopAutoRefresh,
  };
}
