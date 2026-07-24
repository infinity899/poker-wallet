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
        <div class="modal p-0 max-h-[85vh] flex flex-col">
          <!-- Header -->
          <div class="modal-header shrink-0">
            <h3 class="text-base font-semibold text-foreground dark:text-foreground-dark mb-3">
              Link tournaments
            </h3>
            <input
              v-model="search"
              type="search"
              placeholder="Search by name or venue..."
              class="input"
            >
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto p-5 space-y-5">
            <div
              v-if="overlappingTrips.length > 0"
              class="flex items-start gap-2 p-3 rounded-lg bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-700/50"
            >
              <ExclamationTriangleIcon class="w-4 h-4 shrink-0 mt-0.5 text-warning-600 dark:text-warning-400" />
              <p class="text-xs text-warning-700 dark:text-warning-400">
                Your dates overlap {{ overlappingTrips.map(t => t.name).join(', ') }}. Tournaments
                already linked there are marked &mdash; linking one to both trips will double-count it.
              </p>
            </div>

            <div v-if="isEmpty" class="empty-state">
              <TrophyIcon class="empty-state-icon" />
              <h4 class="empty-state-title">
                No live tournaments found
              </h4>
              <p class="empty-state-description">
                Trips link <strong class="font-medium">live</strong> tournaments. Log one first, or
                clear your search.
              </p>
              <NuxtLink to="/tournaments/new" class="btn-primary mt-5">
                Add tournament
              </NuxtLink>
            </div>

            <template v-else>
              <section v-if="suggested.length > 0">
                <div class="flex items-center justify-between gap-3 mb-2">
                  <h4 class="text-xs font-semibold uppercase tracking-wider text-foreground-muted dark:text-foreground-dark-muted">
                    Suggested &mdash; venue &amp; dates match ({{ suggested.length }})
                  </h4>
                  <button
                    type="button"
                    class="text-xs text-accent-600 dark:text-accent-400 hover:underline"
                    @click="selectAllSuggested"
                  >
                    Select all
                  </button>
                </div>
                <TripsTournamentPickerRow
                  v-for="t in suggested"
                  :key="t.id"
                  :tournament="t"
                  :selected="selected.has(t.id)"
                  :claimed-by="claimedBy.get(t.id)"
                  @toggle="toggle(t.id)"
                />
              </section>

              <section v-if="dateOnly.length > 0">
                <h4 class="text-xs font-semibold uppercase tracking-wider text-foreground-muted dark:text-foreground-dark-muted mb-2">
                  Same dates, different venue ({{ dateOnly.length }})
                </h4>
                <TripsTournamentPickerRow
                  v-for="t in dateOnly"
                  :key="t.id"
                  :tournament="t"
                  :selected="selected.has(t.id)"
                  :claimed-by="claimedBy.get(t.id)"
                  @toggle="toggle(t.id)"
                />
              </section>

              <section v-if="everything.length > 0">
                <h4 class="text-xs font-semibold uppercase tracking-wider text-foreground-muted dark:text-foreground-dark-muted mb-2">
                  All other live tournaments
                </h4>
                <TripsTournamentPickerRow
                  v-for="t in everything"
                  :key="t.id"
                  :tournament="t"
                  :selected="selected.has(t.id)"
                  :claimed-by="claimedBy.get(t.id)"
                  @toggle="toggle(t.id)"
                />
              </section>
            </template>
          </div>

          <!-- Footer -->
          <div class="modal-footer shrink-0 flex items-center justify-between gap-3">
            <span class="text-sm text-foreground-muted dark:text-foreground-dark-muted">
              {{ selected.size }} selected
            </span>
            <div class="flex gap-3">
              <button class="btn-secondary" @click="emit('close')">
                Cancel
              </button>
              <button class="btn-primary" @click="emit('save', Array.from(selected))">
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { DateRange, Tournament, Trip } from '~/types';
import { ExclamationTriangleIcon, TrophyIcon } from '@heroicons/vue/24/outline';
import { isDateInRange } from '~/composables/useFilters';

const props = defineProps<{
  isOpen: boolean;
  trip: Trip;
}>();

const emit = defineEmits<{
  close: [];
  save: [ids: string[]];
}>();

const tournamentsStore = useTournamentsStore();
const tripsStore = useTripsStore();

const selected = ref<Set<string>>(new Set());
const search = ref('');

const tripRange = computed<DateRange>(() => ({
  start: props.trip.date,
  end: props.trip.endDate,
}));

/** tournamentId -> name of a DIFFERENT trip that already claims it. */
const claimedBy = computed(() => {
  const map = new Map<string, string>();
  for (const t of tripsStore.trips) {
    if (t.id === props.trip.id) {
      continue;
    }
    for (const id of t.tournamentIds) {
      map.set(id, t.name);
    }
  }
  return map;
});

// Store state is exposed as readonly refs; assert back to the mutable element type.
const candidates = computed(() => {
  const query = search.value.trim().toLowerCase();
  return (tournamentsStore.tournaments as Tournament[])
    .filter(t => t.type === 'live' && !t.isSession)
    .filter(t => !query
      || t.name.toLowerCase().includes(query)
      || (t.venue ?? '').toLowerCase().includes(query));
});

function venueMatches(t: Tournament): boolean {
  const tripVenue = props.trip.venue?.trim().toLowerCase();
  const tournamentVenue = t.venue?.trim().toLowerCase();
  return !!tripVenue && !!tournamentVenue && tripVenue === tournamentVenue;
}

function dateMatches(t: Tournament): boolean {
  return isDateInRange(t.date, tripRange.value);
}

function byDateDesc(a: Tournament, b: Tournament): number {
  return b.date.localeCompare(a.date);
}

const suggested = computed(() =>
  candidates.value.filter(t => dateMatches(t) && venueMatches(t)).sort(byDateDesc));
const dateOnly = computed(() =>
  candidates.value.filter(t => dateMatches(t) && !venueMatches(t)).sort(byDateDesc));
const everything = computed(() =>
  candidates.value.filter(t => !dateMatches(t)).sort(byDateDesc).slice(0, 50));

const isEmpty = computed(() =>
  suggested.value.length === 0 && dateOnly.value.length === 0 && everything.value.length === 0);

const overlappingTrips = computed(() => tripsStore.trips.filter(t =>
  t.id !== props.trip.id
  && t.date <= props.trip.endDate
  && t.endDate >= props.trip.date));

watch(() => props.isOpen, (open) => {
  if (open) {
    selected.value = new Set(props.trip.tournamentIds);
    search.value = '';
  }
}, { immediate: true });

function toggle(id: string) {
  const next = new Set(selected.value);
  if (next.has(id)) {
    next.delete(id);
  }
  else {
    next.add(id);
  }
  // Reassign - Set mutation is not reactive.
  selected.value = next;
}

function selectAllSuggested() {
  const next = new Set(selected.value);
  for (const t of suggested.value) {
    // Tournaments already claimed by another trip are never bulk-selected -
    // double-linking must be a deliberate individual click.
    if (!claimedBy.value.has(t.id)) {
      next.add(t.id);
    }
  }
  selected.value = next;
}
</script>
