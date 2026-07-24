<template>
  <div class="grid lg:grid-cols-2 gap-6">
    <div class="card p-6 lg:col-span-2">
      <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Tournament Statistics
      </h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Total Tournaments
          </p>
          <p class="text-xl font-bold text-gray-900 dark:text-gray-100">
            {{ stats.totalTournaments }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            ITM Count
          </p>
          <p class="text-xl font-bold text-success-600 dark:text-success-400">
            {{ stats.itm }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            ITM %
          </p>
          <p class="text-xl font-bold text-gray-900 dark:text-gray-100">
            {{ stats.itmPercentage.toFixed(1) }}%
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            ROI
          </p>
          <p
            class="text-xl font-bold"
            :class="stats.roi >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
          >
            {{ stats.roi.toFixed(1) }}%
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Total Buy-ins
          </p>
          <p class="text-xl font-bold text-gray-900 dark:text-gray-100">
            {{ formatAmount(stats.totalBuyIns) }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Total Winnings
          </p>
          <p class="text-xl font-bold text-gray-900 dark:text-gray-100">
            {{ formatAmount(stats.totalWinnings) }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Avg Cash Multiple
          </p>
          <p class="text-xl font-bold text-gray-900 dark:text-gray-100">
            {{ stats.avgCashMultiple > 0 ? `${stats.avgCashMultiple.toFixed(1)}x` : '-' }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Biggest Cash
          </p>
          <p class="text-xl font-bold text-success-600 dark:text-success-400">
            {{ formatAmount(stats.biggestCash) }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Avg Buy-in
          </p>
          <p class="text-xl font-bold text-gray-900 dark:text-gray-100">
            {{ formatAmount(stats.avgBuyIn) }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Best Finish
          </p>
          <p class="text-xl font-bold text-success-600 dark:text-success-400">
            {{ stats.bestFinish > 0 ? getOrdinal(stats.bestFinish) : '-' }}
          </p>
        </div>
      </div>
    </div>

    <div class="lg:col-span-2">
      <AnalyticsBuyInBreakdown :tournaments="tournaments" />
    </div>

    <div class="card p-6 lg:col-span-2">
      <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Cumulative Profit
      </h3>
      <div class="h-64">
        <Line
          v-if="cumulativeData.labels.length > 0"
          :data="cumulativeData"
          :options="lineChartOptions"
        />
        <div
          v-else
          class="h-full flex items-center justify-center text-gray-400"
        >
          No data available
        </div>
      </div>
    </div>

    <AnalyticsRoiTrendChart :tournaments="tournaments" />
    <AnalyticsItmTrendChart :tournaments="tournaments" />

    <div class="lg:col-span-2">
      <AnalyticsTypeComparison :tournaments="tournaments" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Tournament, TournamentStats } from '~/types';
import { Line } from 'vue-chartjs';
import { calculateCumulativeProfit, getTournamentNetProfit } from '~/utils/calculations';
import { formatDateShort } from '~/utils/formatters';

const props = defineProps<{
  tournaments: Tournament[];
  stats: TournamentStats;
}>();

const { formatAmount } = useCurrency();
const { lineChartOptions } = useCurrencyChartOptions();

const cumulativeData = computed(() => {
  const data = calculateCumulativeProfit(
    props.tournaments,
    item => getTournamentNetProfit(item as Tournament),
  );

  return {
    labels: data.map(d => formatDateShort(d.date)),
    datasets: [{
      label: 'Cumulative Profit',
      data: data.map(d => d.cumulative),
      borderColor: 'rgb(139, 92, 246)',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      fill: true,
      tension: 0.3,
    }],
  };
});

function getOrdinal(n: number): string {
  const suffix = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
  return `${n}${suffix}`;
}
</script>
