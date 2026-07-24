<template>
  <div class="p-4 lg:p-0 space-y-6">
    <TripsHeader v-model:search="searchQuery" :count="filteredTrips.length" />

    <TripsStats :stats="stats" />

    <!-- No trips at all -->
    <div v-if="tripsStore.sortedTrips.length === 0" class="card empty-state">
      <MapIcon class="empty-state-icon" />
      <h3 class="empty-state-title">
        No trips yet
      </h3>
      <p class="empty-state-description">
        Group a festival's buy-ins, cashes and expenses to see what you actually took home.
      </p>
      <NuxtLink to="/trips/new" class="btn-primary mt-5">
        Create your first trip
      </NuxtLink>
    </div>

    <!-- Search miss -->
    <div v-else-if="filteredTrips.length === 0" class="card empty-state">
      <MagnifyingGlassIcon class="empty-state-icon" />
      <h3 class="empty-state-title">
        No trips match "{{ searchQuery }}"
      </h3>
      <p class="empty-state-description">
        Try a venue, location or trip name.
      </p>
      <button class="btn-secondary mt-5" @click="searchQuery = ''">
        Clear search
      </button>
    </div>

    <template v-else>
      <TripsMobileList
        v-if="isMobile"
        :trips="visibleTrips"
        :pnl-by-id="pnlById"
        @delete="handleDelete"
      />
      <TripsTable
        v-else
        :trips="visibleTrips"
        :pnl-by-id="pnlById"
        @delete="handleDelete"
      />

      <div v-if="visibleTrips.length < filteredTrips.length" class="flex justify-center">
        <button class="btn-secondary" @click="visibleCount += PAGE_SIZE">
          Show {{ Math.min(PAGE_SIZE, filteredTrips.length - visibleTrips.length) }} more
          <span class="text-foreground-muted dark:text-foreground-dark-muted ml-1">
            ({{ visibleTrips.length }} of {{ filteredTrips.length }})
          </span>
        </button>
      </div>
    </template>

    <TripsDeleteModal
      :trip="deleteTarget"
      @confirm="confirmDelete"
      @cancel="deleteConfirmId = null"
    />
  </div>
</template>

<script setup lang="ts">
import type { Trip } from '~/types';
import { MagnifyingGlassIcon, MapIcon } from '@heroicons/vue/24/outline';
import { calculateTripsStats } from '~/utils/calculations';

const PAGE_SIZE = 20;

const tripsStore = useTripsStore();
const toast = useToast();
const { isMobile } = useBreakpoint();

const searchQuery = ref('');
const visibleCount = ref(PAGE_SIZE);
const deleteConfirmId = ref<string | null>(null);

const filteredTrips = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) {
    return tripsStore.sortedTrips;
  }
  return tripsStore.sortedTrips.filter(t =>
    t.name.toLowerCase().includes(query)
    || (t.venue ?? '').toLowerCase().includes(query)
    || (t.location ?? '').toLowerCase().includes(query));
});

const visibleTrips = computed(() => filteredTrips.value.slice(0, visibleCount.value));

// Compute P&L ONCE per visible trip; children receive it as a prop so they never
// re-derive it on every render.
const pnlById = computed(() =>
  new Map(visibleTrips.value.map(t => [t.id, tripsStore.getTripPnL(t.id)])));

const stats = computed(() =>
  calculateTripsStats(filteredTrips.value.map(t => tripsStore.getTripPnL(t.id))));

// Store state is exposed as readonly refs; this component only reads, so assert
// back to the mutable element type for the child prop.
const deleteTarget = computed<Trip | null>(() =>
  deleteConfirmId.value
    ? (tripsStore.trips as Trip[]).find(t => t.id === deleteConfirmId.value) ?? null
    : null);

// Reset paging when the search narrows the list
watch(searchQuery, () => {
  visibleCount.value = PAGE_SIZE;
});

function handleDelete(id: string) {
  deleteConfirmId.value = id;
}

async function confirmDelete() {
  if (!deleteConfirmId.value) {
    return;
  }

  const result = await tripsStore.deleteTrip(deleteConfirmId.value);
  if (result.success) {
    toast.success('Trip deleted');
  }
  else {
    toast.error(result.error.message);
  }
  deleteConfirmId.value = null;
}
</script>
