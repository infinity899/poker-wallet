<template>
  <div class="card p-6">
    <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">
      ROI Trend (rolling 10)
    </h3>
    <div class="h-64">
      <Line
        v-if="chartData.labels.length > 0"
        :data="chartData"
        :options="options"
      />
      <div
        v-else
        class="h-full flex items-center justify-center text-center px-4 text-gray-400 text-sm"
      >
        Log at least 10 tournaments{{ groups.length > 1 ? ' in a group' : '' }} to see trends
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChartOptions } from 'chart.js';
import type { TournamentGroup } from '~/utils/tournamentGrouping';
import { Line } from 'vue-chartjs';
import { calculateROITrend } from '~/utils/calculations';
import { formatDateShort } from '~/utils/formatters';
import { buildTrendSeries } from '~/utils/tournamentGrouping';

const props = defineProps<{
  groups: TournamentGroup[];
}>();

const { percentLineChartOptions, seriesLegend } = useCurrencyChartOptions();
const { colorAt } = useSeriesPalette();

const series = computed(() =>
  buildTrendSeries(props.groups, tournaments =>
    calculateROITrend(tournaments, 10).map(point => ({ date: point.date, value: point.roi }))));

const chartData = computed(() => ({
  labels: series.value.dates.map(formatDateShort),
  datasets: series.value.series.map((line, index) => {
    const color = colorAt(index, series.value.series.length);
    return {
      label: line.label,
      data: line.data,
      borderColor: color,
      backgroundColor: withAlpha(color, 0.1),
      fill: series.value.series.length === 1,
      tension: 0.3,
      spanGaps: true,
    };
  }),
}));

const options = computed<ChartOptions<'line'>>(() => ({
  ...percentLineChartOptions.value,
  plugins: {
    ...percentLineChartOptions.value.plugins,
    legend: series.value.series.length > 1 ? seriesLegend.value : { display: false },
  },
}));
</script>
