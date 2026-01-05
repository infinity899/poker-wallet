<template>
  <div class="grid lg:grid-cols-2 gap-6">
    <div class="card p-6">
      <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Cumulative Profit (All Horses)
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
        Per-Transaction Results (Last 30)
      </h3>
      <div class="h-64">
        <Bar
          v-if="transactionProfitData.labels.length > 0"
          :data="transactionProfitData"
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
        Horses Statistics
      </h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Total Horses
          </p>
          <p class="text-xl font-bold text-gray-900 dark:text-gray-100">
            {{ horseCount }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Total Transactions
          </p>
          <p class="text-xl font-bold text-gray-900 dark:text-gray-100">
            {{ stats.totalTransactions }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Win Rate
          </p>
          <p class="text-xl font-bold text-gray-900 dark:text-gray-100">
            {{ stats.winRate.toFixed(1) }}%
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Total Profit
          </p>
          <p
            class="text-xl font-bold"
            :class="stats.totalProfit >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
          >
            {{ formatCurrency(stats.totalProfit) }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Winning Transactions
          </p>
          <p class="text-xl font-bold text-success-600 dark:text-success-400">
            {{ stats.winningTransactions }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Losing Transactions
          </p>
          <p class="text-xl font-bold text-danger-600 dark:text-danger-400">
            {{ stats.losingTransactions }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Best Result
          </p>
          <p class="text-xl font-bold text-success-600 dark:text-success-400">
            {{ formatCurrency(stats.bestResult) }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Worst Result
          </p>
          <p class="text-xl font-bold text-danger-600 dark:text-danger-400">
            {{ formatCurrency(stats.worstResult) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { HorseStats } from '~/types';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
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
  transactionProfitData: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string[];
    }>;
  };
  stats: HorseStats;
  horseCount: number;
}>();

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

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
