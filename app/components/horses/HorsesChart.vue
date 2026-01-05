<template>
  <div class="card p-6">
    <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">
      Cumulative Profit by Horse
    </h3>
    <div class="h-64 lg:h-80">
      <Line
        v-if="chartData.labels.length > 0"
        :data="chartData"
        :options="chartOptions"
      />
      <div
        v-else
        class="h-full flex items-center justify-center text-gray-400"
      >
        No transactions yet
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Horse } from '~/types';
import {
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
import { Line } from 'vue-chartjs';
import { HORSE_COLORS } from '~/types/horse';
import { formatCurrency } from '~/utils/formatters';

const props = defineProps<{
  horses: readonly Horse[];
}>();

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const horsesStore = useHorsesStore();

const chartData = computed(() => {
  // Get all unique dates from all transactions, sorted
  const allDates = new Set<string>();
  props.horses.forEach((horse) => {
    horsesStore.getCumulativeProfitData(horse.id).forEach((d) => {
      allDates.add(d.date);
    });
  });

  const sortedDates = Array.from(allDates).sort();

  // Build datasets for each horse
  const datasets = props.horses.map((horse, index) => {
    const horseData = horsesStore.getCumulativeProfitData(horse.id);
    const profitByDate = new Map(horseData.map(d => [d.date, d.profit]));

    // Fill in cumulative values for all dates
    let lastValue = 0;
    const data = sortedDates.map((date) => {
      if (profitByDate.has(date)) {
        lastValue = profitByDate.get(date)!;
      }
      return lastValue;
    });

    const color = horse.avatar || HORSE_COLORS[index % HORSE_COLORS.length] || 'rgb(245, 158, 11)';

    return {
      label: horse.name,
      data,
      borderColor: color,
      backgroundColor: `${color}14`,
      fill: true,
      tension: 0.4,
      borderWidth: 3,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: color,
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 2,
    };
  });

  return {
    labels: sortedDates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets,
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 16,
        color: 'rgb(156, 163, 175)',
      },
    },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      titleColor: '#f3f4f6',
      bodyColor: '#d1d5db',
      borderColor: 'rgba(75, 85, 99, 0.3)',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (context: any) => `${context.dataset.label}: ${formatCurrency(context.raw as number)}`,
      },
    },
  },
  scales: {
    y: {
      ticks: {
        callback: (value: any) => formatCurrency(value as number),
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
