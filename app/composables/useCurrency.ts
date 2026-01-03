import type { Currency } from '~/types'
import {
  formatCurrency,
  formatProfit,
  formatProfitShort,
  formatHourlyRate
} from '~/utils/formatters'

export function useCurrency() {
  const defaultCurrency = ref<Currency>('USD')

  const setDefaultCurrency = (currency: Currency) => {
    defaultCurrency.value = currency
  }

  return {
    defaultCurrency: readonly(defaultCurrency),
    setDefaultCurrency,
    formatCurrency: (amount: number, currency?: Currency) =>
      formatCurrency(amount, currency ?? defaultCurrency.value),
    formatProfit: (amount: number, currency?: Currency) =>
      formatProfit(amount, currency ?? defaultCurrency.value),
    formatProfitShort,
    formatHourlyRate: (amount: number, currency?: Currency) =>
      formatHourlyRate(amount, currency ?? defaultCurrency.value)
  }
}
