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
        Edit Session
      </h1>
    </div>

    <form class="space-y-5" @submit.prevent="handleSubmit">
      <div class="card p-5 space-y-4">
        <!-- In Progress Banner -->
        <div v-if="isCurrentlyInProgress" class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg p-3">
          <p class="text-sm text-amber-800 dark:text-amber-200">
            This session is in progress. Add cash out and end time to complete it.
          </p>
        </div>

        <!-- Date, Times & Type -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
            <UiTimeInput
              v-model="form.startTime"
              placeholder="Start time"
              @change="calculateDuration"
            />
          </div>
          <div>
            <label class="label">End Time</label>
            <UiTimeInput
              v-model="form.endTime"
              placeholder="End time"
              @change="calculateDuration"
            />
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

        <!-- Result & Duration -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Result ($)</label>
            <input
              v-model.number="form.result"
              type="number"
              step="1"
              class="input font-mono"
              :class="{ 'bg-surface-secondary dark:bg-surface-dark-tertiary': hasCalculatedResult }"
            >
          </div>
          <div>
            <label class="label">Duration (min) <span v-if="hasCalculatedDuration" class="text-foreground-muted dark:text-foreground-dark-muted font-normal">(auto)</span></label>
            <input
              v-model.number="form.duration"
              type="number"
              min="0"
              class="input font-mono"
              :class="{ 'input-error': errors.duration, 'bg-surface-secondary dark:bg-surface-dark-tertiary': hasCalculatedDuration }"
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
        <button v-if="isCurrentlyInProgress && willBeCompleted" type="submit" class="btn-primary flex-1">
          Complete Session
        </button>
        <button v-else type="submit" class="btn-primary flex-1">
          Save Changes
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { Currency, GameType, SessionStatus, SessionType } from '~/types';
import { ArrowLeftIcon } from '@heroicons/vue/24/outline';
import { calculateDurationFromTimes } from '~/utils/calculations';

const sessionsStore = useSessionsStore();
const referenceStore = useReferenceStore();
const router = useRouter();
const route = useRoute();

const sessionId = computed(() => route.params.id as string);
const session = computed(() => sessionsStore.getSessionById(sessionId.value));

// Redirect if session not found
if (!session.value) {
  router.push('/sessions');
}

const form = reactive({
  date: session.value?.date || '',
  startTime: session.value?.startTime || '',
  endTime: session.value?.endTime || '',
  type: session.value?.type || 'live' as SessionType,
  game: session.value?.game || 'NLH' as GameType,
  currency: session.value?.currency || 'USD' as Currency,
  stake: session.value?.stake || '',
  cashIn: session.value?.buyInTotal ?? null as number | null,
  cashOut: session.value?.cashOutTotal ?? null as number | null,
  result: session.value?.result || 0,
  duration: session.value?.duration || 0,
  location: session.value?.location || '',
  site: session.value?.site || '',
  notes: session.value?.notes || '',
  tags: session.value?.tags || [] as string[],
});

const errors = reactive<Record<string, string>>({});

// Check if the session is currently in progress (based on stored status)
const isCurrentlyInProgress = computed(() => {
  return session.value?.status === 'in_progress';
});

// Check if the form will result in a completed session
const willBeCompleted = computed(() => {
  const hasCashOut = form.cashOut !== null && form.cashOut > 0;
  const hasManualResult = form.result !== 0 && !hasCashOut;
  return hasCashOut || hasManualResult;
});

// Check if duration was auto-calculated from times
const hasCalculatedDuration = computed(() => {
  return form.startTime && form.endTime;
});

const hasCalculatedResult = computed(() => {
  return form.cashIn !== null && form.cashOut !== null && form.cashIn > 0;
});

function calculateResult() {
  if (form.cashIn !== null && form.cashOut !== null && form.cashIn > 0) {
    form.result = form.cashOut - form.cashIn;
  }
}

function calculateDuration() {
  if (form.startTime && form.endTime) {
    const duration = calculateDurationFromTimes(form.startTime, form.endTime, form.date);
    if (duration > 0) {
      form.duration = duration;
    }
  }
}

function validate() {
  errors.stake = '';
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

  // Determine the new status
  let newStatus: SessionStatus = session.value?.status || 'completed';
  if (isCurrentlyInProgress.value && willBeCompleted.value) {
    newStatus = 'completed';
  }

  sessionsStore.updateSession(sessionId.value, {
    date: form.date,
    startTime: form.startTime || undefined,
    endTime: form.endTime || undefined,
    type: form.type,
    game: form.game,
    currency: form.currency,
    stake: form.stake,
    result: form.result,
    duration: form.duration,
    location: form.type === 'live' ? form.location : undefined,
    site: form.type === 'online' ? form.site : undefined,
    buyInTotal: form.cashIn ?? undefined,
    cashOutTotal: form.cashOut ?? undefined,
    notes: form.notes || undefined,
    tags: form.tags,
    status: newStatus,
  });

  router.push('/sessions');
}

const venues = computed(() =>
  form.type === 'live' ? referenceStore.liveVenues : referenceStore.onlineSites,
);
</script>
