<template>
  <div class="card p-4 lg:p-5">
    <h3 class="text-sm font-semibold text-foreground dark:text-foreground-dark mb-4">
      Cumulative Tournament Profit
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
  </div>
</template>

<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js';
import type { Tournament } from '~/types';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Line } from 'vue-chartjs';
import { formatCurrency, formatDateShort } from '~/utils/formatters';

const props = defineProps<{
  tournaments: Tournament[];
}>();

const { tokens } = useThemeTokens();

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
);

const chartData = computed<ChartData<'line'>>(() => {
  const completed = props.tournaments
    .filter(t => t.status !== 'in_progress')
    .slice()
    .reverse();

  let cumulative = 0;
  const data = completed.map((t) => {
    const cost = (t.buyIn + t.fee) * (t.entries + 1);
    cumulative += t.winnings - cost;
    return { date: t.date, cumulative };
  });

  return {
    labels: data.map(d => formatDateShort(d.date)),
    datasets: [{
      label: 'Cumulative Profit',
      data: data.map(d => d.cumulative),
      borderColor: tokens.value.accent,
      backgroundColor: withAlpha(tokens.value.accent, 0.1),
      fill: true,
      tension: 0.3,
    }],
  };
});

// Computed so chart chrome re-resolves on a light/dark flip.
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
