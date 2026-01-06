<template>
  <div class="p-4 lg:p-0 max-w-2xl mx-auto">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink
        to="/tournaments"
        class="p-2 hover:bg-surface-tertiary dark:hover:bg-surface-dark-tertiary rounded-md transition-colors"
      >
        <ArrowLeftIcon class="w-5 h-5 text-foreground-muted dark:text-foreground-dark-muted" />
      </NuxtLink>
      <h1 class="text-xl font-semibold text-foreground dark:text-foreground-dark tracking-tight">
        New Tournament
      </h1>
    </div>

    <form class="space-y-5" @submit.prevent="handleSubmit">
      <div class="card p-5 space-y-4">
        <!-- Date & Type -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Date</label>
            <input
              v-model="form.date"
              type="date"
              class="input"
            >
          </div>
          <div>
            <label class="label">Type</label>
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

        <!-- Name -->
        <div>
          <label class="label">Tournament Name</label>
          <input
            v-model="form.name"
            type="text"
            placeholder="e.g., Sunday Million"
            class="input"
            :class="{ 'input-error': errors.name }"
          >
          <p v-if="errors.name" class="mt-1 text-xs text-danger-600 dark:text-danger-400">
            {{ errors.name }}
          </p>
        </div>

        <!-- Currency & Venue/Site -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Currency</label>
            <select v-model="form.currency" class="input">
              <option v-for="currency in referenceStore.currencies" :key="currency" :value="currency">
                {{ currency }}
              </option>
            </select>
          </div>
          <div>
            <label class="label">
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
              <option v-for="venue in venues" :key="venue.id" :value="venue.name">
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
              <option v-for="site in venues" :key="site.id" :value="site.name">
                {{ site.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Buy-in & Fee -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Buy-in ($)</label>
            <input
              v-model.number="form.buyIn"
              type="number"
              min="0"
              class="input font-mono"
              :class="{ 'input-error': errors.buyIn }"
            >
            <p v-if="errors.buyIn" class="mt-1 text-xs text-danger-600 dark:text-danger-400">
              {{ errors.buyIn }}
            </p>
          </div>
          <div>
            <label class="label">Fee ($)</label>
            <input
              v-model.number="form.fee"
              type="number"
              min="0"
              class="input font-mono"
            >
          </div>
        </div>

        <!-- Entries & Winnings -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Re-entries</label>
            <input
              v-model.number="form.entries"
              type="number"
              min="0"
              class="input font-mono"
            >
            <p class="mt-1 text-xs text-foreground-muted dark:text-foreground-dark-muted">
              0 = single entry
            </p>
          </div>
          <div>
            <label class="label">Winnings ($)</label>
            <input
              v-model.number="form.winnings"
              type="number"
              min="0"
              class="input font-mono"
            >
          </div>
        </div>

        <!-- Field Size & Finish -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Field Size</label>
            <input
              v-model.number="form.fieldSize"
              type="number"
              min="1"
              class="input font-mono"
            >
          </div>
          <div>
            <label class="label">Finish Position</label>
            <input
              v-model.number="form.finishPosition"
              type="number"
              min="1"
              class="input font-mono"
            >
          </div>
        </div>

        <!-- Cashed -->
        <div class="flex items-center gap-2">
          <input
            id="cashed"
            v-model="form.cashed"
            type="checkbox"
            class="rounded border-border dark:border-border-dark text-accent-600 focus:ring-accent-500"
          >
          <label for="cashed" class="text-sm font-medium text-foreground-secondary dark:text-foreground-dark-secondary">
            Cashed (In The Money)
          </label>
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

        <!-- Tags -->
        <div>
          <label class="label">Tags</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="tag in referenceStore.tags"
              :key="tag.id"
              type="button"
              class="filter-chip"
              :class="{ 'filter-chip-active': form.tags.includes(tag.name) }"
              @click="form.tags.includes(tag.name) ? form.tags = form.tags.filter(t => t !== tag.name) : form.tags.push(tag.name)"
            >
              {{ tag.name }}
            </button>
          </div>
        </div>
      </div>

      <!-- Submit -->
      <div class="flex gap-3">
        <NuxtLink to="/tournaments" class="btn-secondary flex-1">
          Cancel
        </NuxtLink>
        <button type="submit" class="btn-primary flex-1">
          Save Tournament
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { Currency, SessionType } from '~/types';
import { ArrowLeftIcon } from '@heroicons/vue/24/outline';

const tournamentsStore = useTournamentsStore();
const referenceStore = useReferenceStore();
const router = useRouter();

const form = reactive({
  date: new Date().toISOString().split('T')[0] as string,
  type: 'online' as SessionType,
  currency: 'USD' as Currency,
  name: '',
  buyIn: 0,
  fee: 0,
  entries: 0,
  winnings: 0,
  venue: '',
  site: '',
  fieldSize: undefined as number | undefined,
  finishPosition: undefined as number | undefined,
  cashed: false,
  notes: '',
  tags: [] as string[],
});

const errors = reactive<Record<string, string>>({});

function validate() {
  errors.name = '';
  errors.buyIn = '';

  if (!form.name.trim()) {
    errors.name = 'Tournament name is required';
  }

  if (form.buyIn < 0) {
    errors.buyIn = 'Buy-in must be positive';
  }

  return !errors.name && !errors.buyIn;
}

function handleSubmit() {
  if (!validate()) {
    return;
  }

  tournamentsStore.addTournament({
    date: form.date,
    type: form.type,
    currency: form.currency,
    name: form.name,
    buyIn: form.buyIn,
    fee: form.fee,
    entries: form.entries,
    winnings: form.winnings,
    venue: form.type === 'live' ? form.venue : undefined,
    site: form.type === 'online' ? form.site : undefined,
    fieldSize: form.fieldSize,
    finishPosition: form.finishPosition,
    cashed: form.cashed,
    notes: form.notes || undefined,
    tags: form.tags,
  });

  router.push('/tournaments');
}

const venues = computed(() =>
  form.type === 'live' ? referenceStore.liveVenues : referenceStore.onlineSites,
);

// Auto-set cashed based on winnings
watch(() => form.winnings, (val) => {
  if (val > 0) {
    form.cashed = true;
  }
});
</script>
