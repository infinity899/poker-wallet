<template>
  <div class="card">
    <div class="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
      <h2 class="font-semibold text-gray-900 dark:text-gray-100">
        Recent Tournaments
      </h2>
      <NuxtLink
        to="/tournaments"
        class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
      >
        View all
      </NuxtLink>
    </div>
    <div class="divide-y divide-gray-100 dark:divide-gray-700">
      <div
        v-for="tournament in tournaments"
        :key="tournament.id"
        class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-900 dark:text-gray-100">
              {{ tournament.name }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ formatCurrency(tournament.buyIn) }} buy-in
              <span v-if="tournament.finishPosition">
                &middot; {{ getOrdinal(tournament.finishPosition) }}
              </span>
            </p>
          </div>
          <div class="text-right">
            <p
              class="font-semibold"
              :class="getTournamentProfit(tournament) >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
            >
              {{ formatProfit(getTournamentProfit(tournament)) }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ tournament.cashed ? 'ITM' : 'Bust' }}
            </p>
          </div>
        </div>
      </div>
      <div
        v-if="tournaments.length === 0"
        class="p-8 text-center text-gray-500 dark:text-gray-400"
      >
        No tournaments yet
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
