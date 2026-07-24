<template>
  <form class="space-y-5" @submit.prevent="handleSubmit">
    <div class="card p-5 space-y-4">
      <!-- Name -->
      <div>
        <label class="label">Trip Name</label>
        <input
          v-model="form.name"
          type="text"
          placeholder="e.g., EPT Barcelona 2026"
          class="input"
          :class="{ 'input-error': errors.name }"
        >
        <p v-if="errors.name" class="mt-1 text-xs text-danger-600 dark:text-danger-400">
          {{ errors.name }}
        </p>
      </div>

      <!-- Venue & location -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="label">
            Venue
            <span class="text-foreground-muted dark:text-foreground-dark-muted font-normal">(optional)</span>
          </label>
          <input
            v-model="form.venue"
            type="text"
            list="trip-venue-options"
            placeholder="e.g., Casino Barcelona"
            class="input"
          >
          <datalist id="trip-venue-options">
            <option v-for="venue in referenceStore.liveVenues" :key="venue.id" :value="venue.name" />
          </datalist>
          <p class="mt-1 text-xs text-foreground-muted dark:text-foreground-dark-muted">
            Matching this to your tournaments' venue lets us suggest which ones to link.
          </p>
        </div>
        <div>
          <label class="label">
            Location
            <span class="text-foreground-muted dark:text-foreground-dark-muted font-normal">(optional)</span>
          </label>
          <input
            v-model="form.location"
            type="text"
            placeholder="e.g., Barcelona, Spain"
            class="input"
          >
        </div>
      </div>

      <!-- Dates -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="label">Start Date</label>
          <input
            v-model="form.date"
            type="date"
            class="input"
            :class="{ 'input-error': errors.date }"
          >
          <p v-if="errors.date" class="mt-1 text-xs text-danger-600 dark:text-danger-400">
            {{ errors.date }}
          </p>
        </div>
        <div>
          <label class="label">End Date</label>
          <input
            v-model="form.endDate"
            type="date"
            class="input"
            :class="{ 'input-error': errors.endDate }"
          >
          <p v-if="errors.endDate" class="mt-1 text-xs text-danger-600 dark:text-danger-400">
            {{ errors.endDate }}
          </p>
        </div>
      </div>

      <!-- Currency -->
      <div>
        <label class="label">
          Trip Currency
          <span class="text-foreground-muted dark:text-foreground-dark-muted font-normal">(pre-fills new expenses)</span>
        </label>
        <select v-model="form.currency" class="input max-w-32">
          <option v-for="currency in referenceStore.currencies" :key="currency" :value="currency">
            {{ currency }}
          </option>
        </select>
      </div>

      <!-- Overlap warning -->
      <div
        v-if="overlappingTrips.length > 0"
        class="flex items-start gap-2 p-3 rounded-lg bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-700/50"
      >
        <ExclamationTriangleIcon class="w-4 h-4 shrink-0 mt-0.5 text-warning-600 dark:text-warning-400" />
        <p class="text-xs text-warning-700 dark:text-warning-400">
          These dates overlap {{ overlappingTrips.map(t => t.name).join(', ') }}. That's fine &mdash;
          just be careful not to link the same tournament to both trips.
        </p>
      </div>

      <!-- Notes -->
      <div>
        <label class="label">Notes</label>
        <textarea
          v-model="form.notes"
          rows="3"
          class="input"
          placeholder="Optional notes..."
        />
      </div>
    </div>

    <div class="flex gap-3">
      <button type="button" class="btn-secondary flex-1" @click="emit('cancel')">
        Cancel
      </button>
      <button type="submit" class="btn-primary flex-1">
        {{ submitLabel }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { Currency, Trip } from '~/types';
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline';

export interface TripFormPayload {
  name: string;
  venue?: string;
  location?: string;
  date: string;
  endDate: string;
  currency: Currency;
  notes?: string;
}

const props = withDefaults(defineProps<{
  trip?: Trip | null;
  submitLabel: string;
}>(), { trip: null });

const emit = defineEmits<{
  submit: [payload: TripFormPayload];
  cancel: [];
}>();

const referenceStore = useReferenceStore();
const tripsStore = useTripsStore();
const { displayCurrency } = useCurrency();

function getToday(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

const form = reactive({
  name: props.trip?.name ?? '',
  venue: props.trip?.venue ?? '',
  location: props.trip?.location ?? '',
  date: props.trip?.date ?? getToday(),
  endDate: props.trip?.endDate ?? getToday(),
  currency: (props.trip?.currency ?? displayCurrency.value) as Currency,
  notes: props.trip?.notes ?? '',
});

const errors = reactive<Record<string, string>>({});

// ISO YYYY-MM-DD strings compare correctly with < / > - no Date construction needed.
const overlappingTrips = computed(() => {
  if (!form.date || !form.endDate) {
    return [];
  }
  return tripsStore.trips.filter(t =>
    t.id !== props.trip?.id && t.date <= form.endDate && t.endDate >= form.date);
});

function validate(): boolean {
  errors.name = '';
  errors.date = '';
  errors.endDate = '';

  if (!form.name.trim()) {
    errors.name = 'Trip name is required';
  }
  if (!form.date) {
    errors.date = 'Start date is required';
  }
  if (!form.endDate) {
    errors.endDate = 'End date is required';
  }
  if (form.date && form.endDate && form.endDate < form.date) {
    errors.endDate = 'End date must be on or after the start date';
  }

  return !errors.name && !errors.date && !errors.endDate;
}

function handleSubmit() {
  if (!validate()) {
    return;
  }

  emit('submit', {
    name: form.name.trim(),
    venue: form.venue.trim() || undefined,
    location: form.location.trim() || undefined,
    date: form.date,
    endDate: form.endDate,
    currency: form.currency,
    notes: form.notes.trim() || undefined,
  });
}
</script>
