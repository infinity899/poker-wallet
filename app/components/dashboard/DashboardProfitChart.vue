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
    <!-- Swatches are bound to the same tokens the datasets use, so the legend
         can never drift out of sync with the lines it describes. -->
    <div class="flex flex-wrap justify-center gap-4 lg:gap-6 mt-4 text-xs">
      <div
        v-for="entry in legend"
        :key="entry.label"
        class="flex items-center gap-2"
      >
        <span
          class="w-3 h-0.5 rounded-full"
          :style="{ backgroundColor: entry.color }"
        />
        <span class="text-foreground-muted">{{ entry.label }}</span>
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

const { tokens } = useThemeTokens();

/** Mirrors the dataset colors assigned in Dashboard.vue. */
const legend = computed(() => {
  const t = tokens.value;
  return [
    { label: 'Cash Sessions', color: t.series[6] ?? t.info },
    { label: 'Tournaments', color: t.series[5] ?? t.accent },
    { label: 'Combined', color: t.accent },
  ];
});

// Computed, not a static const: chart chrome has to re-resolve when the theme
// flips. Previously these were dark-mode slate literals that never changed.
const chartOptions = computed<ChartOptions<'line'>>(() => ({
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
      ...tokens.value.tooltip,
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      titleFont: {
        size: 12,
        weight: 600 as const,
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
        color: tokens.value.tick,
        font: { size: 10 },
      },
      grid: {
        color: tokens.value.grid,
      },
      border: {
        display: false,
      },
    },
    x: {
      ticks: {
        color: tokens.value.tick,
        font: { size: 10 },
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
}));
</script>
