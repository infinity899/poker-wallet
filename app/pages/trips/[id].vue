<template>
  <div class="p-4 lg:p-0 space-y-6 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-start gap-3 min-w-0">
        <NuxtLink
          to="/trips"
          class="p-2 shrink-0 hover:bg-surface-tertiary dark:hover:bg-surface-dark-tertiary rounded-md transition-colors"
        >
          <ArrowLeftIcon class="w-5 h-5 text-foreground-muted dark:text-foreground-dark-muted" />
        </NuxtLink>
        <div class="min-w-0">
          <h1 class="text-xl font-semibold text-foreground dark:text-foreground-dark tracking-tight truncate">
            {{ trip?.name ?? 'Trip' }}
          </h1>
          <p v-if="trip" class="text-sm text-foreground-secondary dark:text-foreground-dark-secondary truncate">
            {{ formatDateRange(trip.date, trip.endDate) }}
            <template v-if="trip.venue">
              &middot; {{ trip.venue }}
            </template>
            <span v-if="trip.location" class="text-foreground-muted dark:text-foreground-dark-muted">
              &middot; {{ trip.location }}
            </span>
          </p>
        </div>
      </div>
      <div v-if="trip" class="flex items-center gap-2 shrink-0">
        <button class="btn-secondary" @click="showEditModal = true">
          <Cog6ToothIcon class="w-4 h-4" />
          <span class="hidden sm:inline ml-1.5">Edit</span>
        </button>
        <button
          class="btn-secondary text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/30"
          title="Delete trip"
          @click="showDeleteModal = true"
        >
          <TrashIcon class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Not found -->
    <div v-if="!trip" class="card empty-state">
      <ExclamationCircleIcon class="empty-state-icon" />
      <h3 class="empty-state-title">
        Trip not found
      </h3>
      <p class="empty-state-description">
        This trip may have been deleted.
      </p>
      <NuxtLink to="/trips" class="btn-primary mt-5">
        Back to Trips
      </NuxtLink>
    </div>

    <template v-else>
      <TripsPnLCard :pnl="pnl" :has-mixed-currencies="hasMixedCurrencies" />

      <!-- Stale link banner -->
      <div
        v-if="staleLinkCount > 0"
        class="card p-4 bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-700/50"
      >
        <div class="flex items-start justify-between gap-3 flex-wrap">
          <div class="flex items-start gap-2">
            <ExclamationTriangleIcon class="w-4 h-4 shrink-0 mt-0.5 text-warning-600 dark:text-warning-400" />
            <p class="text-xs text-warning-700 dark:text-warning-400">
              {{ staleLinkCount }} linked
              {{ staleLinkCount === 1 ? 'tournament has' : 'tournaments have' }} been deleted.
              They no longer count toward this trip's P&amp;L.
            </p>
          </div>
          <button class="btn-secondary btn-sm" @click="cleanUpStaleLinks">
            Remove them
          </button>
        </div>
      </div>

      <!-- Linked tournaments -->
      <section class="space-y-3">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-sm font-semibold text-foreground dark:text-foreground-dark">
            Tournaments ({{ linkedTournaments.length }})
          </h2>
          <button class="btn-secondary btn-sm" @click="showPicker = true">
            <LinkIcon class="w-3.5 h-3.5 mr-1" />
            Link tournaments
          </button>
        </div>

        <div v-if="linkedTournaments.length === 0" class="card empty-state">
          <TrophyIcon class="empty-state-icon" />
          <h3 class="empty-state-title">
            No tournaments linked
          </h3>
          <p class="empty-state-description">
            Link the live tournaments you played here to see gross profit and ROI. Expenses alone
            only show what you spent.
          </p>
          <button class="btn-primary mt-5" @click="showPicker = true">
            Link tournaments
          </button>
        </div>

        <div v-else class="card divide-y divide-border-subtle dark:divide-border-dark-subtle">
          <div
            v-for="tournament in linkedTournaments"
            :key="tournament.id"
            class="flex items-center justify-between gap-3 px-4 py-3"
          >
            <NuxtLink :to="`/tournaments/${tournament.id}`" class="min-w-0 flex-1 group">
              <p class="text-sm font-medium text-foreground dark:text-foreground-dark truncate group-hover:underline">
                {{ tournament.name }}
              </p>
              <p class="text-xs text-foreground-muted dark:text-foreground-dark-muted truncate">
                {{ formatDate(tournament.date) }}
                <template v-if="tournament.venue">
                  &middot; {{ tournament.venue }}
                </template>
                <span
                  v-if="!isDateInRange(tournament.date, tripRange)"
                  class="text-warning-600 dark:text-warning-400"
                > &middot; outside trip dates</span>
              </p>
            </NuxtLink>
            <span
              class="data-value text-sm font-semibold shrink-0"
              :class="getTournamentNetProfit(tournament) >= 0
                ? 'text-success-600 dark:text-success-400'
                : 'text-danger-600 dark:text-danger-400'"
            >
              {{ formatDisplayProfit(getTournamentNetProfit(tournament)) }}
            </span>
            <button
              class="p-1 shrink-0 rounded hover:bg-danger-50 dark:hover:bg-danger-900/30 transition-colors"
              title="Unlink from this trip"
              @click="unlinkTournament(tournament.id)"
            >
              <LinkSlashIcon class="w-4 h-4 text-danger-500 dark:text-danger-400" />
            </button>
          </div>
        </div>
      </section>

      <!-- Expenses -->
      <section class="space-y-3">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-sm font-semibold text-foreground dark:text-foreground-dark">
            Expenses ({{ expenses.length }})
          </h2>
          <button class="btn-primary btn-sm" @click="openExpenseModal(null)">
            <PlusIcon class="w-3.5 h-3.5 mr-1" />
            Add expense
          </button>
        </div>

        <div v-if="expenses.length === 0" class="card empty-state">
          <ReceiptPercentIcon class="empty-state-icon" />
          <h3 class="empty-state-title">
            No expenses logged
          </h3>
          <p class="empty-state-description">
            Add flights, hotel and food to turn gross profit into real net profit.
          </p>
          <button class="btn-primary mt-5" @click="openExpenseModal(null)">
            Add expense
          </button>
        </div>

        <div v-else class="grid lg:grid-cols-2 gap-4 items-start">
          <TripsExpenseList
            :expenses="expenses"
            @edit="openExpenseModal"
            @delete="handleDeleteExpense"
          />
          <TripsCategoryChart :expenses-by-category="pnl.expensesByCategory" />
        </div>
      </section>
    </template>

    <!-- Modals -->
    <TripsFormModal
      :is-open="showEditModal"
      :trip="trip"
      @close="showEditModal = false"
      @save="handleUpdateTrip"
    />
    <TripsExpenseModal
      v-if="trip"
      :is-open="showExpenseModal"
      :trip-id="trip.id"
      :trip-start-date="trip.date"
      :trip-end-date="trip.endDate"
      :trip-currency="trip.currency"
      :expense="editingExpense"
      @close="closeExpenseModal"
      @save="handleSaveExpense"
    />
    <TripsTournamentPicker
      v-if="trip"
      :is-open="showPicker"
      :trip="trip"
      @close="showPicker = false"
      @save="handleLink"
    />
    <TripsDeleteModal
      :trip="showDeleteModal ? trip : null"
      @confirm="handleDeleteTrip"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import type { TripFormPayload } from '~/components/trips/TripsForm.vue';
