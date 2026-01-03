<template>
  <div class="p-4 lg:p-0 max-w-2xl mx-auto">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink to="/tournaments" class="p-2 hover:bg-gray-100 rounded-lg">
        <ArrowLeftIcon class="w-5 h-5 text-gray-600" />
      </NuxtLink>
      <h1 class="text-2xl font-bold text-gray-900">
        Edit Tournament
      </h1>
    </div>

    <form class="space-y-6" @submit.prevent="handleSubmit">
      <div class="card p-6 space-y-4">
        <!-- Date & Type -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              v-model="form.date"
              type="date"
              class="input"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
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
          <label class="block text-sm font-medium text-gray-700 mb-1">Tournament Name</label>
          <input
            v-model="form.name"
            type="text"
            placeholder="e.g., Sunday Million"
            class="input"
            :class="{ 'input-error': errors.name }"
          >
          <p v-if="errors.name" class="mt-1 text-sm text-danger-600">
            {{ errors.name }}
          </p>
        </div>

        <!-- Currency & Venue/Site -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select v-model="form.currency" class="input">
              <option v-for="currency in referenceStore.currencies" :key="currency" :value="currency">
                {{ currency }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
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
            <label class="block text-sm font-medium text-gray-700 mb-1">Buy-in ($)</label>
            <input
              v-model.number="form.buyIn"
              type="number"
              min="0"
              class="input"
              :class="{ 'input-error': errors.buyIn }"
            >
            <p v-if="errors.buyIn" class="mt-1 text-sm text-danger-600">
              {{ errors.buyIn }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fee ($)</label>
            <input
              v-model.number="form.fee"
              type="number"
              min="0"
              class="input"
            >
          </div>
        </div>

        <!-- Entries & Winnings -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Re-entries</label>
            <input
              v-model.number="form.entries"
              type="number"
              min="0"
              class="input"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Winnings ($)</label>
            <input
              v-model.number="form.winnings"
              type="number"
              min="0"
              class="input"
            >
          </div>
        </div>

        <!-- Field Size & Finish -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Field Size</label>
            <input
              v-model.number="form.fieldSize"
              type="number"
              min="1"
              class="input"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Finish Position</label>
            <input
              v-model.number="form.finishPosition"
              type="number"
              min="1"
              class="input"
            >
          </div>
        </div>

        <!-- Cashed -->
        <div class="flex items-center gap-2">
          <input
            id="cashed"
            v-model="form.cashed"
            type="checkbox"
            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          >
          <label for="cashed" class="text-sm font-medium text-gray-700">
            Cashed (In The Money)
          </label>
        </div>

        <!-- Notes -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            v-model="form.notes"
            rows="3"
            class="input"
            placeholder="Optional notes..."
          />
        </div>

        <!-- Tags -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Tags</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="tag in referenceStore.tags"
              :key="tag.id"
              type="button"
              class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
              :class="form.tags.includes(tag.name)
                ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
              @click="form.tags.includes(tag.name) ? form.tags = form.tags.filter(t => t !== tag.name) : form.tags.push(tag.name)"
            >
              {{ tag.name }}
            </button>
          </div>
        </div>
      </div>

      <!-- Submit -->
      <div class="flex gap-4">
        <NuxtLink to="/tournaments" class="btn-secondary flex-1">
          Cancel
        </NuxtLink>
        <button type="submit" class="btn-primary flex-1">
          Save Changes
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
const route = useRoute();

const tournamentId = computed(() => route.params.id as string);
const tournament = computed(() => tournamentsStore.getTournamentById(tournamentId.value));

// Redirect if tournament not found
if (!tournament.value) {
  router.push('/tournaments');
}

const form = reactive({
  date: tournament.value?.date || '',
  type: tournament.value?.type || 'online' as SessionType,
  currency: tournament.value?.currency || 'USD' as Currency,
  name: tournament.value?.name || '',
  buyIn: tournament.value?.buyIn || 0,
  fee: tournament.value?.fee || 0,
  entries: tournament.value?.entries || 0,
  winnings: tournament.value?.winnings || 0,
  venue: tournament.value?.venue || '',
  site: tournament.value?.site || '',
  fieldSize: tournament.value?.fieldSize as number | undefined,
  finishPosition: tournament.value?.finishPosition as number | undefined,
  cashed: tournament.value?.cashed || false,
  notes: tournament.value?.notes || '',
  tags: tournament.value?.tags || [] as string[],
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

  tournamentsStore.updateTournament(tournamentId.value, {
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
</script>
