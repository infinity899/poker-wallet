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
        {{ tournament?.isSession ? 'Edit Session' : 'Edit Tournament' }}
      </h1>
      <span v-if="tournament?.source === 'desktop'" class="badge-neutral badge-pill">
        Added from desktop
      </span>
    </div>

    <form class="space-y-5" @submit.prevent="handleSubmit">
      <div class="card p-5 space-y-4">
        <!-- In Progress Banner (sessions only) -->
        <div v-if="isCurrentlyInProgress && isSession" class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg p-3">
          <p class="text-sm text-amber-800 dark:text-amber-200">
            This session is in progress. Add bankroll final to complete it.
          </p>
        </div>

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

        <!-- Currency -->
        <div>
          <label class="label">Currency</label>
          <select v-model="form.currency" class="input max-w-32">
            <option v-for="currency in referenceStore.currencies" :key="currency" :value="currency">
              {{ currency }}
            </option>
          </select>
        </div>

        <!-- Site/Venue with Buy-in/Fee (for single tournaments) -->
        <div v-if="!isSession" class="grid grid-cols-[1fr,auto,auto] gap-3 items-end">
          <div>
            <label class="label">{{ form.type === 'live' ? 'Venue' : 'Site' }}</label>
            <select v-model="form.venue" class="input">
              <option value="">
                Select {{ form.type === 'live' ? 'venue' : 'site' }}
              </option>
              <option v-for="venue in venues" :key="venue.id" :value="venue.name">
                {{ venue.name }}
              </option>
            </select>
          </div>
          <div class="w-24">
            <label class="label">Buy-in ({{ getCurrencySymbol(form.currency) }})</label>
            <input
              v-model.number="form.buyIn"
              type="number"
              step="0.01"
              min="0"
              placeholder="0"
              class="input font-mono text-sm"
            >
          </div>
          <div class="w-24">
            <label class="label">Fee ({{ getCurrencySymbol(form.currency) }})</label>
            <input
              v-model.number="form.fee"
              type="number"
              step="0.01"
              min="0"
              placeholder="0"
              class="input font-mono text-sm"
            >
          </div>
        </div>

        <!-- Sites/Venues with Bankroll (for sessions) -->
        <div v-else class="space-y-3">
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
              <div class="w-28">
                <label v-if="index === 0" class="label text-xs">Initial ({{ getCurrencySymbol(form.currency) }})</label>
                <input
                  v-model.number="entry.bankrollInitial"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  class="input font-mono text-sm"
                >
              </div>
              <div class="w-28">
                <label v-if="index === 0" class="label text-xs">Final ({{ getCurrencySymbol(form.currency) }})</label>
                <input
                  v-model.number="entry.bankrollFinal"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  class="input font-mono text-sm"
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
            <div class="w-28 text-sm font-mono font-medium text-foreground dark:text-foreground-dark text-center">
              {{ totalBankrollInitial || '-' }}
            </div>
            <div class="w-28 text-sm font-mono font-medium text-foreground dark:text-foreground-dark text-center">
              {{ totalBankrollFinal || '-' }}
            </div>
            <div class="w-8" />
          </div>
        </div>

        <!-- Re-entries & Winnings (single tournaments only) -->
        <div v-if="!isSession" class="grid grid-cols-2 gap-4">
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
            <label class="label">Winnings ({{ getCurrencySymbol(form.currency) }})</label>
            <input
              v-model.number="form.winnings"
              type="number"
              step="0.01"
              min="0"
              class="input font-mono"
            >
          </div>
        </div>

        <!-- Field Size & Finish (single tournaments only) -->
        <div v-if="!isSession" class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Field Size <span class="text-foreground-muted dark:text-foreground-dark-muted font-normal">(optional)</span></label>
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

        <!-- Cashed (single tournaments only) -->
        <div v-if="!isSession" class="flex items-center gap-2">
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

        <!-- Session Profit Preview -->
        <div v-if="isSession" class="p-3 rounded-lg bg-surface-secondary dark:bg-surface-dark-tertiary border border-border dark:border-border-dark">
          <div class="flex justify-between items-center">
            <span class="text-xs font-medium text-foreground-muted dark:text-foreground-dark-muted uppercase tracking-wider">Session Profit</span>
            <span
              class="text-base font-semibold"
              :class="sessionProfit >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'"
            >
              {{ sessionProfit >= 0 ? '+' : '' }}{{ sessionProfit }}
            </span>
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
        <NuxtLink to="/tournaments" class="btn-secondary flex-1">
          Cancel
        </NuxtLink>
        <button v-if="isCurrentlyInProgress && willBeCompleted && isSession" type="submit" class="btn-primary flex-1">
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
import type { Currency, SessionStatus, SessionType } from '~/types';
import type { TournamentSiteEntry } from '~/types/tournament';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/vue/24/outline';
import { getCurrencySymbol } from '~/utils/formatters';

