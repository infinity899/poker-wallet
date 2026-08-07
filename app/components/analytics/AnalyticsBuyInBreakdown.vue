<template>
  <div class="card p-6">
    <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">
      Performance by Buy-in Level
    </h3>

    <template v-if="bucketLabels.length > 0">
      <div class="h-64 mb-4">
        <Bar :data="chartData" :options="options" />
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
              v-for="bucket in totals"
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
import type { ChartOptions } from 'chart.js';
import type { BuyInLevelStats, Tournament, TournamentBreakdown } from '~/types';
import type { TournamentGroup } from '~/utils/tournamentGrouping';
import { Bar } from 'vue-chartjs';
import { calculateBuyInBreakdown } from '~/utils/calculations';

const props = withDefaults(defineProps<{
  /** Full filtered set — drives the summary table and the un-split bars. */
  tournaments: Tournament[];
  /** One bar series per group; a single group falls back to profit coloring. */
  groups: TournamentGroup[];
  breakdown?: TournamentBreakdown;
}>(), {
  breakdown: 'none',
});

const { formatAmount, formatDisplayProfit } = useCurrency();
const { barChartOptions, seriesLegend } = useCurrencyChartOptions();
const { tokens } = useThemeTokens();
const { colorAt } = useSeriesPalette();

const totals = computed(() => calculateBuyInBreakdown(props.tournaments));

function bucketLabel(bucket: BuyInLevelStats): string {
  if (bucket.max === null) {
    return `${formatAmount(bucket.min)}+`;
  }
  return `${formatAmount(bucket.min)}–${formatAmount(bucket.max)}`;
}

/*
 * Buckets come from the whole set, not per group, so every series is plotted
 * against the same levels — a group with no entries at a level simply has no
 * bar there rather than shifting the axis.
 */
const bucketLabels = computed(() => totals.value.map(bucketLabel));

// Splitting buy-in bars *by* buy-in level would just draw the same buckets
// one per series, so that dimension keeps the plain profit-colored bars.
const isSplit = computed(() => props.groups.length > 1 && props.breakdown !== 'buyIn');

const chartData = computed(() => {
  if (!isSplit.value) {
    return {
      labels: bucketLabels.value,
      datasets: [{
        label: 'Profit',
        data: totals.value.map(b => b.totalProfit),
        backgroundColor: totals.value.map(b =>
          b.totalProfit >= 0 ? tokens.value.success : tokens.value.danger,
        ),
      }],
    };
  }

  const mins = totals.value.map(b => b.min);

  return {
    labels: bucketLabels.value,
    datasets: props.groups.map((group, index) => {
      const byMin = new Map(
        calculateBuyInBreakdown(group.tournaments).map(b => [b.min, b.totalProfit]),
      );
      return {
        label: group.label,
        data: mins.map(min => byMin.get(min) ?? null),
        backgroundColor: colorAt(index, props.groups.length),
      };
    }),
  };
});

const options = computed<ChartOptions<'bar'>>(() => ({
  ...barChartOptions.value,
  plugins: {
    ...barChartOptions.value.plugins,
    legend: isSplit.value ? seriesLegend.value : { display: false },
    tooltip: {
      ...barChartOptions.value.plugins?.tooltip,
      callbacks: {
        label: context => (isSplit.value
          ? `${context.dataset.label}: ${formatAmount(context.raw as number)}`
          : formatAmount(context.raw as number)),
      },
    },
  },
}));
</script>
