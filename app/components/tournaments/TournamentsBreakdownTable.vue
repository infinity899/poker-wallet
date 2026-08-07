<template>
  <div class="card p-6">
    <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">
      {{ dimensionLabel }}
    </h3>

    <div v-if="rows.length > 0" class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            <th class="py-2 pr-4 font-medium text-left">
              Group
            </th>
            <th class="py-2 px-4 font-medium text-right">
              Count
            </th>
            <th class="py-2 px-4 font-medium text-right">
              Buy-ins
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
            v-for="row in rows"
            :key="row.key"
            class="border-b border-gray-100 dark:border-gray-800 last:border-0"
          >
            <td class="py-2 pr-4 font-medium text-gray-900 dark:text-gray-100">
              <span class="inline-flex items-center gap-2">
                <!-- Swatch ties each row to its line in the charts above. -->
                <span
                  class="w-2.5 h-2.5 rounded-full shrink-0"
                  :style="{ backgroundColor: row.color }"
                />
                {{ row.label }}
              </span>
            </td>
            <td class="py-2 px-4 text-right text-gray-700 dark:text-gray-300 tabular-nums">
              {{ row.stats.totalTournaments }}
            </td>
            <td class="py-2 px-4 text-right text-gray-700 dark:text-gray-300 tabular-nums">
              {{ formatAmount(row.stats.totalBuyIns) }}
            </td>
            <td
              class="py-2 px-4 text-right font-medium tabular-nums"
              :class="row.stats.totalProfit >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
            >
              {{ formatDisplayProfit(row.stats.totalProfit) }}
            </td>
            <td
              class="py-2 px-4 text-right font-medium tabular-nums"
              :class="row.stats.roi >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
            >
              {{ row.stats.roi.toFixed(1) }}%
            </td>
            <td class="py-2 pl-4 text-right text-gray-700 dark:text-gray-300 tabular-nums">
              {{ row.stats.itmPercentage.toFixed(1) }}%
            </td>
          </tr>
        </tbody>
      </table>

      <p v-if="overlaps" class="mt-3 text-xs text-foreground-muted">
        A tournament with several tags counts once per tag, so rows can overlap.
      </p>
    </div>

    <div v-else class="h-24 flex items-center justify-center text-gray-400">
      No data available
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TournamentGroup } from '~/utils/tournamentGrouping';
import { calculateTournamentStats } from '~/utils/calculations';

const props = withDefaults(defineProps<{
  groups: TournamentGroup[];
  dimensionLabel: string;
  /** Set when a tournament can appear in more than one group (tags). */
  overlaps?: boolean;
}>(), {
  overlaps: false,
});

const { formatAmount, formatDisplayProfit } = useCurrency();
const { colorAt } = useSeriesPalette();

const rows = computed(() =>
  props.groups.map((group, index) => ({
    key: group.key,
    label: group.label,
    color: colorAt(index, props.groups.length),
    stats: calculateTournamentStats(group.tournaments),
  })));
</script>
