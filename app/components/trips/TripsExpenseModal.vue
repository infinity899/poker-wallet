<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="overlay flex items-center justify-center z-50 p-4"
        @click.self="emit('close')"
      >
        <div class="modal p-5 max-h-[90vh] overflow-y-auto">
          <h3 class="text-base font-semibold text-foreground dark:text-foreground-dark mb-4">
            {{ expense ? 'Edit Expense' : 'Add Expense' }}
          </h3>

          <form class="space-y-4" @submit.prevent="handleSubmit">
            <!-- Category -->
            <div>
              <label class="label">Category</label>
              <select v-model="form.category" class="input">
                <option v-for="category in EXPENSE_CATEGORY_ORDER" :key="category" :value="category">
                  {{ EXPENSE_CATEGORY_LABELS[category] }}
                </option>
              </select>
            </div>

            <!-- Amount + currency -->
            <div class="grid grid-cols-[1fr_auto] gap-3 items-end">
              <div>
                <label class="label">Amount ({{ getCurrencySymbol(form.currency) }})</label>
                <input
                  v-model.number="form.amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  class="input font-mono text-sm"
                  :class="{ 'input-error': errors.amount }"
                >
              </div>
              <div class="w-28">
                <label class="label">Currency</label>
                <select v-model="form.currency" class="input">
                  <option v-for="currency in referenceStore.currencies" :key="currency" :value="currency">
                    {{ currency }}
                  </option>
                </select>
              </div>
            </div>
            <p v-if="errors.amount" class="-mt-2 text-xs text-danger-600 dark:text-danger-400">
              {{ errors.amount }}
            </p>

            <!-- Date -->
            <div>
              <label class="label">Date</label>
              <input
                v-model="form.date"
                type="date"
                class="input"
                :class="{ 'input-error': errors.date }"
              >
              <p v-if="errors.date" class="mt-1 text-xs text-danger-600 dark:text-danger-400">
                {{ errors.date }}
              </p>
              <p
                v-else-if="isDateOutsideTrip"
                class="mt-1 text-xs text-warning-700 dark:text-warning-400"
              >
                Outside the trip ({{ formatDateRange(tripStartDate, tripEndDate) }}). It still counts
                toward this trip's total.
              </p>
            </div>

            <!-- Description -->
            <div>
              <label class="label">
                Description
                <span class="text-foreground-muted dark:text-foreground-dark-muted font-normal">(optional)</span>
              </label>
              <input
                v-model="form.description"
                type="text"
                placeholder="e.g., BCN return flight"
                class="input"
              >
            </div>

            <!-- Notes -->
            <div>
              <label class="label">
                Notes
                <span class="text-foreground-muted dark:text-foreground-dark-muted font-normal">(optional)</span>
              </label>
              <textarea
                v-model="form.notes"
                rows="2"
                class="input"
                placeholder="Optional notes..."
              />
            </div>

            <div class="flex gap-3 pt-1">
              <button type="button" class="btn-secondary flex-1" @click="emit('close')">
                Cancel
              </button>
              <button type="submit" class="btn-primary flex-1">
                {{ expense ? 'Save Changes' : 'Add Expense' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { Currency, Expense, ExpenseCategory, NewExpense } from '~/types';
import { EXPENSE_CATEGORY_ORDER } from '~/composables/useExpenseCategoryStyle';
import { EXPENSE_CATEGORY_LABELS } from '~/types';
import { formatDateRange, getCurrencySymbol } from '~/utils/formatters';

const props = withDefaults(defineProps<{
  isOpen: boolean;
  tripId: string;
  tripStartDate: string;
  tripEndDate: string;
  tripCurrency?: Currency;
  expense?: Expense | null;
}>(), { expense: null, tripCurrency: undefined });

const emit = defineEmits<{
  close: [];
  save: [payload: NewExpense];
}>();

const referenceStore = useReferenceStore();
const currencyStore = useCurrencyStore();
const { displayCurrency } = useCurrency();

const form = reactive({
  category: 'food' as ExpenseCategory,
  amount: 0,
  currency: 'USD' as Currency,
  date: '',
  description: '',
  notes: '',
});

const errors = reactive<Record<string, string>>({});

// ISO date strings compare lexicographically - safe clamp, no Date objects.
function defaultDate(): string {
  const today = new Date().toISOString().split('T')[0] ?? '';
  if (today < props.tripStartDate) {
    return props.tripStartDate;
  }
  if (today > props.tripEndDate) {
    return props.tripEndDate;
  }
  return today;
}

const isDateOutsideTrip = computed(() =>
  !!form.date && (form.date < props.tripStartDate || form.date > props.tripEndDate));

// Reset on open AND when the target expense changes (edit -> edit another).
watch(() => [props.isOpen, props.expense?.id] as const, ([open]) => {
  if (!open) {
    return;
  }
  const e = props.expense;
  form.category = e?.category ?? 'food';
  // PREFILL FROM ORIGINAL VALUES, never the stored USD ones.
  form.currency = e?.originalCurrency ?? props.tripCurrency ?? displayCurrency.value;
  form.amount = e?.originalAmount ?? 0;
  form.date = e?.date ?? defaultDate();
  form.description = e?.description ?? '';
  form.notes = e?.notes ?? '';
  errors.amount = '';
  errors.date = '';
}, { immediate: true });

function validate(): boolean {
  errors.amount = '';
  errors.date = '';

  if (!form.amount || form.amount <= 0) {
    errors.amount = 'Enter an amount greater than 0';
  }
  if (!form.date) {
    errors.date = 'Date is required';
  }

  return !errors.amount && !errors.date;
}

function handleSubmit() {
  if (!validate()) {
    return;
  }

  // On edit with an UNCHANGED currency, preserve the ORIGINAL rate. Re-fetching
  // today's rate would silently re-value an old expense and move a past trip's P&L.
  const exchangeRate = props.expense && props.expense.originalCurrency === form.currency
    ? props.expense.exchangeRate
    : currencyStore.getCurrentRate(form.currency);

  emit('save', {
    tripId: props.tripId,
    date: form.date,
    category: form.category,
    description: form.description.trim() || undefined,
    amount: form.amount * exchangeRate,
    originalCurrency: form.currency,
    originalAmount: form.amount,
    exchangeRate,
    notes: form.notes.trim() || undefined,
    tags: props.expense?.tags ?? [],
  });
}
</script>
