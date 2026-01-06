<template>
  <div class="p-4 lg:p-0 max-w-2xl mx-auto">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink
        to="/sessions"
        class="p-2 hover:bg-surface-tertiary dark:hover:bg-surface-dark-tertiary rounded-md transition-colors"
      >
        <ArrowLeftIcon class="w-5 h-5 text-foreground-muted dark:text-foreground-dark-muted" />
      </NuxtLink>
      <h1 class="text-xl font-semibold text-foreground dark:text-foreground-dark tracking-tight">
        New Cash Session
      </h1>
    </div>

    <form class="space-y-5" @submit.prevent="handleSubmit">
      <div class="card p-5 space-y-4">
        <!-- Date, Start Time & Type -->
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="label">Date</label>
            <input
              v-model="form.date"
              type="date"
              class="input"
            >
          </div>
          <div>
            <label class="label">Start Time</label>
            <input
              v-model="form.startTime"
              type="time"
              class="input font-mono"
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

        <!-- Game & Stakes -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Game</label>
            <select v-model="form.game" class="input">
              <option v-for="game in referenceStore.gameTypes" :key="game" :value="game">
                {{ game }}
              </option>
            </select>
          </div>
          <div>
            <label class="label">Stakes</label>
            <input
              v-model="form.stake"
              type="text"
              placeholder="1/2"
              class="input font-mono"
              :class="{ 'input-error': errors.stake }"
            >
            <p v-if="errors.stake" class="mt-1 text-xs text-danger-600 dark:text-danger-400">
              {{ errors.stake }}
            </p>
          </div>
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

        <!-- Cash In & Cash Out (optional) -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Cash In (optional)</label>
            <input
              v-model.number="form.cashIn"
              type="number"
              step="1"
              min="0"
              placeholder="0"
              class="input font-mono"
              @input="calculateResult"
            >
          </div>
          <div>
            <label class="label">Cash Out (optional)</label>
            <input
              v-model.number="form.cashOut"
              type="number"
              step="1"
              min="0"
              placeholder="0"
              class="input font-mono"
              @input="calculateResult"
            >
          </div>
        </div>

        <!-- Bankroll Initial & Final (optional) -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Bankroll Initial (optional)</label>
            <input
              v-model.number="form.bankrollInitial"
              type="number"
              step="1"
              min="0"
              placeholder="0"
              class="input font-mono"
              @input="calculateResult"
            >
          </div>
          <div>
            <label class="label">Bankroll Final (optional)</label>
            <input
              v-model.number="form.bankrollFinal"
              type="number"
              step="1"
              min="0"
              placeholder="0"
              class="input font-mono"
              @input="calculateResult"
            >
          </div>
        </div>

        <!-- Result & Duration -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Result ($) <span v-if="!isInProgress" class="text-foreground-muted dark:text-foreground-dark-muted font-normal">(optional for in-progress)</span></label>
            <input
              v-model.number="form.result"
              type="number"
              step="1"
              class="input font-mono"
              :class="{ 'bg-surface-secondary dark:bg-surface-dark-tertiary': hasCalculatedResult }"
            >
          </div>
          <div>
            <label class="label">Duration (min) <span v-if="isInProgress" class="text-foreground-muted dark:text-foreground-dark-muted font-normal">(auto from times)</span></label>
            <input
              v-model.number="form.duration"
              type="number"
              min="0"
              class="input font-mono"
              :class="{ 'input-error': errors.duration }"
              :disabled="isInProgress"
            >
            <p v-if="errors.duration" class="mt-1 text-xs text-danger-600 dark:text-danger-400">
              {{ errors.duration }}
            </p>
          </div>
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
        <NuxtLink to="/sessions" class="btn-secondary flex-1">
          Cancel
        </NuxtLink>
        <button v-if="isInProgress" type="submit" class="btn-primary flex-1">
          Start Session
        </button>
        <button v-else type="submit" class="btn-primary flex-1">
          Save Session
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { Currency, GameType, SessionStatus, SessionType } from '~/types';
import { ArrowLeftIcon } from '@heroicons/vue/24/outline';

const sessionsStore = useSessionsStore();
const referenceStore = useReferenceStore();
const router = useRouter();

// Get current time in HH:mm format
const now = new Date();
const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

const form = reactive({
  date: new Date().toISOString().split('T')[0] as string,
  startTime: currentTime,
  type: 'live' as SessionType,
  game: 'NLH' as GameType,
  currency: 'USD' as Currency,
  stake: '',
  cashIn: null as number | null,
  cashOut: null as number | null,
  bankrollInitial: null as number | null,
  bankrollFinal: null as number | null,
  result: 0,
  duration: 0,
  location: '',
  site: '',
  notes: '',
  tags: [] as string[],
});

// Session is in-progress if no result is determined (no cash out and no bankroll final)
const isInProgress = computed(() => {
  const hasCashOut = form.cashOut !== null && form.cashOut > 0;
  const hasBankrollFinal = form.bankrollFinal !== null && form.bankrollFinal > 0;
  const hasManualResult = form.result !== 0 && !hasCashOut && !hasBankrollFinal;
  return !hasCashOut && !hasBankrollFinal && !hasManualResult;
});

const errors = reactive<Record<string, string>>({});

const hasCalculatedResult = computed(() => {
  const hasBankroll = form.bankrollInitial !== null && form.bankrollFinal !== null && form.bankrollInitial > 0;
  const hasCashInOut = form.cashIn !== null && form.cashOut !== null && form.cashIn > 0;
  return hasBankroll || hasCashInOut;
});

function calculateResult() {
  // Bankroll takes priority over cash in/out
  if (form.bankrollInitial !== null && form.bankrollFinal !== null && form.bankrollInitial > 0) {
    form.result = form.bankrollFinal - form.bankrollInitial;
  }
  else if (form.cashIn !== null && form.cashOut !== null && form.cashIn > 0) {
    form.result = form.cashOut - form.cashIn;
  }
}

function validate() {
  errors.stake = '';
  errors.result = '';
  errors.duration = '';

  if (!form.stake || !/^\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?$/.test(form.stake)) {
    errors.stake = 'Enter valid stakes (e.g., 1/2)';
  }

  // Duration only required for completed sessions
  if (!isInProgress.value && form.duration < 1) {
    errors.duration = 'Duration must be at least 1 minute';
  }

  return !errors.stake && !errors.duration;
}

function handleSubmit() {
  if (!validate()) {
    return;
  }

  const status: SessionStatus = isInProgress.value ? 'in_progress' : 'completed';

  sessionsStore.addSession({
    date: form.date,
    startTime: form.startTime || undefined,
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
    buyInTotal: form.cashIn ?? undefined,
    cashOutTotal: form.cashOut ?? undefined,
    bankrollInitial: form.bankrollInitial ?? undefined,
    bankrollFinal: form.bankrollFinal ?? undefined,
    notes: form.notes || undefined,
    tags: form.tags,
    status,
  });

  router.push('/sessions');
}

const venues = computed(() =>
  form.type === 'live' ? referenceStore.liveVenues : referenceStore.onlineSites,
);
</script>
