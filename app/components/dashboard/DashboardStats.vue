<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
    <div class="stat-card">
      <p class="stat-label">
        Total Profit
      </p>
      <p
        class="stat-value"
        :class="totalProfit >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
      >
        {{ formatProfit(totalProfit) }}
      </p>
    </div>

    <div class="stat-card">
      <p class="stat-label">
        Total Entries
      </p>
      <p class="stat-value text-foreground dark:text-foreground-dark">
        {{ totalEntries }}
      </p>
    </div>

    <div class="stat-card">
      <p class="stat-label">
        Win Rate
      </p>
      <p class="stat-value text-foreground dark:text-foreground-dark">
        {{ formatPercentage(winRate) }}
      </p>
    </div>

    <div class="stat-card">
      <p class="stat-label">
        Hourly Rate
      </p>
      <p
        class="stat-value"
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
