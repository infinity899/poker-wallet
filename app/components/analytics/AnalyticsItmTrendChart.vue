<template>
  <div class="card p-6">
    <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">
      ITM % Trend (rolling 10)
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
        Log at least 10 tournaments to see trends
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChartOptions } from 'chart.js';
import type { Tournament } from '~/types';
import { Line } from 'vue-chartjs';
import { calculateITMTrend } from '~/utils/calculations';
import { formatDateShort } from '~/utils/formatters';

const props = defineProps<{
  tournaments: Tournament[];
}>();

const { percentLineChartOptions } = useCurrencyChartOptions();

// ITM % is bounded, so pin the axis to 0–100 for a stable, comparable scale.
const options = computed<ChartOptions<'line'>>(() => ({
  ...percentLineChartOptions.value,
  scales: {
    ...percentLineChartOptions.value.scales,
    y: {
      ...percentLineChartOptions.value.scales?.y,
      min: 0,
      max: 100,
    },
  },
}));

const chartData = computed(() => {
  const data = calculateITMTrend(props.tournaments, 10);

  return {
    labels: data.map(d => formatDateShort(d.date)),
    datasets: [{
      label: 'ITM %',
      data: data.map(d => d.itmPercentage),
      borderColor: 'rgb(139, 92, 246)',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      fill: true,
      tension: 0.3,
    }],
  };
});
</script>
