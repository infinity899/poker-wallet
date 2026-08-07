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

      <div
        v-if="totalCumulativeData.labels.length > 0"
        class="mt-6 pt-4 border-t border-border dark:border-border-dark"
      >
        <div class="flex items-baseline justify-between gap-4 mb-2">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Cumulative Profit
          </p>
          <p
            class="text-sm font-semibold"
            :class="stats.totalProfit >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
          >
            {{ formatDisplayProfit(stats.totalProfit) }}
          </p>
        </div>
        <div class="h-20">
          <Line
            :data="totalCumulativeData"
            :options="sparklineChartOptions"
          />
        </div>
      </div>
    </div>

    <div class="lg:col-span-2">
      <AnalyticsBuyInBreakdown
        :tournaments="tournaments"
        :groups="groups"
        :breakdown="breakdown"
      />
    </div>

    <div class="card p-6 lg:col-span-2">
      <div class="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <h3 class="font-semibold text-gray-900 dark:text-gray-100">
          Cumulative Profit
        </h3>
        <p v-if="groups.length > 1" class="text-xs text-foreground-muted">
          {{ groups.length }} series
        </p>
      </div>
      <div class="h-64">
        <Line
          v-if="cumulativeData.labels.length > 0"
          :data="cumulativeData"
          :options="cumulativeOptions"
        />
        <div
          v-else
          class="h-full flex items-center justify-center text-gray-400"
        >
          No data available
        </div>
      </div>
    </div>

    <AnalyticsRoiTrendChart :groups="groups" />
    <AnalyticsItmTrendChart :groups="groups" />

    <TournamentsBreakdownTable
      :groups="tableGroups"
      :dimension-label="tableLabel"
      :overlaps="breakdown === 'tag'"
    />
    <AnalyticsWinningsBySite :tournaments="tournaments" />
  </div>
</template>

<script setup lang="ts">
import type { ChartOptions } from 'chart.js';
import type { Tournament, TournamentBreakdown, TournamentStats } from '~/types';
import { Line } from 'vue-chartjs';
import { calculateCumulativeProfit, getTournamentNetProfit } from '~/utils/calculations';
import { formatDateShort } from '~/utils/formatters';
import { breakdownLabel, buildCumulativeSeries, groupTournaments } from '~/utils/tournamentGrouping';

const props = withDefaults(defineProps<{
  tournaments: Tournament[];
  stats: TournamentStats;
  /** Splits every chart below into one series per group. */
  breakdown?: TournamentBreakdown;
}>(), {
  breakdown: 'none',
});

const { formatAmount, formatDisplayProfit } = useCurrency();
const { lineChartOptions, sparklineChartOptions, seriesLegend } = useCurrencyChartOptions();
const { tokens } = useThemeTokens();
const { colorAt } = useSeriesPalette();

const groups = computed(() =>
  groupTournaments(props.tournaments, props.breakdown, { formatAmount }));

/*
 * With no breakdown chosen, the comparison table keeps its historical job of
 * contrasting live and online play — that split is worth seeing by default.
 */
const tableGroups = computed(() =>
  props.breakdown === 'none'
    ? groupTournaments(props.tournaments, 'type', { formatAmount })
    : groups.value);

const tableLabel = computed(() =>
  props.breakdown === 'none' ? 'Live vs Online' : breakdownLabel(props.breakdown));

/** The headline sparkline always tracks the total, next to the total figure. */
const totalCumulativeData = computed(() => {
  const data = calculateCumulativeProfit(
    props.tournaments,
    item => getTournamentNetProfit(item as Tournament),
  );

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

const cumulativeData = computed(() => {
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
        fill: series.length === 1,
        tension: 0.3,
        spanGaps: true,
      };
    }),
  };
});

const cumulativeOptions = computed<ChartOptions<'line'>>(() => ({
  ...lineChartOptions.value,
  plugins: {
    ...lineChartOptions.value.plugins,
    legend: groups.value.length > 1 ? seriesLegend.value : { display: false },
  },
}));

function getOrdinal(n: number): string {
  const suffix = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
  return `${n}${suffix}`;
}
</script>
