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
        <div class="modal p-5">
          <h3 class="text-base font-semibold text-foreground dark:text-foreground-dark mb-4">
            Log Tournament Session
          </h3>

          <form class="space-y-4" @submit.prevent="handleSubmit">
            <!-- Name -->
            <div>
              <label class="label">Name</label>
              <input
                v-model="form.name"
                type="text"
                class="input"
                placeholder="Tournament Session"
              >
            </div>

            <!-- Date & Type -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Date</label>
                <input
                  v-model="form.date"
                  type="date"
                  class="input"
                  @change="updateDefaultName"
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

            <!-- Sites/Venues with Bankroll -->
            <div class="space-y-2">
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

              <div class="space-y-3">
                <div
                  v-for="(entry, index) in siteEntries"
                  :key="index"
                  class="p-3 rounded-lg bg-surface-secondary/50 dark:bg-surface-dark-tertiary/50 space-y-2"
                >
                  <!-- Site/Venue row -->
                  <div class="flex gap-2 items-end">
                    <div class="flex-1">
                      <label class="label text-xs">{{ form.type === 'live' ? 'Venue' : 'Site' }}</label>
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
                    <button
                      v-if="siteEntries.length > 1"
                      type="button"
                      class="p-2 hover:bg-danger-50 dark:hover:bg-danger-900/30 rounded transition-colors mb-0.5"
                      @click="removeSiteEntry(index)"
                    >
                      <TrashIcon class="w-4 h-4 text-danger-500 dark:text-danger-400" />
                    </button>
                  </div>

                  <!-- Bankroll row -->
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="label text-xs">Initial ({{ getCurrencySymbol(form.currency) }})</label>
                      <input
                        v-model.number="entry.bankrollInitial"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0"
                        class="input font-mono text-sm"
                      >
                    </div>
                    <div>
                      <label class="label text-xs">Final ({{ getCurrencySymbol(form.currency) }})</label>
                      <input
                        v-model.number="entry.bankrollFinal"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0"
                        class="input font-mono text-sm"
                      >
                    </div>
                  </div>
                </div>
              </div>

              <!-- Totals row -->
              <div v-if="siteEntries.length > 1" class="flex justify-between items-center pt-2 border-t border-border-subtle dark:border-border-dark-subtle text-sm">
                <span class="font-medium text-foreground-muted dark:text-foreground-dark-muted">Totals</span>
                <div class="flex gap-4 font-mono">
                  <span class="text-foreground dark:text-foreground-dark">Initial: {{ totalBankrollInitial || '-' }}</span>
                  <span class="text-foreground dark:text-foreground-dark">Final: {{ totalBankrollFinal || '-' }}</span>
                </div>
              </div>
            </div>

            <!-- Number of Tournaments -->
            <div>
              <label class="label">Number of Tournaments</label>
              <input
                v-model.number="form.sessionCount"
                type="number"
                min="1"
                class="input font-mono"
                :class="{ 'input-error': errors.sessionCount }"
                placeholder="e.g., 50"
              >
              <p v-if="errors.sessionCount" class="mt-1 text-xs text-danger-600 dark:text-danger-400">
                {{ errors.sessionCount }}
              </p>
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

            <!-- In Progress Status (auto-detected) -->
            <div v-if="isInProgress" class="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <span class="text-sm text-amber-700 dark:text-amber-400">
                Session will be marked as in-progress (no bankroll final entered)
              </span>
            </div>

            <!-- Profit Preview -->
            <div class="p-3 rounded-lg bg-surface-secondary dark:bg-surface-dark-tertiary border border-border dark:border-border-dark">
              <div class="flex justify-between items-center">
                <span class="text-xs font-medium text-foreground-muted dark:text-foreground-dark-muted uppercase tracking-wider">Session Profit</span>
                <span
                  class="text-base font-semibold data-value"
                  :class="profit >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
                >
                  {{ profit >= 0 ? '+' : '' }}{{ formatCurrency(profit) }}
                </span>
              </div>
            </div>

            <!-- Notes -->
            <div>
              <label class="label">Notes (optional)</label>
              <textarea
                v-model="form.notes"
                rows="2"
                class="input"
                placeholder="e.g., Sunday grind session..."
              />
            </div>

            <!-- Communities -->
            <CommunitiesSelector v-model="form.communityIds" />

            <div class="flex gap-3 pt-1">
              <button type="button" class="btn-secondary flex-1" @click="emit('close')">
                Cancel
              </button>
              <button v-if="isInProgress" type="submit" class="btn-primary flex-1">
                Start Session
              </button>
              <button v-else type="submit" class="btn-primary flex-1">
                Log Session
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { Currency, SessionStatus, SessionType } from '~/types';
import type { TournamentSiteEntry } from '~/types/tournament';
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline';
import { formatCurrency, formatDate, getCurrencySymbol } from '~/utils/formatters';

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
    sites?: TournamentSiteEntry[];
    notes?: string;
    tags: string[];
    isSession: boolean;
    sessionCount: number;
    status: SessionStatus;
    communityIds: string[];
  }];
}>();

