<template>
  <div class="card overflow-hidden">
    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead class="bg-gray-50 dark:bg-gray-700">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Date
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Name
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Type
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Buy-in
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Finish
          </th>
          <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Result
          </th>
          <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
        <tr
          v-for="tournament in tournaments"
          :key="tournament.id"
          class="hover:bg-gray-50 dark:hover:bg-gray-700/50"
        >
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
            {{ formatDate(tournament.date) }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
            {{ tournament.name }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm">
            <span
              class="badge"
              :class="tournament.type === 'live' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'"
            >
              {{ tournament.type }}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
            {{ formatCurrency(tournament.buyIn) }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm">
            <span v-if="tournament.finishPosition" class="text-gray-900 dark:text-gray-100">
              {{ formatPosition(tournament.finishPosition) }}
              <span v-if="tournament.fieldSize" class="text-gray-400">
                / {{ tournament.fieldSize }}
              </span>
            </span>
            <span
              class="ml-2 badge"
              :class="tournament.cashed ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'"
            >
              {{ tournament.cashed ? 'ITM' : 'Bust' }}
            </span>
          </td>
          <td
            class="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold"
            :class="getTournamentProfit(tournament) >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
          >
            {{ formatProfit(getTournamentProfit(tournament)) }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
            <div class="flex gap-2 justify-end">
              <NuxtLink
                :to="`/tournaments/${tournament.id}`"
                class="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
              >
                <PencilIcon class="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </NuxtLink>
              <button
                class="p-1 hover:bg-danger-50 dark:hover:bg-danger-900/30 rounded"
                @click.prevent="emit('delete', tournament.id)"
              >
                <TrashIcon class="w-4 h-4 text-danger-500" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <div
      v-if="tournaments.length === 0"
      class="p-8 text-center text-gray-500 dark:text-gray-400"
    >
      No tournaments yet. Add your first tournament!
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Tournament } from '~/types';
import { PencilIcon, TrashIcon } from '@heroicons/vue/24/outline';
import { formatCurrency, formatDate, formatPosition, formatProfit } from '~/utils/formatters';

defineProps<{
  tournaments: Tournament[];
}>();

const emit = defineEmits<{
  delete: [id: string];
}>();

function getTournamentProfit(t: Tournament): number {
  const cost = (t.buyIn + t.fee) * (t.entries + 1);
  return t.winnings - cost;
}
</script>
