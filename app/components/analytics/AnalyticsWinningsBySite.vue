<template>
  <div class="card p-6">
    <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">
      Winnings by Online Site
    </h3>
    <div class="h-72">
      <Pie
        v-if="hasData"
        :data="chartData"
        :options="pieChartOptions"
      />
      <div
        v-else
        class="h-full flex items-center justify-center text-gray-400"
      >
        No online winnings to show
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Tournament } from '~/types';
import { Pie } from 'vue-chartjs';
import { calculateWinningsBySite } from '~/utils/calculations';

const props = defineProps<{
  tournaments: Tournament[];
}>();

const { pieChartOptions } = useCurrencyChartOptions();
const { tokens } = useThemeTokens();

const slices = computed(() => calculateWinningsBySite(props.tournaments));
const hasData = computed(() => slices.value.length > 0);

const chartData = computed(() => {
  /*
   * Categorical palette derived from the accent hue and held at one lightness,
   * so no slice outranks another and the set survives CVD simulation. "Other"
   * stays deliberately desaturated — it is a residual, not a category.
   */
  const SITE_COLORS = tokens.value.series;
  const OTHER_COLOR = tokens.value.tick;

  // Match the arc borders to the card surface so slices read as separated.
  const borderColor = tokens.value.surface;

  return {
    labels: slices.value.map(s => s.site),
    datasets: [{
      data: slices.value.map(s => s.winnings),
      backgroundColor: slices.value.map((s, i) =>
        s.site === 'Other' ? OTHER_COLOR : SITE_COLORS[i % SITE_COLORS.length],
      ),
      borderColor,
      borderWidth: 2,
    }],
  };
});
</script>
