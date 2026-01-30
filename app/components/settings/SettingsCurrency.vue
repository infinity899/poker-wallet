<template>
  <div class="card p-5">
    <h2 class="text-sm font-semibold text-foreground dark:text-foreground-dark mb-4">
      Display Currency
    </h2>

    <div class="space-y-2">
      <button
        v-for="option in currencyOptions"
        :key="option.value"
        class="w-full flex items-center gap-4 p-3 rounded-lg border transition-all duration-150"
        :class="[
          currencyStore.displayCurrency === option.value
            ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20 dark:border-accent-400'
            : 'border-border dark:border-border-dark hover:border-border-strong dark:hover:border-border-dark-strong',
        ]"
        @click="selectCurrency(option.value)"
      >
        <div
          class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-surface-tertiary dark:bg-surface-dark-tertiary"
        >
          <span class="text-sm font-semibold text-foreground dark:text-foreground-dark">
            {{ option.symbol }}
          </span>
        </div>
        <div class="flex-1 text-left min-w-0">
          <p class="text-sm font-medium text-foreground dark:text-foreground-dark">
            {{ option.label }}
          </p>
          <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted">
            {{ option.description }}
          </p>
        </div>
        <div
          v-if="currencyStore.displayCurrency === option.value"
          class="w-5 h-5 rounded-full bg-accent-500 flex items-center justify-center shrink-0"
        >
          <CheckIcon class="w-3 h-3 text-white" />
        </div>
      </button>
    </div>

    <!-- Exchange rates info -->
    <div class="mt-4 pt-4 border-t border-border-subtle dark:border-border-dark-subtle">
      <div class="flex items-center justify-between text-xs text-foreground-muted dark:text-foreground-dark-muted mb-2">
        <span>Exchange Rates</span>
        <button
          class="text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 flex items-center gap-1"
          :disabled="currencyStore.loading"
          @click="refreshRates"
        >
          <ArrowPathIcon
            class="w-3.5 h-3.5"
            :class="{ 'animate-spin': currencyStore.loading }"
          />
          Refresh
        </button>
      </div>

      <div class="grid grid-cols-2 gap-2 text-xs">
        <div
          v-for="option in currencyOptions.filter(o => o.value !== 'USD')"
          :key="option.value"
          class="flex justify-between py-1"
        >
          <span class="text-foreground-muted dark:text-foreground-dark-muted">1 USD</span>
          <span class="font-mono text-foreground dark:text-foreground-dark">
            {{ getExchangeRate(option.value) }} {{ option.value }}
          </span>
        </div>
      </div>

      <p class="mt-2 text-2xs text-foreground-muted dark:text-foreground-dark-muted">
        <template v-if="currencyStore.lastFetch">
          Last updated: {{ formatLastUpdate() }}
        </template>
        <template v-else>
          Using default rates
        </template>
      </p>

      <p class="mt-2 text-2xs text-foreground-muted dark:text-foreground-dark-muted">
        Data is stored in USD. Display currency only affects how amounts are shown.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Currency } from '~/types';
import { ArrowPathIcon, CheckIcon } from '@heroicons/vue/24/outline';

const currencyStore = useCurrencyStore();

interface CurrencyOption {
  value: Currency;
  label: string;
  description: string;
  symbol: string;
}

const currencyOptions: CurrencyOption[] = [
  {
    value: 'USD',
    label: 'US Dollar',
    description: 'United States Dollar',
    symbol: '$',
  },
  {
    value: 'EUR',
    label: 'Euro',
    description: 'European Union Euro',
    symbol: '\u20AC',
  },
  {
    value: 'GBP',
    label: 'British Pound',
    description: 'British Pound Sterling',
    symbol: '\u00A3',
  },
  {
    value: 'CAD',
    label: 'Canadian Dollar',
    description: 'Canadian Dollar',
    symbol: 'C$',
  },
  {
    value: 'RON',
    label: 'Romanian Leu',
    description: 'Romanian Leu',
    symbol: 'L',
  },
];

async function selectCurrency(currency: Currency) {
  await currencyStore.setDisplayCurrency(currency);
}

async function refreshRates() {
  await currencyStore.refreshRates(true);
}

function getExchangeRate(currency: Currency): string {
  const rates = currencyStore.rates;
  if (!rates) {
    return '-';
  }
  const rate = rates.rates[currency];
  return rate ? rate.toFixed(2) : '-';
}

function formatLastUpdate(): string {
  const lastFetch = currencyStore.lastFetch;
  if (!lastFetch) {
    return '';
  }

  const now = new Date();
  const diff = now.getTime() - lastFetch.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m ago`;
  }
  if (minutes > 0) {
    return `${minutes}m ago`;
  }
  return 'Just now';
}
</script>
