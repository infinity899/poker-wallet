<template>
  <div class="grid lg:grid-cols-2 gap-6">
    <div class="card p-6 lg:col-span-2">
      <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Cumulative Profit
      </h3>
      <div class="h-64">
        <Line
          v-if="cumulativeData.labels.length > 0"
          :data="cumulativeData"
          :options="lineChartOptions"
        />
        <div
          v-else
          class="h-full flex items-center justify-center text-gray-400"
        >
          No data available
        </div>
      </div>
    </div>

    <div class="card p-6 lg:col-span-2">
      <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Tournament Statistics
      </h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Total Tournaments
          </p>
          <p class="text-xl font-bold text-gray-900 dark:text-gray-100">
            {{ stats.totalTournaments }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            ITM Count
          </p>
          <p class="text-xl font-bold text-success-600 dark:text-success-400">
            {{ stats.itm }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            ITM %
          </p>
          <p class="text-xl font-bold text-gray-900 dark:text-gray-100">
            {{ stats.itmPercentage.toFixed(1) }}%
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            ROI
          </p>
          <p
            class="text-xl font-bold"
            :class="stats.roi >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
          >
            {{ stats.roi.toFixed(1) }}%
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Total Buy-ins
          </p>
          <p class="text-xl font-bold text-gray-900 dark:text-gray-100">
            {{ formatCurrency(stats.totalBuyIns) }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Total Winnings
          </p>
          <p class="text-xl font-bold text-gray-900 dark:text-gray-100">
            {{ formatCurrency(stats.totalWinnings) }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Avg Buy-in
          </p>
          <p class="text-xl font-bold text-gray-900 dark:text-gray-100">
            {{ formatCurrency(stats.avgBuyIn) }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Best Finish
          </p>
          <p class="text-xl font-bold text-success-600 dark:text-success-400">
            {{ stats.bestFinish > 0 ? getOrdinal(stats.bestFinish) : '-' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TournamentStats } from '~/types';
import { Line } from 'vue-chartjs';
import { formatCurrency } from '~/utils/formatters';

defineProps<{
  cumulativeData: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      fill: boolean;
      tension: number;
    }>;
  };
  stats: TournamentStats;
}>();

function getOrdinal(n: number): string {
  const suffix = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
  return `${n}${suffix}`;
}

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (context: any) => formatCurrency(context.raw as number),
      },
    },
  },
  scales: {
    y: {
      ticks: {
        callback: (value: any) => formatCurrency(value as number),
      },
    },
  },
};
</script>