interface FormSiteEntry {
  name: string;
  bankrollInitial: number | null;
  bankrollFinal: number | null;
}

const referenceStore = useReferenceStore();

function getToday(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

function getDefaultName(date: string): string {
  return `Tournament Session - ${formatDate(date)}`;
}

const form = reactive({
  date: getToday(),
  type: 'online' as SessionType,
  currency: 'USD' as Currency,
  name: '',
  sessionCount: 1,
  notes: '',
  communityIds: [] as string[],
});

function updateDefaultName() {
  form.name = getDefaultName(form.date);
}

// Site entries with their bankroll
const siteEntries = ref<FormSiteEntry[]>([
  { name: '', bankrollInitial: null, bankrollFinal: null },
]);

function addSiteEntry() {
  siteEntries.value.push({ name: '', bankrollInitial: null, bankrollFinal: null });
}

function removeSiteEntry(index: number) {
  if (siteEntries.value.length > 1) {
    siteEntries.value.splice(index, 1);
  }
}

// Calculate totals from all site entries
const totalBankrollInitial = computed(() => {
  return siteEntries.value.reduce((sum, entry) => sum + (entry.bankrollInitial || 0), 0);
});

const errors = reactive<Record<string, string>>({});

const liveVenues = computed(() => referenceStore.liveVenues);
const onlineSites = computed(() => referenceStore.onlineSites);
const venues = computed(() => form.type === 'live' ? liveVenues.value : onlineSites.value);

// Total bankroll final from all sites
const totalBankrollFinal = computed(() => {
  return siteEntries.value.reduce((sum, entry) => sum + (entry.bankrollFinal || 0), 0);
});

// Calculate profit from bankroll change
const profit = computed(() => {
  return totalBankrollFinal.value - totalBankrollInitial.value;
});

// Session is in-progress if no bankrollFinal on any site
// Same logic as cash sessions: no cash out = in progress
const isInProgress = computed(() => {
  return totalBankrollFinal.value === 0;
});

// Reset form when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    const today = getToday();
    form.date = today;
    form.type = 'online';
    form.currency = 'USD';
    form.name = getDefaultName(today);
    form.sessionCount = 1;
    form.notes = '';
    form.communityIds = [];
    siteEntries.value = [{ name: '', bankrollInitial: null, bankrollFinal: null }];
    errors.sessionCount = '';
  }
}, { immediate: true });

function validate(): boolean {
  errors.sessionCount = '';

  let valid = true;

  if (!form.sessionCount || form.sessionCount < 1) {
    errors.sessionCount = 'Must be at least 1 tournament';
    valid = false;
  }

  return valid;
}

function handleSubmit() {
  if (!validate()) {
    return;
  }

  // Get primary site/venue from first entry
  const primaryEntry = siteEntries.value[0];
  const primaryName = primaryEntry?.name || '';

  // Build sites array with entries that have names
  const sites: TournamentSiteEntry[] = siteEntries.value
    .filter(entry => entry.name)
    .map(entry => ({
      name: entry.name,
      bankrollInitial: entry.bankrollInitial ?? undefined,
      bankrollFinal: entry.bankrollFinal ?? undefined,
    }));

  const status: SessionStatus = isInProgress.value ? 'in_progress' : 'completed';

  emit('save', {
    date: form.date,
    type: form.type,
    currency: form.currency,
    name: form.name || getDefaultName(form.date),
    buyIn: 0, // Sessions don't track buy-in
    fee: 0, // Sessions don't track fee
    entries: 0,
    winnings: totalBankrollFinal.value, // Store final bankroll as winnings
    venue: form.type === 'live' ? primaryName || undefined : undefined,
    site: form.type === 'online' ? primaryName || undefined : undefined,
    sites: sites.length > 0 ? sites : undefined,
    notes: form.notes.trim() || undefined,
    tags: [],
    isSession: true,
    sessionCount: form.sessionCount,
    status,
    communityIds: form.communityIds,
  });
}
</script>
