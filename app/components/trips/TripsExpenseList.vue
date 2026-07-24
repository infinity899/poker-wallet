<template>
  <div class="card divide-y divide-border-subtle dark:divide-border-dark-subtle">
    <div
      v-for="expense in sorted"
      :key="expense.id"
      class="flex items-center gap-3 px-4 py-3"
    >
      <span
        class="w-2.5 h-2.5 rounded-full shrink-0"
        :style="{ backgroundColor: EXPENSE_CATEGORY_COLORS[expense.category] }"
      />

      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium text-foreground dark:text-foreground-dark truncate">
          {{ expense.description || EXPENSE_CATEGORY_LABELS[expense.category] }}
        </p>
        <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted truncate">
          {{ formatDate(expense.date) }} &middot; {{ EXPENSE_CATEGORY_LABELS[expense.category] }}
        </p>
      </div>

      <div class="text-right shrink-0">
        <p class="data-value text-sm font-medium text-danger-600 dark:text-danger-400">
          -{{ formatAmount(expense.amount) }}
        </p>
        <p
          v-if="showsOriginal(expense)"
          class="data-value text-2xs text-foreground-muted dark:text-foreground-dark-muted"
        >
          {{ formatCurrency(expense.originalAmount, expense.originalCurrency) }}
        </p>
      </div>

      <div class="flex gap-1 shrink-0">
        <button
          class="p-1 rounded hover:bg-surface-tertiary dark:hover:bg-surface-dark-tertiary transition-colors"
          title="Edit expense"
          @click="emit('edit', expense)"
        >
          <PencilIcon class="w-4 h-4 text-foreground-muted dark:text-foreground-dark-muted" />
        </button>
        <button
          class="p-1 rounded hover:bg-danger-50 dark:hover:bg-danger-900/30 transition-colors"
          title="Delete expense"
          @click="emit('delete', expense.id)"
        >
          <TrashIcon class="w-4 h-4 text-danger-500 dark:text-danger-400" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Expense } from '~/types';
import { PencilIcon, TrashIcon } from '@heroicons/vue/24/outline';
import { EXPENSE_CATEGORY_COLORS } from '~/composables/useExpenseCategoryStyle';
import { EXPENSE_CATEGORY_LABELS } from '~/types';
// formatCurrency is used raw HERE ONLY: it renders the original amount in its own
// currency with no conversion. Every other figure goes through useCurrency().
import { formatCurrency, formatDate } from '~/utils/formatters';

const props = defineProps<{
  expenses: Expense[];
}>();

const emit = defineEmits<{
  edit: [expense: Expense];
  delete: [id: string];
}>();

const { formatAmount, displayCurrency } = useCurrency();

const sorted = computed(() =>
  [...props.expenses].sort((a, b) =>
    b.date.localeCompare(a.date) || a.category.localeCompare(b.category)));

function showsOriginal(expense: Expense): boolean {
  return expense.originalCurrency !== displayCurrency.value;
}
</script>
