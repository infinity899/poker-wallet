<template>
  <div class="card p-4 lg:p-5">
    <h3 class="text-sm font-semibold text-foreground dark:text-foreground-dark mb-4">
      Cumulative Profit
    </h3>
    <div class="h-72 lg:h-80">
      <Line
        v-if="chartData.labels && chartData.labels.length > 0"
        :data="chartData"
        :options="chartOptions"
      />
      <div
        v-else
        class="h-full flex items-center justify-center text-foreground-muted dark:text-foreground-dark-muted text-sm"
      >
        No data available
      </div>
    </div>
    <div class="flex flex-wrap justify-center gap-4 lg:gap-6 mt-4 text-xs">
      <div class="flex items-center gap-2">
        <span class="w-3 h-0.5 rounded-full bg-blue-500" />
        <span class="text-foreground-muted dark:text-foreground-dark-muted">Cash Sessions</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-3 h-0.5 rounded-full bg-violet-500" />
        <span class="text-foreground-muted dark:text-foreground-dark-muted">Tournaments</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-3 h-0.5 rounded-full bg-orange-400" />
        <span class="text-foreground-muted dark:text-foreground-dark-muted">My Horses</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-3 h-0.5 rounded-full bg-accent-500" />
        <span class="text-foreground-muted dark:text-foreground-dark-muted">Combined</span>
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
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      titleColor: '#f8fafc',
      bodyColor: '#cbd5e1',
      borderColor: 'rgba(71, 85, 105, 0.3)',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 6,
      titleFont: {
        size: 12,
        weight: '600',
      },
      bodyFont: {
        size: 11,
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
        color: 'rgb(148, 163, 184)',
        font: {
          size: 10,
        },
      },
      grid: {
        color: 'rgba(71, 85, 105, 0.15)',
      },
      border: {
        display: false,
      },
    },
    x: {
      ticks: {
        color: 'rgb(148, 163, 184)',
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
      hoverRadius: 5,
      hoverBorderWidth: 2,
    },
    line: {
      borderWidth: 2,
    },
  },
};
</script>
