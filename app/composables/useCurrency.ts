import type { Currency } from '~/types';
import {
  formatCurrency,
  formatHourlyRate,
  formatProfit,
  formatProfitShort,
} from '~/utils/formatters';

export function useCurrency() {
  const currencyStore = useCurrencyStore();

  // Display currency from store (user setting)
  const displayCurrency = computed(() => currencyStore.displayCurrency);

  /**
   * Format a USD amount in the user's display currency
   */
  function formatAmount(usdAmount: number): string {
    const converted = currencyStore.toDisplayCurrency(usdAmount);
    return formatCurrency(converted, displayCurrency.value);
  }

  /**
   * Format a USD profit amount in the user's display currency with +/- sign
   */
  function formatDisplayProfit(usdAmount: number): string {
    const converted = currencyStore.toDisplayCurrency(usdAmount);
    return formatProfit(converted, displayCurrency.value);
  }

  /**
   * Format a USD hourly rate in the user's display currency
   */
  function formatDisplayHourly(usdAmount: number): string {
    const converted = currencyStore.toDisplayCurrency(usdAmount);
    return formatHourlyRate(converted, displayCurrency.value);
  }

  /**
   * Format a short profit amount (e.g., +$1.5K) in the user's display currency
   */
  function formatDisplayProfitShort(usdAmount: number): string {
    const converted = currencyStore.toDisplayCurrency(usdAmount);
    return formatProfitShort(converted, displayCurrency.value);
  }

  return {
    displayCurrency,
    // New auto-converting formatters (use these for display)
    formatAmount,
    formatDisplayProfit,
    formatDisplayHourly,
    formatDisplayProfitShort,
    // Legacy formatters (for specific currency use)
    formatCurrency: (amount: number, currency?: Currency) =>
      formatCurrency(amount, currency ?? displayCurrency.value),
    formatProfit: (amount: number, currency?: Currency) =>
      formatProfit(amount, currency ?? displayCurrency.value),
    formatProfitShort: (amount: number, currency?: Currency) =>
      formatProfitShort(amount, currency),
    formatHourlyRate: (amount: number, currency?: Currency) =>
      formatHourlyRate(amount, currency ?? displayCurrency.value),
  };
}