interface FormSiteEntry {
  name: string;
  buyIn: number | null;
  fee: number | null;
  bankrollInitial: number | null;
  bankrollFinal: number | null;
}

const tournamentsStore = useTournamentsStore();
const referenceStore = useReferenceStore();
const communitiesStore = useCommunitiesStore();
const currencyStore = useCurrencyStore();
const router = useRouter();
const route = useRoute();

const tournamentId = computed(() => route.params.id as string);
const tournament = computed(() => tournamentsStore.getTournamentById(tournamentId.value));

// Redirect if tournament not found
if (!tournament.value) {
  router.push('/tournaments');
}

// Initialize site entries from existing tournament data
function initSiteEntries(): FormSiteEntry[] {
  const t = tournament.value;
  if (!t) {
    return [{ name: '', buyIn: null, fee: null, bankrollInitial: null, bankrollFinal: null }];
  }

  // If tournament has sites array, use it
  if (t.sites && t.sites.length > 0) {
    return t.sites.map(site => ({
      name: site.name,
      buyIn: site.buyIn ?? null,
      fee: site.fee ?? null,
      bankrollInitial: site.bankrollInitial ?? null,
      bankrollFinal: site.bankrollFinal ?? null,
    }));
  }

  // Otherwise, create single entry from primary site/venue
  const primaryName = t.type === 'live' ? (t.venue || '') : (t.site || '');
  return [{
    name: primaryName,
    buyIn: t.buyIn ?? null,
    fee: t.fee ?? null,
    bankrollInitial: null,
    bankrollFinal: null,
  }];
}

const siteEntries = ref<FormSiteEntry[]>(initSiteEntries());

function addSiteEntry() {
  siteEntries.value.push({ name: '', buyIn: null, fee: null, bankrollInitial: null, bankrollFinal: null });
}

// Check if this is a session (not a single tournament)
const isSession = computed(() => tournament.value?.isSession === true);

function removeSiteEntry(index: number) {
  if (siteEntries.value.length > 1) {
    siteEntries.value.splice(index, 1);
  }
}

// Calculate bankroll totals from all site entries (for sessions)
const totalBankrollInitial = computed(() => {
  return siteEntries.value.reduce((sum, entry) => sum + (entry.bankrollInitial || 0), 0);
});

const totalBankrollFinal = computed(() => {
  return siteEntries.value.reduce((sum, entry) => sum + (entry.bankrollFinal || 0), 0);
});

// Get initial venue for single tournaments
function getInitialVenue(): string {
  const t = tournament.value;
  if (!t) {
    return '';
  }
  return t.type === 'live' ? (t.venue || '') : (t.site || '');
}

// Use original currency/values if available (for edit), otherwise fallback
const initialCurrency = tournament.value?.originalCurrency || tournament.value?.currency || 'USD' as Currency;
const initialBuyIn = tournament.value?.originalBuyIn ?? tournament.value?.buyIn ?? 0;
const initialFee = tournament.value?.originalFee ?? tournament.value?.fee ?? 0;
const initialWinnings = tournament.value?.originalWinnings ?? tournament.value?.winnings ?? 0;

