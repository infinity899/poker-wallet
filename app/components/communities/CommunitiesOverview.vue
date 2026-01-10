<template>
  <div class="card p-4 lg:p-6">
    <h3 class="text-sm font-semibold text-foreground dark:text-foreground-dark mb-4">
      Overview
    </h3>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total Profit -->
      <div>
        <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted mb-1">
          Total Profit
        </p>
        <p
          class="text-xl font-bold tabular-nums"
          :class="stats.totalProfit >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
        >
          {{ formatCurrency(stats.totalProfit) }}
        </p>
      </div>

      <!-- Win Rate -->
      <div>
        <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted mb-1">
          Win Rate
        </p>
        <p class="text-xl font-bold tabular-nums text-foreground dark:text-foreground-dark">
          {{ stats.winRate.toFixed(1) }}%
        </p>
      </div>

      <!-- Hourly Rate -->
      <div>
        <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted mb-1">
          Hourly Rate
        </p>
        <p
          class="text-xl font-bold tabular-nums"
          :class="stats.hourlyRate >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
        >
          {{ formatCurrency(stats.hourlyRate) }}/hr
        </p>
      </div>

      <!-- Members -->
      <div>
        <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted mb-1">
          Members
        </p>
        <p class="text-xl font-bold tabular-nums text-foreground dark:text-foreground-dark">
          {{ stats.totalMembers }}
        </p>
      </div>
    </div>

    <!-- Secondary Stats -->
    <div class="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-border dark:border-border-dark">
      <div>
        <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted">
          Sessions
        </p>
        <p class="text-sm font-medium tabular-nums text-foreground dark:text-foreground-dark">
          {{ stats.totalSessions }}
        </p>
      </div>
      <div>
        <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted">
          Tournaments
        </p>
        <p class="text-sm font-medium tabular-nums text-foreground dark:text-foreground-dark">
          {{ stats.totalTournaments }}
        </p>
      </div>
      <div>
        <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted">
          Hours
        </p>
        <p class="text-sm font-medium tabular-nums text-foreground dark:text-foreground-dark">
          {{ stats.totalHours.toFixed(1) }}
        </p>
      </div>
      <div>
        <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted">
          Best Result
        </p>
        <p class="text-sm font-medium tabular-nums text-success-600 dark:text-success-400">
          {{ formatCurrency(stats.bestResult) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency } from '~/utils/formatters';

const props = defineProps<{
  communityId: string;
}>();

const communitiesStore = useCommunitiesStore();

const stats = computed(() => communitiesStore.getCommunityStats(props.communityId));
</script>
