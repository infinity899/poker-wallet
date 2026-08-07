<template>
  <div class="card p-4 lg:p-5">
    <div class="flex flex-wrap items-baseline justify-between gap-2 mb-4">
      <h3 class="text-sm font-semibold text-foreground dark:text-foreground-dark">
        Cumulative Tournament Profit
      </h3>
      <p v-if="groups.length > 1" class="text-xs text-foreground-muted">
        {{ groups.length }} series
      </p>
    </div>
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
import type { Tournament, TournamentBreakdown } from '~/types';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Line } from 'vue-chartjs';
import { formatDateShort } from '~/utils/formatters';
import { buildCumulativeSeries, groupTournaments } from '~/utils/tournamentGrouping';

const props = withDefaults(defineProps<{
  tournaments: Tournament[];
  /** Splits the chart into one line per group (live/online, site, …). */
  breakdown?: TournamentBreakdown;
}>(), {
  breakdown: 'none',
});

const { tokens } = useThemeTokens();
const { colorAt } = useSeriesPalette();
// Values are stored in USD; formatAmount renders them in the display currency.
const { formatAmount } = useCurrency();

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
);

const groups = computed(() =>
  groupTournaments(
    props.tournaments.filter(t => t.status !== 'in_progress'),
    props.breakdown,
    { formatAmount },
  ));

const chartData = computed<ChartData<'line'>>(() => {
  const { dates, series } = buildCumulativeSeries(groups.value);

  return {
    labels: dates.map(formatDateShort),
    datasets: series.map((line, index) => {
      const color = colorAt(index, series.length);
      return {
        label: line.label,
        data: line.data,
        borderColor: color,
        backgroundColor: withAlpha(color, 0.1),
        // Stacked fills would read as an area chart, which these lines are not.
        fill: series.length === 1,
        tension: 0.3,
        spanGaps: true,
      };
    }),
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
    legend: groups.value.length > 1
      ? {
          display: true,
          position: 'bottom',
          labels: {
            color: tokens.value.tick,
            font: { size: 11 },
            padding: 12,
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 8,
            boxHeight: 8,
          },
        }
      : { display: false },
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
          return `${context.dataset.label}: ${formatAmount(value)}`;
        },
      },
    },
  },
  scales: {
    y: {
      ticks: {
        callback: value => formatAmount(value as number),
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
