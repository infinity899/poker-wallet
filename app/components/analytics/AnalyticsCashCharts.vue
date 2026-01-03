<template>
  <div class="grid lg:grid-cols-2 gap-6">
    <div class="card p-6">
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

    <div class="card p-6">
      <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Profit per Session (Last 30)
      </h3>
      <div class="h-64">
        <Bar
          v-if="sessionProfitData.labels.length > 0"
          :data="sessionProfitData"
          :options="barChartOptions"
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
        Session Statistics
      </h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Total Sessions
          </p>
          <p class="text-xl font-bold text-gray-900 dark:text-gray-100">
            {{ stats.totalSessions }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Winning Sessions
          </p>
          <p class="text-xl font-bold text-success-600 dark:text-success-400">
            {{ stats.winningSessions }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Losing Sessions
          </p>
          <p class="text-xl font-bold text-danger-600 dark:text-danger-400">
            {{ stats.losingSessions }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Best Session
          </p>
          <p class="text-xl font-bold text-success-600 dark:text-success-400">
            {{ formatCurrency(stats.bestSession) }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Worst Session
          </p>
          <p class="text-xl font-bold text-danger-600 dark:text-danger-400">
            {{ formatCurrency(stats.worstSession) }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Avg Profit
          </p>
          <p
            class="text-xl font-bold"
            :class="stats.avgProfit >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
          >
            {{ formatCurrency(stats.avgProfit) }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Total Hours
          </p>
          <p class="text-xl font-bold text-gray-900 dark:text-gray-100">
            {{ stats.totalHours.toFixed(1) }}h
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Current Streak
          </p>
          <p
            class="text-xl font-bold"
            :class="stats.currentStreak >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
          >
            {{ stats.currentStreak > 0 ? '+' : '' }}{{ stats.currentStreak }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SessionStats } from '~/types';
import { Bar, Line } from 'vue-chartjs';
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
  sessionProfitData: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string[];
    }>;
  };
  stats: SessionStats;
}>();

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

const barChartOptions = {
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