const form = reactive({
  date: tournament.value?.date || '',
  type: tournament.value?.type || 'online' as SessionType,
  currency: initialCurrency,
  name: tournament.value?.name || '',
  venue: getInitialVenue(),
  buyIn: initialBuyIn,
  fee: initialFee,
  entries: tournament.value?.entries || 0,
  winnings: initialWinnings,
  fieldSize: tournament.value?.fieldSize as number | undefined,
  finishPosition: tournament.value?.finishPosition as number | undefined,
  cashed: tournament.value?.cashed || false,
  notes: tournament.value?.notes || '',
  tags: tournament.value?.tags || [] as string[],
  communityIds: communitiesStore.getCommunitiesForTournament(tournament.value?.id || ''),
});

const errors = reactive<Record<string, string>>({});

// Check if the tournament is currently in progress (based on stored status)
const isCurrentlyInProgress = computed(() => {
  return tournament.value?.status === 'in_progress';
});

// Session profit calculation
const sessionProfit = computed(() => {
  return totalBankrollFinal.value - totalBankrollInitial.value;
});

// Check if the form will result in a completed tournament/session
const willBeCompleted = computed(() => {
  if (isSession.value) {
    // For sessions, complete when bankrollFinal is entered
    return totalBankrollFinal.value > 0;
  }
  // For single tournaments
  const hasFinish = form.finishPosition !== undefined && form.finishPosition !== null && form.finishPosition > 0;
  const hasWinnings = form.winnings > 0;
  return hasFinish || hasWinnings;
});

function validate() {
  errors.name = '';
  errors.buyIn = '';

  if (!form.name.trim()) {
    errors.name = 'Tournament name is required';
  }

  return !errors.name && !errors.buyIn;
}

async function handleSubmit() {
  if (!validate()) {
    return;
  }

  // Convert values to USD for storage
  const exchangeRate = currencyStore.getCurrentRate(form.currency);

  if (isSession.value) {
    // For sessions, determine status based on bankroll final
    let newStatus: SessionStatus = tournament.value?.status || 'completed';
    if (isCurrentlyInProgress.value && willBeCompleted.value) {
      newStatus = 'completed';
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

    const usdWinnings = currencyStore.toUSD(totalBankrollFinal.value, form.currency);

    await tournamentsStore.updateTournament(tournamentId.value, {
      date: form.date,
      type: form.type,
      currency: form.currency,
      name: form.name,
      buyIn: 0, // Sessions don't track buy-in
      fee: 0, // Sessions don't track fee
      entries: 0,
      winnings: usdWinnings, // Store final bankroll as winnings in USD
      venue: form.type === 'live' ? primaryName : undefined,
      site: form.type === 'online' ? primaryName : undefined,
      sites: sites.length > 0 ? sites : undefined,
      notes: form.notes || undefined,
      tags: form.tags,
      status: newStatus,
      // Original currency values for reference
      originalCurrency: form.currency,
      originalBuyIn: 0,
      originalFee: 0,
      originalWinnings: totalBankrollFinal.value,
      exchangeRate,
    });
  }
  else {
    // For single tournaments - always completed, no multi-site
    const usdBuyIn = currencyStore.toUSD(form.buyIn, form.currency);
    const usdFee = currencyStore.toUSD(form.fee, form.currency);
    const usdWinnings = currencyStore.toUSD(form.winnings, form.currency);

    await tournamentsStore.updateTournament(tournamentId.value, {
      date: form.date,
      type: form.type,
      currency: form.currency,
      name: form.name,
      buyIn: usdBuyIn,
      fee: usdFee,
      entries: form.entries,
      winnings: usdWinnings,
      venue: form.type === 'live' ? form.venue || undefined : undefined,
      site: form.type === 'online' ? form.venue || undefined : undefined,
      fieldSize: form.fieldSize,
      finishPosition: form.finishPosition,
      cashed: form.cashed,
      notes: form.notes || undefined,
      tags: form.tags,
      status: 'completed',
      // Original currency values for reference
      originalCurrency: form.currency,
      originalBuyIn: form.buyIn,
      originalFee: form.fee,
      originalWinnings: form.winnings,
      exchangeRate,
    });
  }

  // Update community links
  await communitiesStore.updateTournamentCommunities(tournamentId.value, form.communityIds);

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
