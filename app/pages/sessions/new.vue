<template>
  <div class="p-4 lg:p-0 max-w-2xl mx-auto">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink to="/sessions" class="p-2 hover:bg-gray-100 rounded-lg">
        <ArrowLeftIcon class="w-5 h-5 text-gray-600" />
      </NuxtLink>
      <h1 class="text-2xl font-bold text-gray-900">
        New Cash Session
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

        <!-- Game & Stakes -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Game</label>
            <select v-model="form.game" class="input">
              <option v-for="game in referenceStore.gameTypes" :key="game" :value="game">
                {{ game }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Stakes</label>
            <input
              v-model="form.stake"
              type="text"
              placeholder="1/2"
              class="input"
              :class="{ 'input-error': errors.stake }"
            >
            <p v-if="errors.stake" class="mt-1 text-sm text-danger-600">
              {{ errors.stake }}
            </p>
          </div>
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
              v-model="form.location"
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

        <!-- Result & Duration -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Result ($)</label>
            <input
              v-model.number="form.result"
              type="number"
              step="1"
              class="input"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
            <input
              v-model.number="form.duration"
              type="number"
              min="1"
              class="input"
              :class="{ 'input-error': errors.duration }"
            >
            <p v-if="errors.duration" class="mt-1 text-sm text-danger-600">
              {{ errors.duration }}
            </p>
          </div>
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
        <NuxtLink to="/sessions" class="btn-secondary flex-1">
          Cancel
        </NuxtLink>
        <button type="submit" class="btn-primary flex-1">
          Save Session
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { Currency, GameType, SessionType } from '~/types';
import { ArrowLeftIcon } from '@heroicons/vue/24/outline';

const sessionsStore = useSessionsStore();
const referenceStore = useReferenceStore();
const router = useRouter();

const form = reactive({
  date: new Date().toISOString().split('T')[0] as string,
  type: 'live' as SessionType,
  game: 'NLH' as GameType,
  currency: 'USD' as Currency,
  stake: '',
  result: 0,
  duration: 120,
  location: '',
  site: '',
  notes: '',
  tags: [] as string[],
});

const errors = reactive<Record<string, string>>({});

function validate() {
  errors.stake = '';
  errors.result = '';
  errors.duration = '';

  if (!form.stake || !/^\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?$/.test(form.stake)) {
    errors.stake = 'Enter valid stakes (e.g., 1/2)';
  }

  if (form.duration < 1) {
    errors.duration = 'Duration must be at least 1 minute';
  }

  return !errors.stake && !errors.duration;
}

function handleSubmit() {
  if (!validate()) {
    return;
  }

  sessionsStore.addSession({
    date: form.date,
    type: form.type,
    game: form.game,
    currency: form.currency,
    stake: form.stake,
    smallBlind: 0,
    bigBlind: 0,
    result: form.result,
    duration: form.duration,
    location: form.type === 'live' ? form.location : undefined,
    site: form.type === 'online' ? form.site : undefined,
    notes: form.notes || undefined,
    tags: form.tags,
  });

  router.push('/sessions');
}

const venues = computed(() =>
  form.type === 'live' ? referenceStore.liveVenues : referenceStore.onlineSites,
);
</script>
