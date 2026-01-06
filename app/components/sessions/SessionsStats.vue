<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
    <div class="stat-card">
      <p class="stat-label">
        Total Profit
      </p>
      <p
        class="stat-value"
        :class="stats.totalProfit >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
      >
        {{ formatProfit(stats.totalProfit) }}
      </p>
    </div>
    <div class="stat-card">
      <p class="stat-label">
        Win Rate
      </p>
      <p class="stat-value text-foreground dark:text-foreground-dark">
        {{ stats.winRate.toFixed(1) }}%
      </p>
    </div>
    <div class="stat-card">
      <p class="stat-label">
        Hourly Rate
      </p>
      <p
        class="stat-value"
        :class="stats.hourlyRate >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
      >
        {{ formatCurrency(stats.hourlyRate) }}/hr
      </p>
    </div>
    <div class="stat-card">
      <p class="stat-label">
        Total Hours
      </p>
      <p class="stat-value text-foreground dark:text-foreground-dark">
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
