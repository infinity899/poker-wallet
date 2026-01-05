<template>
  <div class="card p-6">
    <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">
      Cumulative Profit
    </h3>
    <div class="h-80">
      <Line
        v-if="chartData.labels && chartData.labels.length > 0"
        :data="chartData"
        :options="chartOptions"
      />
      <div
        v-else
        class="h-full flex items-center justify-center text-gray-400"
      >
        No data available
      </div>
    </div>
    <div class="flex flex-wrap justify-center gap-6 mt-4 text-sm">
      <div class="flex items-center gap-2">
        <span class="w-4 h-1 rounded-full bg-blue-500" />
        <span class="text-gray-600 dark:text-gray-400">Cash Sessions</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-4 h-1 rounded-full bg-purple-500" />
        <span class="text-gray-600 dark:text-gray-400">Tournaments</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-4 h-1 rounded-full bg-orange-400" />
        <span class="text-gray-600 dark:text-gray-400">My Horses</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-4 h-1 rounded-full bg-emerald-500" />
        <span class="text-gray-600 dark:text-gray-400">Combined</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js';
import { Line } from 'vue-chartjs';
import { formatCurrency } from '~/utils/formatters';

defineProps<{
  chartData: ChartData<'line'>;
}>();

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      titleColor: '#f3f4f6',
      bodyColor: '#d1d5db',
      borderColor: 'rgba(75, 85, 99, 0.3)',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      titleFont: {
        size: 13,
        weight: 'bold',
      },
      bodyFont: {
        size: 12,
      },
      callbacks: {
        label: (context) => {
          const value = context.raw as number;
          if (value === null || value === undefined) {
            return '';
          }
          return `${context.dataset.label}: ${formatCurrency(value)}`;
        },
      },
    },
  },
  scales: {
    y: {
      ticks: {
        callback: value => formatCurrency(value as number),
        color: 'rgb(156, 163, 175)',
        font: {
          size: 11,
        },
      },
      grid: {
        color: 'rgba(75, 85, 99, 0.2)',
      },
      border: {
        display: false,
      },
    },
    x: {
      ticks: {
        color: 'rgb(156, 163, 175)',
        font: {
          size: 10,
        },
        maxRotation: 45,
        minRotation: 45,
      },
      grid: {
        display: false,
      },
      border: {
        display: false,
      },
    },
  },
  elements: {
    point: {
      radius: 0,
      hoverRadius: 6,
      hoverBorderWidth: 2,
    },
    line: {
      borderWidth: 3,
    },
  },
};
</script>
