<template>
  <div class="space-y-3">
    <NuxtLink
      v-for="tournament in tournaments"
      :key="tournament.id"
      :to="`/tournaments/${tournament.id}`"
      class="card p-4 block hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow"
    >
      <div class="flex justify-between items-start mb-2">
        <div>
          <p class="font-semibold text-gray-900 dark:text-gray-100">
            {{ tournament.name }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ formatDate(tournament.date) }} &middot; {{ formatCurrency(tournament.buyIn) }}
          </p>
        </div>
        <p
          class="text-lg font-bold"
          :class="getTournamentProfit(tournament) >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
        >
          {{ formatProfit(getTournamentProfit(tournament)) }}
        </p>
      </div>
      <div class="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
        <span>{{ tournament.type === 'live' ? tournament.venue : tournament.site }}</span>
        <span v-if="tournament.finishPosition">{{ formatPosition(tournament.finishPosition) }}</span>
        <span :class="tournament.cashed ? 'text-success-600 dark:text-success-400' : ''">
          {{ tournament.cashed ? 'ITM' : 'Bust' }}
        </span>
      </div>
    </NuxtLink>

    <div
      v-if="tournaments.length === 0"
      class="card p-8 text-center text-gray-500 dark:text-gray-400"
    >
      No tournaments yet. Add your first tournament!
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Tournament } from '~/types';
import { formatCurrency, formatDate, formatPosition, formatProfit } from '~/utils/formatters';

defineProps<{
  tournaments: Tournament[];
}>();

function getTournamentProfit(t: Tournament): number {
  const cost = (t.buyIn + t.fee) * (t.entries + 1);
  return t.winnings - cost;
}
</script>
