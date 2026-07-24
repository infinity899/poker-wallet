<template>
  <div class="card-elevated overflow-hidden">
    <!-- Tournaments / Buy-ins / Cashes -->
    <div class="grid grid-cols-3 divide-x divide-border dark:divide-border-dark border-b border-border dark:border-border-dark">
      <div class="px-3 py-3 sm:px-4">
        <p class="stat-label">
          Tournaments
        </p>
        <p class="data-value text-lg sm:text-xl font-semibold text-foreground dark:text-foreground-dark">
          {{ pnl.tournamentCount }}
        </p>
      </div>
      <div class="px-3 py-3 sm:px-4">
        <p class="stat-label">
          Buy-ins
        </p>
        <p class="data-value text-lg sm:text-xl font-semibold text-danger-600 dark:text-danger-400">
          -{{ formatAmount(pnl.buyIns) }}
        </p>
      </div>
      <div class="px-3 py-3 sm:px-4">
        <p class="stat-label">
          Cashes
        </p>
        <p class="data-value text-lg sm:text-xl font-semibold text-success-600 dark:text-success-400">
          +{{ formatAmount(pnl.cashes) }}
        </p>
      </div>
    </div>

    <!-- Gross profit -->
    <div class="flex items-baseline justify-between gap-4 px-4 py-3">
      <span class="text-sm font-medium text-foreground-secondary dark:text-foreground-dark-secondary">
        Gross profit
      </span>
      <span
        class="data-value text-base font-semibold"
        :class="pnl.grossProfit >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
      >
        {{ formatDisplayProfit(pnl.grossProfit) }}
      </span>
    </div>

    <!-- Expenses breakdown -->
    <div class="px-4 py-3 border-t border-border dark:border-border-dark">
      <p class="stat-label mb-2">
        Expenses
      </p>

      <div v-if="expenseLines.length > 0" class="space-y-1.5">
        <div
          v-for="line in expenseLines"
          :key="line.category"
          class="flex items-center justify-between gap-3"
        >
          <span class="flex items-center gap-2 min-w-0 text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
            <span class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: line.color }" />
            <span class="truncate">{{ line.label }}</span>
          </span>
          <span class="data-value text-sm shrink-0 text-danger-600 dark:text-danger-400">
            -{{ formatAmount(line.amount) }}
          </span>
        </div>
      </div>
      <p v-else class="text-sm text-foreground-muted dark:text-foreground-dark-muted">
        No expenses logged yet.
      </p>

      <div class="mt-3 pt-3 border-t border-border-subtle dark:border-border-dark-subtle flex items-baseline justify-between gap-4">
        <span class="text-sm font-medium text-foreground-secondary dark:text-foreground-dark-secondary">
          Total expenses
        </span>
        <span class="data-value text-base font-semibold text-danger-600 dark:text-danger-400">
          -{{ formatAmount(pnl.totalExpenses) }}
        </span>
      </div>
    </div>

    <!-- Net profit -->
    <div
      class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-4 border-t-2 border-border-strong dark:border-border-dark-strong"
      :class="pnl.netProfit >= 0 ? 'profit-bg' : 'loss-bg'"
    >
      <span class="text-xs font-semibold uppercase tracking-wider">Net profit</span>
      <div class="flex items-baseline gap-3">
        <span class="data-value text-2xl sm:text-3xl font-semibold">
          {{ formatDisplayProfit(pnl.netProfit) }}
        </span>
        <span class="text-sm font-medium opacity-80">ROI {{ roiLabel }}</span>
      </div>
    </div>

    <!-- Mixed-currency footnote -->
    <p
      v-if="hasMixedCurrencies"
      class="flex items-start gap-1.5 px-4 py-2.5 text-xs text-foreground-muted dark:text-foreground-dark-muted border-t border-border-subtle dark:border-border-dark-subtle"
    >
      <InformationCircleIcon class="w-3.5 h-3.5 shrink-0 mt-px" />
      <span>Converted to {{ displayCurrency }} using the exchange rate recorded with each entry.</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import type { TripPnL } from '~/types';
import { InformationCircleIcon } from '@heroicons/vue/24/outline';
import { EXPENSE_CATEGORY_COLORS } from '~/composables/useExpenseCategoryStyle';
import { formatPercentage } from '~/utils/formatters';

const props = defineProps<{
  pnl: TripPnL;
  hasMixedCurrencies: boolean;
}>();

const { formatAmount, formatDisplayProfit, displayCurrency } = useCurrency();

// Render the pre-sorted breakdown from TripPnL so the card and the pie chart
// consume one identical source and can never disagree.
const expenseLines = computed(() =>
  props.pnl.expensesByCategory.map(c => ({
    ...c,
    color: EXPENSE_CATEGORY_COLORS[c.category],
  })));

// ROI is meaningless with no invested capital - show an em dash, not "0.0%".
const roiLabel = computed(() =>
  props.pnl.buyIns + props.pnl.totalExpenses === 0 ? '—' : formatPercentage(props.pnl.netRoi));
</script>
