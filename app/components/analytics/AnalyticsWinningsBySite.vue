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
const themeStore = useThemeStore();

// Fixed categorical palette (600-level, validated for CVD in light & dark).
// Colors follow slice order; "Other" always takes the neutral slate.
const SITE_COLORS = [
  '#2563eb', // blue
  '#059669', // emerald
  '#d97706', // amber
  '#7c3aed', // violet
  '#db2777', // pink
  '#0891b2', // cyan
  '#ea580c', // orange
];
const OTHER_COLOR = '#64748b';

const slices = computed(() => calculateWinningsBySite(props.tournaments));
const hasData = computed(() => slices.value.length > 0);

const chartData = computed(() => {
  // Match the arc borders to the card surface so slices read as separated (relief for CVD).
  const borderColor = themeStore.isDark ? '#1e293b' : '#ffffff';

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
