<template>
  <div class="card">
    <div class="card-header flex items-center justify-between">
      <h2 class="text-sm font-semibold text-foreground dark:text-foreground-dark">
        Recent Sessions
      </h2>
      <NuxtLink
        to="/sessions"
        class="text-xs font-medium text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300 transition-colors"
      >
        View all
      </NuxtLink>
    </div>
    <div class="divide-y divide-border dark:divide-border-dark">
      <NuxtLink
        v-for="session in sessions"
        :key="session.id"
        :to="`/sessions/${session.id}`"
        class="block px-4 py-3 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors"
      >
        <div class="flex items-center justify-between gap-4">
          <div class="min-w-0">
            <p class="text-sm font-medium text-foreground dark:text-foreground-dark truncate">
              {{ session.game }} {{ session.stake }}
            </p>
            <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted truncate">
              {{ session.type === 'live' ? session.location : session.site }}
            </p>
          </div>
          <div class="text-right shrink-0">
            <p
              class="text-sm font-semibold data-value"
              :class="session.result >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
            >
              {{ formatProfit(session.result) }}
            </p>
            <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted">
              {{ formatDuration(session.duration) }}
            </p>
          </div>
        </div>
      </NuxtLink>
      <div
        v-if="sessions.length === 0"
        class="empty-state py-8"
      >
        <p class="text-sm text-foreground-muted dark:text-foreground-dark-muted">
          No sessions yet
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CashSession } from '~/types';
import { formatDuration } from '~/utils/formatters';

defineProps<{
  sessions: CashSession[];
}>();

const { formatDisplayProfit } = useCurrency();

// Wrapper to format profit (values are in USD from store)
const formatProfit = (amount: number) => formatDisplayProfit(amount);
</script>
