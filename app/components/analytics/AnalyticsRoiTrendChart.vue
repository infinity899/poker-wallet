<template>
  <div class="card p-6">
    <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">
      ROI Trend (rolling 10)
    </h3>
    <div class="h-64">
      <Line
        v-if="chartData.labels.length > 0"
        :data="chartData"
        :options="percentLineChartOptions"
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
import type { Tournament } from '~/types';
import { Line } from 'vue-chartjs';
import { calculateROITrend } from '~/utils/calculations';
import { formatDateShort } from '~/utils/formatters';

const props = defineProps<{
  tournaments: Tournament[];
}>();

const { percentLineChartOptions } = useCurrencyChartOptions();

const chartData = computed(() => {
  const data = calculateROITrend(props.tournaments, 10);

  return {
    labels: data.map(d => formatDateShort(d.date)),
    datasets: [{
      label: 'ROI',
      data: data.map(d => d.roi),
      borderColor: 'rgb(139, 92, 246)',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      fill: true,
      tension: 0.3,
    }],
  };
});
</script>