import type { DateRange, Expense, NewExpense, Tournament, Trip } from '~/types';
import {
  ArrowLeftIcon,
  Cog6ToothIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  LinkSlashIcon,
  PlusIcon,
  ReceiptPercentIcon,
  TrashIcon,
  TrophyIcon,
} from '@heroicons/vue/24/outline';
import { isDateInRange } from '~/composables/useFilters';
import { getTournamentNetProfit } from '~/utils/calculations';
import { formatDate, formatDateRange } from '~/utils/formatters';

const route = useRoute();
const router = useRouter();
const tripsStore = useTripsStore();
const toast = useToast();
const { formatDisplayProfit, displayCurrency } = useCurrency();

const showEditModal = ref(false);
const showDeleteModal = ref(false);
const showExpenseModal = ref(false);
const showPicker = ref(false);
const editingExpense = ref<Expense | null>(null);

const tripId = computed(() => route.params.id as string);
// Store state is exposed as readonly refs; this page only reads, so assert back to
// the mutable element type for the child props.
const trip = computed<Trip | null>(() =>
  (tripsStore.trips as Trip[]).find(t => t.id === tripId.value) ?? null);

const pnl = computed(() => tripsStore.getTripPnL(tripId.value));
const expenses = computed(() => tripsStore.getTripExpenses(tripId.value));

