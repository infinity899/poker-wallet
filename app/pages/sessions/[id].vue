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

        <!-- Currency -->
        <div>
          <label class="label">Currency</label>
          <select v-model="form.currency" class="input max-w-32">
            <option v-for="currency in referenceStore.currencies" :key="currency" :value="currency">
              {{ currency }}
            </option>
          </select>
        </div>

        <!-- Sites/Venues with Cash In/Out -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="label mb-0">{{ form.type === 'live' ? 'Venues' : 'Sites' }}</label>
            <button
              type="button"
              class="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
              @click="addSiteEntry"
            >
              <PlusIcon class="w-3.5 h-3.5" />
              Add {{ form.type === 'live' ? 'Venue' : 'Site' }}
            </button>
          </div>

          <div class="space-y-2">
            <div
              v-for="(entry, index) in siteEntries"
              :key="index"
              class="grid grid-cols-[1fr,auto,auto,auto] gap-2 items-end"
            >
              <div>
                <label v-if="index === 0" class="label text-xs">{{ form.type === 'live' ? 'Venue' : 'Site' }}</label>
                <select
                  v-model="entry.name"
                  class="input"
                >
                  <option value="">
                    Select {{ form.type === 'live' ? 'venue' : 'site' }}
                  </option>
                  <option v-for="venue in venues" :key="venue.id" :value="venue.name">
                    {{ venue.name }}
                  </option>
                </select>
              </div>
              <div class="w-24">
                <label v-if="index === 0" class="label text-xs">Cash In</label>
                <input
                  v-model.number="entry.cashIn"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="0"
                  class="input font-mono text-sm"
                  @input="calculateResult"
                >
              </div>
              <div class="w-24">
                <label v-if="index === 0" class="label text-xs">Cash Out</label>
                <input
                  v-model.number="entry.cashOut"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="0"
                  class="input font-mono text-sm"
                  @input="calculateResult"
                >
              </div>
              <div class="w-8">
                <label v-if="index === 0" class="label text-xs">&nbsp;</label>
                <button
                  v-if="siteEntries.length > 1"
                  type="button"
                  class="p-2 hover:bg-danger-50 dark:hover:bg-danger-900/30 rounded transition-colors"
                  @click="removeSiteEntry(index)"
                >
                  <TrashIcon class="w-4 h-4 text-danger-500 dark:text-danger-400" />
                </button>
              </div>
            </div>
          </div>

          <!-- Totals row -->
          <div v-if="siteEntries.length > 1" class="grid grid-cols-[1fr,auto,auto,auto] gap-2 items-center pt-2 border-t border-border-subtle dark:border-border-dark-subtle">
            <div class="text-sm font-medium text-foreground-muted dark:text-foreground-dark-muted text-right pr-2">
              Total
            </div>
            <div class="w-24 text-sm font-mono font-medium text-foreground dark:text-foreground-dark text-center">
              {{ totalCashIn || '-' }}
            </div>
            <div class="w-24 text-sm font-mono font-medium text-foreground dark:text-foreground-dark text-center">
              {{ totalCashOut || '-' }}
            </div>
            <div class="w-8" />
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

        <!-- Communities -->
        <CommunitiesSelector v-model="form.communityIds" />
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
import type { Currency, GameType, SessionStatus, SessionType, SiteEntry } from '~/types';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/vue/24/outline';
import { calculateDurationFromTimes } from '~/utils/calculations';

interface FormSiteEntry {
  name: string;
  cashIn: number | null;
  cashOut: number | null;
}

const sessionsStore = useSessionsStore();
const referenceStore = useReferenceStore();
const communitiesStore = useCommunitiesStore();
const router = useRouter();
const route = useRoute();

const sessionId = computed(() => route.params.id as string);
const session = computed(() => sessionsStore.getSessionById(sessionId.value));

// Redirect if session not found
if (!session.value) {
  router.push('/sessions');
}

