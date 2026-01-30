<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="card p-4">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Total Profit
      </p>
      <p
        class="text-xl font-bold"
        :class="stats.totalProfit >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
      >
        {{ formatProfit(stats.totalProfit) }}
      </p>
    </div>
    <div class="card p-4">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        ROI
      </p>
      <p
        class="text-xl font-bold"
        :class="stats.roi >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
      >
        {{ formatPercentage(stats.roi) }}
      </p>
    </div>
    <div class="card p-4">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        ITM %
      </p>
      <p class="text-xl font-bold text-gray-900 dark:text-gray-100">
        {{ formatPercentage(stats.itmPercentage) }}
      </p>
    </div>
    <div class="card p-4">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Avg Buy-in
      </p>
      <p class="text-xl font-bold text-gray-900 dark:text-gray-100">
        {{ formatCurrency(stats.avgBuyIn) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TournamentStats } from '~/types';
import { formatPercentage } from '~/utils/formatters';

defineProps<{
  stats: TournamentStats;
}>();

const { formatAmount, formatDisplayProfit } = useCurrency();

// Wrapper to format currency (values are in USD from store)
const formatCurrency = (amount: number) => formatAmount(amount);
const formatProfit = (amount: number) => formatDisplayProfit(amount);
</script>
