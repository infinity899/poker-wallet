<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
    <div class="stat-card">
      <p class="stat-label">
        Trips
      </p>
      <p class="stat-value text-foreground dark:text-foreground-dark">
        {{ stats.totalTrips }}
      </p>
    </div>
    <div class="stat-card">
      <p class="stat-label">
        Gross Profit
      </p>
      <p
        class="stat-value"
        :class="stats.grossProfit >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
      >
        {{ formatDisplayProfit(stats.grossProfit) }}
      </p>
    </div>
    <div class="stat-card">
      <p class="stat-label">
        Expenses
      </p>
      <p class="stat-value text-danger-600 dark:text-danger-400">
        -{{ formatAmount(stats.totalExpenses) }}
      </p>
    </div>
    <div class="stat-card">
      <p class="stat-label">
        Net Profit
      </p>
      <p
        class="stat-value"
        :class="stats.netProfit >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
      >
        {{ formatDisplayProfit(stats.netProfit) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TripStats } from '~/types';

defineProps<{
  stats: TripStats;
}>();

const { formatAmount, formatDisplayProfit } = useCurrency();
</script>