// Initialize site entries from existing session data
function initSiteEntries(): FormSiteEntry[] {
  const s = session.value;
  if (!s) {
    return [{ name: '', cashIn: null, cashOut: null }];
  }

  // If session has sites array, use it
  if (s.sites && s.sites.length > 0) {
    return s.sites.map(site => ({
      name: site.name,
      cashIn: site.cashIn ?? null,
      cashOut: site.cashOut ?? null,
    }));
  }

  // Otherwise, create single entry from primary site/location
  const primaryName = s.type === 'live' ? (s.location || '') : (s.site || '');
  return [{
    name: primaryName,
    cashIn: s.buyInTotal ?? null,
    cashOut: s.cashOutTotal ?? null,
  }];
}

const form = reactive({
  date: session.value?.date || '',
  startTime: session.value?.startTime || '',
  endTime: session.value?.endTime || '',
  type: session.value?.type || 'live' as SessionType,
  game: session.value?.game || 'NLH' as GameType,
  currency: session.value?.currency || 'USD' as Currency,
  stake: session.value?.stake || '',
  result: session.value?.result || 0,
  duration: session.value?.duration || 0,
  notes: session.value?.notes || '',
  tags: session.value?.tags || [] as string[],
  communityIds: communitiesStore.getCommunitiesForSession(session.value?.id || ''),
});

// Site entries with their cash in/out
const siteEntries = ref<FormSiteEntry[]>(initSiteEntries());

function addSiteEntry() {
  siteEntries.value.push({ name: '', cashIn: null, cashOut: null });
}

function removeSiteEntry(index: number) {
  if (siteEntries.value.length > 1) {
    siteEntries.value.splice(index, 1);
    calculateResult();
  }
}

// Calculate totals from all site entries
const totalCashIn = computed(() => {
  return siteEntries.value.reduce((sum, entry) => sum + (entry.cashIn || 0), 0);
});

const totalCashOut = computed(() => {
  return siteEntries.value.reduce((sum, entry) => sum + (entry.cashOut || 0), 0);
});

const errors = reactive<Record<string, string>>({});

// Check if the session is currently in progress (based on stored status)
const isCurrentlyInProgress = computed(() => {
  return session.value?.status === 'in_progress';
});

// Check if the form will result in a completed session
const willBeCompleted = computed(() => {
  const hasCashOut = totalCashOut.value > 0;
  const hasManualResult = form.result !== 0 && !hasCashOut;
  return hasCashOut || hasManualResult;
});

// Check if duration was auto-calculated from times
const hasCalculatedDuration = computed(() => {
  return form.startTime && form.endTime;
});

const hasCalculatedResult = computed(() => {
  return totalCashIn.value > 0 && totalCashOut.value > 0;
});

function calculateResult() {
  if (totalCashIn.value > 0 && totalCashOut.value > 0) {
    form.result = totalCashOut.value - totalCashIn.value;
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

async function handleSubmit() {
  if (!validate()) {
    return;
  }

  // Determine the new status
  let newStatus: SessionStatus = session.value?.status || 'completed';
  if (isCurrentlyInProgress.value && willBeCompleted.value) {
    newStatus = 'completed';
  }

  // Get primary site/venue from first entry
  const primaryEntry = siteEntries.value[0];
  const primaryName = primaryEntry?.name || '';

  // Build sites array with entries that have names
  const sites: SiteEntry[] = siteEntries.value
    .filter(entry => entry.name)
    .map(entry => ({
      name: entry.name,
      cashIn: entry.cashIn ?? undefined,
      cashOut: entry.cashOut ?? undefined,
    }));

  await sessionsStore.updateSession(sessionId.value, {
    date: form.date,
    startTime: form.startTime || undefined,
    endTime: form.endTime || undefined,
    type: form.type,
    game: form.game,
    currency: form.currency,
    stake: form.stake,
    result: form.result,
    duration: form.duration,
    location: form.type === 'live' ? primaryName : undefined,
    site: form.type === 'online' ? primaryName : undefined,
    sites: sites.length > 0 ? sites : undefined,
    buyInTotal: totalCashIn.value > 0 ? totalCashIn.value : undefined,
    cashOutTotal: totalCashOut.value > 0 ? totalCashOut.value : undefined,
    notes: form.notes || undefined,
    tags: form.tags,
    status: newStatus,
  });

  // Update community links
  await communitiesStore.updateSessionCommunities(sessionId.value, form.communityIds);

  router.push('/sessions');
}

const venues = computed(() =>
  form.type === 'live' ? referenceStore.liveVenues : referenceStore.onlineSites,
);
</script>
