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
        Win Rate
      </p>
      <p class="text-xl font-bold text-gray-900 dark:text-gray-100">
        {{ stats.winRate.toFixed(1) }}%
      </p>
    </div>
    <div class="card p-4">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Hourly Rate
      </p>
      <p
        class="text-xl font-bold"
        :class="stats.hourlyRate >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
      >
        {{ formatCurrency(stats.hourlyRate) }}/hr
      </p>
    </div>
    <div class="card p-4">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Total Hours
      </p>
      <p class="text-xl font-bold text-gray-900 dark:text-gray-100">
        {{ stats.totalHours.toFixed(1) }}h
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SessionStats } from '~/types';
import { formatCurrency, formatProfit } from '~/utils/formatters';

defineProps<{
  stats: SessionStats;
}>();
</script>
