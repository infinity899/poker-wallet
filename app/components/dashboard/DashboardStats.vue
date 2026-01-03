<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="card p-4 lg:p-6">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">
        Total Profit
      </p>
      <p
        class="text-xl lg:text-2xl font-bold"
        :class="totalProfit >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
      >
        {{ formatProfit(totalProfit) }}
      </p>
    </div>

    <div class="card p-4 lg:p-6">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">
        Total Entries
      </p>
      <p class="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">
        {{ totalEntries }}
      </p>
    </div>

    <div class="card p-4 lg:p-6">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">
        Win Rate
      </p>
      <p class="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">
        {{ formatPercentage(winRate) }}
      </p>
    </div>

    <div class="card p-4 lg:p-6">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">
        Hourly Rate
      </p>
      <p
        class="text-xl lg:text-2xl font-bold"
        :class="hourlyRate >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
      >
        {{ formatCurrency(hourlyRate) }}/hr
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency, formatPercentage, formatProfit } from '~/utils/formatters';

defineProps<{
  totalProfit: number;
  totalEntries: number;
  winRate: number;
  hourlyRate: number;
}>();
</script>
