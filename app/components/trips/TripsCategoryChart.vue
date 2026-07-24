<template>
  <div class="card p-4 lg:p-6">
    <h3 class="text-sm font-semibold text-foreground dark:text-foreground-dark mb-4">
      Expenses by category
    </h3>
    <div class="h-56 sm:h-64">
      <Pie
        v-if="expensesByCategory.length > 0"
        :data="chartData"
        :options="pieChartOptions"
      />
      <div
        v-else
        class="h-full flex items-center justify-center text-sm text-foreground-muted dark:text-foreground-dark-muted"
      >
        No expenses to show
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ExpenseCategoryTotal } from '~/types';
import { ArcElement, Chart as ChartJS, Legend, PieController, Tooltip } from 'chart.js';
import { Pie } from 'vue-chartjs';
import { EXPENSE_CATEGORY_COLORS } from '~/composables/useExpenseCategoryStyle';

const props = defineProps<{
  expensesByCategory: ExpenseCategoryTotal[];
}>();

// Chart.js modules are registered per-component in this codebase.
ChartJS.register(ArcElement, PieController, Tooltip, Legend);

const { pieChartOptions } = useCurrencyChartOptions();
const themeStore = useThemeStore();

const chartData = computed(() => ({
  labels: props.expensesByCategory.map(c => c.label),
  datasets: [{
    data: props.expensesByCategory.map(c => c.amount),
    backgroundColor: props.expensesByCategory.map(c => EXPENSE_CATEGORY_COLORS[c.category]),
    // Match arc borders to the card surface so slices read as separated (relief for CVD).
    borderColor: themeStore.isDark ? '#1e293b' : '#ffffff',
    borderWidth: 2,
  }],
}));
</script>
