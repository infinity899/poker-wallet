<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="emit('close')"
    >
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Log Tournament Session
        </h3>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <!-- Date & Type -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <input
                v-model="form.date"
                type="date"
                class="input"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <select v-model="form.type" class="input">
                <option value="live">
                  Live
                </option>
                <option value="online">
                  Online
                </option>
              </select>
            </div>
          </div>

          <!-- Site/Venue -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ form.type === 'live' ? 'Venue' : 'Site' }}
            </label>
            <select
              v-if="form.type === 'live'"
              v-model="form.venue"
              class="input"
            >
              <option value="">
                Select venue
              </option>
              <option v-for="venue in liveVenues" :key="venue.id" :value="venue.name">
                {{ venue.name }}
              </option>
            </select>
            <select
              v-else
              v-model="form.site"
              class="input"
            >
              <option value="">
                Select site
              </option>
              <option v-for="site in onlineSites" :key="site.id" :value="site.name">
                {{ site.name }}
              </option>
            </select>
          </div>

          <!-- Number of Tournaments -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Number of Tournaments
            </label>
            <input
              v-model.number="form.sessionCount"
              type="number"
              min="1"
              class="input"
              :class="{ 'input-error': errors.sessionCount }"
              placeholder="e.g., 50"
            >
            <p v-if="errors.sessionCount" class="mt-1 text-sm text-danger-600">
              {{ errors.sessionCount }}
            </p>
          </div>

          <!-- Currency & Total Buy-ins -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Currency
              </label>
              <select v-model="form.currency" class="input">
                <option v-for="currency in referenceStore.currencies" :key="currency" :value="currency">
                  {{ currency }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Total Buy-ins
              </label>
              <input
                v-model.number="form.buyIn"
                type="number"
                min="0"
                class="input"
                :class="{ 'input-error': errors.buyIn }"
                placeholder="e.g., 500"
              >
              <p v-if="errors.buyIn" class="mt-1 text-sm text-danger-600">
                {{ errors.buyIn }}
              </p>
            </div>
          </div>

          <!-- Total Fees & Total Winnings -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Total Fees
              </label>
              <input
                v-model.number="form.fee"
                type="number"
                min="0"
                class="input"
                placeholder="e.g., 50"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Total Winnings
              </label>
              <input
                v-model.number="form.winnings"
                type="number"
                min="0"
                class="input"
                placeholder="e.g., 750"
              >
            </div>
          </div>

          <!-- Profit Preview -->
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600 dark:text-gray-400">Session Profit:</span>
              <span
                class="font-semibold"
                :class="profit >= 0 ? 'text-success-600' : 'text-danger-600'"
              >
                {{ profit >= 0 ? '+' : '' }}{{ formatCurrency(profit) }}
              </span>
            </div>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (optional)
            </label>
            <textarea
              v-model="form.notes"
              rows="2"
              class="input"
              placeholder="e.g., Sunday grind session..."
            />
          </div>

          <div class="flex gap-3 pt-2">
            <button type="button" class="btn-secondary flex-1" @click="emit('close')">
              Cancel
            </button>
            <button type="submit" class="btn-primary flex-1">
              Log Session
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Currency, SessionType } from '~/types';
import { formatCurrency } from '~/utils/formatters';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
  save: [data: {
    date: string;
    type: SessionType;
    currency: Currency;
    name: string;
    buyIn: number;
    fee: number;
    entries: number;
    winnings: number;
    venue?: string;
    site?: string;
    notes?: string;
    tags: string[];
    isSession: boolean;
    sessionCount: number;
  }];
}>();

const referenceStore = useReferenceStore();

function getToday(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

const form = reactive({
  date: getToday(),
  type: 'online' as SessionType,
  currency: 'USD' as Currency,
  sessionCount: 1,
  buyIn: 0,
  fee: 0,
  winnings: 0,
  venue: '',
  site: '',
  notes: '',
});

const errors = reactive<Record<string, string>>({});

const liveVenues = computed(() => referenceStore.liveVenues);
const onlineSites = computed(() => referenceStore.onlineSites);

const profit = computed(() => {
  return form.winnings - form.buyIn - form.fee;
});

// Reset form when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    form.date = getToday();
    form.type = 'online';
    form.currency = 'USD';
    form.sessionCount = 1;
    form.buyIn = 0;
    form.fee = 0;
    form.winnings = 0;
    form.venue = '';
    form.site = '';
    form.notes = '';
    errors.sessionCount = '';
    errors.buyIn = '';
  }
}, { immediate: true });

function validate(): boolean {
  errors.sessionCount = '';
  errors.buyIn = '';

  let valid = true;

  if (!form.sessionCount || form.sessionCount < 1) {
    errors.sessionCount = 'Must be at least 1 tournament';
    valid = false;
  }

  if (form.buyIn < 0) {
    errors.buyIn = 'Buy-in must be positive';
    valid = false;
  }

  return valid;
}

function handleSubmit() {
  if (!validate()) {
    return;
  }

  emit('save', {
    date: form.date,
    type: form.type,
    currency: form.currency,
    name: `Session (${form.sessionCount} tournaments)`,
    buyIn: form.buyIn,
    fee: form.fee,
    entries: 0,
    winnings: form.winnings,
    venue: form.type === 'live' ? form.venue || undefined : undefined,
    site: form.type === 'online' ? form.site || undefined : undefined,
    notes: form.notes.trim() || undefined,
    tags: [],
    isSession: true,
    sessionCount: form.sessionCount,
  });
}
</script>
