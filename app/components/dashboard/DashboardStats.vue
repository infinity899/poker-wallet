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
        Avg Result
      </p>
      <p
        class="stat-value"
        :class="avgResult >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
      >
        {{ formatProfit(avgResult) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatPercentage } from '~/utils/formatters';

/*
 * Every card here has to mean something whether the player's volume is cash or
 * tournaments: profit, how much was played, how often it ended up ahead, and by
 * how much on average. Format-specific measures - hourly rate, ROI, ITM - live
 * on the Cash Sessions and Tournaments pages instead.
 */
defineProps<{
  totalProfit: number;
  totalEntries: number;
  winRate: number;
  avgResult: number;
}>();

const { formatDisplayProfit } = useCurrency();

// Wrapper to format profit (values passed are already in USD)
const formatProfit = (amount: number) => formatDisplayProfit(amount);
</script>
