<template>
  <div class="card p-6">
    <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">
      Live vs Online
    </h3>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            <th class="py-2 pr-4 font-medium text-left" />
            <th class="py-2 px-4 font-medium text-right">
              Live
            </th>
            <th class="py-2 pl-4 font-medium text-right">
              Online
            </th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-gray-100 dark:border-gray-800">
            <td class="py-2 pr-4 text-gray-500 dark:text-gray-400">
              Tournaments
            </td>
            <td class="py-2 px-4 text-right font-medium text-gray-900 dark:text-gray-100">
              {{ liveStats.totalTournaments }}
            </td>
            <td class="py-2 pl-4 text-right font-medium text-gray-900 dark:text-gray-100">
              {{ onlineStats.totalTournaments }}
            </td>
          </tr>
          <tr class="border-b border-gray-100 dark:border-gray-800">
            <td class="py-2 pr-4 text-gray-500 dark:text-gray-400">
              Profit
            </td>
            <td
              class="py-2 px-4 text-right font-medium"
              :class="liveStats.totalProfit >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
            >
              {{ formatDisplayProfit(liveStats.totalProfit) }}
            </td>
            <td
              class="py-2 pl-4 text-right font-medium"
              :class="onlineStats.totalProfit >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
            >
              {{ formatDisplayProfit(onlineStats.totalProfit) }}
            </td>
          </tr>
          <tr class="border-b border-gray-100 dark:border-gray-800">
            <td class="py-2 pr-4 text-gray-500 dark:text-gray-400">
              ROI
            </td>
            <td
              class="py-2 px-4 text-right font-medium"
              :class="liveStats.roi >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
            >
              {{ liveStats.roi.toFixed(1) }}%
            </td>
            <td
              class="py-2 pl-4 text-right font-medium"
              :class="onlineStats.roi >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
            >
              {{ onlineStats.roi.toFixed(1) }}%
            </td>
          </tr>
          <tr>
            <td class="py-2 pr-4 text-gray-500 dark:text-gray-400">
              ITM %
            </td>
            <td class="py-2 px-4 text-right font-medium text-gray-900 dark:text-gray-100">
              {{ liveStats.itmPercentage.toFixed(1) }}%
            </td>
            <td class="py-2 pl-4 text-right font-medium text-gray-900 dark:text-gray-100">
              {{ onlineStats.itmPercentage.toFixed(1) }}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Tournament } from '~/types';
import { calculateTournamentStats } from '~/utils/calculations';

const props = defineProps<{
  tournaments: Tournament[];
}>();

const { formatDisplayProfit } = useCurrency();

const liveStats = computed(() =>
  calculateTournamentStats(props.tournaments.filter(t => t.type === 'live')));
const onlineStats = computed(() =>
  calculateTournamentStats(props.tournaments.filter(t => t.type === 'online')));
</script>
