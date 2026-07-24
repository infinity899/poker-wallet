<template>
  <div class="card p-6">
    <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">
      Performance by Buy-in Level
    </h3>

    <template v-if="breakdown.length > 0">
      <div class="h-64 mb-4">
        <Bar :data="chartData" :options="barChartOptions" />
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <th class="py-2 pr-4 font-medium">
                Level
              </th>
              <th class="py-2 px-4 font-medium text-right">
                Count
              </th>
              <th class="py-2 px-4 font-medium text-right">
                Profit
              </th>
              <th class="py-2 px-4 font-medium text-right">
                ROI
              </th>
              <th class="py-2 pl-4 font-medium text-right">
                ITM %
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="bucket in breakdown"
              :key="bucket.min"
              class="border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              <td class="py-2 pr-4 font-medium text-gray-900 dark:text-gray-100">
                {{ bucketLabel(bucket) }}
              </td>
              <td class="py-2 px-4 text-right text-gray-700 dark:text-gray-300">
                {{ bucket.count }}
              </td>
              <td
                class="py-2 px-4 text-right font-medium"
                :class="bucket.totalProfit >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
              >
                {{ formatDisplayProfit(bucket.totalProfit) }}
              </td>
              <td
                class="py-2 px-4 text-right font-medium"
                :class="bucket.roi >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
              >
                {{ bucket.roi.toFixed(1) }}%
              </td>
              <td class="py-2 pl-4 text-right text-gray-700 dark:text-gray-300">
                {{ bucket.itmPercentage.toFixed(0) }}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <div
      v-else
      class="h-64 flex items-center justify-center text-gray-400"
    >
      No data available
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BuyInLevelStats, Tournament } from '~/types';
import { Bar } from 'vue-chartjs';
import { calculateBuyInBreakdown } from '~/utils/calculations';

const props = defineProps<{
  tournaments: Tournament[];
}>();

const { formatAmount, formatDisplayProfit } = useCurrency();
const { barChartOptions } = useCurrencyChartOptions();

const breakdown = computed(() => calculateBuyInBreakdown(props.tournaments));

function bucketLabel(bucket: BuyInLevelStats): string {
  if (bucket.max === null) {
    return `${formatAmount(bucket.min)}+`;
  }
  return `${formatAmount(bucket.min)}–${formatAmount(bucket.max)}`;
}

const chartData = computed(() => ({
  labels: breakdown.value.map(bucketLabel),
  datasets: [{
    label: 'Profit',
    data: breakdown.value.map(b => b.totalProfit),
    backgroundColor: breakdown.value.map(b =>
      b.totalProfit >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)',
    ),
  }],
}));
</script>