// getTripTournaments already drops unresolvable ids; filter(Boolean) is belt-and-braces.
const linkedTournaments = computed<Tournament[]>(() =>
  (tripsStore.getTripTournaments(tripId.value) ?? []).filter(Boolean) as Tournament[]);

// Difference between stored ids and resolvable ones = tournaments deleted elsewhere.
const staleLinkCount = computed(() =>
  Math.max(0, (trip.value?.tournamentIds.length ?? 0) - linkedTournaments.value.length));

const tripRange = computed<DateRange>(() => ({
  start: trip.value?.date ?? null,
  end: trip.value?.endDate ?? null,
}));

const hasMixedCurrencies = computed(() => {
  const currencies = new Set(expenses.value.map(e => e.originalCurrency));
  return currencies.size > 1 || (currencies.size === 1 && !currencies.has(displayCurrency.value));
});

function openExpenseModal(expense: Expense | null) {
  editingExpense.value = expense;
  showExpenseModal.value = true;
}

function closeExpenseModal() {
  showExpenseModal.value = false;
  editingExpense.value = null;
}

async function handleUpdateTrip(payload: TripFormPayload) {
  const result = await tripsStore.updateTrip(tripId.value, payload);
  if (result.success) {
    toast.success('Trip updated');
    showEditModal.value = false;
  }
  else {
    toast.error(result.error.message);
  }
}

async function handleDeleteTrip() {
  const result = await tripsStore.deleteTrip(tripId.value);
  if (result.success) {
    toast.success('Trip deleted');
    router.push('/trips');
  }
  else {
    toast.error(result.error.message);
    showDeleteModal.value = false;
  }
}

async function handleSaveExpense(payload: NewExpense) {
  const result = editingExpense.value
    ? await tripsStore.updateExpense(editingExpense.value.id, payload)
    : await tripsStore.addExpense(payload);

  if (result.success) {
    toast.success(editingExpense.value ? 'Expense updated' : 'Expense added');
    closeExpenseModal();
  }
  else {
    toast.error(result.error.message);
  }
}

async function handleDeleteExpense(id: string) {
  const result = await tripsStore.deleteExpense(id);
  if (result.success) {
    toast.success('Expense deleted');
  }
  else {
    toast.error(result.error.message);
  }
}

async function handleLink(ids: string[]) {
  const result = await tripsStore.setTripTournaments(tripId.value, ids);
  if (result.success) {
    toast.success('Tournaments linked');
    showPicker.value = false;
  }
  else {
    toast.error(result.error.message);
  }
}

async function unlinkTournament(id: string) {
  const result = await tripsStore.removeTournamentFromTrip(tripId.value, id);
  if (result.success) {
    toast.success('Tournament unlinked');
  }
  else {
    toast.error(result.error.message);
  }
}

async function cleanUpStaleLinks() {
  const alive = new Set(linkedTournaments.value.map(t => t.id));
  const result = await tripsStore.setTripTournaments(
    tripId.value,
    (trip.value?.tournamentIds ?? []).filter(id => alive.has(id)),
  );

  if (result.success) {
    toast.success('Removed deleted tournaments');
  }
  else {
    toast.error(result.error.message);
  }
}
</script>
