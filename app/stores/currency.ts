import type { Currency } from '~/types/session';
import { defineStore } from 'pinia';
import { useExchangeRates } from '~/composables/useExchangeRates';

export const useCurrencyStore = defineStore('currency', () => {
  const authStore = useAuthStore();
  const exchangeRates = useExchangeRates();

  // State
  const initialized = ref(false);

  // Display currency from user settings (defaults to USD)
  const displayCurrency = computed<Currency>(() => {
    return (authStore.settings?.default_currency as Currency) || 'USD';
  });

  /**
   * Convert USD amount to display currency
   */
  function toDisplayCurrency(usdAmount: number): number {
    return exchangeRates.fromUSD(usdAmount, displayCurrency.value);
  }

  /**
   * Convert amount from any currency to USD (for storage)
   */
  function toUSD(amount: number, currency: Currency): number {
    return exchangeRates.toUSD(amount, currency);
  }

  /**
   * Get current exchange rate for a currency (USD per 1 unit of currency)
   * Returns the rate to use when recording a transaction
   */
  function getCurrentRate(currency: Currency): number {
    if (currency === 'USD') {
      return 1;
    }
    // Rate is how many of `currency` per 1 USD, so we need the inverse
    const rate = exchangeRates.getRate(currency);
    return 1 / rate;
  }

  /**
   * Set display currency preference
   */
  async function setDisplayCurrency(currency: Currency): Promise<void> {
    await authStore.updateSettings({ default_currency: currency });
  }

  /**
   * Initialize the currency store
   */
  async function initialize(): Promise<void> {
    if (initialized.value) {
      return;
    }

    await exchangeRates.initialize();
    initialized.value = true;
  }

  return {
    // State
    initialized: readonly(initialized),

    // Computed
    displayCurrency,
    rates: exchangeRates.rates,
    loading: exchangeRates.loading,
    error: exchangeRates.error,
    lastFetch: exchangeRates.lastFetch,
    isReady: exchangeRates.isReady,
    isStale: exchangeRates.isStale,

    // Actions
    initialize,
    toDisplayCurrency,
    toUSD,
    getCurrentRate,
    setDisplayCurrency,
    refreshRates: exchangeRates.refreshRates,
  };
});
