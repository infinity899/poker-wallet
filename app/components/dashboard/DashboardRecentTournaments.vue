<template>
  <div class="card">
    <div class="card-header flex items-center justify-between">
      <h2 class="text-sm font-semibold text-foreground dark:text-foreground-dark">
        Recent Tournaments
      </h2>
      <NuxtLink
        to="/tournaments"
        class="text-xs font-medium text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300 transition-colors"
      >
        View all
      </NuxtLink>
    </div>
    <div class="divide-y divide-border dark:divide-border-dark">
      <NuxtLink
        v-for="tournament in tournaments"
        :key="tournament.id"
        :to="`/tournaments/${tournament.id}`"
        class="block px-4 py-3 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors"
      >
        <div class="flex items-center justify-between gap-4">
          <div class="min-w-0">
            <p class="text-sm font-medium text-foreground dark:text-foreground-dark truncate">
              {{ tournament.name }}
            </p>
            <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted">
              {{ formatCurrency(tournament.buyIn) }} buy-in
              <span v-if="tournament.finishPosition">
                &middot; {{ getOrdinal(tournament.finishPosition) }}
              </span>
            </p>
          </div>
          <div class="text-right shrink-0">
            <p
              class="text-sm font-semibold data-value"
              :class="getTournamentProfit(tournament) >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
            >
              {{ formatProfit(getTournamentProfit(tournament)) }}
            </p>
            <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted">
              {{ tournament.cashed ? 'ITM' : 'Bust' }}
            </p>
          </div>
        </div>
      </NuxtLink>
      <div
        v-if="tournaments.length === 0"
        class="empty-state py-8"
      >
        <p class="text-sm text-foreground-muted dark:text-foreground-dark-muted">
          No tournaments yet
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Tournament } from '~/types';
import { formatCurrency, formatProfit } from '~/utils/formatters';

defineProps<{
  tournaments: Tournament[];
}>();

function getTournamentProfit(tournament: Tournament): number {
  const cost = (tournament.buyIn + tournament.fee) * (tournament.entries + 1);
  return tournament.winnings - cost;
}

function getOrdinal(n: number): string {
  const suffix = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
  return `${n}${suffix}`;
}
</script>
